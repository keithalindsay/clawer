import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

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
      },
    });

    // Check subscription
    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      );
    }

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

    // Extract bot settings if provided
    const botSettings = settings ? {
      botName: settings.botName || 'Assistant',
      personality: settings.personality || 'helpful and friendly',
      customInstructions: settings.customInstructions || '',
      communicationStyle: settings.communicationStyle || 'balanced',
      responseLength: settings.responseLength || 'balanced',
    } : undefined;

    // Route message to user's OpenClaw container
    console.log('[chat] Routing to container:', {
      userId,
      port: user.containerPort,
      messageLength: message.length,
    });

    const result = await containerApi.chat(
      user.containerPort,
      message,
      context,
      botSettings
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
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
