import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Agent Events table - stores activity from user containers
 *
 * Mirrors what the container exposes, persisted in Postgres for:
 * - Queries across time (activity feed history beyond what container holds)
 * - Reporting and stats aggregation
 * - Surviving container restarts
 *
 * Synced from container via POST /api/dashboard/sync (on load + every 30s)
 */
export const agentEvents = pgTable(
  'agent_events',
  {
    /** Unique event ID (uuid) */
    id: uuid('id').primaryKey().defaultRandom(),

    /** Owner user ID - FK to users */
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /**
     * Event type
     * delegation      – agent delegated a subtask to another agent
     * task_complete   – a task reached done status
     * file_created    – agent saved a file
     * cron_run        – a cron job executed
     * error           – an error occurred
     * agent_spawn     – a sub-agent was spawned
     * agent_complete  – a sub-agent finished
     */
    eventType: text('event_type').notNull(),

    /** Team member display name (e.g. "Scout", "Dash") */
    agentName: text('agent_name').notNull(),

    /** Team member emoji (e.g. "🔍", "⚡") — nullable */
    agentEmoji: text('agent_emoji'),

    /** Human-readable one-line summary of what happened */
    summary: text('summary').notNull(),

    /** Additional structured data (file paths, task IDs, error messages, etc.) */
    details: jsonb('details'),

    /** When the event was recorded */
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_agent_events_user_id').on(table.userId),
    index('idx_agent_events_created_at').on(table.createdAt),
    index('idx_agent_events_event_type').on(table.eventType),
  ]
);

export type AgentEvent = typeof agentEvents.$inferSelect;
export type NewAgentEvent = typeof agentEvents.$inferInsert;
