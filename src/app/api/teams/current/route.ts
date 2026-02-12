import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';

/**
 * GET /api/teams/current
 * 
 * Returns the current user's team configuration
 * 
 * @returns Team config with all members
 */
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's team template
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        teamTemplate: true,
      },
    });

    // Default to lifeos if no template set
    const templateName = user?.teamTemplate || 'lifeos';
    
    // Load team config
    const teamConfig = getTeamConfig(templateName);
    
    if (!teamConfig) {
      return NextResponse.json(
        { error: 'Team template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      template: templateName,
      ...teamConfig,
    });

  } catch (error: any) {
    console.error('Error fetching team config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team configuration' },
      { status: 500 }
    );
  }
}
