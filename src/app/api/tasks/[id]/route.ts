import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/tasks/[id]
 * Update a task's fields. Only the owner can update.
 * Body: { title?, description?, status?, priority?, assigned_to? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const validStatuses = ['backlog', 'queued', 'running', 'done', 'failed'];
  const validPriorities = ['low', 'medium', 'high', 'urgent'];

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
  if (body.status !== undefined && validStatuses.includes(body.status)) updates.status = body.status;
  if (body.priority !== undefined && validPriorities.includes(body.priority)) updates.priority = body.priority;
  if (body.assigned_to !== undefined) updates.assignedTo = body.assigned_to || null;

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();

  return NextResponse.json({ task: updated });
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task. Only the owner can delete.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  return NextResponse.json({ success: true });
}
