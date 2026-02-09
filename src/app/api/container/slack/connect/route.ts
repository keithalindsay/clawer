import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { botToken, appToken, signingSecret } = body;

    if (!botToken || typeof botToken !== 'string' || !botToken.startsWith('xoxb-')) {
      return NextResponse.json(
        { error: 'Invalid Bot Token. Must start with xoxb-' },
        { status: 400 }
      );
    }

    if (!appToken || typeof appToken !== 'string' || !appToken.startsWith('xapp-')) {
      return NextResponse.json(
        { error: 'Invalid App Token. Must start with xapp-' },
        { status: 400 }
      );
    }

    if (!signingSecret || typeof signingSecret !== 'string' || signingSecret.length < 10) {
      return NextResponse.json(
        { error: 'Invalid Signing Secret' },
        { status: 400 }
      );
    }

    // Get user's container port
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerPort: true },
    });

    if (!user?.containerPort) {
      return NextResponse.json(
        { error: 'Container not provisioned' },
        { status: 404 }
      );
    }

    // Proxy request to user's container
    const { data, error, status } = await containerApi.slackConnect(
      user.containerPort,
      botToken,
      appToken,
      signingSecret
    );
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Update database if connection successful
    if (data?.success) {
      await db
        .update(users)
        .set({ 
          slackConnected: 1,
          slackBotToken: botToken,
          slackAppToken: appToken,
          slackSigningSecret: signingSecret,
          slackTeamId: data.teamName || null,
        })
        .where(eq(users.id, userId));
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to connect Slack:', error);
    return NextResponse.json(
      { error: 'Failed to connect Slack' },
      { status: 500 }
    );
  }
}
