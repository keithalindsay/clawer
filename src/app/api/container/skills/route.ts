import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's container info from DB
    const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (!user || !user.containerPort || !user.containerToken) {
      return NextResponse.json(
        { error: 'Container not configured' },
        { status: 400 }
      );
    }

    // Proxy request to user's container
    const containerUrl = `http://127.0.0.1:${user.containerPort}/api/skills`;
    const response = await fetch(containerUrl, {
      headers: {
        'Authorization': `Bearer ${user.containerToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch skills from container' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
