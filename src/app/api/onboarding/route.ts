import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { botName, botEmoji, communicationStyle, channels } = body;

  // Map communication style to personality description
  const personalityMap: Record<string, string> = {
    casual: 'friendly, relaxed, uses emojis, approachable',
    professional: 'clear, polished, business-appropriate, concise',
    technical: 'precise, detailed, technical, no fluff',
  };

  try {
    // Upsert bot settings
    const existing = await db.query.botSettings.findFirst({
      where: eq(botSettings.userId, userId),
    });

    const settingsData = {
      botName: botName || 'Assistant',
      botAvatar: botEmoji || '🤖',
      personality: personalityMap[communicationStyle] || 'helpful and friendly',
      communicationStyle: communicationStyle || 'casual',
      customInstructions: '', // Let the bot figure out use cases from conversation
      additionalSettings: { channels: channels || [] },
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(botSettings)
        .set(settingsData)
        .where(eq(botSettings.userId, userId));
    } else {
      await db.insert(botSettings).values({
        userId,
        ...settingsData,
      });
    }

    // Update user record — mark onboarding complete
    await db
      .update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
