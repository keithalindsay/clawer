import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema/users';
import { containerApi } from '@/lib/container-client';

/**
 * Find the active OpenClaw session for a given agent
 * 
 * OpenClaw transforms session keys to: agent:main:web-chat-{timestamp}
 * e.g., "agent:main:web-chat-1771880431560"
 * 
 * Instead of deriving the key, we list all sessions and find the right one.
 * Returns the most recently updated session (sorted by updatedAt descending).
 */
async function findSessionKey(port: number, agentId: string): Promise<string | null> {
  const sessionsResult = await containerApi.getSessions(port);
  
  if (sessionsResult.error || !sessionsResult.data?.sessions) {
    console.error('[history] Failed to list sessions:', sessionsResult.error);
    return null;
  }

  // Find sessions matching: agent:main:web-chat-* (OpenClaw uses hyphenated "web-chat")
  // Sort by updatedAt descending to get most recent
  const webChatSessions = sessionsResult.data.sessions
    .filter(s => s.key.startsWith('agent:main:web-chat-'))
    .sort((a, b) => {
      // Handle updatedAt as either ISO string or unix ms
      const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
      const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
      return bTime - aTime;
    });

  if (webChatSessions.length > 0) {
    console.log(`[history] Found session: ${webChatSessions[0].key} for agent ${agentId}`);
    return webChatSessions[0].key;
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
