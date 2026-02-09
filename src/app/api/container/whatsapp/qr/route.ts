import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { provisionContainer } from '@/lib/provisioner';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's container port and template
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerPort: true, containerId: true, teamTemplate: true },
    });

    // Auto-provision container if not exists
    if (!user?.containerPort) {
      const teamTemplate = user?.teamTemplate || 'lifeos';
      const result = await provisionContainer(userId, teamTemplate);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to provision container' },
          { status: 500 }
        );
      }
      
      // Refresh user data
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { containerPort: true, containerId: true, teamTemplate: true },
      });
    }

    if (!user?.containerPort) {
      return NextResponse.json(
        { error: 'Container not provisioned' },
        { status: 404 }
      );
    }

    // Request QR from container
    const { data, error, status } = await containerApi.whatsappQR(user.containerPort);
    
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to fetch WhatsApp QR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR code' },
      { status: 500 }
    );
  }
}
