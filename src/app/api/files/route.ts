/**
 * GET /api/files — List agent workspace files
 *
 * Returns the folder tree under ~/clawd/ for the authenticated user.
 * This is the agent's full workspace including:
 *   - Root files: SOUL.md, AGENTS.md, USER.md, WORKING.md, etc.
 *   - memory/: Daily notes and hourly summaries
 *   - files/: Onboarding deliverables and saved artifacts
 *   - scripts/: Agent-created scripts
 *   - Any other files the agent creates
 */

import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { resolveUserFilesDir, getUserContainerStatus, listFiles } from '@/lib/files';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    let baseDir: string;
    try {
      baseDir = await resolveUserFilesDir(userId);
    } catch (err) {
      const error = err as Error;
      if (error.message === 'USER_NOT_FOUND') return apiErrors.notFound('User');
      throw err;
    }

    const containerStatus = await getUserContainerStatus(userId);
    const tree = await listFiles(baseDir);

    // Overlay real container status
    tree.containerReady = containerStatus === 'running';

    return apiSuccess(tree);
  } catch (error) {
    console.error('[files GET]', error);
    return apiErrors.internalError();
  }
}
