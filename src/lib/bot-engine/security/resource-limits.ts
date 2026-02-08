/**
 * Resource Limits - Enforce rate limits and resource constraints
 */

import { ExecutionContext } from '../types';
import { TIER_LIMITS } from './constants';

export interface ResourceLimits {
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxToolCallsPerRequest: number;
  maxConversationLength: number;
}

interface RateLimitData {
  requestsPerMinute: number;
  requestsPerDay: number;
  minuteResetAt: number;
  dayResetAt: number;
}

/**
 * In-memory rate limit store (use Redis in production)
 */
const rateLimitStore = new Map<string, RateLimitData>();

/**
 * Enforce resource limits for a request
 */
export function enforceResourceLimits(
  context: ExecutionContext,
  limits: ResourceLimits
): { allowed: boolean; reason?: string } {
  const userId = context.userId;
  const tier = context.tier;
  
  // Get limits for tier
  const tierLimits = limits || TIER_LIMITS[tier] || TIER_LIMITS.free;
  
  // Check conversation length
  if (context.conversationHistory.length > tierLimits.maxConversationLength) {
    return {
      allowed: false,
      reason: `Conversation too long. Maximum ${tierLimits.maxConversationLength} messages for ${tier} tier.`,
    };
  }
  
  // Check rate limits
  const rateLimitResult = checkRateLimits(userId, tierLimits);
  if (!rateLimitResult.allowed) {
    return rateLimitResult;
  }
  
  // Increment counters
  incrementRateLimits(userId);
  
  return { allowed: true };
}

/**
 * Check if user is within rate limits
 */
function checkRateLimits(
  userId: string,
  limits: ResourceLimits
): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const data = rateLimitStore.get(userId) || {
    requestsPerMinute: 0,
    requestsPerDay: 0,
    minuteResetAt: now + 60000,
    dayResetAt: now + 86400000,
  };
  
  // Reset counters if windows expired
  if (now >= data.minuteResetAt) {
    data.requestsPerMinute = 0;
    data.minuteResetAt = now + 60000;
  }
  
  if (now >= data.dayResetAt) {
    data.requestsPerDay = 0;
    data.dayResetAt = now + 86400000;
  }
  
  // Check per-minute limit
  if (data.requestsPerMinute >= limits.maxRequestsPerMinute) {
    const secondsRemaining = Math.ceil((data.minuteResetAt - now) / 1000);
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.maxRequestsPerMinute} requests per minute. Try again in ${secondsRemaining}s.`,
    };
  }
  
  // Check per-day limit (-1 means unlimited)
  if (limits.maxRequestsPerDay !== -1 && data.requestsPerDay >= limits.maxRequestsPerDay) {
    const hoursRemaining = Math.ceil((data.dayResetAt - now) / 3600000);
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${limits.maxRequestsPerDay} requests per day. Try again in ${hoursRemaining}h.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Increment rate limit counters
 */
function incrementRateLimits(userId: string): void {
  const now = Date.now();
  const data = rateLimitStore.get(userId) || {
    requestsPerMinute: 0,
    requestsPerDay: 0,
    minuteResetAt: now + 60000,
    dayResetAt: now + 86400000,
  };
  
  data.requestsPerMinute++;
  data.requestsPerDay++;
  
  rateLimitStore.set(userId, data);
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string, tier: string): {
  requestsPerMinute: number;
  requestsPerDay: number;
  limitsPerMinute: number;
  limitsPerDay: number;
} {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const data = rateLimitStore.get(userId) || {
    requestsPerMinute: 0,
    requestsPerDay: 0,
    minuteResetAt: Date.now() + 60000,
    dayResetAt: Date.now() + 86400000,
  };
  
  return {
    requestsPerMinute: data.requestsPerMinute,
    requestsPerDay: data.requestsPerDay,
    limitsPerMinute: limits.maxRequestsPerMinute,
    limitsPerDay: limits.maxRequestsPerDay,
  };
}

/**
 * Reset rate limits for a user (admin function)
 */
export function resetRateLimits(userId: string): void {
  rateLimitStore.delete(userId);
}
