import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

export async function POST() {
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

    // Request disconnect from container
    const { data, error, status } = await containerApi.whatsappDisconnect(user.containerPort);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Update DB
    await db
      .update(users)
      .set({ whatsappConnected: 0 })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to disconnect WhatsApp:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
