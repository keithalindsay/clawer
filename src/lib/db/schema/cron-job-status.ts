import { pgTable, text, timestamp, uuid, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Cron Job Status table - tracks cron health per container
 *
 * Caches cron status so the health page loads from DB, not container.
 * Updated by POST /api/dashboard/sync.
 */
export const cronJobStatus = pgTable(
  'cron_job_status',
  {
    /** Unique row ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** Owner user ID - FK to users */
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Cron job identifier (e.g. "morning-briefing", "memory-summarizer") */
    jobName: text('job_name').notNull(),

    /** Cron schedule expression (e.g. "0 7 * * *") */
    schedule: text('schedule').notNull(),

    /**
     * Last known status of the job
     * ok      – completed successfully
     * error   – completed with an error
     * running – currently executing
     */
    lastStatus: text('last_status').notNull().default('ok'),

    /** When the job last ran (null if never) */
    lastRunAt: timestamp('last_run_at'),

    /** How long the last run took in milliseconds */
    lastDurationMs: integer('last_duration_ms'),

    /** Number of consecutive errors without a success in between */
    consecutiveErrors: integer('consecutive_errors').notNull().default(0),

    /** Last upserted timestamp */
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_cron_job_status_user_job').on(table.userId, table.jobName),
    index('idx_cron_job_status_user_id').on(table.userId),
  ]
);

export type CronJobStatus = typeof cronJobStatus.$inferSelect;
export type NewCronJobStatus = typeof cronJobStatus.$inferInsert;
