/**
 * POST /api/telegram/disconnect
 * 
 * Stop bot polling and remove token from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { stopTelegramBot } from '@/lib/telegram/bot';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Stop the bot
    await stopTelegramBot(userId);

    // Remove token from database
    await db
      .update(users)
      .set({
        telegramBotToken: null,
        telegramBotUsername: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Telegram disconnect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect Telegram bot' },
      { status: 500 }
    );
  }
}
