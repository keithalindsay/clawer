import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { teamTemplate } = body;

  const validTemplates = ['lifeos', 'ecommerce', 'mom'];
  if (teamTemplate && !validTemplates.includes(teamTemplate)) {
    return NextResponse.json({ error: 'Invalid team template' }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      teamTemplate: teamTemplate || 'lifeos',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
