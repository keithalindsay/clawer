import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Orchestrator Alert Definitions
 * Pre-built and custom alert templates for container monitoring
 */
export const orchestratorAlerts = pgTable('orchestrator_alerts', {
  /** Unique alert ID (e.g., 'ssh_bruteforce', 'disk_space') */
  id: text('id').primaryKey(),
  
  /** Human-readable alert name */
  name: text('name').notNull(),
  
  /** Detailed description of what this alert monitors */
  description: text('description'),
  
  /** Shell script to execute for this check */
  checkScript: text('check_script').notNull(),
  
  /** Cron schedule expression (e.g., every 5 minutes) */
  schedule: text('schedule').notNull(),
  
  /** Action type: notify | auto | approve */
  action: text('action').notNull().default('notify'),
  
  /** Severity level: info | warning | critical */
  severity: text('severity').notNull().default('warning'),
  
  /** Whether this alert is globally enabled */
  enabled: boolean('enabled').notNull().default(true),
  
  /** When this alert was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * User Alert Assignments
 * Tracks which alerts are enabled for each user with custom settings
 */
export const userAlerts = pgTable('user_alerts', {
  /** Unique assignment ID */
  id: text('id').primaryKey(),
  
  /** User ID this alert is assigned to */
  userId: text('user_id').notNull(),
  
  /** Reference to orchestrator_alerts */
  alertId: text('alert_id').references(() => orchestratorAlerts.id, { onDelete: 'cascade' }),
  
  /** Whether this alert is enabled for this user */
  enabled: boolean('enabled').notNull().default(true),
  
  /** JSON string of user-specific threshold overrides */
  thresholdOverrides: text('threshold_overrides'),
  
  /** Permission level: notify | auto | approve | manual */
  permissionLevel: text('permission_level').notNull().default('notify'),
  
  /** When this assignment was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Alert History
 * Log of all triggered alerts and their outcomes
 */
export const alertHistory = pgTable('alert_history', {
  /** Unique history entry ID */
  id: text('id').primaryKey(),
  
  /** Alert that triggered (nullable if alert was deleted) */
  alertId: text('alert_id').references(() => orchestratorAlerts.id, { onDelete: 'set null' }),
  
  /** User ID (NULL for fleet-wide alerts) */
  userId: text('user_id'),
  
  /** Container name that triggered the alert */
  containerName: text('container_name'),
  
  /** Severity at time of trigger: info | warning | critical */
  severity: text('severity'),
  
  /** Alert message content */
  message: text('message'),
  
  /** Action that was taken (if any) */
  actionTaken: text('action_taken'),
  
  /** Whether user has acknowledged this alert */
  acknowledged: boolean('acknowledged').notNull().default(false),
  
  /** When this alert was triggered */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Permission Requests
 * Tracks orchestrator actions requiring user approval
 */
export const permissionRequests = pgTable('permission_requests', {
  /** Unique request ID */
  id: text('id').primaryKey(),
  
  /** User ID who needs to approve/deny */
  userId: text('user_id').notNull(),
  
  /** Type of action: upgrade | cleanup | config_change | security_patch */
  actionType: text('action_type').notNull(),
  
  /** Detailed description of the requested action */
  description: text('description'),
  
  /** Status: pending | approved | denied | expired */
  status: text('status').notNull().default('pending'),
  
  /** When this request expires (if not responded to) */
  expiresAt: timestamp('expires_at'),
  
  /** When the user responded */
  respondedAt: timestamp('responded_at'),
  
  /** When this request was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ══════════════════════════════════════════════════════════════════════════
// TypeScript types
// ══════════════════════════════════════════════════════════════════════════

export type OrchestratorAlert = typeof orchestratorAlerts.$inferSelect;
export type NewOrchestratorAlert = typeof orchestratorAlerts.$inferInsert;

export type UserAlert = typeof userAlerts.$inferSelect;
export type NewUserAlert = typeof userAlerts.$inferInsert;

export type AlertHistory = typeof alertHistory.$inferSelect;
export type NewAlertHistory = typeof alertHistory.$inferInsert;

export type PermissionRequest = typeof permissionRequests.$inferSelect;
export type NewPermissionRequest = typeof permissionRequests.$inferInsert;
