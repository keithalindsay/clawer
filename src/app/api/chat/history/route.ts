import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema/users';
import { containerApi } from '@/lib/container-client';

/**
 * Find the active OpenClaw session for a given agent and channel
 * 
 * OpenClaw transforms session keys to: agent:main:{channel}-{timestamp}
 * e.g., "agent:main:web-chat-1771880431560"
 * 
 * Instead of deriving the key, we list all sessions and find the right one.
 */
async function findSessionKey(port: number, agentId: string, channel: string = 'webchat'): Promise<string | null> {
  const sessionsResult = await containerApi.getSessions(port);
  
  if (sessionsResult.error || !sessionsResult.data?.sessions) {
    console.error('[history] Failed to list sessions:', sessionsResult.error);
    return null;
  }

  // Find session matching: agent:main:{channel}-*
  // The agentId parameter tells us which agent, but OpenClaw stores under "main"
  const targetPrefix = `agent:main:${channel}-`;
  
  for (const session of sessionsResult.data.sessions) {
    if (session.key.startsWith(targetPrefix)) {
      console.log(`[history] Found session: ${session.key} for agent ${agentId}`);
      return session.key;
    }
  }
  
  // Also check custom-agent:* pattern for custom agents
  for (const session of sessionsResult.data.sessions) {
    if (session.key.startsWith(`custom-agent:${agentId}:`)) {
      console.log(`[history] Found custom session: ${session.key}`);
      return session.key;
    }
  }
  
  console.log('[history] No session found. Available:', sessionsResult.data.sessions.map(s => s.key));
  return null;
}

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

    // Get user's container info and team template
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
        containerStatus: true,
        teamTemplate: true,
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

    // Derive session key directly from agentId (no DB lookup needed!)
    // This matches the pattern used in /api/chat/route.ts
    // Find the actual session key from OpenClaw instead of deriving it
    // OpenClaw transforms "agent:X:main" to "agent:main:webchat-TIMESTAMP"
    const sessionKey = await findSessionKey(user.containerPort, agentId);
    
    if (!sessionKey) {
      // No active session for this agent yet - return empty history
      return NextResponse.json({
        messages: [],
        sessionKey: null,
        totalMessages: 0,
        hasMore: false,
      });
    }

    // Fetch history directly from OpenClaw session via container API
    // No conversation record needed - OpenClaw IS the source of truth
    const historyResult = await containerApi.getSessionHistory(
      user.containerPort,
      sessionKey,
      { limit, offset }
    );

    if (historyResult.error) {
      console.error('[history] Failed to fetch from container:', historyResult.error);
      return NextResponse.json(
        {
          messages: [],
          sessionKey,
          totalMessages: 0,
          hasMore: false,
          error: historyResult.error,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      messages: historyResult.data?.messages || [],
      sessionKey,
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
