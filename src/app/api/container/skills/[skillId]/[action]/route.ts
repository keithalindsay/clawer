import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    skillId: string;
    action: 'enable' | 'disable';
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId, action } = params;

    // Validate action
    if (action !== 'enable' && action !== 'disable') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "enable" or "disable"' },
        { status: 400 }
      );
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
    const containerUrl = `http://127.0.0.1:${user.containerPort}/api/skills/${skillId}/${action}`;
    const response = await fetch(containerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.containerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to ${action} skill` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Skill toggle API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
