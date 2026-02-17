import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Tasks table - Kanban-style task board
 * Status flow: backlog → queued → running → done | failed
 */
export const tasks = pgTable('tasks', {
  /** Unique task ID */
  id: text('id').primaryKey(),

  /** Owner user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  /** Task title */
  title: text('title').notNull(),

  /** Task description / instructions for the agent */
  description: text('description'),

  /**
   * Task status
   * backlog  – created, not yet queued
   * queued   – ready to execute (play button visible)
   * running  – agent is currently executing
   * done     – completed successfully
   * failed   – execution failed
   */
  status: text('status').notNull().default('backlog'),

  /**
   * Priority
   * low | medium | high | urgent
   */
  priority: text('priority').notNull().default('medium'),

  /** Team member ID to assign this task to (from team template) */
  assignedTo: text('assigned_to'),

  /** Agent response / output after execution */
  result: text('result'),

  /** Error message if execution failed */
  error: text('error'),

  /** When the task was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),

  /** When execution started */
  startedAt: timestamp('started_at'),

  /** When execution finished (done or failed) */
  completedAt: timestamp('completed_at'),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
