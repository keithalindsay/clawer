/**
 * GET  /api/mombrain/family-members — list all family members for the user
 * POST /api/mombrain/family-members — create a new family member
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { familyMembers } from '@/lib/db/schema/mombrain';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { apiSuccess, apiErrors } from '@/lib/api/response';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const members = await db.query.familyMembers.findMany({
      where: eq(familyMembers.userId, userId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    return apiSuccess({ members });
  } catch (error) {
    console.error('[family-members GET]', error);
    return apiErrors.internalError();
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const { name, birthDate, grade, school, interests, dietaryRestrictions, notes } = body;

    if (!name || typeof name !== 'string') {
      return apiErrors.validationError({ field: 'name', message: 'name is required' });
    }

    const [member] = await db
      .insert(familyMembers)
      .values({
        id: randomUUID(),
        userId,
        name: name.trim(),
        birthDate: birthDate ?? null,
        grade: grade ?? null,
        school: school ?? null,
        interests: Array.isArray(interests) ? interests : [],
        dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
        notes: notes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Sync family profile to container workspace so agents can read it
    await syncFamilyProfileToContainer(userId);

    return apiSuccess({ member }, 201);
  } catch (error) {
    console.error('[family-members POST]', error);
    return apiErrors.internalError();
  }
}

// ── Sync helper ───────────────────────────────────────────────────────────────

/**
 * Writes the full family profile (all members) to the container workspace at
 * ~/clawd/family-profile.json so agents always have fresh context.
 */
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

    // Write to clawd root (not data/) so agents find it at ~/clawd/family-profile.json
    const { getContainerClawdPath } = await import('../_helpers');
    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(getContainerClawdPath(user.containerId), 'family-profile.json');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ members, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (err) {
    // Non-critical — don't fail the request if sync fails
    console.warn('[family-members] syncFamilyProfileToContainer failed:', err);
  }
}
