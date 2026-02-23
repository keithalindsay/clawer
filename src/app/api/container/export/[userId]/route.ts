import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * POST /api/container/export/[userId]
 * Exports a container's userdata to a portable archive
 * Admin only
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

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.containerId) {
      return NextResponse.json({ error: 'No container found for user' }, { status: 404 });
    }

    // Run export script on the server
    const exportScript = '/opt/clawer/scripts/container-export.sh';
    const exportDir = '/opt/clawer/exports';
    
    console.log(`[Export] Starting export for container: ${user.containerId}`);
    
    const { stdout, stderr } = await execAsync(
      `ssh root@YOUR_DOCKER_HOST "${exportScript} ${user.containerId} ${exportDir}"`,
      { timeout: 300000 } // 5 minute timeout
    );
    
    if (stderr && !stderr.includes('[INFO]') && !stderr.includes('[WARN]')) {
      console.error('[Export] stderr:', stderr);
    }
    
    console.log('[Export] stdout:', stdout);

    // Parse output to find archive path
    const archiveMatch = stdout.match(/Archive: (\/opt\/clawer\/exports\/[^\s]+\.tar\.gz)/);
    const sizeMatch = stdout.match(/Size: ([^\n]+)/);
    
    if (!archiveMatch) {
      throw new Error('Failed to locate export archive in script output');
    }

    const archivePath = archiveMatch[1];
    const archiveSize = sizeMatch ? sizeMatch[1] : 'unknown';

    // Read manifest from archive
    const { stdout: manifestJson } = await execAsync(
      `ssh root@YOUR_DOCKER_HOST "tar -xzf ${archivePath} -O manifest.json"`
    );
    
    const manifest = JSON.parse(manifestJson);

    // Update database with last export timestamp
    await db.update(users)
      .set({ 
        lastBackup: new Date(),
        backupCount: (user.backupCount || 0) + 1
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      exportPath: archivePath,
      size: archiveSize,
      manifest,
      message: 'Container exported successfully'
    });

  } catch (error: any) {
    console.error('[Export] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to export container',
      details: error.stderr || error.stdout
    }, { status: 500 });
  }
}

/**
 * GET /api/container/export/[userId]
 * Lists available exports for a user
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

    if (!user || !user.containerId) {
      return NextResponse.json({ exports: [] });
    }

    // List exports for this container
    const { stdout } = await execAsync(
      `ssh root@YOUR_DOCKER_HOST "ls -lh /opt/clawer/exports/${user.containerId}_*.tar.gz 2>/dev/null || echo ''"`
    );

    const exports = stdout.trim().split('\n')
      .filter(line => line)
      .map(line => {
        const parts = line.split(/\s+/);
        const size = parts[4];
        const filename = parts[8];
        const path = `/opt/clawer/exports/${filename}`;
        
        return {
          filename,
          path,
          size,
          timestamp: filename.match(/_(\d{8}_\d{6})/)?.[1] || 'unknown'
        };
      });

    return NextResponse.json({ exports });

  } catch (error: any) {
    console.error('[Export List] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to list exports'
    }, { status: 500 });
  }
}
