/**
 * GET /api/memory/stats
 *
 * Aggregates the user's "memory" statistics:
 *  - daysSinceSignup   — days since user.createdAt
 *  - conversationCount — total non-deleted conversations in DB
 *  - fileCount         — files under the user's volume mount
 *  - memoryFacts       — non-blank lines in MEMORY.md inside the container
 *  - memoryTopics      — first N lines parsed as topic bullets
 *
 * Works whether the container is running or stopped (reads the volume mount
 * directly via the host filesystem).
 */

import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { eq, and, isNull } from 'drizzle-orm';
import { resolveUserFilesDir, listFiles } from '@/lib/files';
import fs from 'fs/promises';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemoryStats {
  daysSinceSignup: number;
  conversationCount: number;
  fileCount: number;
  memoryFacts: number;
  memoryTopics: string[];
  containerAvailable: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Read MEMORY.md from the user's container workspace.
 *
 * The workspace lives at:
 *   /opt/clawer/userdata/clawer_user_{userId}/clawd/MEMORY.md
 *
 * Returns null if the file doesn't exist or can't be read.
 */
async function readContainerMemoryFile(userId: string): Promise<string | null> {
  const containerName = `clawer_user_${userId}`;
  const memoryPath = `/opt/clawer/userdata/${containerName}/clawd/MEMORY.md`;
  try {
    return await fs.readFile(memoryPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Parse MEMORY.md content into a line count and topic list.
 *
 * Lines that are blank or consist only of whitespace are excluded.
 * Lines starting with `#` are treated as section headings (topics).
 */
function parseMemoryFile(content: string): { facts: number; topics: string[] } {
  const lines = content.split('\n');
  const nonBlank = lines.filter((l) => l.trim().length > 0);

  // Extract headings as "topics" (strip leading #)
  const topics = nonBlank
    .filter((l) => l.trimStart().startsWith('#'))
    .map((l) => l.replace(/^#+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 10); // cap at 10 topics

  return { facts: nonBlank.length, topics };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    // 1. Load user record
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return apiErrors.notFound('User');

    // 2. Days since signup
    const daysSinceSignup = daysBetween(new Date(user.createdAt), new Date());

    // 3. Conversation count
    const allConversations = await db.query.conversations.findMany({
      where: and(eq(conversations.userId, userId), isNull(conversations.deletedAt)),
      columns: { id: true },
    });
    const conversationCount = allConversations.length;

    // 4. File count from volume mount (works regardless of container status)
    let fileCount = 0;
    let containerAvailable = false;
    try {
      const baseDir = await resolveUserFilesDir(userId);
      const tree = await listFiles(baseDir);
      fileCount = tree.totalFiles;
      containerAvailable = true;
    } catch {
      // Container directory doesn't exist or user not found — that's fine
      containerAvailable = false;
    }

    // 5. MEMORY.md facts
    let memoryFacts = 0;
    let memoryTopics: string[] = [];
    const memoryContent = await readContainerMemoryFile(userId);
    if (memoryContent) {
      const parsed = parseMemoryFile(memoryContent);
      memoryFacts = parsed.facts;
      memoryTopics = parsed.topics;
    }

    const stats: MemoryStats = {
      daysSinceSignup,
      conversationCount,
      fileCount,
      memoryFacts,
      memoryTopics,
      containerAvailable,
    };

    return apiSuccess(stats);
  } catch (error) {
    console.error('[GET /api/memory/stats]', error);
    return apiErrors.internalError();
  }
}
