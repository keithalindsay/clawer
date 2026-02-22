/**
 * GET /api/dashboard/config
 *
 * Returns a sanitized snapshot of the user's openclaw.json configuration.
 * Reads the file directly from the volume-mounted path on the host — same
 * pattern as the File Viewer (/api/files/content).
 *
 * NEVER returns tokens, API keys, or auth sections.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SanitizedConfig {
  models: {
    primary: string;
    fallback: string;
    heartbeat: string;
    subagent: string;
    embeddings: string;
  };
  channels: {
    whatsapp: { configured: boolean };
    telegram: { configured: boolean };
    slack: { configured: boolean };
  };
  memory: {
    memorySearch: boolean;
    embeddings: { provider: string; model: string };
  };
  security: {
    dmScope: string;
    containerIsolation: true;
  };
}

// ---------------------------------------------------------------------------
// Model name cleaner
// ---------------------------------------------------------------------------

/**
 * Strips provider prefix and cleans up model display names.
 *
 * Examples:
 *   "minimax/MiniMax-M2.5"   → "MiniMax M2.5"
 *   "openai/gpt-4o-mini"     → "GPT-4o Mini"
 *   "ollama/qwen2.5:3b"      → "Qwen 2.5 3B"
 *   "nomic-embed-text"        → "Nomic Embed Text"
 */
function cleanModelName(raw: string | null | undefined): string {
  if (!raw) return 'Not configured';

  // Strip provider prefix (everything before the first "/")
  const withoutProvider = raw.includes('/') ? raw.split('/').slice(1).join('/') : raw;

  // Handle ollama-style tags with colon (e.g. qwen2.5:3b)
  const withoutTag = withoutProvider.includes(':')
    ? withoutProvider.split(':').join(' ').replace(/(\d)/g, ' $1').replace(/\s+/g, ' ')
    : withoutProvider;

  // Replace hyphens/underscores with spaces and title-case each word
  return withoutTag
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      // Preserve all-caps acronyms (e.g. GPT, M2.5)
      if (/^[A-Z0-9.]+$/.test(word)) return word;
      // Capitalise first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// Config parser
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseConfig(raw: any): SanitizedConfig {
  // Model fields — OpenClaw uses various names depending on version
  const primaryModel =
    raw?.model ??
    raw?.defaultModel ??
    raw?.models?.primary ??
    raw?.llm?.model ??
    null;

  const fallbackModel =
    raw?.fallbackModel ??
    raw?.models?.fallback ??
    raw?.llm?.fallback ??
    null;

  const heartbeatModel =
    raw?.heartbeatModel ??
    raw?.models?.heartbeat ??
    raw?.llm?.heartbeat ??
    null;

  const subagentModel =
    raw?.subagentModel ??
    raw?.models?.subagent ??
    raw?.models?.subAgent ??
    raw?.llm?.subagent ??
    null;

  const embeddingsModel =
    raw?.memory?.embeddings?.model ??
    raw?.embeddings?.model ??
    raw?.models?.embeddings ??
    null;

  // Channel configuration
  const wa = raw?.channels?.whatsapp ?? {};
  const tg = raw?.channels?.telegram ?? {};
  const sl = raw?.channels?.slack ?? {};

  const whatsappConfigured =
    Boolean(wa?.enabled) ||
    Boolean(wa?.configured) ||
    Boolean(wa?.sessionFile) ||
    Boolean(wa?.authDir);

  const telegramConfigured =
    Boolean(tg?.enabled) ||
    Boolean(tg?.configured) ||
    // Has a non-empty token means it's configured (token itself is stripped)
    (typeof tg?.token === 'string' && tg.token.length > 0) ||
    (typeof tg?.botToken === 'string' && tg.botToken.length > 0);

  const slackConfigured =
    Boolean(sl?.enabled) ||
    Boolean(sl?.configured) ||
    (typeof sl?.token === 'string' && sl.token.length > 0) ||
    (typeof sl?.botToken === 'string' && sl.botToken.length > 0);

  // Memory
  const memorySearch =
    Boolean(raw?.memory?.enabled) ||
    Boolean(raw?.memory?.memorySearch) ||
    Boolean(raw?.memorySearch);

  const embProvider = raw?.memory?.embeddings?.provider ?? raw?.embeddings?.provider ?? 'local';
  const embModel =
    raw?.memory?.embeddings?.model ?? raw?.embeddings?.model ?? embeddingsModel ?? 'nomic-embed-text';

  // Security
  const dmScope = raw?.security?.dmScope ?? raw?.dmScope ?? 'per-channel';

  return {
    models: {
      primary: cleanModelName(primaryModel),
      fallback: cleanModelName(fallbackModel),
      heartbeat: cleanModelName(heartbeatModel),
      subagent: cleanModelName(subagentModel),
      embeddings: cleanModelName(embModel),
    },
    channels: {
      whatsapp: { configured: whatsappConfigured },
      telegram: { configured: telegramConfigured },
      slack: { configured: slackConfigured },
    },
    memory: {
      memorySearch,
      embeddings: {
        provider: embProvider,
        model: cleanModelName(embModel),
      },
    },
    security: {
      dmScope,
      containerIsolation: true, // always true on Clawer — dedicated containers
    },
  };
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Resolve container ID from DB (same pattern as resolveUserFilesDir in lib/files.ts)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const containerName = user.containerId ?? `clawer_user_${userId}`;
    const configPath = `/opt/clawer/userdata/${containerName}/.openclaw/openclaw.json`;

    // 3. Read config file
    let raw: unknown = null;
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      raw = JSON.parse(content);
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        // Container not yet provisioned — return safe defaults
        return NextResponse.json(
          parseConfig({}),
          {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
          }
        );
      }
      // Malformed JSON — log and return defaults
      console.error('[config GET] Failed to parse openclaw.json:', error);
      return NextResponse.json(
        parseConfig({}),
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // 4. Sanitize and return (no secrets)
    const sanitized = parseConfig(raw);

    return NextResponse.json(sanitized, {
      status: 200,
      headers: {
        // Cache for 5 minutes — config rarely changes
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[config GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
