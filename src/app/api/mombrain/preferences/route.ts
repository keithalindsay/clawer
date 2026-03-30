/**
 * GET /api/mombrain/preferences — fetch family preferences for the user
 * PUT /api/mombrain/preferences — create or update family preferences
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { familyPreferences } from '@/lib/db/schema/mombrain';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiErrors } from '@/lib/api/response';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const prefs = await db.query.familyPreferences.findFirst({
      where: eq(familyPreferences.userId, userId),
    });

    // Return defaults if not yet configured
    if (!prefs) {
      return apiSuccess({
        preferences: {
          userId,
          dietaryRestrictions: [],
          cuisinePreferences: [],
          budgetLevel: 'moderate',
          cookingSkill: 'intermediate',
          dinnerTime: '18:00',
          groceryDay: 'saturday',
          createdAt: null,
          updatedAt: null,
        },
      });
    }

    return apiSuccess({ preferences: prefs });
  } catch (error) {
    console.error('[preferences GET]', error);
    return apiErrors.internalError();
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const {
      dietaryRestrictions,
      cuisinePreferences,
      budgetLevel,
      cookingSkill,
      dinnerTime,
      groceryDay,
    } = body;

    const now = new Date();

    // Upsert: insert if not exists, update if exists
    const existing = await db.query.familyPreferences.findFirst({
      where: eq(familyPreferences.userId, userId),
    });

    let preferences;
    if (existing) {
      [preferences] = await db
        .update(familyPreferences)
        .set({
          ...(dietaryRestrictions !== undefined && {
            dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
          }),
          ...(cuisinePreferences !== undefined && {
            cuisinePreferences: Array.isArray(cuisinePreferences) ? cuisinePreferences : [],
          }),
          ...(budgetLevel !== undefined && { budgetLevel: String(budgetLevel) }),
          ...(cookingSkill !== undefined && { cookingSkill: String(cookingSkill) }),
          ...(dinnerTime !== undefined && { dinnerTime: String(dinnerTime) }),
          ...(groceryDay !== undefined && { groceryDay: String(groceryDay) }),
          updatedAt: now,
        })
        .where(eq(familyPreferences.userId, userId))
        .returning();
    } else {
      [preferences] = await db
        .insert(familyPreferences)
        .values({
          userId,
          dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
          cuisinePreferences: Array.isArray(cuisinePreferences) ? cuisinePreferences : [],
          budgetLevel: budgetLevel ?? 'moderate',
          cookingSkill: cookingSkill ?? 'intermediate',
          dinnerTime: dinnerTime ?? '18:00',
          groceryDay: groceryDay ?? 'saturday',
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    }

    return apiSuccess({ preferences });
  } catch (error) {
    console.error('[preferences PUT]', error);
    return apiErrors.internalError();
  }
}
