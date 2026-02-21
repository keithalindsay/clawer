/**
 * GET /api/briefing/settings — Get the current user's morning briefing config
 * PUT /api/briefing/settings — Update the current user's morning briefing config
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

/* ── GET ─────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        briefingEnabled: true,
        briefingTime: true,
        briefingChannel: true,
        briefingTimezone: true,
        briefingIncludeSummary: true,
        briefingIncludeWorking: true,
        briefingIncludeReminders: true,
        briefingIncludeNews: true,
      },
    });

    if (!user) return apiErrors.notFound('User');

    return apiSuccess({
      enabled: !!user.briefingEnabled,
      time: user.briefingTime ?? '07:30',
      channel: user.briefingChannel ?? 'whatsapp',
      timezone: user.briefingTimezone ?? 'America/New_York',
      includeSummary: !!user.briefingIncludeSummary,
      includeWorking: !!user.briefingIncludeWorking,
      includeReminders: !!user.briefingIncludeReminders,
      includeNews: !!user.briefingIncludeNews,
    });
  } catch (err) {
    console.error('[briefing/settings GET]', err);
    return apiErrors.internalError();
  }
}

/* ── PUT ─────────────────────────────────────────────────────── */

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();

    const {
      enabled,
      time,
      channel,
      timezone,
      includeSummary,
      includeWorking,
      includeReminders,
      includeNews,
    } = body as {
      enabled?: boolean;
      time?: string;
      channel?: string;
      timezone?: string;
      includeSummary?: boolean;
      includeWorking?: boolean;
      includeReminders?: boolean;
      includeNews?: boolean;
    };

    // Validate channel
    const validChannels = ['whatsapp', 'telegram', 'web'];
    if (channel && !validChannels.includes(channel)) {
      return apiErrors.validationError(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }

    // Validate time format HH:MM
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      return apiErrors.validationError('Invalid time format. Use HH:MM (e.g. 07:30)');
    }

    const patch: Partial<typeof users.$inferInsert> = {};

    if (enabled !== undefined) patch.briefingEnabled = enabled ? 1 : 0;
    if (time !== undefined) patch.briefingTime = time;
    if (channel !== undefined) patch.briefingChannel = channel;
    if (timezone !== undefined) patch.briefingTimezone = timezone;
    if (includeSummary !== undefined) patch.briefingIncludeSummary = includeSummary ? 1 : 0;
    if (includeWorking !== undefined) patch.briefingIncludeWorking = includeWorking ? 1 : 0;
    if (includeReminders !== undefined) patch.briefingIncludeReminders = includeReminders ? 1 : 0;
    if (includeNews !== undefined) patch.briefingIncludeNews = includeNews ? 1 : 0;

    if (Object.keys(patch).length === 0) {
      return apiErrors.validationError('No valid fields to update');
    }

    await db.update(users).set(patch).where(eq(users.id, userId));

    return apiSuccess({ updated: true });
  } catch (err) {
    console.error('[briefing/settings PUT]', err);
    return apiErrors.internalError();
  }
}
