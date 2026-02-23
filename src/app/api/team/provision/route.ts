/**
 * Team Provisioning API
 * 
 * POST /api/team/provision
 * Provisions a team for a user - creates agent workspace, SOUL.md, and session
 * 
 * Query params:
 * - force=true: Re-provision even if team already exists
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { provisionFullTeam, hasTeamProvisioned, getProvisionedAgents } from '@/lib/container/provision-team';
import { getTeamConfig } from '@/lib/teams';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { templateName, defaultAgentId } = await req.json();

    if (!templateName || typeof templateName !== 'string') {
      return NextResponse.json(
        { error: 'templateName is required' },
        { status: 400 }
      );
    }

    // Validate template exists
    const teamConfig = getTeamConfig(templateName);
    if (!teamConfig) {
      return NextResponse.json(
        { error: `Unknown team template: ${templateName}` },
        { status: 400 }
      );
    }

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerId: true,
        containerPort: true,
        containerStatus: true,
        stripeSubscriptionId: true,
      },
    });

    // Only paid users can provision teams (free tier uses shared container)
    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: 'team_provisioning_requires_subscription',
          message: 'Team provisioning requires a paid subscription. Upgrade to access AI Teams.',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    if (!user.containerId) {
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

    // Check if team already provisioned
    const containerName = `clawer_user_${userId}`;
    const force = req.nextUrl.searchParams.get('force') === 'true';
    const alreadyProvisioned = await hasTeamProvisioned(containerName);
    
    if (alreadyProvisioned && !force) {
      // Return existing agents instead of error
      const agents = await getProvisionedAgents(containerName);
      return NextResponse.json({
        success: true,
        teamTemplate: templateName,
        agents: agents.filter(a => a !== 'main'),
        message: 'Team already provisioned',
        alreadyProvisioned: true,
      });
    }

    // Provision the team
    console.log('[team-provision] Provisioning team:', { userId, templateName, defaultAgentId, force });
    
    try {
      await provisionFullTeam({
        userId,
        containerName,
        templateName,
        defaultAgentId,
      });
    } catch (error) {
      console.error('[PROVISION ERROR] Failed to provision team:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Provisioning failed' },
        { status: 500 }
      );
    }

    // Get provisioned agents
    const agents = await getProvisionedAgents(containerName);
    console.log('[team-provision] Success:', { agents });

    return NextResponse.json({
      success: true,
      teamTemplate: templateName,
      agents: agents.filter(a => a !== 'main'),
      message: force ? 'Team re-provisioned successfully' : 'Team provisioned successfully',
    });

  } catch (error: any) {
    console.error('[team-provision] Error:', error);
    return NextResponse.json(
      { error: 'Failed to provision team' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team/provision
 * Check if team is provisioned
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerId: true,
        teamTemplate: true,
        defaultAgentId: true,
      },
    });

    if (!user?.containerId) {
      return NextResponse.json({
        provisioned: false,
        message: 'No container found',
      });
    }

    const containerName = `clawer_user_${userId}`;
    const provisioned = await hasTeamProvisioned(containerName);
    const agents = provisioned ? await getProvisionedAgents(containerName) : [];

    return NextResponse.json({
      provisioned,
      teamTemplate: user.teamTemplate || 'lifeos',
      defaultAgent: user.defaultAgentId || null,
      agents: agents.filter(a => a !== 'main'),
    });

  } catch (error: any) {
    console.error('[team-provision-check] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check provisioning status' },
      { status: 500 }
    );
  }
}
