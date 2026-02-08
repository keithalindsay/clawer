/**
 * GET /api/telegram/status
 * 
 * Check if user has a Telegram bot connected
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Telegram connection status
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        telegramBotToken: true,
        telegramBotUsername: true,
      },
    });

    const connected = !!user?.telegramBotToken;

    return NextResponse.json({
      connected,
      botUsername: user?.telegramBotUsername || null,
    });
  } catch (error: any) {
    console.error('Telegram status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get Telegram status' },
      { status: 500 }
    );
  }
}
