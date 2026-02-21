/**
 * Engagement Message Scheduler
 *
 * Creates the Day 1-7 engagement message sequence for a user when they
 * complete onboarding. Messages are inserted as 'pending' and picked up
 * by the /api/engagement/pending worker endpoint.
 */

import { db } from '@/lib/db';
import { engagementMessages } from '@/lib/db/schema/engagement-messages';
import { users } from '@/lib/db/schema/users';
import { eq, and, lte, gte } from 'drizzle-orm';

/* ── Sequence definition ─────────────────────────────────────── */

interface MessageSpec {
  type: string;
  /** Hours from onboarding completion to schedule this message */
  offsetHours: number;
  /** Default channel — can be overridden per user */
  defaultChannel: string;
}

/**
 * The 6-message engagement sequence (Day 4 is intentionally silent).
 * Offsets are relative to onboarding completion time.
 */
const ENGAGEMENT_SEQUENCE: MessageSpec[] = [
  { type: 'day1_recap',       offsetHours: 6,   defaultChannel: 'web' },      // Day 1, 6 PM (≈6h after morning signup)
  { type: 'day2_briefing',    offsetHours: 26,  defaultChannel: 'whatsapp' }, // Day 2, 8 AM local
  { type: 'day3_capability',  offsetHours: 52,  defaultChannel: 'whatsapp' }, // Day 3, 10 AM local
  { type: 'day5_reengage',    offsetHours: 100, defaultChannel: 'whatsapp' }, // Day 5, 10 AM local
  { type: 'day6_depth',       offsetHours: 124, defaultChannel: 'whatsapp' }, // Day 6, 10 AM local
  { type: 'day7_recap',       offsetHours: 148, defaultChannel: 'whatsapp' }, // Day 7, 10 AM local
];

/* ── Template content builders ───────────────────────────────── */

/**
 * Generate message content for each day based on user context.
 * Returns plain-text / markdown suitable for WhatsApp / Telegram.
 */
export function buildEngagementMessageContent(
  messageType: string,
  user: {
    name: string | null;
    teamTemplate: string | null;
  }
): string {
  const name = user.name || 'there';
  const templateName = getTemplateName(user.teamTemplate || 'lifeos');
  const deliverableType = getDeliverableType(user.teamTemplate || 'lifeos');

  switch (messageType) {
    case 'day1_recap':
      return `Hey ${name} 👋 Here's what I worked on for you today:

✅ Created your ${deliverableType} (saved to Files)
✅ Set up your ${templateName} team
✅ Ready to help you every day

Want me to set up your morning briefing so I can update you daily?`;

    case 'day2_briefing':
      return `Quick question — what would make me more useful to you?

A) Daily morning briefing (news, schedule, reminders)
B) Weekly content batch
C) Just ask when I need something

Reply with A, B, or C 👆`;

    case 'day3_capability':
      return `${name}, I can also create files and save research for you.

Try saying: "Research ${getIndustryHint(user.teamTemplate || 'lifeos')} and save a report"

I'll have it ready by tomorrow morning. 📄`;

    case 'day5_reengage':
      return `Hey ${name} — you're building momentum! 🔥

This week I can:
• Answer any questions you have
• Create files and save research
• Help you plan and organize

Most underused feature for ${templateName} users: ${getUnderusedFeature(user.teamTemplate || 'lifeos')}

Want to try it?`;

    case 'day6_depth':
      return buildDay6Content(user.teamTemplate || 'lifeos', name);

    case 'day7_recap':
      return `Your first week with your team 📊

✅ Your ${templateName} team is set up and learning your preferences

✅ The more we work together, the better I get at predicting what you need

🎁 Week 2 unlock: ${getWeek2Unlock(user.teamTemplate || 'lifeos')}

Want to try it? Just say the word.`;

    default:
      return `Hey ${name}! Your ${templateName} team is here and ready to help. What can I do for you today?`;
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */

function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    lifeos: 'Life OS',
    solopreneur: 'Solopreneur',
    'content-creator': 'Content Creator',
    ecommerce: 'E-Commerce',
    'growth-ops': 'Growth Ops',
    fitness: 'Fitness',
    parent: 'Parent',
    finance: 'Finance',
  };
  return names[templateId] ?? templateId;
}

