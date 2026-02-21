import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Engagement messages table - Day 1-7 onboarding message sequence
 *
 * Created when a user completes onboarding. Each row represents
 * one scheduled message in the engagement sequence.
 */
export const engagementMessages = pgTable('engagement_messages', {
  /** Unique message ID */
  id: uuid('id').primaryKey().defaultRandom(),

  /** User this message belongs to */
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /**
   * Message type / day key
   * One of: day1_recap, day2_briefing, day3_capability, day5_reengage,
   *         day6_depth, day7_recap
   */
  messageType: text('message_type').notNull(),

  /** When this message should be sent (absolute timestamp) */
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),

  /** When this message was actually sent */
  sentAt: timestamp('sent_at', { withTimezone: true }),

  /**
   * Delivery status
   * pending → sent | skipped | failed
   */
  status: text('status').notNull().default('pending'),

  /** Why message was skipped (if status = 'skipped') */
  skipReason: text('skip_reason'),

  /** Rendered message content (plain text / markdown) */
  content: text('content'),

  /** Delivery channel: whatsapp | telegram | web | slack */
  channel: text('channel').notNull().default('web'),

  /** Extra metadata (template vars, A/B variant, etc.) */
  metadata: jsonb('metadata'),

  /** Row creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EngagementMessage = typeof engagementMessages.$inferSelect;
export type NewEngagementMessage = typeof engagementMessages.$inferInsert;
