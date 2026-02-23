/**
 * GET /api/agent/files  — List available agent config files with content
 * PUT /api/agent/files  — Update a specific agent config file
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiErrors, apiError } from '@/lib/api/response';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_FILES = ['SOUL.md', 'AGENTS.md', 'USER.md', 'IDENTITY.md', 'MEMORY.md'];

const FILE_DESCRIPTIONS: Record<string, string> = {
  'SOUL.md': 'Agent personality, behavior rules, and core values',
  'AGENTS.md': 'Memory management, tool usage, and workspace configuration',
  'USER.md': "User profile — what your agent knows about you",
  'IDENTITY.md': 'Agent name, emoji, and vibe',
  'MEMORY.md': 'Long-term memory storage for your agent',
};

function getContainerPath(containerId: string): string {
  // Use the actual container ID from the database
  return `/opt/clawer/userdata/${containerId}/clawd`;
}

async function getFileInfo(filePath: string, filename: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stat = await fs.stat(filePath);
    return {
      filename,
      description: FILE_DESCRIPTIONS[filename] || '',
      content,
      lastModified: stat.mtime.toISOString(),
      exists: true,
    };
  } catch {
    return {
      filename,
      description: FILE_DESCRIPTIONS[filename] || '',
      content: '',
      lastModified: null,
      exists: false,
    };
  }
}

/**
 * GET /api/agent/files
 * Returns all allowed files with their content and metadata.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return apiErrors.notFound('User');

    // Check if container is provisioned
    if (!user.containerId) {
      return apiSuccess({ files: [], containerReady: false });
    }

    // Use the actual containerId from database
    const claWdPath = getContainerPath(user.containerId);
    const files = await Promise.all(
      ALLOWED_FILES.map(filename => getFileInfo(path.join(claWdPath, filename), filename))
    );

    return apiSuccess({ files, containerReady: true });
  } catch (error) {
    console.error('[agent/files GET]', error);
    return apiErrors.internalError();
  }
}

/**
 * PUT /api/agent/files
 * Body: { filename: string, content: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const { filename, content } = body as { filename?: string; content?: string };

    if (!filename || !ALLOWED_FILES.includes(filename)) {
      return apiError('INVALID_FILENAME', `Filename must be one of: ${ALLOWED_FILES.join(', ')}`, 400);
    }
    if (typeof content !== 'string') {
      return apiErrors.validationError({ field: 'content', message: 'content must be a string' });
    }
    if (content.length > 500_000) {
      return apiError('CONTENT_TOO_LARGE', 'File content exceeds 500 KB limit', 400);
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return apiErrors.notFound('User');

    // Check if container is provisioned
    if (!user.containerId) {
      return apiError('CONTAINER_NOT_PROVISIONED', 'Container not yet provisioned', 503);
    }

    // Use the actual containerId from database
    const claWdPath = getContainerPath(user.containerId);

    // Ensure directory exists
    await fs.mkdir(claWdPath, { recursive: true });

    const filePath = path.join(claWdPath, filename);
    await fs.writeFile(filePath, content, 'utf-8');

    const stat = await fs.stat(filePath);

    return apiSuccess({
      filename,
      lastModified: stat.mtime.toISOString(),
      size: stat.size,
    });
  } catch (error) {
    console.error('[agent/files PUT]', error);
    return apiErrors.internalError();
  }
}
