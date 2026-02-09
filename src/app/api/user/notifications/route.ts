/**
 * GET/POST /api/user/notifications — Notification preferences
 * 
 * Stores preferences in bot_settings.additionalSettings JSON column.
 * 
 * GET: Returns current notification preferences
 * POST: Updates notification preferences
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq } from 'drizzle-orm';

/* ── Types ─────────────────────────────────────────────────────── */

interface NotificationPreferences {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  usageAlerts: boolean;
  whatsappNotifications: boolean;
}

const DEFAULTS: NotificationPreferences = {
  emailNotifications: true,
  weeklyDigest: true,
  usageAlerts: true,
  whatsappNotifications: true,
};

/* ── GET ───────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const settings = await db.query.botSettings.findFirst({
      where: eq(botSettings.userId, userId),
    });

    const additional = (settings?.additionalSettings as Record<string, unknown>) || {};

    const prefs: NotificationPreferences = {
      emailNotifications: (additional.emailNotifications as boolean) ?? DEFAULTS.emailNotifications,
      weeklyDigest: (additional.weeklyDigest as boolean) ?? DEFAULTS.weeklyDigest,
      usageAlerts: (additional.usageAlerts as boolean) ?? DEFAULTS.usageAlerts,
      whatsappNotifications: (additional.whatsappNotifications as boolean) ?? DEFAULTS.whatsappNotifications,
    };

    return apiSuccess(prefs);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return apiErrors.internalError();
  }
}

/* ── POST ──────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await request.json();

    // Validate — only allow known boolean keys
    const allowedKeys = ['emailNotifications', 'weeklyDigest', 'usageAlerts', 'whatsappNotifications'];
    const updates: Record<string, boolean> = {};

    for (const key of allowedKeys) {
      if (key in body && typeof body[key] === 'boolean') {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiError('VALIDATION_ERROR', 'No valid notification preferences provided', 400);
    }

    // Upsert into bot_settings.additionalSettings
    const existing = await db.query.botSettings.findFirst({
      where: eq(botSettings.userId, userId),
    });

    const existingAdditional = (existing?.additionalSettings as Record<string, unknown>) || {};
    const mergedAdditional = { ...existingAdditional, ...updates };

    if (existing) {
      await db
        .update(botSettings)
        .set({
          additionalSettings: mergedAdditional,
          updatedAt: new Date(),
        })
        .where(eq(botSettings.userId, userId));
    } else {
      await db.insert(botSettings).values({
        userId,
        botName: 'Assistant',
        botAvatar: '🤖',
        personality: 'helpful and friendly',
        communicationStyle: 'balanced',
        responseLength: 'balanced',
        additionalSettings: mergedAdditional,
      });
    }

    return apiSuccess({ updated: true, preferences: { ...DEFAULTS, ...existingAdditional, ...updates } });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return apiErrors.internalError();
  }
}
