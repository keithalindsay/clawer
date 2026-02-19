/**
 * Tests for src/lib/rate-limit/index.ts
 *
 * Focuses on the in-memory functions (no Redis required):
 *   - trackDailyUsage / checkDailyLimit / getDailyUsageCount
 *   - trackIPSignups / checkIPLimit
 *   - RATE_LIMITS constant values
 *
 * Redis-backed functions (checkRateLimit, checkUserRateLimit, checkMessageQuota)
 * stub out when REDIS_URL is not set, so we also verify the stub behaviour here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock ioredis so tests never hit a real Redis server ──────────────────────
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    pipeline: vi.fn(() => ({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 0], // zremrangebyscore
        [null, 0], // zcard  (count = 0 → allowed)
        [null, 1], // zadd
        [null, 1], // expire
      ]),
    })),
    zadd: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
  })),
}));

// ── Import the module under test ─────────────────────────────────────────────
import {
  RATE_LIMITS,
  trackDailyUsage,
  checkDailyLimit,
  getDailyUsageCount,
  trackIPSignups,
  checkIPLimit,
  checkUserRateLimit,
} from '@/lib/rate-limit';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a unique userId/IP per test to avoid shared-map state collisions. */
let counter = 0;
const uid = () => `user_test_${++counter}`;
const ip  = () => `192.168.1.${counter}`;

// ── checkDailyLimit() ─────────────────────────────────────────────────────────

describe('checkDailyLimit()', () => {
  it('returns true for an unknown userId (no previous usage)', () => {
    expect(checkDailyLimit(uid())).toBe(true);
  });

  it('returns true when usage count is below the limit', () => {
    const userId = uid();
    trackDailyUsage(userId); // count = 1
    expect(checkDailyLimit(userId, 5)).toBe(true);
  });

  it('returns false when usage count equals the limit', () => {
    const userId = uid();
    trackDailyUsage(userId); // count = 1
    expect(checkDailyLimit(userId, 1)).toBe(false); // count(1) < limit(1) is false
  });

  it('returns false when usage count exceeds the limit', () => {
    const userId = uid();
    trackDailyUsage(userId); // 1
    trackDailyUsage(userId); // 2
    trackDailyUsage(userId); // 3
    expect(checkDailyLimit(userId, 2)).toBe(false);
  });

  it('returns true when the usage record has expired (resetAt in the past)', () => {
    const userId = uid();

    // Advance time so any record set "now" appears expired
    const future = Date.now() + 200_000; // 200 s ahead
    vi.setSystemTime(future);

    // Create a record at the advanced time
    trackDailyUsage(userId);

    // Jump further ahead past the midnight reset boundary
    // The record's resetAt is set to tomorrow midnight UTC, so jump 2 full days
    vi.setSystemTime(future + 2 * 24 * 60 * 60 * 1000);

    expect(checkDailyLimit(userId, 1)).toBe(true); // expired → treated as no usage

    vi.useRealTimers();
  });
});

// ── trackDailyUsage() ─────────────────────────────────────────────────────────

describe('trackDailyUsage()', () => {
  it('creates a new record with count=1 for an unknown userId', () => {
    const userId = uid();
    expect(getDailyUsageCount(userId)).toBe(0); // not tracked yet

    trackDailyUsage(userId);

    expect(getDailyUsageCount(userId)).toBe(1);
  });

  it('increments count for an existing (non-expired) record', () => {
    const userId = uid();
    trackDailyUsage(userId); // 1
    trackDailyUsage(userId); // 2
    trackDailyUsage(userId); // 3

    expect(getDailyUsageCount(userId)).toBe(3);
  });

  it('resets counter when the existing record has expired', () => {
    const userId = uid();

    const now = Date.now();
    vi.setSystemTime(now);

    trackDailyUsage(userId); // count = 1 at "now"

    // Jump past midnight UTC reset
    vi.setSystemTime(now + 2 * 24 * 60 * 60 * 1000);

    trackDailyUsage(userId); // should reset to 1, not 2

    expect(getDailyUsageCount(userId)).toBe(1);

    vi.useRealTimers();
  });
});

// ── getDailyUsageCount() ──────────────────────────────────────────────────────

describe('getDailyUsageCount()', () => {
  it('returns 0 for an unknown userId', () => {
    expect(getDailyUsageCount(uid())).toBe(0);
  });

  it('returns the correct count for a tracked user', () => {
    const userId = uid();
    trackDailyUsage(userId);
    trackDailyUsage(userId);
    expect(getDailyUsageCount(userId)).toBe(2);
  });

  it('returns 0 when the record has expired', () => {
    const userId = uid();

    const now = Date.now();
    vi.setSystemTime(now);

    trackDailyUsage(userId);
    expect(getDailyUsageCount(userId)).toBe(1);

    // Jump past the resetAt boundary
    vi.setSystemTime(now + 2 * 24 * 60 * 60 * 1000);
    expect(getDailyUsageCount(userId)).toBe(0);

    vi.useRealTimers();
  });
});

