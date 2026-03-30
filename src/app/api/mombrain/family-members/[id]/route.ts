/**
 * PUT    /api/mombrain/family-members/:id — update a family member
 * DELETE /api/mombrain/family-members/:id — delete a family member
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { familyMembers } from '@/lib/db/schema/mombrain';
import { users } from '@/lib/db/schema/users';
import { and, eq } from 'drizzle-orm';
import { apiSuccess, apiErrors } from '@/lib/api/response';

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const { id } = await params;

    // Verify ownership before updating
    const existing = await db.query.familyMembers.findFirst({
      where: and(eq(familyMembers.id, id), eq(familyMembers.userId, userId)),
    });
    if (!existing) return apiErrors.notFound('Family member');

    const body = await req.json();
    const { name, birthDate, grade, school, interests, dietaryRestrictions, notes } = body;

    const [updated] = await db
      .update(familyMembers)
      .set({
        ...(name !== undefined && { name: String(name).trim() }),
        ...(birthDate !== undefined && { birthDate }),
        ...(grade !== undefined && { grade }),
        ...(school !== undefined && { school }),
        ...(interests !== undefined && { interests: Array.isArray(interests) ? interests : [] }),
        ...(dietaryRestrictions !== undefined && {
          dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
        }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(and(eq(familyMembers.id, id), eq(familyMembers.userId, userId)))
      .returning();

    // Sync family profile to container
    await syncFamilyProfileToContainer(userId);

    return apiSuccess({ member: updated });
  } catch (error) {
    console.error('[family-members/[id] PUT]', error);
    return apiErrors.internalError();
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const { id } = await params;

    const existing = await db.query.familyMembers.findFirst({
      where: and(eq(familyMembers.id, id), eq(familyMembers.userId, userId)),
    });
    if (!existing) return apiErrors.notFound('Family member');

    await db
      .delete(familyMembers)
      .where(and(eq(familyMembers.id, id), eq(familyMembers.userId, userId)));

    await syncFamilyProfileToContainer(userId);

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    console.error('[family-members/[id] DELETE]', error);
    return apiErrors.internalError();
  }
}

// ── Sync helper ───────────────────────────────────────────────────────────────

async function syncFamilyProfileToContainer(userId: string): Promise<void> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerId: true },
    });
    if (!user?.containerId) return;

    const members = await db.query.familyMembers.findMany({
      where: eq(familyMembers.userId, userId),
    });

    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(
      `/opt/clawer/userdata/${user.containerId}/clawd`,
      'family-profile.json'
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify({ members, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[family-members/[id]] syncFamilyProfileToContainer failed:', err);
  }
}
