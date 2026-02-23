import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { eq, and } from 'drizzle-orm';
import { authenticateContainer } from '@/lib/container-auth';

/**
 * GET /api/container/tasks/[id]
 * Get a single task by ID.
 * Auth: Bearer <gateway_token>
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateContainer(req);
  if (auth.error || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, auth.userId)),
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

/**
 * PATCH /api/container/tasks/[id]
 * Update a task's fields.
 * Body: { title?, description?, status?, priority?, assigned_to? }
 * Auth: Bearer <gateway_token>
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateContainer(req);
  if (auth.error || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, auth.userId)),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const validStatuses = ['backlog', 'queued', 'running', 'done', 'failed'];
  const validPriorities = ['low', 'medium', 'high', 'urgent'];

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
  if (body.status !== undefined && validStatuses.includes(body.status)) {
    updates.status = body.status;
    // Track timing
    if (body.status === 'running' && !existing.startedAt) {
      updates.startedAt = new Date();
    }
    if ((body.status === 'done' || body.status === 'failed') && !existing.completedAt) {
      updates.completedAt = new Date();
    }
  }
  if (body.priority !== undefined && validPriorities.includes(body.priority)) updates.priority = body.priority;
  if (body.assigned_to !== undefined) updates.assignedTo = body.assigned_to || null;
  if (body.result !== undefined) updates.result = body.result || null;
  if (body.error !== undefined) updates.error = body.error || null;

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, id), eq(tasks.userId, auth.userId)))
    .returning();

  return NextResponse.json({ task: updated });
}

/**
 * DELETE /api/container/tasks/[id]
 * Delete a task.
 * Auth: Bearer <gateway_token>
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateContainer(req);
  if (auth.error || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, auth.userId)),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, auth.userId)));

  return NextResponse.json({ success: true });
}
