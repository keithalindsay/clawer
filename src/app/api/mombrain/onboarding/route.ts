/**
 * POST /api/mombrain/onboarding
 *
 * Batch-creates family members + preferences, then marks onboarding complete
 * on the user record.  The Expo app sends everything in a single request so
 * the user experience feels instant.
 *
 * Request body:
 * {
 *   displayName?: string
 *   timezone?: string
 *   members: Array<{ name, birthDate?, grade?, school?, interests?, dietaryRestrictions?, notes? }>
 *   preferences?: { dietaryRestrictions?, cuisinePreferences?, budgetLevel?,
 *                   cookingSkill?, dinnerTime?, groceryDay? }
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { familyMembers, familyPreferences } from '@/lib/db/schema/mombrain';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const {
      displayName,
      timezone,
      members: rawMembers,
      preferences: rawPrefs,
    } = body;

    // Basic validation
    if (!Array.isArray(rawMembers)) {
      return apiErrors.validationError({ field: 'members', message: 'members must be an array' });
    }

    const now = new Date();

    // 1. Insert family members
    const createdMembers = [];
    for (const m of rawMembers) {
      if (!m.name || typeof m.name !== 'string') continue; // skip invalid entries

      const [member] = await db
        .insert(familyMembers)
        .values({
          id: randomUUID(),
          userId,
          name: String(m.name).trim(),
          birthDate: m.birthDate ?? null,
          grade: m.grade ?? null,
          school: m.school ?? null,
          interests: Array.isArray(m.interests) ? m.interests : [],
          dietaryRestrictions: Array.isArray(m.dietaryRestrictions) ? m.dietaryRestrictions : [],
          notes: m.notes ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      createdMembers.push(member);
    }

    // 2. Upsert family preferences
    let preferences = null;
    if (rawPrefs) {
      const existing = await db.query.familyPreferences.findFirst({
        where: eq(familyPreferences.userId, userId),
      });

      if (existing) {
        [preferences] = await db
          .update(familyPreferences)
          .set({
            ...(rawPrefs.dietaryRestrictions !== undefined && {
              dietaryRestrictions: Array.isArray(rawPrefs.dietaryRestrictions)
                ? rawPrefs.dietaryRestrictions
                : [],
            }),
            ...(rawPrefs.cuisinePreferences !== undefined && {
              cuisinePreferences: Array.isArray(rawPrefs.cuisinePreferences)
                ? rawPrefs.cuisinePreferences
                : [],
            }),
            ...(rawPrefs.budgetLevel && { budgetLevel: String(rawPrefs.budgetLevel) }),
            ...(rawPrefs.cookingSkill && { cookingSkill: String(rawPrefs.cookingSkill) }),
            ...(rawPrefs.dinnerTime && { dinnerTime: String(rawPrefs.dinnerTime) }),
            ...(rawPrefs.groceryDay && { groceryDay: String(rawPrefs.groceryDay) }),
            updatedAt: now,
          })
          .where(eq(familyPreferences.userId, userId))
          .returning();
      } else {
        [preferences] = await db
          .insert(familyPreferences)
          .values({
            userId,
            dietaryRestrictions: Array.isArray(rawPrefs.dietaryRestrictions)
              ? rawPrefs.dietaryRestrictions
              : [],
            cuisinePreferences: Array.isArray(rawPrefs.cuisinePreferences)
              ? rawPrefs.cuisinePreferences
              : [],
            budgetLevel: rawPrefs.budgetLevel ?? 'moderate',
            cookingSkill: rawPrefs.cookingSkill ?? 'intermediate',
            dinnerTime: rawPrefs.dinnerTime ?? '18:00',
            groceryDay: rawPrefs.groceryDay ?? 'saturday',
            createdAt: now,
            updatedAt: now,
          })
          .returning();
      }
    }

    // 3. Mark onboarding complete + update display fields
    await db
      .update(users)
      .set({
        onboardingCompleted: 1,
        ...(displayName && { name: String(displayName).trim() }),
        ...(timezone && { briefingTimezone: String(timezone) }),
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    // 4. Sync family profile to container workspace
    await syncFamilyProfileToContainer(userId, createdMembers);

    return apiSuccess(
      {
        onboardingCompleted: true,
        membersCreated: createdMembers.length,
        members: createdMembers,
        preferences,
      },
      201
    );
  } catch (error) {
    console.error('[onboarding POST]', error);
    return apiErrors.internalError();
  }
}

// ── Container sync ────────────────────────────────────────────────────────────

async function syncFamilyProfileToContainer(
  userId: string,
  members: unknown[]
): Promise<void> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerId: true },
    });
    if (!user?.containerId) return;

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

    // Also seed empty data files if they don't exist
    const dataDir = path.join(`/opt/clawer/userdata/${user.containerId}/clawd`, 'data');
    await fs.mkdir(dataDir, { recursive: true });

    const seedFiles: Record<string, unknown> = {
      'calendar-events.json': [],
      'grocery-list.json': [],
      'nudges.json': [],
      'budget-summary.json': { categories: {}, month: new Date().toISOString().slice(0, 7), total: 0 },
    };

    for (const [filename, defaultValue] of Object.entries(seedFiles)) {
      const fp = path.join(dataDir, filename);
      try {
        await fs.access(fp);
        // file exists — don't overwrite
      } catch {
        await fs.writeFile(fp, JSON.stringify(defaultValue, null, 2), 'utf-8');
      }
    }

    // Seed meal-plans directory
    await fs.mkdir(path.join(dataDir, 'meal-plans'), { recursive: true });
    await fs.mkdir(path.join(dataDir, 'receipts'), { recursive: true });
  } catch (err) {
    console.warn('[onboarding] syncFamilyProfileToContainer failed:', err);
  }
}
