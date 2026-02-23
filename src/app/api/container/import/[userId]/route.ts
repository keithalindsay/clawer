import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * POST /api/container/import/[userId]
 * Imports userdata from an archive into a container
 * Admin only
 * 
 * Body: {
 *   archivePath: string (path on server)
 *   force?: boolean (override timestamp warnings)
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    
    // Validate userId
    if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const body = await req.json();
    const { archivePath, force = false } = body;

    if (!archivePath) {
      return NextResponse.json({ 
        error: 'Missing archivePath in request body' 
      }, { status: 400 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.containerId) {
      return NextResponse.json({ 
        error: 'No container found for user. Create a container first.' 
      }, { status: 404 });
    }

    // Validate archive exists on server
    const { stdout: archiveExists } = await execAsync(
      `ssh root@YOUR_DOCKER_HOST "test -f ${archivePath} && echo 'exists' || echo 'not found'"`
    );

    if (!archiveExists.trim().includes('exists')) {
      return NextResponse.json({ 
        error: `Archive not found on server: ${archivePath}` 
      }, { status: 404 });
    }

    // Run import script on the server
    const importScript = '/opt/clawer/scripts/container-import.sh';
    const forceFlag = force ? '--force' : '';
    
    console.log(`[Import] Starting import for container: ${user.containerId}`);
    console.log(`[Import] Archive: ${archivePath}`);
    console.log(`[Import] Force: ${force}`);
    
    const { stdout, stderr } = await execAsync(
      `ssh root@YOUR_DOCKER_HOST "${importScript} ${forceFlag} ${archivePath} ${user.containerId}"`,
      { timeout: 300000 } // 5 minute timeout
    );
    
    if (stderr && !stderr.includes('[INFO]') && !stderr.includes('[WARN]')) {
      console.error('[Import] stderr:', stderr);
    }
    
    console.log('[Import] stdout:', stdout);

    // Check if import was successful
    if (stdout.includes('Import complete!')) {
      // Restart container to apply changes
      console.log('[Import] Restarting container to apply changes...');
      await execAsync(
        `ssh root@YOUR_DOCKER_HOST "docker restart ${user.containerId}"`
      );

      return NextResponse.json({
        success: true,
        containerId: user.containerId,
        message: 'Container imported and restarted successfully',
        output: stdout
      });
    } else {
      throw new Error('Import script did not complete successfully');
    }

  } catch (error: any) {
    console.error('[Import] Error:', error);
    
    // Check if it's a timestamp warning
    if (error.message?.includes('older than existing')) {
      return NextResponse.json({ 
        error: 'Import data is older than existing container data',
        suggestion: 'Use force=true to override this check',
        details: error.stderr || error.stdout
      }, { status: 409 }); // Conflict
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to import container',
      details: error.stderr || error.stdout
    }, { status: 500 });
  }
}

/**
 * GET /api/container/import/[userId]
 * Returns import status/info for a user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    
    // Validate userId
    if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check userdata directory status
    if (!user.containerId) {
      return NextResponse.json({
        canImport: false,
        message: 'No container exists for this user'
      });
    }

    const { stdout } = await execAsync(
      `ssh root@YOUR_DOCKER_HOST "du -sh /opt/clawer/userdata/${user.containerId} 2>/dev/null || echo '0'"`
    );

    const currentSize = stdout.trim().split(/\s+/)[0];

    return NextResponse.json({
      canImport: true,
      containerId: user.containerId,
      currentUserdataSize: currentSize,
      message: 'Container is ready for import'
    });

  } catch (error: any) {
    console.error('[Import Info] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get import info'
    }, { status: 500 });
  }
}
