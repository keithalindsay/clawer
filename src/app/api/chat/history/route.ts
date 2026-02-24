import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema/users';
import { containerApi } from '@/lib/container-client';

/**
 * Find the active OpenClaw session for a given agent
 * 
 * Session keys are now agent-specific: agent:main:web-chat-{agentId}-{timestamp}
 * e.g., "agent:main:web-chat-executive-assistant-1771880431560"
 * 
 * We find the most recently updated session for the specific agent.
 */
async function findSessionKey(port: number, agentId: string): Promise<string | null> {
  const sessionsResult = await containerApi.getSessions(port);
  
  if (sessionsResult.error || !sessionsResult.data?.sessions) {
    console.error('[history] Failed to list sessions:', sessionsResult.error);
    return null;
  }

  // Find sessions matching this specific agent
  // Pattern: agent:main:web-chat-{agentId}-{timestamp}
  const agentSessions = sessionsResult.data.sessions
    .filter(s => s.key.includes(`web-chat-${agentId}-`))
    .sort((a, b) => {
      // Handle updatedAt as either ISO string or unix ms
      const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
      const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
      return bTime - aTime;
    });

  if (agentSessions.length > 0) {
    console.log(`[history] Found session: ${agentSessions[0].key} for agent ${agentId}`);
    return agentSessions[0].key;
  }
  
  // Fallback: check custom-agent:* pattern for custom agents
  for (const session of sessionsResult.data.sessions) {
    if (session.key.startsWith(`custom-agent:${agentId}:`)) {
      console.log(`[history] Found custom session: ${session.key}`);
      return session.key;
    }
  }
  
  // Legacy fallback: check for old-style sessions without agent ID
  // This supports migration from the old shared session format
  const legacySessions = sessionsResult.data.sessions
    .filter(s => s.key.startsWith('agent:main:web-chat-') && !s.key.includes('web-chat-default-'))
    .sort((a, b) => {
      const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
      const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
      return bTime - aTime;
    });
  
  if (legacySessions.length > 0 && agentId !== 'default') {
    // Only show legacy session for the first agent to preserve history
    // New messages will go to agent-specific sessions
    console.log(`[history] Found legacy session: ${legacySessions[0].key}`);
  }
  
  console.log('[history] No session found for agent:', agentId, 'Available:', sessionsResult.data.sessions.map(s => s.key));
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

    // Fetch history directly from OpenClaw session via container API
    // The container now supports agentId-based lookup to find the most recent session
    // No conversation record needed - OpenClaw IS the source of truth
    const historyResult = await containerApi.getSessionHistory(
      user.containerPort,
      null, // Let container find session by agentId
      { limit, offset, agentId }
    );
    
    const sessionKey = historyResult.data?.sessionKey || null;

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
