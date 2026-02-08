/**
 * Audit Logger - Comprehensive logging of all bot actions
 */

export type AuditActionType = 
  | 'message'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'rate_limit'
  | 'blocked'
  | 'confirmation_required'
  | 'confirmation_approved'
  | 'confirmation_denied'
  | 'input_sanitized'
  | 'output_filtered';

export interface AuditEntry {
  timestamp: Date;
  userId: string;
  botId: string;
  action: AuditActionType;
  details: Record<string, unknown>;
  ip?: string;
  sessionId?: string;
}

/**
 * In-memory audit log (use database in production)
 */
const auditLog: AuditEntry[] = [];

/**
 * Maximum entries to keep in memory
 */
const MAX_LOG_ENTRIES = 10000;

/**
 * Log an audit entry
 */
export function logAudit(entry: AuditEntry): void {
  // Set timestamp if not provided
  if (!entry.timestamp) {
    entry.timestamp = new Date();
  }
  
  // Add to log
  auditLog.push(entry);
  
  // Trim if exceeds max (keep most recent)
  if (auditLog.length > MAX_LOG_ENTRIES) {
    auditLog.splice(0, auditLog.length - MAX_LOG_ENTRIES);
  }
  
  // Also log to console for development
  console.log('[AUDIT]', {
    timestamp: entry.timestamp.toISOString(),
    userId: entry.userId,
    botId: entry.botId,
    action: entry.action,
    details: sanitizeDetailsForLogging(entry.details),
  });
  
  // TODO: In production, write to database or log aggregation service
}

/**
 * Get audit log for a user
 */
export function getAuditLog(
  userId: string,
  since?: Date,
  limit: number = 100
): AuditEntry[] {
  let filtered = auditLog.filter(entry => entry.userId === userId);
  
  if (since) {
    filtered = filtered.filter(entry => entry.timestamp >= since);
  }
  
  // Return most recent entries
  return filtered.slice(-limit);
}

/**
 * Get audit log for a bot
 */
export function getAuditLogByBot(
  botId: string,
  since?: Date,
  limit: number = 100
): AuditEntry[] {
  let filtered = auditLog.filter(entry => entry.botId === botId);
  
  if (since) {
    filtered = filtered.filter(entry => entry.timestamp >= since);
  }
  
  return filtered.slice(-limit);
}

/**
 * Get audit log by action type
 */
export function getAuditLogByAction(
  action: AuditActionType,
  since?: Date,
  limit: number = 100
): AuditEntry[] {
  let filtered = auditLog.filter(entry => entry.action === action);
  
  if (since) {
    filtered = filtered.filter(entry => entry.timestamp >= since);
  }
  
  return filtered.slice(-limit);
}

/**
 * Get security events (blocks, rate limits, etc.)
 */
export function getSecurityEvents(
  since?: Date,
  limit: number = 100
): AuditEntry[] {
  const securityActions: AuditActionType[] = [
    'blocked',
    'rate_limit',
    'input_sanitized',
    'output_filtered',
  ];
  
  let filtered = auditLog.filter(entry => 
    securityActions.includes(entry.action)
  );
  
  if (since) {
    filtered = filtered.filter(entry => entry.timestamp >= since);
  }
  
  return filtered.slice(-limit);
}

/**
 * Get statistics for a user
 */
export function getUserStats(userId: string, since?: Date): {
  totalMessages: number;
  totalToolCalls: number;
  totalErrors: number;
  totalBlocked: number;
  totalRateLimited: number;
  actionBreakdown: Record<AuditActionType, number>;
} {
  let entries = auditLog.filter(entry => entry.userId === userId);
  
  if (since) {
    entries = entries.filter(entry => entry.timestamp >= since);
  }
  
  const stats = {
    totalMessages: 0,
    totalToolCalls: 0,
    totalErrors: 0,
    totalBlocked: 0,
    totalRateLimited: 0,
    actionBreakdown: {} as Record<AuditActionType, number>,
  };
  
  for (const entry of entries) {
    // Count by action type
    stats.actionBreakdown[entry.action] = 
      (stats.actionBreakdown[entry.action] || 0) + 1;
    
    // Specific counters
    switch (entry.action) {
      case 'message':
        stats.totalMessages++;
        break;
      case 'tool_call':
        stats.totalToolCalls++;
        break;
      case 'error':
        stats.totalErrors++;
        break;
      case 'blocked':
        stats.totalBlocked++;
        break;
      case 'rate_limit':
        stats.totalRateLimited++;
        break;
    }
  }
  
  return stats;
}

/**
 * Sanitize sensitive data from details for logging
 */
function sanitizeDetailsForLogging(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(details)) {
    // Redact sensitive fields
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('secret')
    ) {
      sanitized[key] = '[YOUR_SECRET]';
    } else if (typeof value === 'string' && value.length > 500) {
      // Truncate long strings
      sanitized[key] = value.substring(0, 500) + '... [truncated]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Export audit log to JSON (for backup/analysis)
 */
export function exportAuditLog(
  since?: Date,
  until?: Date
): string {
  let filtered = auditLog;
  
  if (since) {
    filtered = filtered.filter(entry => entry.timestamp >= since);
  }
  
  if (until) {
    filtered = filtered.filter(entry => entry.timestamp <= until);
  }
  
  return JSON.stringify(filtered, null, 2);
}

/**
 * Clear audit log (admin function - use with caution)
 */
export function clearAuditLog(userId?: string): number {
  if (userId) {
    const initialLength = auditLog.length;
    const filtered = auditLog.filter(entry => entry.userId !== userId);
    auditLog.length = 0;
    auditLog.push(...filtered);
    return initialLength - auditLog.length;
  } else {
    const count = auditLog.length;
    auditLog.length = 0;
    return count;
  }
}

/**
 * Log a message event
 */
export function logMessage(
  userId: string,
  botId: string,
  message: string,
  ip?: string
): void {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'message',
    details: {
      messageLength: message.length,
      messagePreview: message.substring(0, 100),
    },
    ip,
  });
}

/**
 * Log a tool call event
 */
export function logToolCall(
  userId: string,
  botId: string,
  toolName: string,
  args: Record<string, unknown>,
  ip?: string
): void {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'tool_call',
    details: {
      toolName,
      args: sanitizeDetailsForLogging(args),
    },
    ip,
  });
}

/**
 * Log a tool result event
 */
export function logToolResult(
  userId: string,
  botId: string,
  toolName: string,
  success: boolean,
  error?: string,
  ip?: string
): void {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'tool_result',
    details: {
      toolName,
      success,
      error,
    },
    ip,
  });
}

/**
 * Log an error event
 */
export function logError(
  userId: string,
  botId: string,
  error: Error | string,
  context?: Record<string, unknown>,
  ip?: string
): void {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'error',
    details: {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    },
    ip,
  });
}

/**
 * Log a rate limit event
 */
export function logRateLimit(
  userId: string,
  botId: string,
  reason: string,
  ip?: string
): void {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'rate_limit',
    details: {
      reason,
    },
    ip,
  });
}

/**
 * Log a blocked event
 */
export function logBlocked(
  userId: string,
  botId: string,
  reason: string,
  details?: Record<string, unknown>,
  ip?: string
): void {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'blocked',
    details: {
      reason,
      ...details,
    },
    ip,
  });
}
