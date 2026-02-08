/**
 * POST /api/telegram/connect
 * 
 * Validate and store user's Telegram bot token
 * Start polling for messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { validateTelegramToken, createTelegramBot } from '@/lib/telegram/bot';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { botToken } = body;

    if (!botToken || typeof botToken !== 'string') {
      return NextResponse.json(
        { error: 'Bot token is required' },
        { status: 400 }
      );
    }

    // Validate token by calling Telegram getMe API
    const validation = await validateTelegramToken(botToken);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid bot token' },
        { status: 400 }
      );
    }

    // Store token in database
    await db
      .update(users)
      .set({
        telegramBotToken: botToken,
        telegramBotUsername: validation.botUsername,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Start the bot (polling for messages)
    await createTelegramBot({
      token: botToken,
      userId,
    });

    return NextResponse.json({
      success: true,
      botUsername: validation.botUsername,
      botName: validation.botName,
    });
  } catch (error: any) {
    console.error('Telegram connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Telegram bot' },
      { status: 500 }
    );
  }
}
