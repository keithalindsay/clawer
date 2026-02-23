import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { tasks } from '@/lib/db/schema/tasks';
import { customAgents } from '@/lib/db/schema/custom-agents';
import { modelConfigs } from '@/lib/db/schema/model-configs';
import { eq, sql, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { containerApi } from '@/lib/container-client';
import { routeRequest } from '@/lib/router';
import { FREE_MESSAGE_LIMIT, FREE_DAILY_LIMIT, FREE_TIER_PORT, FREE_TIER_TOKEN, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { getTeamConfig, getAgentFromTeam, TeamMember } from '@/lib/teams';
import { trackDailyUsage, checkDailyLimit, checkUserRateLimit } from '@/lib/rate-limit';
import { unauthorized, badRequest, forbidden, notFound, rateLimited, serviceUnavailable, serverError } from '@/lib/api-errors';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return unauthorized();
  }

  try {
    const { message, context, settings, agentId } = await req.json();

    if (!message || typeof message !== 'string') {
      return badRequest('Message is required');
    }

    // Input validation: length limit and sanitization
    if (message.length > MAX_MESSAGE_LENGTH) {
      return badRequest(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
    }

    // Strip null bytes (potential injection vector)
    const sanitizedMessage = message.replace(/\0/g, '');

    // Rate limit: per-minute throttle for all users
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { tier: true },
    });
    const userTier = (userRecord?.tier || 'free') as 'free' | 'basic' | 'pro' | 'enterprise';
    
    const rateLimit = await checkUserRateLimit(userId, userTier);
    if (!rateLimit.allowed) {
      const retrySeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return rateLimited(
        'Too many requests. Please slow down.',
        retrySeconds,
        {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
        }
      );
    }

    // Get user with container info and team template
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { 
        stripeSubscriptionId: true,
        containerPort: true,
        containerStatus: true,
        freeMessagesUsed: true,
        teamTemplate: true,
        name: true,
      },
    });

    // Handle agent-specific chat if agentId provided
    // Route to real agent session instead of prompt switching
    let sessionKey: string = `user-${userId}-agent-${agentId || 'default'}`;
    
    if (agentId) {
      const templateName = user?.teamTemplate || 'lifeos';
      const teamConfig = getTeamConfig(templateName);
      
      if (!teamConfig) {
        return notFound('Team template');
      }

      // First try template agent, then check custom agents
      let agent: TeamMember | null = getAgentFromTeam(templateName, agentId);
      let isCustomAgent = false;
      
      if (!agent) {
        // Check custom agents in database
        const customAgent = await db.query.customAgents.findFirst({
          where: and(
            eq(customAgents.userId, userId),
            eq(customAgents.agentId, agentId)
          ),
        });
        
        if (customAgent) {
          // Convert custom agent to TeamMember format
          agent = {
            id: customAgent.agentId,
            name: customAgent.name,
            role: customAgent.role || 'Assistant',
            emoji: customAgent.emoji || '🤖',
            description: customAgent.personality || '',
            triggers: customAgent.triggers || [],
            quickPrompts: customAgent.quickPrompts || [],
          };
          isCustomAgent = true;
        }
      }
      
      if (!agent) {
        return notFound('Agent', 'Agent not found in your team');
      }

      // Use agent-specific session key (routes to agent's workspace)
      // For custom agents, use a custom-agent-specific session
      // OpenClaw sessions ARE the source of truth - no DB conversation records needed
      sessionKey = isCustomAgent ? `custom-agent:${agentId}:main` : `agent:${agentId}:main`;
    }

    // Free tier vs paid subscription routing
    const hasSubscription = !!user?.stripeSubscriptionId;
    let targetPort: number;
    let targetToken: string | undefined;
    
    if (!hasSubscription) {
      // Free tier: shared container
      const freeUsed = user?.freeMessagesUsed ?? 0;
      
      // Check total message limit
      if (freeUsed >= FREE_MESSAGE_LIMIT) {
        return forbidden(
          `You've used all ${FREE_MESSAGE_LIMIT} free messages. Upgrade to keep chatting!`,
          JSON.stringify({
            upgradeUrl: '/pricing',
            freeMessagesUsed: freeUsed,
            freeMessageLimit: FREE_MESSAGE_LIMIT,
          })
        );
      }
      
      // Check daily rate limit
      if (!checkDailyLimit(userId, FREE_DAILY_LIMIT)) {
        return rateLimited(
          `You've reached your daily limit of ${FREE_DAILY_LIMIT} messages. Try again tomorrow!`,
          undefined,
          {
            freeMessagesUsed: freeUsed,
            freeMessageLimit: FREE_MESSAGE_LIMIT,
          }
        );
      }
      
      // Track daily usage
      trackDailyUsage(userId);
      
      // Route to shared free tier container
      targetPort = FREE_TIER_PORT;
      targetToken = FREE_TIER_TOKEN;
      
      // Increment free message counter
      await db
        .update(users)
        .set({
          freeMessagesUsed: sql`${users.freeMessagesUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
        
    } else {
      // Paid tier: dedicated container
      // Check container exists and is running
      if (!user.containerPort) {
        return serviceUnavailable('Container not provisioned. Please wait or contact support.');
      }

      if (user.containerStatus !== 'running') {
        return serviceUnavailable(`Container is ${user.containerStatus || 'not ready'}. Please wait.`);
      }
      
      targetPort = user.containerPort;
      targetToken = undefined; // Will use default token lookup
    }

    // Extract bot settings if provided
    // Phase 1: Remove system prompt injection - agents have SOUL.md instead
    const botSettings = settings ? {
      botName: settings.botName || 'Assistant',
      personality: settings.personality || 'helpful and friendly',
      customInstructions: settings.customInstructions || '',
      communicationStyle: settings.communicationStyle || 'balanced',
      responseLength: settings.responseLength || 'balanced',
    } : undefined;

    // Build system prompt for routing classification
    let systemPrompt = '';
    if (botSettings) {
      const parts = [];
      if (botSettings.personality) parts.push(botSettings.personality);
      if (botSettings.customInstructions) parts.push(botSettings.customInstructions);
      systemPrompt = parts.join('. ');
    }

    // Load user's model config from DB for custom selections
    let userOrchestratorModel = 'google/gemini-3-flash';   // Default: Smart tier
    let userWorkerModel = 'google/gemini-2.0-flash-lite';  // Default: Bulk tasks
    
    try {
      const userModelConfig = await db.query.modelConfigs.findFirst({
        where: eq(modelConfigs.userId, userId),
      });
      
      if (userModelConfig) {
        // Map DB model IDs to full provider/model format
        const orchestratorMapping: Record<string, string> = {
          'gpt-4o': 'openai/gpt-4o',
          'gpt-4o-mini': 'openai/gpt-4o-mini',
          'gemini-3-flash': 'google/gemini-3-flash',
          'gemini-2.0-flash': 'google/gemini-2.0-flash',
        };
        const workerMapping: Record<string, string> = {
          'gemini-2.0-flash-lite': 'google/gemini-2.0-flash-lite',
          'gemini-2.0-flash': 'google/gemini-2.0-flash',
          'grok-4.1-fast': 'xai/grok-4.1-fast',
        };
        
        userOrchestratorModel = orchestratorMapping[userModelConfig.orchestratorModel] || userOrchestratorModel;
        userWorkerModel = workerMapping[userModelConfig.workerModel] || userWorkerModel;
        
        console.log('[chat] Using custom model config:', {
          orchestrator: userOrchestratorModel,
          worker: userWorkerModel,
        });
      }
    } catch (error) {
      console.warn('[chat] Failed to load model config, using defaults:', error);
    }
    
    // Classify request using smart router
    const routing = routeRequest({
      prompt: sanitizedMessage,
      systemPrompt,
      userOrchestratorModel,
      userWorkerModel,
    });

    console.log('[chat] Smart routing decision:', {
      tier: routing.tier,
      model: routing.model,
      confidence: routing.confidence,
      signals: routing.signals.slice(0, 3),  // Log first 3 signals
    });

    // Route message to appropriate container
    console.log('[chat] Routing to container:', {
      userId,
      port: targetPort,
      tier: hasSubscription ? 'paid' : 'free',
      messageLength: sanitizedMessage.length,
    });

    // Use agent-specific session key for routing
    // Format: agent:<agentId>:main routes to agent's isolated workspace
    const finalSessionKey = context || sessionKey;

    const result = await containerApi.chat(
      targetPort,
      sanitizedMessage,
      finalSessionKey,
      {
        ...botSettings,
        model: routing.model,
        tier: routing.tier,
        confidence: routing.confidence,
      },
      targetToken
    );

    if (result.error) {
      console.error('[chat] Container error:', result.error);
      return serverError('Container communication failed', result.error);
    }

    // ✅ NO MORE DB WRITES — OpenClaw sessions are the single source of truth
    // Messages are stored in OpenClaw's session via the chat call above
    // No conversation records needed for chat persistence

    // 🔧 Task auto-creation: Detect task creation intent and create tasks in database
    const responseContent = result.data?.content || '';
    const createdTaskIds: string[] = [];
    
    // Detect task creation markers in response
    if (responseContent && (
      /creat(?:ed|ing)|add(?:ed|ing)|popula(?:ted|ting)/i.test(responseContent) &&
      /task|kanban|board/i.test(responseContent)
    )) {
      try {
        // Parse tasks from response using multiple patterns
        const taskPatterns = [
          // Pattern 1: Numbered list with descriptions (e.g., "1. Task title - description")
          /(?:^|\n)\d+\.\s+([^\n-:]+?)(?:\s*[-:]\s*([^\n]+))?(?=\n|$)/gm,
          // Pattern 2: Bullet points (e.g., "- Task title: description")
          /(?:^|\n)[-*]\s+([^\n:]+?)(?:\s*:\s*([^\n]+))?(?=\n|$)/gm,
          // Pattern 3: Task: format (e.g., "Task: Title - description")
          /(?:^|\n)Task:\s*([^\n-]+?)(?:\s*[-:]\s*([^\n]+))?(?=\n|$)/gim,
        ];
        
        const extractedTasks: Array<{ title: string; description?: string }> = [];
        
        for (const pattern of taskPatterns) {
          let match;
          while ((match = pattern.exec(responseContent)) !== null) {
            const title = match[1]?.trim();
            const description = match[2]?.trim();
            
            if (title && title.length > 2 && title.length < 200) {
              // Avoid duplicates
              if (!extractedTasks.some(t => t.title === title)) {
                extractedTasks.push({ title, description: description || null });
              }
            }
          }
          if (extractedTasks.length > 0) break; // Stop if we found tasks with first pattern
        }
        
        console.log('[chat] Detected task creation intent, extracted tasks:', extractedTasks.length);
        
        // Create tasks in database
        if (extractedTasks.length > 0) {
          for (const task of extractedTasks.slice(0, 20)) { // Limit to 20 tasks max
            try {
              const [newTask] = await db
                .insert(tasks)
                .values({
                  id: randomUUID(),
                  userId,
                  title: task.title,
                  description: task.description,
                  status: 'backlog',
                  priority: 'medium',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();
              
              createdTaskIds.push(newTask.id);
              console.log('[chat] Created task:', newTask.title);
            } catch (taskErr: any) {
              console.error('[chat] Failed to create task:', task.title, taskErr.message);
            }
          }
        }
      } catch (parseErr: any) {
        console.error('[chat] Task parsing error:', parseErr.message);
      }
    }

    return NextResponse.json({
      content: result.data?.content || 'No response from assistant',
      createdTasks: createdTaskIds.length > 0 ? createdTaskIds : undefined,
      routing: {
        tier: routing.tier,
        model: routing.model,
        confidence: routing.confidence,
      },
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return serverError('Failed to process message', error.message);
  }
}
