import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || 'user_39PgWfJYYrb2T36BqfnRgtwlsfM').split(',');
const PRODUCTION_SERVER = process.env.PRODUCTION_SERVER || 'root@YOUR_DOCKER_HOST';

async function sshExec(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', PRODUCTION_SERVER, command]);
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => code === 0 ? resolve({stdout, stderr}) : reject(new Error(stderr || 'SSH command failed')));
  });
}

export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
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
