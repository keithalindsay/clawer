import { pgTable, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { bots } from './bots';

/**
 * Usage type enum
 */
export const usageTypeEnum = pgEnum('usage_type', [
  'message',        // Chat message
  'tool_call',      // Tool invocation
  'integration',    // External API call
]);

/**
 * Usage records table - detailed usage for billing
 */
export const usageRecords = pgTable('usage_records', {
  /** Unique record ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** User ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Bot ID (optional) */
  botId: uuid('bot_id').references(() => bots.id, { onDelete: 'set null' }),
  
  /** Usage type */
  type: usageTypeEnum('type').notNull(),
  
  /** Model used */
  model: text('model'),
  
  /** Input tokens */
  inputTokens: integer('input_tokens').notNull().default(0),
  
  /** Output tokens */
  outputTokens: integer('output_tokens').notNull().default(0),
  
  /** Calculated cost in USD (microdollars) */
  costMicros: integer('cost_micros').notNull().default(0),
  
  /** Usage period (for aggregation) */
  periodStart: timestamp('period_start').notNull(),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Daily usage summary - aggregated for fast queries
 */
export const dailyUsageSummary = pgTable('daily_usage_summary', {
  /** Unique record ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** User ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Date (YYYY-MM-DD) */
  date: text('date').notNull(),
  
  /** Total messages */
  messageCount: integer('message_count').notNull().default(0),
  
  /** Total input tokens */
  totalInputTokens: integer('total_input_tokens').notNull().default(0),
  
  /** Total output tokens */
  totalOutputTokens: integer('total_output_tokens').notNull().default(0),
  
  /** Total cost in USD (microdollars) */
  totalCostMicros: integer('total_cost_micros').notNull().default(0),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