function getDeliverableType(templateId: string): string {
  const types: Record<string, string> = {
    lifeos: 'weekly life structure',
    solopreneur: 'week of content ideas',
    'content-creator': '4-week content calendar',
    ecommerce: 'competitor analysis',
    'growth-ops': 'growth experiment backlog',
    fitness: '4-week workout plan',
    parent: 'family weekly overview',
    finance: 'financial clarity snapshot',
  };
  return types[templateId] ?? 'personalized deliverable';
}

function getIndustryHint(templateId: string): string {
  const hints: Record<string, string> = {
    lifeos: 'personal productivity trends',
    solopreneur: 'your industry trends',
    'content-creator': 'trending content ideas in your niche',
    ecommerce: 'competitor pricing and positioning',
    'growth-ops': 'growth tactics for your stage',
    fitness: 'nutrition and training research',
    parent: 'family scheduling tips',
    finance: 'personal finance strategies for your goal',
  };
  return hints[templateId] ?? 'relevant topics for you';
}

function getUnderusedFeature(templateId: string): string {
  const features: Record<string, string> = {
    lifeos: 'habit tracking — ask me to track any habit daily',
    solopreneur: 'batch content creation — I can write a week of posts at once',
    'content-creator': 'content repurposing — I can turn one video into 10 posts',
    ecommerce: 'competitor monitoring — I can track their pricing weekly',
    'growth-ops': 'experiment templates — I can build a full ICE-scored backlog',
    fitness: 'workout adjustments — I can modify your plan based on how you feel',
    parent: 'meal planning — I can plan the whole week in one go',
    finance: 'expense categorization — tell me your transactions and I\'ll analyze them',
  };
  return features[templateId] ?? 'file creation — ask me to create any document';
}

function buildDay6Content(templateId: string, name: string): string {
  const content: Record<string, string> = {
    solopreneur: `${name}, I can run a mini-competitor analysis whenever you want.

Just say "analyze [competitor name]" and I'll report back on their content, pricing, and positioning.

Want me to start with someone specific? 🔍`,

    'content-creator': `${name}, I've been noticing what works in your niche.

Want me to turn a trending topic into a full content script? I'll have it ready in minutes.

Just say "write a script about [topic]" 🎬`,

    fitness: `${name}, week one is in the books! 💪

Based on the plan you started, I've got week 2 ready to go — with progressive overload built in.

Want to see your updated training plan?`,

    parent: `${name}, I can take meal planning completely off your plate.

Just tell me how many meals you need this week and any dietary needs. I'll plan the whole thing.

Want a full weekly meal plan? 🍽️`,

    finance: `${name}, I can help you track spending patterns and flag anything unusual.

Just paste your recent transactions and I'll categorize them and give you a clear picture.

Want to try it? 💰`,

    lifeos: `${name}, I can proactively remind you about your habits throughout the week.

Just tell me what you want to track and I'll check in at the right times.

What habit should we start with? 🎯`,

    ecommerce: `${name}, I can track your competitor's pricing on a schedule.

Just tell me what to monitor and I'll alert you whenever they make a move.

Which competitor should I watch? 👀`,

    'growth-ops': `${name}, I can run daily competitive intelligence for you.

Pick a competitor and I'll track their content, product updates, and positioning weekly.

Who should I start monitoring? 📊`,
  };

  return (
    content[templateId] ??
    `${name}, you've been building great habits this week. 

Want me to go deeper on any area? I can create detailed reports, track anything specific, or help you plan ahead.

Just ask! 🚀`
  );
}

function getWeek2Unlock(templateId: string): string {
  const unlocks: Record<string, string> = {
    lifeos: 'I can now proactively remind you about your habits — just tell me what to track',
    solopreneur: 'I can now monitor your competitors daily and alert you to changes',
    'content-creator': 'I can now repurpose any video into content for every platform automatically',
    ecommerce: 'I can now track your competitor pricing in real-time',
    fitness: 'I can now adjust your program based on how each workout felt',
    parent: 'I can now manage family appointments and send reminders automatically',
    finance: 'I can now categorize expenses and flag unusual transactions',
    'growth-ops': 'I can now run daily competitive intelligence reports',
  };
  return unlocks[templateId] ?? 'deeper personalization based on everything I\'ve learned this week';
}

