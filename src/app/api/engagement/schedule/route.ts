/**
 * POST /api/engagement/schedule
 *
 * Creates the Day 1-7 engagement message sequence for a user.
 * Should be called immediately after onboarding is marked complete.
 *
 * Body: { userId?: string }  — defaults to authenticated user
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { scheduleEngagementSequence } from '@/lib/engagement/scheduler';

export async function POST(req: NextRequest) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) return apiErrors.unauthorized();

    const body = await req.json().catch(() => ({}));

    // Allow targeting a specific userId (admin / internal use).
    // Defaults to the authenticated user.
    const targetUserId: string = (body as { userId?: string }).userId || authUserId;

    // Only allow users to schedule for themselves (unless we add admin checks later)
    if (targetUserId !== authUserId) {
      return apiErrors.forbidden();
    }

    await scheduleEngagementSequence(targetUserId, new Date());

    return apiSuccess({ scheduled: true, userId: targetUserId });
  } catch (err) {
    console.error('[engagement/schedule POST]', err);
    return apiErrors.internalError();
  }
}
