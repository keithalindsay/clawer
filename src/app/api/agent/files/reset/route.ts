/**
 * POST /api/agent/files/reset
 * Resets a specific agent config file to its default content.
 *
 * Body: { filename: string }
 *
 * Defaults are read from /opt/defaults/{filename}.
 * If no default exists for the file, the file is cleared (set to empty string).
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
const DEFAULTS_DIR = '/opt/defaults';

function getContainerPath(userId: string): string {
  const containerName = `clawer_user_${userId}`;
  return `/opt/clawer/userdata/${containerName}/clawd`;
}

async function getDefaultContent(filename: string): Promise<string> {
  const defaultPath = path.join(DEFAULTS_DIR, filename);
  try {
    return await fs.readFile(defaultPath, 'utf-8');
  } catch {
    // No default file — return empty string
    return '';
  }
}

/**
 * POST /api/agent/files/reset
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const { filename } = body as { filename?: string };

    if (!filename || !ALLOWED_FILES.includes(filename)) {
      return apiError('INVALID_FILENAME', `Filename must be one of: ${ALLOWED_FILES.join(', ')}`, 400);
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return apiErrors.notFound('User');

    const claWdPath = getContainerPath(userId);
    await fs.mkdir(claWdPath, { recursive: true });

    const defaultContent = await getDefaultContent(filename);
    const filePath = path.join(claWdPath, filename);
    await fs.writeFile(filePath, defaultContent, 'utf-8');

    const stat = await fs.stat(filePath);

    return apiSuccess({
      filename,
      content: defaultContent,
      lastModified: stat.mtime.toISOString(),
      resetToDefault: true,
    });
  } catch (error) {
    console.error('[agent/files/reset POST]', error);
    return apiErrors.internalError();
  }
}
