import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { eq } from 'drizzle-orm';
import { TEAM_CONFIGS } from '@/lib/teams';

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamTemplate } = await request.json();

  if (!teamTemplate || !TEAM_CONFIGS[teamTemplate]) {
    return NextResponse.json({ error: 'Invalid team template' }, { status: 400 });
  }

  try {
    // Update user's team template
    await db
      .update(users)
      .set({ teamTemplate, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team change error:', error);
    return NextResponse.json({ error: 'Failed to change team' }, { status: 500 });
  }
}