/* ── Main scheduler function ─────────────────────────────────── */

/**
 * Schedule the full Day 1-7 engagement sequence for a newly onboarded user.
 * Should be called immediately after onboarding is marked complete.
 *
 * @param userId - Clerk user ID
 * @param onboardingCompletedAt - When onboarding finished (defaults to now)
 */
export async function scheduleEngagementSequence(
  userId: string,
  onboardingCompletedAt: Date = new Date()
): Promise<void> {
  // Get user to determine preferred channel and template
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      teamTemplate: true,
      briefingChannel: true,
      briefingEnabled: true,
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const preferredChannel = user.briefingChannel || 'web';

  // Delete any existing pending messages for this user (idempotent)
  await db
    .delete(engagementMessages)
    .where(
      and(
        eq(engagementMessages.userId, userId),
        eq(engagementMessages.status, 'pending')
      )
    );

  // Build message rows
  const rows = ENGAGEMENT_SEQUENCE.map((spec) => {
    const scheduledFor = new Date(
      onboardingCompletedAt.getTime() + spec.offsetHours * 60 * 60 * 1000
    );

    const content = buildEngagementMessageContent(spec.type, {
      name: user.name,
      teamTemplate: user.teamTemplate,
    });

    // Day 2 briefing goes through the briefing channel if enabled
    const channel =
      spec.type === 'day2_briefing' && user.briefingEnabled
        ? preferredChannel
        : spec.defaultChannel;

    return {
      userId,
      messageType: spec.type,
      scheduledFor,
      status: 'pending' as const,
      content,
      channel,
    };
  });

  await db.insert(engagementMessages).values(rows);
}

/* ── Skip logic ──────────────────────────────────────────────── */

/**
 * Check whether an engagement message should be skipped.
 * Returns the skip reason string, or null if it should be sent.
 */
export async function checkSkipConditions(
  msg: { userId: string; messageType: string },
  recentActivityWindowMs = 2 * 60 * 60 * 1000 // 2 hours
): Promise<string | null> {
  const twoHoursAgo = new Date(Date.now() - recentActivityWindowMs);

  // Check for recent user activity (updated within 2 hours = user is engaged)
  const user = await db.query.users.findFirst({
    where: eq(users.id, msg.userId),
    columns: { updatedAt: true, briefingEnabled: true },
  });

  if (!user) return 'user_not_found';

  // If user was active in the last 2 hours, skip (they're already engaged)
  if (user.updatedAt && user.updatedAt > twoHoursAgo) {
    return 'user_recently_active';
  }

  // Day 2 briefing: skip if user has briefing disabled
  if (msg.messageType === 'day2_briefing' && !user.briefingEnabled) {
    return 'briefing_disabled';
  }

  return null; // No skip — send this message
}

/* ── Status updater ──────────────────────────────────────────── */

export async function markMessageSent(messageId: string): Promise<void> {
  await db
    .update(engagementMessages)
    .set({ status: 'sent', sentAt: new Date() })
    .where(eq(engagementMessages.id, messageId));
}

export async function markMessageSkipped(
  messageId: string,
  reason: string
): Promise<void> {
  await db
    .update(engagementMessages)
    .set({ status: 'skipped', skipReason: reason })
    .where(eq(engagementMessages.id, messageId));
}

export async function markMessageFailed(messageId: string): Promise<void> {
  await db
    .update(engagementMessages)
    .set({ status: 'failed' })
    .where(eq(engagementMessages.id, messageId));
}

/* ── Pending message query ───────────────────────────────────── */

/**
 * Fetch all pending messages that are due to be sent now.
 * Used by the /api/engagement/pending cron endpoint.
 */
export async function getPendingMessages() {
  return db.query.engagementMessages.findMany({
    where: and(
      eq(engagementMessages.status, 'pending'),
      lte(engagementMessages.scheduledFor, new Date())
    ),
    orderBy: engagementMessages.scheduledFor,
    limit: 100,
  });
}
