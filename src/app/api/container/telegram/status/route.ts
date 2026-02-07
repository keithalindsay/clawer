import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
    const containerUrl = `http://localhost:${user.containerPort}/api/telegram/status`;
    const response = await fetch(containerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Update database if status changed
    if (data.connected !== undefined) {
      await db
        .update(users)
        .set({ telegramConnected: data.connected ? 1 : 0 })
        .where(eq(users.id, userId));
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Failed to fetch Telegram status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
