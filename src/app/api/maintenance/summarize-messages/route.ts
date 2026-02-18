/**
 * POST /api/maintenance/summarize-messages
 *
 * Summarizes recent unsummarized messages per conversation by sending them
 * to each user's container as a memory-update prompt.
 *
 * Cron: every 4 hours
 *   0 *\/4 * * *   curl -X POST https://clawer.ai/api/maintenance/summarize-messages \
 *                       -H "x-maintenance-key: $MAINTENANCE_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema/messages';
import { conversations } from '@/lib/db/schema/conversations';
import { users } from '@/lib/db/schema/users';
import { eq, and, gte, isNull } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { FREE_TIER_PORT, FREE_TIER_TOKEN } from '@/lib/constants';

function authCheck(req: NextRequest): boolean {
  const key = req.headers.get('x-maintenance-key');
  const secret = process.env.MAINTENANCE_SECRET;
  if (!secret) return false;
  return key === secret;
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Window: messages from the last 4 hours that haven't been summarized yet
  const windowStart = new Date(Date.now() - 4 * 60 * 60 * 1000);

  // Load all unsummarized messages in the window, joined to conversation + user
  const rows = await db
    .select({
      messageId: messages.id,
      conversationId: messages.conversationId,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
      userId: conversations.userId,
      agentId: conversations.agentId,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(messages.summarized, false),
        gte(messages.createdAt, windowStart),
        isNull(conversations.deletedAt)
      )
    )
    .orderBy(messages.createdAt);

  if (rows.length === 0) {
    return NextResponse.json({ summarized: 0, conversations: 0 });
  }

  // Group rows by conversationId
  const byConversation = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = byConversation.get(row.conversationId) ?? [];
    group.push(row);
    byConversation.set(row.conversationId, group);
  }

  // Cache user container info so we don't re-fetch per conversation
  const userCache = new Map<string, { containerPort: number | null; containerStatus: string | null; stripeSubscriptionId: string | null }>();

  let totalSummarized = 0;
  let conversationsProcessed = 0;

  for (const [conversationId, convRows] of byConversation) {
    const userId = convRows[0].userId;

    // Fetch user container info (cached)
    if (!userCache.has(userId)) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          containerPort: true,
          containerStatus: true,
          stripeSubscriptionId: true,
        },
      });
      userCache.set(userId, {
        containerPort: user?.containerPort ?? null,
        containerStatus: user?.containerStatus ?? null,
        stripeSubscriptionId: user?.stripeSubscriptionId ?? null,
      });
    }

    const user = userCache.get(userId)!;
    const hasSubscription = !!user.stripeSubscriptionId;

    let targetPort: number;
    let targetToken: string | undefined;

    if (!hasSubscription) {
      targetPort = FREE_TIER_PORT;
      targetToken = FREE_TIER_TOKEN;
    } else {
      if (!user.containerPort || user.containerStatus !== 'running') {
        // Skip — container unavailable; messages remain unsummarized for next run
        console.warn(`[summarize] Skipping conversation ${conversationId}: container unavailable for user ${userId}`);
        continue;
      }
      targetPort = user.containerPort;
      targetToken = undefined;
    }

    // Format messages as a readable transcript
    const transcript = convRows
      .map(r => `${r.role}: ${r.content}`)
      .join('\n\n');

    const prompt =
      `[MEMORY UPDATE] Summarize and remember these key facts, decisions, and action items from recent conversations:\n\n${transcript}`;

    const result = await containerApi.chat(
      targetPort,
      prompt,
      undefined,
      undefined,
      targetToken
    );

    if (result.error) {
      console.error(`[summarize] Container error for conversation ${conversationId}:`, result.error);
      // Non-fatal: leave messages unsummarized so they retry next run
      continue;
    }

    // Mark all messages in this conversation window as summarized
    const messageIds = convRows.map(r => r.messageId);
    for (const id of messageIds) {
      await db
        .update(messages)
        .set({ summarized: true })
        .where(eq(messages.id, id));
    }

    totalSummarized += messageIds.length;
    conversationsProcessed++;
  }

  return NextResponse.json({
    summarized: totalSummarized,
    conversations: conversationsProcessed,
  });
}
