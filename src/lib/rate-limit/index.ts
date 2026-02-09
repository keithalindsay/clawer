/**
 * Redis-based rate limiter for CLAWER.AI
 */

import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis | null {
  // Return null if Redis URL not configured (stub mode)
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, rate limiting stubbed (always passes)');
    return null;
  }
  
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    
    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }
  
  return redis;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface RateLimitOptions {
  /**
   * Maximum requests allowed in the window
   */
  limit: number;
  
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  
  /**
   * Unique identifier for this rate limit (e.g., userId, IP)
   */
  identifier: string;
  
  /**
   * Namespace prefix for Redis keys
   */
  prefix?: string;
}

/**
 * Rate limit tiers
 */
export const RATE_LIMITS = {
  free: {
    requestsPerMinute: 20,
    messagesPerDay: 100,
    wsConnections: 1,
  },
  basic: {
    requestsPerMinute: 60,
    messagesPerDay: 500,
    wsConnections: 2,
  },
  pro: {
    requestsPerMinute: 120,
    messagesPerDay: 2000,
    wsConnections: 5,
  },
  enterprise: {
    requestsPerMinute: 300,
    messagesPerDay: -1, // Unlimited
    wsConnections: 10,
  },
} as const;

/**
 * Check rate limit using sliding window algorithm
 */
export async function checkRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const client = getRedisClient();
  
  // Stub mode - always allow if Redis not configured
  if (!client) {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      resetAt: new Date(Date.now() + options.windowSeconds * 1000),
    };
  }
  
  const { limit, windowSeconds, identifier, prefix = 'ratelimit' } = options;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  
  try {
    // Use Redis pipeline for atomic operations
    const pipeline = client.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count entries in current window
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}`);
    
    // Set expiry
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Pipeline execution failed');
    }
    
    // Get count from zcard result
    const count = (results[1][1] as number) || 0;
    const remaining = Math.max(0, limit - count - 1); // -1 for current request
    const allowed = count < limit;
    
    const resetAt = new Date(now + windowMs);
    
    return {
      allowed,
      limit,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    
    // Fail open - allow request if Redis fails
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      resetAt: new Date(Date.now() + options.windowSeconds * 1000),
    };
  }
}

/**
 * Get rate limit for user tier
 */
export function getRateLimitForTier(tier: keyof typeof RATE_LIMITS) {
  return RATE_LIMITS[tier] || RATE_LIMITS.free;
}

/**
 * Check rate limit for user request (per-minute limit)
 */
export async function checkUserRateLimit(
  userId: string,
  tier: keyof typeof RATE_LIMITS = 'free'
): Promise<RateLimitResult> {
  const limits = getRateLimitForTier(tier);
  
  return checkRateLimit({
    identifier: userId,
    limit: limits.requestsPerMinute,
    windowSeconds: 60,
    prefix: 'ratelimit:user',
  });
}

/**
 * Check daily message quota
 */
export async function checkMessageQuota(
  userId: string,
  tier: keyof typeof RATE_LIMITS = 'free'
): Promise<RateLimitResult> {
  const limits = getRateLimitForTier(tier);
  
  // Enterprise has unlimited messages
  if (limits.messagesPerDay === -1) {
    return {
      allowed: true,
      limit: -1,
      remaining: -1,
      resetAt: new Date(Date.now() + 86400000), // 24 hours
    };
  }
  
  return checkRateLimit({
    identifier: userId,
    limit: limits.messagesPerDay,
    windowSeconds: 86400, // 24 hours
    prefix: 'quota:messages',
  });
}

/**
 * Increment message count (call after successful message)
 */
export async function incrementMessageCount(userId: string): Promise<void> {
  const client = getRedisClient();
  
  if (!client) {
    return; // Stub mode
  }
  
  const key = `quota:messages:${userId}`;
  const now = Date.now();
  
  try {
    await client
      .pipeline()
      .zadd(key, now, `${now}`)
      .expire(key, 86400) // 24 hours
      .exec();
  } catch (error) {
    console.error('Failed to increment message count:', error);
  }
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// ============================================================================
// Free Tier In-Memory Rate Limiting (for shared container)
// ============================================================================

interface UsageRecord {
  count: number;
  resetAt: number;
}

// Daily usage tracking by user ID
const dailyUsage = new Map<string, UsageRecord>();

// IP signup tracking
const ipSignups = new Map<string, UsageRecord>();

/**
 * Track daily usage for a user
 */
export function trackDailyUsage(userId: string): void {
  const now = Date.now();
  const record = dailyUsage.get(userId);
  
  if (record && record.resetAt > now) {
    record.count++;
  } else {
    // Reset at midnight UTC
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    dailyUsage.set(userId, {
      count: 1,
      resetAt: tomorrow.getTime()
    });
  }
}

/**
 * Check if user has exceeded daily limit
 */
export function checkDailyLimit(userId: string, limit: number = 10): boolean {
  const now = Date.now();
  const record = dailyUsage.get(userId);
  
  if (!record || record.resetAt <= now) {
    return true; // No usage or expired record
  }
  
  return record.count < limit;
}

/**
 * Track IP address for signup rate limiting
 */
export function trackIPSignups(ip: string): void {
  const now = Date.now();
  const record = ipSignups.get(ip);
  
  if (record && record.resetAt > now) {
    record.count++;
  } else {
    // Reset after 24 hours
    const resetTime = now + (24 * 60 * 60 * 1000);
    ipSignups.set(ip, {
      count: 1,
      resetAt: resetTime
    });
  }
}

/**
 * Check if IP has exceeded signup limit
 */
export function checkIPLimit(ip: string, limit: number = 3): boolean {
  const now = Date.now();
  const record = ipSignups.get(ip);
  
  if (!record || record.resetAt <= now) {
    return true; // No signups or expired record
  }
  
  return record.count < limit;
}

/**
 * Get current daily usage count for a user
 */
export function getDailyUsageCount(userId: string): number {
  const now = Date.now();
  const record = dailyUsage.get(userId);
  
  if (!record || record.resetAt <= now) {
    return 0;
  }
  
  return record.count;
}
