import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

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
    const { data, error, status } = await containerApi.telegramStatus(user.containerPort);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Update database to match actual state
    if (data) {
      const isConnected = (data as any).configured || (data as any).connected;
      await db
        .update(users)
        .set({ telegramConnected: isConnected ? 1 : 0 })
        .where(eq(users.id, userId));
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to fetch Telegram status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
