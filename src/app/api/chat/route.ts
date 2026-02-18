import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { bots } from '@/lib/db/schema/bots';
import { conversations } from '@/lib/db/schema/conversations';
import { messages } from '@/lib/db/schema/messages';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { routeRequest } from '@/lib/router';
import { FREE_MESSAGE_LIMIT, FREE_DAILY_LIMIT, FREE_TIER_PORT, FREE_TIER_TOKEN, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { getTeamConfig, getAgentFromTeam, buildAgentSystemPrompt } from '@/lib/teams';
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
    let agentSystemPrompt: string | undefined;
    let conversationId: string | undefined;
    
    if (agentId) {
      const templateName = user?.teamTemplate || 'lifeos';
      const teamConfig = getTeamConfig(templateName);
      
      if (!teamConfig) {
        return NextResponse.json(
          { error: 'Team template not found' },
          { status: 404 }
        );
      }

      const agent = getAgentFromTeam(templateName, agentId);
      
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found in your team' },
          { status: 404 }
        );
      }

      // Build agent-specific system prompt
      agentSystemPrompt = buildAgentSystemPrompt(agent, teamConfig, user?.name || undefined);

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
    const botSettings = settings ? {
      botName: settings.botName || 'Assistant',
      personality: settings.personality || 'helpful and friendly',
      customInstructions: agentSystemPrompt || settings.customInstructions || '',
      communicationStyle: settings.communicationStyle || 'balanced',
      responseLength: settings.responseLength || 'balanced',
    } : agentSystemPrompt ? {
      botName: 'Assistant',
      personality: 'helpful and friendly',
      customInstructions: agentSystemPrompt,
      communicationStyle: 'balanced',
      responseLength: 'balanced',
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

    const result = await containerApi.chat(
      targetPort,
      sanitizedMessage,
      context,
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

    // Persist both messages to the DB for history
    if (conversationId) {
      try {
        await db.insert(messages).values([
          { conversationId, role: 'user', content: sanitizedMessage },
          { conversationId, role: 'assistant', content: result.data?.content || '' },
        ]);
      } catch (saveErr) {
        // Non-fatal: log but don't fail the response
        console.error('[chat] Failed to save messages:', saveErr);
      }
    }

    return NextResponse.json({
      content: result.data?.content || 'No response from assistant',
      conversationId,
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
