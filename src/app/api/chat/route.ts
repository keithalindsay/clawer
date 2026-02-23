import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { bots } from '@/lib/db/schema/bots';
import { conversations } from '@/lib/db/schema/conversations';
import { tasks } from '@/lib/db/schema/tasks';
import { customAgents } from '@/lib/db/schema/custom-agents';
// ✅ REMOVED: messages import - no longer writing to DB
import { eq, sql, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { containerApi } from '@/lib/container-client';
import { routeRequest } from '@/lib/router';
import { FREE_MESSAGE_LIMIT, FREE_DAILY_LIMIT, FREE_TIER_PORT, FREE_TIER_TOKEN, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { getTeamConfig, getAgentFromTeam, TeamMember } from '@/lib/teams';
import { trackDailyUsage, checkDailyLimit, checkUserRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, context, settings, agentId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Input validation: length limit and sanitization
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: 'Too many requests. Please slow down.',
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
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
    // Phase 1: Route to real agent session instead of prompt switching
    let conversationId: string | undefined;
    let sessionKey: string = `user-${userId}-agent-${agentId || 'default'}`;
    
    if (agentId) {
      const templateName = user?.teamTemplate || 'lifeos';
      const teamConfig = getTeamConfig(templateName);
      
      if (!teamConfig) {
        return NextResponse.json(
          { error: 'Team template not found' },
          { status: 404 }
        );
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
        return NextResponse.json(
          { error: 'Agent not found in your team' },
          { status: 404 }
        );
      }

      // Use agent-specific session key (routes to agent's workspace)
      // For custom agents, use a custom-agent-specific session
      sessionKey = isCustomAgent ? `custom-agent:${agentId}:main` : `agent:${agentId}:main`;

      // Find or create agent conversation
      let conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.userId, userId),
          eq(conversations.agentId, agentId),
          isNull(conversations.deletedAt)
        ),
      });

      if (!conversation) {
        // Create new agent conversation
        const userBot = await db.query.bots.findFirst({
          where: eq(bots.userId, userId),
        });

        if (userBot) {
          const [newConversation] = await db
            .insert(conversations)
            .values({
              userId,
              botId: userBot.id,
              title: `Chat with ${agent.name}`,
              agentId: agent.id,
              agentName: agent.name,
              agentEmoji: agent.emoji || '',
              agentRole: agent.role,
              metadata: {
                agentDescription: agent.description,
                triggers: agent.triggers,
                isCustomAgent,
              },
            })
            .returning();

          conversation = newConversation;
        }
      }

      conversationId = conversation?.id;
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
        return NextResponse.json(
          { 
            error: 'free_trial_exceeded',
            message: `You've used all ${FREE_MESSAGE_LIMIT} free messages. Upgrade to keep chatting!`,
            upgradeUrl: '/pricing',
            freeMessagesUsed: freeUsed,
            freeMessageLimit: FREE_MESSAGE_LIMIT,
          },
          { status: 403 }
        );
      }
      
      // Check daily rate limit
      if (!checkDailyLimit(userId, FREE_DAILY_LIMIT)) {
        return NextResponse.json(
          {
            error: 'daily_limit_exceeded',
            message: `You've reached your daily limit of ${FREE_DAILY_LIMIT} messages. Try again tomorrow!`,
            freeMessagesUsed: freeUsed,
            freeMessageLimit: FREE_MESSAGE_LIMIT,
          },
          { status: 429 }
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
        return NextResponse.json(
          { error: 'Container not provisioned. Please wait or contact support.' },
          { status: 503 }
        );
      }

      if (user.containerStatus !== 'running') {
        return NextResponse.json(
          { error: `Container is ${user.containerStatus || 'not ready'}. Please wait.` },
          { status: 503 }
        );
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

    // Classify request using smart router
    // TODO: Load user's model config from DB (model-configs table) for custom selections
    const routing = routeRequest({
      prompt: sanitizedMessage,
      systemPrompt,
      userOrchestratorModel: 'google/gemini-3-flash',   // Smart tier: best reasoning per dollar
      userWorkerModel: 'google/gemini-2.0-flash-lite',  // Bulk tasks: near-zero cost
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

    // Phase 1: Use agent-specific session key for routing
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
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // ✅ NO MORE MESSAGE INSERTS — OpenClaw sessions are the single source of truth
    // Messages are already stored in OpenClaw's session via the chat call above

    // Update conversation metadata if this is an agent conversation
    if (conversationId) {
      try {
        await db
          .update(conversations)
          .set({
            updatedAt: new Date(),
            lastMessageAt: new Date(),
          })
          .where(eq(conversations.id, conversationId));
      } catch (updateErr) {
        console.error('[chat] Failed to update conversation metadata:', updateErr);
      }
    }

    // 🔧 Bug Fix: Detect task creation intent and create tasks in database
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
      conversationId,
      createdTasks: createdTaskIds.length > 0 ? createdTaskIds : undefined,
      routing: {
        tier: routing.tier,
        model: routing.model,
        confidence: routing.confidence,
      },
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
