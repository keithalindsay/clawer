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
    // Get all Docker containers with details
    const { stdout } = await sshExec(
      'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}"'
    );

    const containers = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, name, status, image, ports] = line.split('|');
        return {
          id,
          name,
          status,
          image,
          ports,
          isRunning: status.toLowerCase().startsWith('up'),
        };
      });

    return NextResponse.json({ containers });
  } catch (error: any) {
    console.error('Admin containers error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get containers' 
    }, { status: 500 });
  }
}
