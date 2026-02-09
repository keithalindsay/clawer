/**
 * GET/POST /api/user/settings - User settings (profile + bot personality + notifications)
 * 
 * GET: Returns current user settings (profile + bot_settings merged)
 * POST: Updates user settings
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const clerkUser = await currentUser();

    // Get user record
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return apiErrors.notFound('User');

    // Get bot settings
    const settings = await db.query.botSettings.findFirst({
      where: eq(botSettings.userId, userId),
    });

    const additionalSettings = (settings?.additionalSettings as Record<string, unknown>) || {};

    return apiSuccess({
      profile: {
        name: user.name || clerkUser?.firstName || '',
        email: user.email,
        avatarUrl: clerkUser?.imageUrl || null,
      },
      botPersonality: {
        botName: settings?.botName || 'Assistant',
        botAvatar: settings?.botAvatar || '🤖',
        personality: settings?.personality || 'helpful and friendly',
        communicationStyle: settings?.communicationStyle || 'balanced',
        responseLength: settings?.responseLength || 'balanced',
        customInstructions: settings?.customInstructions || '',
      },
      notifications: {
        emailNotifications: (additionalSettings.emailNotifications as boolean) ?? true,
        weeklyDigest: (additionalSettings.weeklyDigest as boolean) ?? true,
        usageAlerts: (additionalSettings.usageAlerts as boolean) ?? true,
        whatsappNotifications: (additionalSettings.whatsappNotifications as boolean) ?? true,
      },
      connectedPlatforms: {
        whatsapp: !!user.whatsappConnected,
        telegram: !!user.telegramConnected,
        slack: !!user.slackTeamId,
      },
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return apiErrors.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await request.json();

    // Update user name if provided
    if (body.profile?.name !== undefined) {
      await db
        .update(users)
        .set({
          name: body.profile.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Upsert bot settings
    if (body.botPersonality || body.notifications) {
      const existing = await db.query.botSettings.findFirst({
        where: eq(botSettings.userId, userId),
      });

      const existingAdditional = (existing?.additionalSettings as Record<string, unknown>) || {};

      const botData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.botPersonality) {
        if (body.botPersonality.botName !== undefined) botData.botName = body.botPersonality.botName;
        if (body.botPersonality.botAvatar !== undefined) botData.botAvatar = body.botPersonality.botAvatar;
        if (body.botPersonality.personality !== undefined) botData.personality = body.botPersonality.personality;
        if (body.botPersonality.communicationStyle !== undefined) botData.communicationStyle = body.botPersonality.communicationStyle;
        if (body.botPersonality.responseLength !== undefined) botData.responseLength = body.botPersonality.responseLength;
        if (body.botPersonality.customInstructions !== undefined) botData.customInstructions = body.botPersonality.customInstructions;
      }

      if (body.notifications) {
        botData.additionalSettings = {
          ...existingAdditional,
          ...(body.notifications.emailNotifications !== undefined && {
            emailNotifications: body.notifications.emailNotifications,
          }),
          ...(body.notifications.weeklyDigest !== undefined && {
            weeklyDigest: body.notifications.weeklyDigest,
          }),
          ...(body.notifications.usageAlerts !== undefined && {
            usageAlerts: body.notifications.usageAlerts,
          }),
          ...(body.notifications.whatsappNotifications !== undefined && {
            whatsappNotifications: body.notifications.whatsappNotifications,
          }),
        };
      }

      if (existing) {
        await db
          .update(botSettings)
          .set(botData)
          .where(eq(botSettings.userId, userId));
      } else {
        await db.insert(botSettings).values({
          userId,
          botName: (botData.botName as string) || 'Assistant',
          botAvatar: (botData.botAvatar as string) || '🤖',
          personality: (botData.personality as string) || 'helpful and friendly',
          communicationStyle: (botData.communicationStyle as string) || 'balanced',
          responseLength: (botData.responseLength as string) || 'balanced',
          customInstructions: (botData.customInstructions as string) || null,
          additionalSettings: botData.additionalSettings || {},
        });
      }
    }

    return apiSuccess({ updated: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return apiErrors.internalError();
  }
}
