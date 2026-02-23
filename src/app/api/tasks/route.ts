import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { users } from '@/lib/db/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { containerApi } from '@/lib/container-client';
import { getTeamConfig, getAgentFromTeam, buildAgentSystemPrompt } from '@/lib/teams';
import { FREE_TIER_PORT, FREE_TIER_TOKEN } from '@/lib/constants';
import { unauthorized, badRequest } from '@/lib/api-errors';

/**
 * GET /api/tasks
 * List the authenticated user's tasks, optionally filtered by status.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const where = status
    ? and(eq(tasks.userId, userId), eq(tasks.status, status))
    : eq(tasks.userId, userId);

  const rows = await db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json({ tasks: rows });
}

/**
 * POST /api/tasks
 * Create a new task for the authenticated user.
 * Body: { title, description?, priority?, assigned_to? }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { title, description, priority, assigned_to } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return badRequest('Title is required');
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const taskPriority = validPriorities.includes(priority) ? priority : 'medium';

  const [task] = await db
    .insert(tasks)
    .values({
      id: randomUUID(),
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      status: 'backlog',
      priority: taskPriority,
      assignedTo: assigned_to || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ task }, { status: 201 });
}
