import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { eq, isNull } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // Get conversations from DB for metadata
    const dbConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)],
      limit: 50,
    });

    // Fetch session list from OpenClaw
    const sessionsResult = await containerApi.getSessions(user.containerPort);

    if (sessionsResult.error) {
      // Fallback to DB-only data
      return NextResponse.json({
        conversations: dbConversations.map(c => ({
          id: c.id,
          agentId: c.agentId,
          agentName: c.agentName,
          title: c.title,
          sessionKey: c.sessionKey,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: 0,
        })),
      });
    }

    // Merge DB conversations with OpenClaw session metadata
    const sessions = sessionsResult.data?.sessions || [];
    const enriched = dbConversations.map(convo => {
      const session = sessions.find((s: any) => s.key === convo.sessionKey);
      return {
        id: convo.id,
        agentId: convo.agentId,
        agentName: convo.agentName,
        agentEmoji: convo.agentEmoji,
        title: convo.title,
        sessionKey: convo.sessionKey,
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt,
        messageCount: session?.messageCount || 0,
        tokenEstimate: session?.tokenEstimate || 0,
        lastActivity: session?.updatedAt || convo.updatedAt,
      };
    });

    return NextResponse.json({
      conversations: enriched,
    });

  } catch (error: any) {
    console.error('[sessions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
