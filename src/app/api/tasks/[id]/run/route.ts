import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { users } from '@/lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { getTeamConfig, getAgentFromTeam, buildAgentSystemPrompt } from '@/lib/teams';
import { FREE_TIER_PORT, FREE_TIER_TOKEN } from '@/lib/constants';

/**
 * POST /api/tasks/[id]/run
 * Execute a task by sending its description to the user's container.
 * Transitions: queued/backlog → running → done | failed
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Load task
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status === 'running') {
    return NextResponse.json({ error: 'Task is already running' }, { status: 409 });
  }

  // Load user for container info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      containerPort: true,
      containerStatus: true,
      stripeSubscriptionId: true,
      gatewayToken: true,
      teamTemplate: true,
      name: true,
    },
  });

  // Determine target container
  const hasSubscription = !!user?.stripeSubscriptionId;
  let targetPort: number;
  let targetToken: string | undefined;

  if (!hasSubscription) {
    targetPort = FREE_TIER_PORT;
    targetToken = FREE_TIER_TOKEN;
  } else {
    if (!user?.containerPort) {
      return NextResponse.json({ error: 'Container not provisioned' }, { status: 503 });
    }
    if (user.containerStatus !== 'running') {
      return NextResponse.json(
        { error: `Container is ${user.containerStatus || 'not ready'}` },
        { status: 503 }
      );
    }
    targetPort = user.containerPort;
    targetToken = undefined;
  }

  // Build agent system prompt if task has an assigned agent
  let botSettings: Record<string, string> | undefined;
  if (task.assignedTo) {
    const templateName = user?.teamTemplate || 'lifeos';
    const teamConfig = getTeamConfig(templateName);
    if (teamConfig) {
      const agent = getAgentFromTeam(templateName, task.assignedTo);
      if (agent) {
        const systemPrompt = buildAgentSystemPrompt(agent, teamConfig, user?.name || undefined);
        botSettings = {
          botName: agent.name,
          personality: 'helpful and professional',
          customInstructions: systemPrompt,
          communicationStyle: 'balanced',
          responseLength: 'balanced',
        };
      }
    }
  }

  // Mark as running
  await db
    .update(tasks)
    .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasks.id, id));

  // Build the message to send — structured prompt so the agent understands context
  const message = [
    '[TASK ASSIGNMENT]',
    `Title: ${task.title}`,
    `Priority: ${task.priority || 'normal'}`,
    task.description ? `Description: ${task.description}` : '',
    '',
    'Please complete this task thoroughly. When done, provide a clear summary of what you accomplished and any results.',
  ].filter(line => line !== undefined).join('\n').trim();

  // Execute via container
  const result = await containerApi.chat(
    targetPort,
    message,
    undefined,
    botSettings,
    targetToken
  );

  if (result.error || !result.data?.content) {
    // Mark as failed
    await db
      .update(tasks)
      .set({
        status: 'failed',
        error: result.error || 'No response from agent',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id));

    return NextResponse.json({ error: result.error || 'Execution failed' }, { status: 500 });
  }

  // Mark as done
  const [updated] = await db
    .update(tasks)
    .set({
      status: 'done',
      result: result.data.content,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();

  return NextResponse.json({ task: updated });
}
