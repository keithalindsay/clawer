/**
 * GET/PUT /api/bot/settings
 * 
 * Get or update bot personality settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq } from 'drizzle-orm';

const DEFAULT_SETTINGS = {
  botName: 'Assistant',
  botAvatar: '🤖',
  personality: 'helpful and friendly',
  customInstructions: null,
  communicationStyle: 'balanced',
  responseLength: 'balanced',
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's bot settings
    let settings = await db.query.botSettings.findFirst({
      where: eq(botSettings.userId, userId),
    });

    // Return defaults if no settings exist
    if (!settings) {
      return NextResponse.json({
        ...DEFAULT_SETTINGS,
        isDefault: true,
      });
    }

    return NextResponse.json({
      botName: settings.botName,
      botAvatar: settings.botAvatar,
      personality: settings.personality,
      customInstructions: settings.customInstructions,
      communicationStyle: settings.communicationStyle,
      responseLength: settings.responseLength,
      isDefault: false,
    });
  } catch (error: any) {
    console.error('Get bot settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      botName,
      botAvatar,
      personality,
      customInstructions,
      communicationStyle,
      responseLength,
    } = body;

    // Validate inputs
    if (botName && botName.length > 50) {
      return NextResponse.json(
        { error: 'Bot name must be 50 characters or less' },
        { status: 400 }
      );
    }

    if (personality && personality.length > 500) {
      return NextResponse.json(
        { error: 'Personality must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (customInstructions && customInstructions.length > 2000) {
      return NextResponse.json(
        { error: 'Custom instructions must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const existing = await db.query.botSettings.findFirst({
      where: eq(botSettings.userId, userId),
    });

    const updateData = {
      botName: botName || DEFAULT_SETTINGS.botName,
      botAvatar: botAvatar || DEFAULT_SETTINGS.botAvatar,
      personality: personality || DEFAULT_SETTINGS.personality,
      customInstructions: customInstructions || null,
      communicationStyle: communicationStyle || DEFAULT_SETTINGS.communicationStyle,
      responseLength: responseLength || DEFAULT_SETTINGS.responseLength,
      updatedAt: new Date(),
    };

    let settings;

    if (existing) {
      // Update existing
      [settings] = await db
        .update(botSettings)
        .set(updateData)
        .where(eq(botSettings.userId, userId))
        .returning();
    } else {
      // Create new
      [settings] = await db
        .insert(botSettings)
        .values({
          userId,
          ...updateData,
        })
        .returning();
    }

    return NextResponse.json({
      botName: settings.botName,
      botAvatar: settings.botAvatar,
      personality: settings.personality,
      customInstructions: settings.customInstructions,
      communicationStyle: settings.communicationStyle,
      responseLength: settings.responseLength,
      isDefault: false,
    });
  } catch (error: any) {
    console.error('Update bot settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
