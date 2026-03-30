/**
 * POST /api/mombrain/push-token
 *
 * Stores (or updates) the Expo push notification token for the user.
 * One token per user — upsert based on userId.
 *
 * Request body:
 * {
 *   token: string      — Expo push token (e.g. "ExponentPushToken[xxx]")
 *   platform: string   — "ios" | "android"
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { pushTokens } from '@/lib/db/schema/mombrain';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiErrors } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const { token, platform } = body;

    if (!token || typeof token !== 'string') {
      return apiErrors.validationError({ field: 'token', message: 'token is required' });
    }
    if (!['ios', 'android'].includes(platform)) {
      return apiErrors.validationError({
        field: 'platform',
        message: 'platform must be "ios" or "android"',
      });
    }

    const now = new Date();

    // Upsert: one row per user (primary key = userId)
    const existing = await db.query.pushTokens.findFirst({
      where: eq(pushTokens.userId, userId),
    });

    let result;
    if (existing) {
      [result] = await db
        .update(pushTokens)
        .set({ token, platform, updatedAt: now })
        .where(eq(pushTokens.userId, userId))
        .returning();
    } else {
      [result] = await db
        .insert(pushTokens)
        .values({ userId, token, platform, updatedAt: now })
        .returning();
    }

    return apiSuccess({ pushToken: result, registered: true });
  } catch (error) {
    console.error('[push-token POST]', error);
    return apiErrors.internalError();
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// Allow the app to de-register the token (e.g. on logout)

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[push-token DELETE]', error);
    return apiErrors.internalError();
  }
}
