import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
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

    // Proxy request to user's container API server (gateway port + 1)
    const apiPort = user.containerPort + 1;
    const containerUrl = `http://localhost:${apiPort}/api/telegram/connect`;
    const response = await fetch(containerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    // Update database if connection successful
    if (data.success) {
      await db
        .update(users)
        .set({ telegramConnected: 1 })
        .where(eq(users.id, userId));
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Failed to connect Telegram:', error);
    return NextResponse.json(
      { error: 'Failed to connect Telegram' },
      { status: 500 }
    );
  }
}
