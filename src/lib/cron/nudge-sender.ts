/**
 * Nudge Sender — MomBrain Push Notification Cron Logic
 *
 * Runs on a schedule (every 10 minutes via Vercel Cron).
 * For every active MomBrain user:
 *   1. Reads ~/clawd/data/nudges.json from their container
 *   2. Finds nudges that are pending and whose scheduledFor <= now
 *   3. Respects the daily limit (max 3 nudges / user / day)
 *   4. Sends them via the Expo Push API
 *   5. Updates the nudge status to 'sent' back in the container file
 *
 * Architecture note (from BACKEND-ARCHITECTURE-V2.md §5.4):
 *   Domain data lives in the per-user OpenClaw container at
 *   ~/clawd/data/nudges.json — not in the Postgres DB.
 *   Clawer API reads/writes container files via containerRequest().
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { pushTokens } from '@/lib/db/schema/mombrain';
import { eq, and } from 'drizzle-orm';
import { containerRequest } from '@/lib/container-client';
import { sendPushNotification } from '@/lib/expo-push';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Nudge {
  id: string;
  type: 'picture_day' | 'meal_plan' | 'deadline' | 'birthday' | 'grocery' | string;
  title: string;
  body: string;
  agent: string;
  priority: 'urgent' | 'timely' | 'helpful';
  scheduledFor: string;   // ISO 8601
  status: 'pending' | 'sent' | 'acted' | 'dismissed';
  sentAt?: string;        // ISO 8601 — set when status → 'sent'
}

export interface NudgeSendResult {
  userId: string;
  nudgesSent: number;
  nudgesSkipped: number;
  errors: string[];
}

export interface NudgeSenderSummary {
  processedUsers: number;
  totalNudgesSent: number;
  totalNudgesSkipped: number;
  userResults: NudgeSendResult[];
  errors: string[];
  ranAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum push notifications per user per UTC calendar day */
const MAX_NUDGES_PER_DAY = 3;

/** Path inside the container for the nudges file */
const NUDGES_FILE_PATH = 'clawd/data/nudges.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Count nudges that were already sent today (UTC) for this user's nudge list.
 */
function countSentToday(nudges: Nudge[]): number {
  const todayUtc = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return nudges.filter(
    (n) => n.status === 'sent' && n.sentAt && n.sentAt.startsWith(todayUtc)
  ).length;
}

/**
 * Read nudges.json from the user's container.
 * Returns an empty array if the file doesn't exist or is malformed.
 */
