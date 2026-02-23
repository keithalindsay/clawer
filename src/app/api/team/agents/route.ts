/**
 * Custom Agents API
 * 
 * CRUD operations for user-created custom agents (Phase 4)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { customAgents } from '@/lib/db/schema/custom-agents';
import { users } from '@/lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import { provisionCustomAgent } from '@/lib/container/provision-custom-agent';
import { getTeamConfig } from '@/lib/teams';

/**
 * GET /api/team/agents - List all agents (template + custom)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team template
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get template agents
    const teamConfig = getTeamConfig(user.teamTemplate || 'lifeos');
    const templateAgents = teamConfig?.members || [];

    // Get custom agents
    const userCustomAgents = await db.query.customAgents.findMany({
      where: eq(customAgents.userId, userId),
      orderBy: (agents, { desc }) => [desc(agents.createdAt)],
    });

    // Combine and format
    const allAgents = [
      ...templateAgents.map(agent => ({
        ...agent,
        isCustom: false,
        isTemplate: true,
      })),
      ...userCustomAgents.map(agent => ({
        id: agent.agentId,
        name: agent.name,
        role: agent.role || 'Assistant',
        emoji: agent.emoji || '🤖',
        description: agent.personality || '',
        triggers: agent.triggers || [],
        quickPrompts: agent.quickPrompts || [],
        skills: agent.skills || [],
        delegationConfig: agent.delegationConfig || {},
        isCustom: true,
        isTemplate: false,
        dbId: agent.id,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      })),
    ];

    return NextResponse.json({
      agents: allAgents,
      teamTemplate: user.teamTemplate || 'lifeos',
      teamName: teamConfig?.name || 'Personal Assistant',
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/agents - Create custom agent
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      id: agentId,
      emoji,
      role,
      personality,
      skills,
      canDelegateTo,
      canReceiveFrom,
      triggers,
      quickPrompts,
    } = body;

    // Validate required fields
    if (!agentId || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, role' },
        { status: 400 }
      );
    }

    // Check if agent ID already exists for this user
    const existing = await db.query.customAgents.findFirst({
      where: and(
        eq(customAgents.userId, userId),
        eq(customAgents.agentId, agentId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Agent with this ID already exists' },
        { status: 409 }
      );
    }

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.containerId) {
      return NextResponse.json(
        { error: 'User container not found' },
        { status: 404 }
      );
    }

    // Create agent in database
    const [newAgent] = await db
      .insert(customAgents)
      .values({
        userId,
        agentId,
        name,
        emoji: emoji || '🤖',
        role,
        personality,
        skills: skills || [],
        delegationConfig: {
          canDelegateTo: canDelegateTo || [],
          canReceiveFrom: canReceiveFrom || [],
        },
        triggers: triggers || [],
        quickPrompts: quickPrompts || [],
        config: body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Provision agent in container
    const provisionResult = await provisionCustomAgent({
      containerName: user.containerId,
      agentId,
      name,
      role,
      emoji: emoji || '🤖',
      personality,
      description: personality || role,
      skills: skills || [],
      triggers: triggers || [],
      quickPrompts: quickPrompts || [],
      delegationConfig: {
        canDelegateTo: canDelegateTo || [],
        canReceiveFrom: canReceiveFrom || [],
      },
    });

    if (!provisionResult.success) {
      // Rollback DB insert if provisioning failed
      await db
        .delete(customAgents)
        .where(eq(customAgents.id, newAgent.id));

      return NextResponse.json(
        { error: 'Failed to provision agent', details: provisionResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: newAgent.agentId,
        dbId: newAgent.id,
        name: newAgent.name,
        role: newAgent.role,
        emoji: newAgent.emoji,
        personality: newAgent.personality,
        skills: newAgent.skills,
        delegationConfig: newAgent.delegationConfig,
        triggers: newAgent.triggers,
        quickPrompts: newAgent.quickPrompts,
        createdAt: newAgent.createdAt,
        updatedAt: newAgent.updatedAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/agents?agentId=... - Remove custom agent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' },
        { status: 400 }
      );
    }

    // Find and delete the agent
    const agent = await db.query.customAgents.findFirst({
      where: and(
        eq(customAgents.userId, userId),
        eq(customAgents.agentId, agentId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    await db
      .delete(customAgents)
      .where(and(
        eq(customAgents.userId, userId),
        eq(customAgents.agentId, agentId)
      ));

    // TODO: Also remove agent workspace from container
    // This would require additional container cleanup logic

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/agents?agentId=... - Update custom agent
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      emoji,
      role,
      personality,
      skills,
      canDelegateTo,
      canReceiveFrom,
      triggers,
      quickPrompts,
    } = body;

    // Find the agent
    const agent = await db.query.customAgents.findFirst({
      where: and(
        eq(customAgents.userId, userId),
        eq(customAgents.agentId, agentId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Update agent
    const [updated] = await db
      .update(customAgents)
      .set({
        name: name || agent.name,
        emoji: emoji || agent.emoji,
        role: role || agent.role,
        personality: personality !== undefined ? personality : agent.personality,
        skills: skills || agent.skills,
        delegationConfig: {
          canDelegateTo: canDelegateTo || (agent.delegationConfig as any)?.canDelegateTo || [],
          canReceiveFrom: canReceiveFrom || (agent.delegationConfig as any)?.canReceiveFrom || [],
        },
        triggers: triggers || agent.triggers,
        quickPrompts: quickPrompts || agent.quickPrompts,
        config: body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(customAgents.userId, userId),
        eq(customAgents.agentId, agentId)
      ))
      .returning();

    // TODO: Regenerate SOUL.md in container with updated config

    return NextResponse.json({
      success: true,
      agent: {
        id: updated.agentId,
        dbId: updated.id,
        name: updated.name,
        role: updated.role,
        emoji: updated.emoji,
        personality: updated.personality,
        skills: updated.skills,
        delegationConfig: updated.delegationConfig,
        triggers: updated.triggers,
        quickPrompts: updated.quickPrompts,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating custom agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent', details: error.message },
      { status: 500 }
    );
  }
}
