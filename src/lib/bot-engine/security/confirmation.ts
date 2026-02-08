/**
 * Confirmation Flow - Require user confirmation for destructive actions
 */

import {
  CONFIRMATION_REQUIRED_TOOLS,
  CONFIRMATION_REQUIRED_PATTERNS,
  PENDING_ACTION_EXPIRATION_MS,
} from './constants';

export interface PendingAction {
  id: string;
  userId: string;
  action: string;
  params: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * In-memory pending actions store (use Redis in production)
 */
const pendingActions = new Map<string, PendingAction>();

/**
 * Check if a tool requires user confirmation
 */
export function requiresConfirmation(
  toolName: string,
  args: Record<string, unknown>
): boolean {
  // 1. Check if tool is in the explicit confirmation list
  if (CONFIRMATION_REQUIRED_TOOLS.includes(toolName)) {
    return true;
  }
  
  // 2. Check if tool name matches confirmation patterns
  for (const pattern of CONFIRMATION_REQUIRED_PATTERNS) {
    if (pattern.test(toolName)) {
      return true;
    }
  }
  
  // 3. Check for specific destructive parameters
  if (args.delete === true || args.permanent === true) {
    return true;
  }
  
  // 4. Special cases based on tool + params
  if (toolName === 'gmail_send' && args.to) {
    // Always confirm email sends
    return true;
  }
  
  if (toolName === 'calendar_create' && args.attendees) {
    // Confirm if inviting others
    return true;
  }
  
  if (toolName === 'drive_share' && args.anyone === true) {
    // Confirm public sharing
    return true;
  }
  
  return false;
}

/**
 * Store a pending action and return action ID
 */
export function storePendingAction(action: PendingAction): string {
  // Generate action ID if not provided
  if (!action.id) {
    action.id = generateActionId();
  }
  
  // Set expiration if not provided
  if (!action.expiresAt) {
    action.expiresAt = new Date(Date.now() + PENDING_ACTION_EXPIRATION_MS);
  }
  
  // Set creation time
  action.createdAt = new Date();
  
  // Store action
  pendingActions.set(action.id, action);
  
  // Clean up expired actions periodically
  cleanupExpiredActions();
  
  return action.id;
}

/**
 * Confirm a pending action
 */
export function confirmAction(
  actionId: string,
  userId: string
): { confirmed: boolean; action?: PendingAction; reason?: string } {
  const action = pendingActions.get(actionId);
  
  // Check if action exists
  if (!action) {
    return {
      confirmed: false,
      reason: 'Action not found or already expired',
    };
  }
  
  // Check if action belongs to user
  if (action.userId !== userId) {
    return {
      confirmed: false,
      reason: 'Action does not belong to this user',
    };
  }
  
  // Check if action has expired
  if (new Date() > action.expiresAt) {
    pendingActions.delete(actionId);
    return {
      confirmed: false,
      reason: 'Action has expired',
    };
  }
  
  // Remove from pending (action is now confirmed)
  pendingActions.delete(actionId);
  
  return {
    confirmed: true,
    action,
  };
}

/**
 * Cancel a pending action
 */
export function cancelAction(
  actionId: string,
  userId: string
): { cancelled: boolean; reason?: string } {
  const action = pendingActions.get(actionId);
  
  if (!action) {
    return {
      cancelled: false,
      reason: 'Action not found',
    };
  }
  
  if (action.userId !== userId) {
    return {
      cancelled: false,
      reason: 'Action does not belong to this user',
    };
  }
  
  pendingActions.delete(actionId);
  
  return {
    cancelled: true,
  };
}

/**
 * Get all pending actions for a user
 */
export function getPendingActions(userId: string): PendingAction[] {
  const now = new Date();
  const actions: PendingAction[] = [];
  
  for (const action of pendingActions.values()) {
    if (action.userId === userId && action.expiresAt > now) {
      actions.push(action);
    }
  }
  
  // Sort by creation time (newest first)
  return actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Generate a unique action ID
 */
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Clean up expired actions (run periodically)
 */
function cleanupExpiredActions(): void {
  const now = new Date();
  
  for (const [id, action] of pendingActions.entries()) {
    if (action.expiresAt < now) {
      pendingActions.delete(id);
    }
  }
}

/**
 * Format action for user confirmation message
 */
export function formatConfirmationMessage(action: PendingAction): string {
  const expiresIn = Math.ceil((action.expiresAt.getTime() - Date.now()) / 1000);
  const minutes = Math.floor(expiresIn / 60);
  const seconds = expiresIn % 60;
  
  let message = `⚠️ **Confirmation Required**\n\n`;
  message += `**Action:** ${action.action}\n`;
  message += `**Action ID:** ${action.id}\n\n`;
  
  // Format parameters in a readable way
  message += `**Details:**\n`;
  for (const [key, value] of Object.entries(action.params)) {
    message += `- ${key}: ${formatParamValue(value)}\n`;
  }
  
  message += `\n**This action will expire in ${minutes}m ${seconds}s**\n\n`;
  message += `To confirm, reply with: \`/confirm ${action.id}\`\n`;
  message += `To cancel, reply with: \`/cancel ${action.id}\``;
  
  return message;
}

/**
 * Format parameter value for display
 */
function formatParamValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 100 ? value.substring(0, 100) + '...' : value;
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2).substring(0, 200);
  }
  return String(value);
}

/**
 * Clear all pending actions for a user (admin function)
 */
export function clearPendingActions(userId: string): number {
  let count = 0;
  
  for (const [id, action] of pendingActions.entries()) {
    if (action.userId === userId) {
      pendingActions.delete(id);
      count++;
    }
  }
  
  return count;
}
