import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { authenticateContainer } from '@/lib/container-auth';

/**
 * GET /api/container/tasks
 * List tasks for the container's user, optionally filtered by status/priority.
 * Auth: Bearer <gateway_token>
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateContainer(req);
  if (auth.error || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const assignedTo = searchParams.get('assigned_to') || searchParams.get('agentId');

  // Build where conditions
  let where = eq(tasks.userId, auth.userId);
  
  if (status) {
    where = and(where, eq(tasks.status, status))!;
  }
  if (priority) {
    where = and(where, eq(tasks.priority, priority))!;
  }
  if (assignedTo) {
    where = and(where, eq(tasks.assignedTo, assignedTo))!;
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json({ tasks: rows });
}

/**
 * POST /api/container/tasks
 * Create a new task for the container's user.
 * Body: { title, description?, priority?, assigned_to?, status? }
 * Auth: Bearer <gateway_token>
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateContainer(req);
  if (auth.error || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, priority, assigned_to, status } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const validStatuses = ['backlog', 'queued', 'running', 'done', 'failed'];
  
  const taskPriority = validPriorities.includes(priority) ? priority : 'medium';
  const taskStatus = validStatuses.includes(status) ? status : 'backlog';

  const [task] = await db
    .insert(tasks)
    .values({
      id: randomUUID(),
      userId: auth.userId,
      title: title.trim(),
      description: description?.trim() || null,
      status: taskStatus,
      priority: taskPriority,
      assignedTo: assigned_to || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ task }, { status: 201 });
}
