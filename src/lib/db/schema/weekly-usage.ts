import { pgTable, text, timestamp, uuid, bigint, decimal, integer, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Weekly usage tracking for rate limiting
 * Resets every Monday at 00:00 UTC
 */
export const weeklyUsage = pgTable('weekly_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** User ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Week boundaries */
  weekStart: timestamp('week_start').notNull(),
  weekEnd: timestamp('week_end').notNull(),
  
  /** Orchestrator tokens (smart brain - Gemini 3 Flash, etc.) */
  orchestratorInputTokens: bigint('orchestrator_input_tokens', { mode: 'number' }).notNull().default(0),
  orchestratorOutputTokens: bigint('orchestrator_output_tokens', { mode: 'number' }).notNull().default(0),
  
  /** Worker tokens (cheap models - Flash-Lite, GPT-4o-mini, etc.) */
  workerInputTokens: bigint('worker_input_tokens', { mode: 'number' }).notNull().default(0),
  workerOutputTokens: bigint('worker_output_tokens', { mode: 'number' }).notNull().default(0),
  
  /** 
   * Normalized "Orchestrator Equivalent Tokens" (OET)
   * This is what users see - accounts for worker tokens being cheaper
   * Formula: orchestrator_tokens * 1.0 + worker_tokens * 0.15
   */
  totalOet: bigint('total_oet', { mode: 'number' }).notNull().default(0),
  
  /** Estimated cost in USD for internal tracking */
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 4 }).notNull().default('0'),
  
  /** Request count for analytics */
  requestCount: integer('request_count').notNull().default(0),
  
  /** Timestamps */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one record per user per week
  userWeekUnique: unique('user_week_unique').on(table.userId, table.weekStart),
  // Index for fast user lookups
  userIdIdx: index('weekly_usage_user_idx').on(table.userId),
  // Index for reset queries
  weekStartIdx: index('weekly_usage_week_idx').on(table.weekStart),
}));

/**
 * Historical usage archive - stores completed weeks for analytics
 */
export const usageHistory = pgTable('usage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** User ID (not FK - user may be deleted) */
  userId: text('user_id').notNull(),
  
  /** Archived week data */
  weekStart: timestamp('week_start').notNull(),
  weekEnd: timestamp('week_end').notNull(),
  
  /** Token counts */
  orchestratorInputTokens: bigint('orchestrator_input_tokens', { mode: 'number' }),
  orchestratorOutputTokens: bigint('orchestrator_output_tokens', { mode: 'number' }),
  workerInputTokens: bigint('worker_input_tokens', { mode: 'number' }),
  workerOutputTokens: bigint('worker_output_tokens', { mode: 'number' }),
  totalOet: bigint('total_oet', { mode: 'number' }),
  
  /** Cost and analytics */
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 4 }),
  requestCount: integer('request_count'),
  peakDailyUsage: bigint('peak_daily_usage', { mode: 'number' }),
  
  /** Archive timestamp */
  archivedAt: timestamp('archived_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('usage_history_user_idx').on(table.userId),
  weekStartIdx: index('usage_history_week_idx').on(table.weekStart),
}));

/**
 * Per-request logging for detailed analytics
 */
export const requestLog = pgTable('request_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** User ID */
  userId: text('user_id').notNull(),
  
  /** Request tracking */
  requestId: text('request_id').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  
  /** Routing decision (JSON) */
  routeDecision: text('route_decision'),  // {"intent": "...", "workers": ["SEARCH"]}
  
  /** Token breakdown (JSON) */
  orchestratorTokens: text('orchestrator_tokens'),  // {"input": 150, "output": 320}
  workerTokens: text('worker_tokens'),              // {"SEARCH": {"input": 2000, "output": 500}}
  totalTokens: integer('total_tokens'),
  
  /** Performance */
  latencyMs: integer('latency_ms'),
  
  /** Cost */
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 6 }),
}, (table) => ({
  userTimeIdx: index('request_log_user_time_idx').on(table.userId, table.timestamp),
}));

/**
 * Token tier limits
 */
export const TOKEN_LIMITS = {
  basic: {
    weeklyOet: 3_750_000,    // ~15M monthly
    priceMonthly: 49,
  },
  pro: {
    weeklyOet: 10_000_000,   // ~40M monthly
    priceMonthly: 99,
  },
  enterprise: {
    weeklyOet: 25_000_000,   // ~100M monthly
    priceMonthly: 249,
  },
} as const;

/**
 * Rate limit thresholds
 */
export const RATE_LIMITS = {
  warningThreshold: 0.80,    // 80% - show warning
  hardLimit: 1.00,           // 100% - block requests
  maxTokensPerRequest: 100_000,
  maxRequestsPerMinute: 20,
  maxRequestsPerHour: 200,
} as const;
