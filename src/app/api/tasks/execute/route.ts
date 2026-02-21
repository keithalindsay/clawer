import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { users } from '@/lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { getTeamConfig, getAgentFromTeam, buildAgentSystemPrompt } from '@/lib/teams';
import { FREE_TIER_PORT, FREE_TIER_TOKEN } from '@/lib/constants';

/**
 * POST /api/tasks/execute
 *
 * Sends a task to the user's container agent for execution.
 * Unlike /api/tasks/[id]/run (which is used by the Kanban play button),
 * this endpoint also logs an agent_event so the activity feed reflects it.
 *
 * Body: { taskId: string }
 *
 * Response:
 *   202 Accepted — task dispatched, execution happens async
 *   { task, event }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let taskId: string;
  try {
    const body = await req.json();
    taskId = body.taskId;
    if (!taskId || typeof taskId !== 'string') throw new Error('missing taskId');
  } catch {
    return NextResponse.json({ error: 'Request body must contain { taskId: string }' }, { status: 400 });
  }

  // Load task — must belong to this user
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
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

  // Resolve container target
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

  // Resolve agent info from team template
  let agentName = 'Assistant';
  let agentEmoji = '🤖';
  let botSettings: Record<string, string> | undefined;

  if (task.assignedTo) {
    const templateName = user?.teamTemplate || 'lifeos';
    const teamConfig = getTeamConfig(templateName);
    const agent = teamConfig ? getAgentFromTeam(templateName, task.assignedTo) : null;
    if (agent) {
      agentName = agent.name;
      agentEmoji = agent.emoji || '🤖';
      const systemPrompt = buildAgentSystemPrompt(agent, teamConfig!, user?.name || undefined);
      botSettings = {
        botName: agent.name,
        personality: 'helpful and professional',
        customInstructions: systemPrompt,
        communicationStyle: 'balanced',
        responseLength: 'balanced',
      };
    }
  }

  // Mark task as running
  await db
    .update(tasks)
    .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  // Log "started working" event immediately so activity feed updates
  const [startedEvent] = await db
    .insert(agentEvents)
    .values({
      userId,
      eventType: 'task_complete', // placeholder — will be overwritten on completion
      agentName,
      agentEmoji,
      summary: `${agentEmoji} ${agentName} started working on: ${task.title}`,
      details: { taskId, taskTitle: task.title, phase: 'started' },
    })
    .returning();

  // Build message for the agent
  const message = [
    '[TASK ASSIGNMENT]',
    `Title: ${task.title}`,
    `Priority: ${task.priority || 'normal'}`,
    task.description ? `Description: ${task.description}` : '',
    '',
    'Please complete this task thoroughly. When done, provide a clear summary of what you accomplished and any results.',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  // Execute via container — this is synchronous for now (waits for response)
  const result = await containerApi.chat(
    targetPort,
    message,
    undefined,
    botSettings,
    targetToken
  );

  if (result.error || !result.data?.content) {
    // Mark task failed
    await db
      .update(tasks)
      .set({
        status: 'failed',
        error: result.error || 'No response from agent',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    // Log error event
    await db.insert(agentEvents).values({
      userId,
      eventType: 'error',
      agentName,
      agentEmoji,
      summary: `❌ ${agentName} failed on: ${task.title}`,
      details: { taskId, taskTitle: task.title, error: result.error },
    });

    return NextResponse.json(
      { error: result.error || 'Execution failed' },
      { status: 500 }
    );
  }

  // Mark task done
  const [updatedTask] = await db
    .update(tasks)
    .set({
      status: 'done',
      result: result.data.content,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  // Update the start event to reflect completion
  await db
    .update(agentEvents)
    .set({
      eventType: 'task_complete',
      summary: `✅ ${agentName} completed: ${task.title}`,
      details: { taskId, taskTitle: task.title, phase: 'completed' },
    })
    .where(eq(agentEvents.id, startedEvent.id));

  return NextResponse.json({ task: updatedTask });
}
