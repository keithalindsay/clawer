import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { eq, and, isNull } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
        containerStatus: true,
      },
    });

    if (!user?.containerPort) {
      return NextResponse.json(
        { error: 'Container not provisioned' },
        { status: 503 }
      );
    }

    if (user.containerStatus !== 'running') {
      return NextResponse.json(
        { error: 'Container not running' },
        { status: 503 }
      );
    }

    // Find or create conversation for this agent
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.userId, userId),
        eq(conversations.agentId, agentId),
        isNull(conversations.deletedAt)
      ),
    });

    if (!conversation) {
      // No conversation exists yet - return empty history
      return NextResponse.json({
        messages: [],
        conversationId: null,
        sessionKey: null,
        totalMessages: 0,
        hasMore: false,
      });
    }

    // Fetch history from OpenClaw session via container API
    const historyResult = await containerApi.getSessionHistory(
      user.containerPort,
      conversation.sessionKey,
      { limit, offset }
    );

    if (historyResult.error) {
      console.error('[history] Failed to fetch from container:', historyResult.error);
      return NextResponse.json(
        {
          messages: [],
          conversationId: conversation.id,
          sessionKey: conversation.sessionKey,
          totalMessages: 0,
          hasMore: false,
          error: historyResult.error,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      messages: historyResult.data?.messages || [],
      conversationId: conversation.id,
      sessionKey: conversation.sessionKey,
      totalMessages: historyResult.data?.totalMessages || 0,
      hasMore: historyResult.data?.hasMore || false,
      metadata: historyResult.data?.metadata,
    });

  } catch (error: any) {
    console.error('[history] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
