import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { customAgents } from '@/lib/db/schema/custom-agents';
import { eq, and } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { getTeamConfig, getAgentFromTeam } from '@/lib/teams';

/**
 * Derive OpenClaw session key from agentId
 * 
 * Pattern:
 * - Template agents: `agent:{agentId}:main` (e.g., `agent:executive-assistant:main`)
 * - Custom agents: `custom-agent:{agentId}:main`
 * 
 * This matches the pattern used in /api/chat/route.ts line ~98
 */
async function deriveSessionKey(userId: string, agentId: string, teamTemplate?: string): Promise<{ sessionKey: string; isCustomAgent: boolean } | null> {
  const templateName = teamTemplate || 'lifeos';
  const teamConfig = getTeamConfig(templateName);
  
  if (!teamConfig) {
    return null;
  }

  // First try template agent
  const agent = getAgentFromTeam(templateName, agentId);
  
  if (agent) {
    return { sessionKey: `agent:${agentId}:main`, isCustomAgent: false };
  }
  
  // Check custom agents in database
  const customAgent = await db.query.customAgents.findFirst({
    where: and(
      eq(customAgents.userId, userId),
      eq(customAgents.agentId, agentId)
    ),
  });
  
  if (customAgent) {
    return { sessionKey: `custom-agent:${agentId}:main`, isCustomAgent: true };
  }
  
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
    const sessionInfo = await deriveSessionKey(userId, agentId, user.teamTemplate || undefined);
    
    if (!sessionInfo) {
      return NextResponse.json(
        { error: 'Agent not found in your team' },
        { status: 404 }
      );
    }

    const { sessionKey } = sessionInfo;

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
