import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { sshExec } from '@/lib/ssh';

export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run the fleet health check script
    const { stdout } = await sshExec('/opt/orchestrator/scripts/fleet-health-check.sh', {
      timeout: 60000, // 60 second timeout for all containers
    });

    // Parse the JSON output
    const healthData = JSON.parse(stdout);

    return NextResponse.json(healthData);
  } catch (error: any) {
    console.error('Fleet health check error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check fleet health',
      details: error.stack,
    }, { status: 500 });
  }
}