async function readNudgesFromContainer(
  containerPort: number,
  gatewayToken: string
): Promise<Nudge[]> {
  const result = await containerRequest<{ content: string }>(
    containerPort,
    `/api/files/read?path=${encodeURIComponent(NUDGES_FILE_PATH)}`,
    { method: 'GET' },
    gatewayToken
  );

  if (result.error || !result.data?.content) {
    // File may not exist yet — that's fine
    return [];
  }

  try {
    const parsed = JSON.parse(result.data.content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[nudge-sender] Failed to parse nudges.json from container');
    return [];
  }
}

/**
 * Write the updated nudges array back to the container.
 */
async function writeNudgesToContainer(
  containerPort: number,
  gatewayToken: string,
  nudges: Nudge[]
): Promise<boolean> {
  const result = await containerRequest<{ success: boolean }>(
    containerPort,
    '/api/files/write',
    {
      method: 'POST',
      body: JSON.stringify({
        path: NUDGES_FILE_PATH,
        content: JSON.stringify(nudges, null, 2),
      }),
    },
    gatewayToken
  );

  return !result.error && result.data?.success === true;
}

// ── Per-user processor ────────────────────────────────────────────────────────

/**
 * Process nudges for a single user.
 */
async function processUserNudges(
  userId: string,
  containerPort: number,
  gatewayToken: string,
  pushToken: string
): Promise<NudgeSendResult> {
  const result: NudgeSendResult = {
    userId,
    nudgesSent: 0,
    nudgesSkipped: 0,
    errors: [],
  };

  // 1. Read nudges from container
  let nudges: Nudge[];
  try {
    nudges = await readNudgesFromContainer(containerPort, gatewayToken);
  } catch (err: any) {
    result.errors.push(`Failed to read nudges: ${err.message}`);
    return result;
  }

  if (nudges.length === 0) return result;

  // 2. Apply daily limit
  const sentTodayCount = countSentToday(nudges);
  const remainingQuota = MAX_NUDGES_PER_DAY - sentTodayCount;

  if (remainingQuota <= 0) {
    result.nudgesSkipped = nudges.filter(
      (n) => n.status === 'pending' && new Date(n.scheduledFor) <= new Date()
    ).length;
    return result;
  }

  // 3. Find due pending nudges, sorted by priority then scheduledFor
  const now = new Date();
  const priorityOrder: Record<string, number> = { urgent: 0, timely: 1, helpful: 2 };

  const dueNudges = nudges
    .filter((n) => n.status === 'pending' && new Date(n.scheduledFor) <= now)
    .sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3;
      const pb = priorityOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    })
    .slice(0, remainingQuota);

  if (dueNudges.length === 0) return result;

  // 4. Send each nudge and mark status
  let dirty = false;

  for (const nudge of dueNudges) {
    try {
      const pushResult = await sendPushNotification(
        pushToken,
        nudge.title,
        nudge.body,
        {
          nudgeId: nudge.id,
          nudgeType: nudge.type,
          agent: nudge.agent,
        }
      );

      if (pushResult.success) {
        // Update in-place
        const idx = nudges.findIndex((n) => n.id === nudge.id);
        if (idx !== -1) {
          nudges[idx] = {
            ...nudges[idx],
            status: 'sent',
            sentAt: new Date().toISOString(),
          };
          dirty = true;
          result.nudgesSent++;
        }
      } else {
        result.errors.push(
          `Failed to send nudge ${nudge.id}: ${pushResult.error}`
        );
        result.nudgesSkipped++;

        if (pushResult.isInvalidToken) {
          // Token is stale — log prominently so the push-token route can be called
          console.error(
            `[nudge-sender] Invalid push token for user ${userId} — token should be re-registered`
          );
          // Stop processing this user; no point sending more
          break;
        }
      }
    } catch (err: any) {
      result.errors.push(`Error sending nudge ${nudge.id}: ${err.message}`);
      result.nudgesSkipped++;
    }
  }

  // 5. Persist updated nudge statuses back to container
  if (dirty) {
    const saved = await writeNudgesToContainer(containerPort, gatewayToken, nudges);
    if (!saved) {
      result.errors.push('Failed to persist nudge status updates to container');
    }
  }

  return result;
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Run the nudge sender across all active MomBrain users.
 *
 * Called by the Vercel Cron endpoint every 10 minutes.
 */
export async function runNudgeSender(): Promise<NudgeSenderSummary> {
  const summary: NudgeSenderSummary = {
    processedUsers: 0,
    totalNudgesSent: 0,
    totalNudgesSkipped: 0,
    userResults: [],
    errors: [],
    ranAt: new Date().toISOString(),
  };

  // 1. Find all MomBrain users with running containers and a push token
  let momUsers: Array<{
    id: string;
    containerPort: number | null;
    containerStatus: string | null;
    gatewayToken: string | null;
    pushToken: string | null;
  }>;

  try {
    // Join users with push_tokens
    const rows = await db
      .select({
        id: users.id,
        containerPort: users.containerPort,
        containerStatus: users.containerStatus,
        gatewayToken: users.gatewayToken,
        pushToken: pushTokens.token,
      })
      .from(users)
      .innerJoin(pushTokens, eq(users.id, pushTokens.userId))
      .where(
        and(
          eq(users.teamTemplate, 'mom'),
          eq(users.containerStatus, 'running')
        )
      );

    momUsers = rows;
  } catch (err: any) {
    summary.errors.push(`DB query failed: ${err.message}`);
    return summary;
  }

  if (momUsers.length === 0) {
    return summary;
  }

  // 2. Process each user (sequentially to avoid overwhelming containers)
  for (const user of momUsers) {
    if (!user.containerPort || !user.gatewayToken || !user.pushToken) {
      continue;
    }

    try {
      const userResult = await processUserNudges(
        user.id,
        user.containerPort,
        user.gatewayToken,
        user.pushToken
      );

      summary.processedUsers++;
      summary.totalNudgesSent += userResult.nudgesSent;
      summary.totalNudgesSkipped += userResult.nudgesSkipped;
      summary.userResults.push(userResult);

      if (userResult.errors.length > 0) {
        console.warn(
          `[nudge-sender] User ${user.id} had ${userResult.errors.length} error(s):`,
          userResult.errors
        );
      }
    } catch (err: any) {
      const msg = `Unhandled error for user ${user.id}: ${err.message}`;
      console.error('[nudge-sender]', msg);
      summary.errors.push(msg);
    }
  }

  console.log(
    `[nudge-sender] Done — ${summary.processedUsers} users, ` +
    `${summary.totalNudgesSent} sent, ${summary.totalNudgesSkipped} skipped`
  );

  return summary;
}
