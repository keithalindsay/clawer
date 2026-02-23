/**
 * Team Provisioning API
 * 
 * POST /api/team/provision
 * Provisions a team for a user - creates agent workspace, SOUL.md, and session
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { provisionFullTeam as provisionTeam } from '@/lib/container/provision-team';
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
    const alreadyProvisioned = await hasTeamProvisioned(user.containerId);
    if (alreadyProvisioned) {
      return NextResponse.json(
        {
          error: 'team_already_provisioned',
          message: 'Team already provisioned. Contact support to reset.',
        },
        { status: 409 }
      );
    }

    // Provision the team
    console.log('[team-provision] Provisioning team:', { userId, templateName, defaultAgentId });
    
    const result = await provisionTeam({
      userId,
      containerName: user.containerId,
      templateName,
      defaultAgentId,
    });

    if (!result.success) {
      console.error('[team-provision] Failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Provisioning failed' },
        { status: 500 }
      );
    }

    console.log('[team-provision] Success:', { agentId: result.agentId });

    return NextResponse.json({
      success: true,
      teamTemplate: templateName,
      defaultAgent: result.agentId,
      message: 'Team provisioned successfully',
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

    const provisioned = await hasTeamProvisioned(user.containerId);

    return NextResponse.json({
      provisioned,
      teamTemplate: user.teamTemplate || null,
      defaultAgent: user.defaultAgentId || null,
    });

  } catch (error: any) {
    console.error('[team-provision-check] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check provisioning status' },
      { status: 500 }
    );
  }
}
