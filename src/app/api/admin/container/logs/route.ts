import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(req: NextRequest) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    // Validate userId is safe (Clerk format: user_XXXXX with alphanumeric)
    if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const containerName = `clawer_user_${userId}`;
    
    const { stdout } = await sshExec(`docker logs --tail 100 ${containerName} 2>&1`);
    
    return NextResponse.json({ logs: stdout });
  } catch (error: any) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get logs' 
    }, { status: 500 });
  }
}
