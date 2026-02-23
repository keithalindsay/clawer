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
import { unauthorized, badRequest, forbidden, serviceUnavailable, serverError } from '@/lib/api-errors';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return unauthorized();
  }

  try {
    const { templateName, defaultAgentId } = await req.json();

    if (!templateName || typeof templateName !== 'string') {
      return badRequest('templateName is required');
    }

    // Validate template exists
    const teamConfig = getTeamConfig(templateName);
    if (!teamConfig) {
      return badRequest(`Unknown team template: ${templateName}`);
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
      return forbidden(
        'Team provisioning requires a paid subscription. Upgrade to access AI Teams.',
        JSON.stringify({ upgradeUrl: '/pricing' })
      );
    }

    if (!user.containerId) {
      return serviceUnavailable('Container not provisioned. Please wait or contact support.');
    }

    if (user.containerStatus !== 'running') {
      return serviceUnavailable(`Container is ${user.containerStatus || 'not ready'}. Please wait.`);
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
      return serverError(
        'Provisioning failed',
        error instanceof Error ? error.message : undefined
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
    return serverError('Failed to provision team', error.message);
  }
}

/**
 * GET /api/team/provision
 * Check if team is provisioned
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return unauthorized();
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
    return serverError('Failed to check provisioning status', error.message);
  }
}
