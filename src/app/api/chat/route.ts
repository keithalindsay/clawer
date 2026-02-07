import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { provisionContainer } from '@/lib/orchestrator';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, context } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user's container port
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

    // Send message to container
    const { data, error, status } = await containerApi.chat(
      user.containerPort,
      message,
      context || 'web-chat'
    );

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
