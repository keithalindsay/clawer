import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq, sql } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { routeRequest } from '@/lib/router';
import { FREE_MESSAGE_LIMIT, FREE_DAILY_LIMIT, FREE_TIER_PORT, FREE_TIER_TOKEN } from '@/lib/constants';
import { trackDailyUsage, checkDailyLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, context, settings } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user with container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { 
        stripeSubscriptionId: true,
        containerPort: true,
        containerStatus: true,
        freeMessagesUsed: true,
      },
    });

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
    const routing = routeRequest({
      prompt: message,
      systemPrompt,
      userOrchestratorModel: 'openai/gpt-4o-mini',
      userWorkerModel: 'openai/gpt-4o-mini',  // Both using same model for now
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
      messageLength: message.length,
    });

    const result = await containerApi.chat(
      targetPort,
      message,
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

    return NextResponse.json({
      content: result.data?.content || 'No response from assistant',
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