// ── checkIPLimit() + trackIPSignups() ─────────────────────────────────────────

describe('checkIPLimit() / trackIPSignups()', () => {
  it('returns true (allowed) for a brand-new IP address', () => {
    expect(checkIPLimit(ip())).toBe(true);
  });

  it('allows up to the default limit (3) and blocks on the 3rd signup', () => {
    const testIp = ip();
    trackIPSignups(testIp); // 1
    trackIPSignups(testIp); // 2

    expect(checkIPLimit(testIp, 3)).toBe(true); // 2 < 3

    trackIPSignups(testIp); // 3

    expect(checkIPLimit(testIp, 3)).toBe(false); // 3 is NOT < 3
  });

  it('blocks when signup count exceeds the limit', () => {
    const testIp = ip();
    trackIPSignups(testIp); // 1
    trackIPSignups(testIp); // 2
    trackIPSignups(testIp); // 3
    trackIPSignups(testIp); // 4

    expect(checkIPLimit(testIp, 3)).toBe(false);
  });

  it('returns true again after the 24-hour window expires', () => {
    const testIp = ip();

    const now = Date.now();
    vi.setSystemTime(now);

    trackIPSignups(testIp);
    trackIPSignups(testIp);
    trackIPSignups(testIp); // count = 3 → blocked
    expect(checkIPLimit(testIp, 3)).toBe(false);

    // Advance past 24-hour window
    vi.setSystemTime(now + 25 * 60 * 60 * 1000); // 25 hours later

    expect(checkIPLimit(testIp, 3)).toBe(true); // record expired

    vi.useRealTimers();
  });
});

// ── RATE_LIMITS constants ─────────────────────────────────────────────────────

describe('RATE_LIMITS constants', () => {
  it('free tier has 20 requests per minute', () => {
    expect(RATE_LIMITS.free.requestsPerMinute).toBe(20);
  });

  it('free tier has 100 messages per day', () => {
    expect(RATE_LIMITS.free.messagesPerDay).toBe(100);
  });

  it('basic tier has 60 requests per minute', () => {
    expect(RATE_LIMITS.basic.requestsPerMinute).toBe(60);
  });

  it('basic tier has 500 messages per day', () => {
    expect(RATE_LIMITS.basic.messagesPerDay).toBe(500);
  });

  it('pro tier has 120 requests per minute', () => {
    expect(RATE_LIMITS.pro.requestsPerMinute).toBe(120);
  });

  it('pro tier has 2000 messages per day', () => {
    expect(RATE_LIMITS.pro.messagesPerDay).toBe(2000);
  });

  it('enterprise tier has 300 requests per minute', () => {
    expect(RATE_LIMITS.enterprise.requestsPerMinute).toBe(300);
  });

  it('enterprise tier has -1 (unlimited) messages per day', () => {
    expect(RATE_LIMITS.enterprise.messagesPerDay).toBe(-1);
  });

  it('enterprise has the highest rpm of all tiers', () => {
    expect(RATE_LIMITS.enterprise.requestsPerMinute).toBeGreaterThan(
      RATE_LIMITS.pro.requestsPerMinute,
    );
    expect(RATE_LIMITS.pro.requestsPerMinute).toBeGreaterThan(
      RATE_LIMITS.basic.requestsPerMinute,
    );
    expect(RATE_LIMITS.basic.requestsPerMinute).toBeGreaterThan(
      RATE_LIMITS.free.requestsPerMinute,
    );
  });
});

// ── checkUserRateLimit() — stub mode (no REDIS_URL) ───────────────────────────

describe('checkUserRateLimit() stub mode (REDIS_URL not set)', () => {
  beforeEach(() => {
    // Ensure REDIS_URL is not set so the module uses stub mode
    delete process.env.REDIS_URL;
  });

  it('returns allowed=true when Redis is not configured (fail-open)', async () => {
    const result = await checkUserRateLimit(uid(), 'free');
    expect(result.allowed).toBe(true);
  });

  it('returns correct limit for the given tier (free → 20)', async () => {
    const result = await checkUserRateLimit(uid(), 'free');
    expect(result.limit).toBe(20);
  });

  it('returns correct limit for pro tier (120)', async () => {
    const result = await checkUserRateLimit(uid(), 'pro');
    expect(result.limit).toBe(120);
  });

  it('returns a resetAt date in the future', async () => {
    const result = await checkUserRateLimit(uid(), 'basic');
    expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('includes remaining field', async () => {
    const result = await checkUserRateLimit(uid(), 'enterprise');
    expect(typeof result.remaining).toBe('number');
  });
});
