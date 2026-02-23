/**
 * GET /api/team/agents/health
 * 
 * Health check that verifies agents actually exist in the user's container.
 * Returns detailed status of each expected agent vs what's actually provisioned.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { sshExec } from '@/lib/ssh';
import { getTeamConfig } from '@/lib/teams';
import { getProvisionedAgents, hasTeamProvisioned } from '@/lib/container/provision-team';

// Map template agent IDs to short OpenClaw agent names (duplicated from provision-team.ts for now)
const AGENT_NAME_MAP: Record<string, string> = {
  'chief-of-staff': 'max',
  'goal-tracker': 'north',
  'researcher': 'scout',
  'executor': 'dash',
  'wellness': 'zen',
  'executive-assistant': 'claire',
  'research-analyst': 'leo',
  'outreach-specialist': 'harper',
  'hunter': 'hunter',
  'shield': 'shield',
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerId: true,
        containerStatus: true,
      },
    });

    if (!user?.containerId) {
      return NextResponse.json({
        healthy: false,
        error: 'No container provisioned',
        containerStatus: 'not_found',
        agents: {
          expected: [],
          actual: [],
          missing: [],
        },
      }, { status: 200 });
    }

    const containerName = `clawer_user_${userId}`;

    // Get expected agents from team config (default to lifeos)
    const teamConfig = getTeamConfig('lifeos');
    const expectedAgents = teamConfig?.members.map(m => ({
      templateId: m.id,
      name: m.name,
      openclawName: AGENT_NAME_MAP[m.id] || m.id.replace(/-/g, ''),
    })) || [];

    // Check if container is running
    let containerRunning = false;
    try {
      const { stdout } = await sshExec(
        `docker inspect ${containerName} --format "{{.State.Running}}"`,
        10000
      );
      containerRunning = stdout.trim() === 'true';
    } catch {
      return NextResponse.json({
        healthy: false,
        error: 'Container not accessible',
        containerStatus: user.containerStatus || 'error',
        agents: {
          expected: expectedAgents.map(a => a.openclawName),
          actual: [],
          missing: expectedAgents.map(a => a.openclawName),
        },
      }, { status: 200 });
    }

    if (!containerRunning) {
      return NextResponse.json({
        healthy: false,
        error: 'Container not running',
        containerStatus: 'stopped',
        agents: {
          expected: expectedAgents.map(a => a.openclawName),
          actual: [],
          missing: expectedAgents.map(a => a.openclawName),
        },
      }, { status: 200 });
    }

    // Get actually provisioned agents from container
    const actualAgents = await getProvisionedAgents(containerName);
    
    // Check for team config file
    const hasTeamConfig = await hasTeamProvisioned(containerName);

    // Calculate missing agents (exclude 'main' from expected)
    const expectedNames = expectedAgents.map(a => a.openclawName);
    const missing = expectedNames.filter(name => !actualAgents.includes(name));
    const extra = actualAgents.filter(name => !expectedNames.includes(name) && name !== 'main');

    // Check if SOUL.md exists for each agent
    const agentDetails: Array<{
      name: string;
      registered: boolean;
      hasSoul: boolean;
      workspace: string | null;
    }> = [];

    for (const expected of expectedAgents) {
      const registered = actualAgents.includes(expected.openclawName);
      let hasSoul = false;
      let workspace: string | null = null;

      if (registered) {
        try {
          workspace = `/home/user/workspace-${expected.openclawName}`;
          const { stdout } = await sshExec(
            `docker exec ${containerName} test -f ${workspace}/SOUL.md && echo "yes" || echo "no"`,
            5000
          );
          hasSoul = stdout.trim() === 'yes';
        } catch {
          // Ignore errors checking SOUL.md
        }
      }

      agentDetails.push({
        name: expected.openclawName,
        registered,
        hasSoul,
        workspace: registered ? workspace : null,
      });
    }

    const healthy = missing.length === 0 && hasTeamConfig;

    return NextResponse.json({
      healthy,
      containerStatus: 'running',
      hasTeamConfig,
      agents: {
        expected: expectedNames,
        actual: actualAgents,
        missing,
        extra,
        details: agentDetails,
      },
      summary: healthy 
        ? `All ${expectedNames.length} agents provisioned correctly`
        : `Missing ${missing.length} of ${expectedNames.length} agents: ${missing.join(', ')}`,
    });

  } catch (error) {
    console.error('[HEALTH] Error checking agent health:', error);
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      agents: {
        expected: [],
        actual: [],
        missing: [],
      },
    }, { status: 500 });
  }
}
