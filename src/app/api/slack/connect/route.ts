/**
 * POST /api/slack/connect
 * 
 * Store user's Slack bot token (BYOB mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { testBotToken } from '@/lib/slack/client';

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

    if (!botToken || typeof botToken !== 'string' || !botToken.startsWith('xoxb-')) {
      return NextResponse.json(
        { error: 'Invalid bot token. Must start with xoxb-' },
        { status: 400 }
      );
    }

    // Test the token
    const test = await testBotToken(botToken);
    if (!test.valid) {
      return NextResponse.json(
        { error: test.error || 'Invalid bot token' },
        { status: 400 }
      );
    }

    // Store token in database
    await db
      .update(users)
      .set({
        slackBotToken: botToken,
        slackTeamId: test.teamName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      teamName: test.teamName,
      botName: test.botName,
    });

  } catch (error) {
    console.error('Slack connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/slack/connect
 * 
 * Disconnect Slack bot
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .update(users)
      .set({
        slackBotToken: null,
        slackTeamId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Slack disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/slack/connect
 * 
 * Check Slack connection status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return NextResponse.json({
      connected: !!user?.slackBotToken,
      teamName: user?.slackTeamId || null,
    });

  } catch (error) {
    console.error('Slack status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
