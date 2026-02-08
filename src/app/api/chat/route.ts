import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { provisionContainer } from '@/lib/orchestrator';
import { routeRequest } from '@/lib/router';

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

    // Extract bot settings if provided
    const botSettings = settings ? {
      botName: settings.botName,
      personality: settings.personality,
      customInstructions: settings.customInstructions,
      communicationStyle: settings.communicationStyle,
      responseLength: settings.responseLength,
    } : undefined;

    // Get user's container port and model preferences
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { 
        containerPort: true, 
        containerId: true,
        stripeSubscriptionId: true,
      },
    });

    // Check subscription
    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      );
    }

    // Auto-provision container if not exists
    if (!user.containerPort) {
      const result = await provisionContainer(userId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to provision container' },
          { status: 500 }
        );
      }
      
      // Refresh user data
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { containerPort: true, containerId: true, stripeSubscriptionId: true },
      });
    }

    if (!user?.containerPort) {
      return NextResponse.json(
        { error: 'Container not available' },
        { status: 503 }
      );
    }

    // ─── Smart Routing ───
    // Classify the message and decide which model to use
    const routing = routeRequest({
      prompt: message,
      systemPrompt: botSettings?.customInstructions,
      // TODO: Get user's model preferences from modelConfigs table
      userOrchestratorModel: 'gpt-4o-mini',  // Default orchestrator
      userWorkerModel: 'gpt-4o-mini',         // Default worker (same for now)
    });

    console.log('[chat] Routing decision:', {
      tier: routing.tier,
      useOrchestrator: routing.useOrchestrator,
      model: routing.model,
      confidence: routing.confidence.toFixed(2),
      signals: routing.signals.slice(0, 3),
      costEstimate: `$${routing.costEstimate.toFixed(6)}`,
    });

    // Send message to container with routing info
    const { data, error, status } = await containerApi.chat(
      user.containerPort,
      message,
      context || 'web-chat',
      {
        ...botSettings,
        // Pass routing decision to container
        routingTier: routing.tier,
        routingModel: routing.model,
        routingConfidence: routing.confidence,
      }
    );

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Return response with routing metadata
    return NextResponse.json({
      ...data,
      _routing: {
        tier: routing.tier,
        model: routing.model,
        confidence: routing.confidence,
        signals: routing.signals,
        costEstimate: routing.costEstimate,
        savings: routing.savings,
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
