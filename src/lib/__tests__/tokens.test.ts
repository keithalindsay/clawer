/**
 * Tests for:
 *   - src/lib/tokens/index.ts  (calculateOET, getTokenLimit, calculateCost, checkRateLimit)
 *   - src/lib/tokens/constants.ts  (TOKEN_LIMITS, OET_WEIGHTS, RATE_LIMITS, MODEL_PRICING)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock DB (used by trackTokenUsage / getWeeklyUsage / checkRateLimit) ───────

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// ── Mock weekly-reset helpers ─────────────────────────────────────────────────

vi.mock('@/lib/tokens/weekly-reset', () => ({
  getCurrentWeekBoundaries: vi.fn(() => ({
    weekStart: new Date('2026-02-16T00:00:00Z'),
    weekEnd: new Date('2026-02-23T00:00:00Z'),
  })),
  getNextMonday: vi.fn(() => new Date('2026-02-23T00:00:00Z')),
  isNewWeek: vi.fn(() => false),
}));

// ── Mock drizzle-orm operators (used inside getOrCreateWeeklyUsage) ───────────

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
    and: vi.fn((...args: unknown[]) => args),
  };
});

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  calculateOET,
  getTokenLimit,
  calculateCost,
  checkRateLimit,
} from '@/lib/tokens';

import {
  TOKEN_LIMITS,
  OET_WEIGHTS,
  RATE_LIMITS,
  MODEL_PRICING,
} from '@/lib/tokens/constants';

import { db } from '@/lib/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Configure db.select() to simulate an existing weekly-usage record.
 */
function mockWeeklyUsageRecord(totalOet: number) {
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            userId: 'user_mock',
            weekStart: new Date('2026-02-16T00:00:00Z'),
            weekEnd: new Date('2026-02-23T00:00:00Z'),
            orchestratorInputTokens: 0,
            orchestratorOutputTokens: 0,
            workerInputTokens: 0,
            workerOutputTokens: 0,
            totalOet,
            estimatedCostUsd: '0.0000',
            requestCount: 0,
          },
        ]),
      }),
    }),
  });
}

// ── calculateOET() ─────────────────────────────────────────────────────────────

describe('calculateOET()', () => {
  it('orchestrator tokens have weight 1.0 (1000 orch + 0 worker = 1000)', () => {
    expect(calculateOET(1000, 0)).toBe(1000);
  });

  it('worker tokens have weight 0.15 (0 orch + 1000 worker = 150)', () => {
    expect(calculateOET(0, 1000)).toBe(150);
  });

  it('combines both: 1000 orch + 1000 worker = 1150', () => {
    expect(calculateOET(1000, 1000)).toBe(1150);
  });

  it('result is always an integer (Math.round applied)', () => {
    // 0 * 1.0 + 1 * 0.15 = 0.15 → rounds to 0
    const result = calculateOET(0, 1);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('handles zero inputs', () => {
    expect(calculateOET(0, 0)).toBe(0);
  });

  it('handles large numbers without floating-point errors', () => {
    const result = calculateOET(1_000_000, 1_000_000);
    expect(result).toBe(1_150_000);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ── getTokenLimit() ────────────────────────────────────────────────────────────

describe('getTokenLimit()', () => {
  it("returns 500,000 for 'free' tier", () => {
    expect(getTokenLimit('free')).toBe(500_000);
  });

  it("returns 3,750,000 for 'basic' tier", () => {
    expect(getTokenLimit('basic')).toBe(3_750_000);
  });

  it("returns 10,000,000 for 'pro' tier", () => {
    expect(getTokenLimit('pro')).toBe(10_000_000);
  });

  it("returns 25,000,000 for 'enterprise' tier", () => {
    expect(getTokenLimit('enterprise')).toBe(25_000_000);
  });

  it("falls back to free limit (500,000) for unknown tier", () => {
    // Cast to bypass TS — simulates a bad tier coming from DB
    expect(getTokenLimit('unknown' as any)).toBe(500_000);
  });
});

// ── calculateCost() ────────────────────────────────────────────────────────────

describe('calculateCost()', () => {
  it('orchestrator: 1M input tokens at $0.50/1M = $0.50', () => {
    const cost = calculateCost('orchestrator', 1_000_000, 0);
    expect(cost).toBeCloseTo(0.50, 6);
  });

  it('orchestrator: 1M output tokens at $3.00/1M = $3.00', () => {
    const cost = calculateCost('orchestrator', 0, 1_000_000);
    expect(cost).toBeCloseTo(3.00, 6);
  });

  it('worker (searchWorker): 1M input tokens at $0.05/1M = $0.05', () => {
    const cost = calculateCost('worker', 1_000_000, 0);
    expect(cost).toBeCloseTo(0.05, 6);
  });

  it('worker (searchWorker): 1M output tokens at $0.20/1M = $0.20', () => {
    const cost = calculateCost('worker', 0, 1_000_000);
    expect(cost).toBeCloseTo(0.20, 6);
  });

  it('zero tokens → $0 cost', () => {
    expect(calculateCost('orchestrator', 0, 0)).toBe(0);
    expect(calculateCost('worker', 0, 0)).toBe(0);
  });

  it('orchestrator combined: 1M input + 1M output = $3.50', () => {
    const cost = calculateCost('orchestrator', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(3.50, 6);
  });

  it('worker combined: 1M input + 1M output = $0.25', () => {
    const cost = calculateCost('worker', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.25, 6);
  });
});

// ── checkRateLimit() (token-based) ────────────────────────────────────────────

describe('checkRateLimit() (token-based)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns allowed=true when under 80% threshold', async () => {
    // free limit = 500_000; 50% used = 250_000
    mockWeeklyUsageRecord(250_000);

    const result = await checkRateLimit('user_free_under', 'free');

    expect(result.allowed).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('returns a warning when between 80% and 100%', async () => {
    // free limit = 500_000; 85% = 425_000
    mockWeeklyUsageRecord(425_000);

    const result = await checkRateLimit('user_free_warning', 'free');

    expect(result.allowed).toBe(true);
    expect(result.warning).toBeDefined();
    expect(typeof result.warning).toBe('string');
  });

  it('returns allowed=false when at or over 100%', async () => {
    // free limit = 500_000; 100% = 500_000
    mockWeeklyUsageRecord(500_000);

    const result = await checkRateLimit('user_free_exceeded', 'free');

    expect(result.allowed).toBe(false);
    expect(result.warning).toBeDefined();
  });

  it('returns allowed=false when over 100%', async () => {
    // free limit = 500_000; 110% = 550_000
    mockWeeklyUsageRecord(550_000);

    const result = await checkRateLimit('user_free_over', 'free');

    expect(result.allowed).toBe(false);
  });

  it('includes percentUsed as integer percentage', async () => {
    // 50% of free limit
    mockWeeklyUsageRecord(250_000);

    const result = await checkRateLimit('user_pct', 'free');

    expect(result.percentUsed).toBe(50);
  });

  it('includes tokensUsed matching the mock record totalOet', async () => {
    mockWeeklyUsageRecord(100_000);

    const result = await checkRateLimit('user_tok', 'free');

    expect(result.tokensUsed).toBe(100_000);
  });

  it('includes tokenLimit for the specified tier', async () => {
    mockWeeklyUsageRecord(0);

    const result = await checkRateLimit('user_lim', 'pro');

    expect(result.tokenLimit).toBe(10_000_000);
  });

  it('includes resetDate as a Date instance', async () => {
    mockWeeklyUsageRecord(0);

    const result = await checkRateLimit('user_date', 'basic');

    expect(result.resetDate).toBeInstanceOf(Date);
    expect(result.resetDate.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('creates a new weekly record when none exists (empty array from DB)', async () => {
    // Simulate no existing record → insert a new one
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // empty → create new
        }),
      }),
    });

    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            userId: 'user_new',
            weekStart: new Date('2026-02-16T00:00:00Z'),
            weekEnd: new Date('2026-02-23T00:00:00Z'),
            orchestratorInputTokens: 0,
            orchestratorOutputTokens: 0,
            workerInputTokens: 0,
            workerOutputTokens: 0,
            totalOet: 0,
            estimatedCostUsd: '0',
            requestCount: 0,
          },
        ]),
      }),
    });

    const result = await checkRateLimit('user_new', 'free');

    expect(result.allowed).toBe(true);
    expect(result.tokensUsed).toBe(0);
    expect(db.insert).toHaveBeenCalledOnce();
  });
});

// ── TOKEN_LIMITS constants integrity ─────────────────────────────────────────

describe('TOKEN_LIMITS constants', () => {
  it('all tiers have weeklyOet > 0', () => {
    for (const tier of ['free', 'basic', 'pro', 'enterprise'] as const) {
      expect(TOKEN_LIMITS[tier].weeklyOet).toBeGreaterThan(0);
    }
  });

  it('free tier has the lowest limit', () => {
    expect(TOKEN_LIMITS.free.weeklyOet).toBeLessThan(TOKEN_LIMITS.basic.weeklyOet);
  });

  it('enterprise has the highest limit', () => {
    expect(TOKEN_LIMITS.enterprise.weeklyOet).toBeGreaterThan(TOKEN_LIMITS.pro.weeklyOet);
  });

  it('tiers are ordered: free < basic < pro < enterprise', () => {
    expect(TOKEN_LIMITS.free.weeklyOet).toBeLessThan(TOKEN_LIMITS.basic.weeklyOet);
    expect(TOKEN_LIMITS.basic.weeklyOet).toBeLessThan(TOKEN_LIMITS.pro.weeklyOet);
    expect(TOKEN_LIMITS.pro.weeklyOet).toBeLessThan(TOKEN_LIMITS.enterprise.weeklyOet);
  });

  it('free tier limit is 500,000', () => {
    expect(TOKEN_LIMITS.free.weeklyOet).toBe(500_000);
  });

  it('basic tier limit is 3,750,000', () => {
    expect(TOKEN_LIMITS.basic.weeklyOet).toBe(3_750_000);
  });

  it('pro tier limit is 10,000,000', () => {
    expect(TOKEN_LIMITS.pro.weeklyOet).toBe(10_000_000);
  });

  it('enterprise tier limit is 25,000,000', () => {
    expect(TOKEN_LIMITS.enterprise.weeklyOet).toBe(25_000_000);
  });
});

// ── OET_WEIGHTS constants ─────────────────────────────────────────────────────

describe('OET_WEIGHTS constants', () => {
  it('orchestrator weight is 1.0', () => {
    expect(OET_WEIGHTS.orchestrator).toBe(1.0);
  });

  it('worker weight is 0.15', () => {
    expect(OET_WEIGHTS.worker).toBe(0.15);
  });
});

// ── RATE_LIMITS constants ─────────────────────────────────────────────────────

describe('RATE_LIMITS constants (tokens/constants.ts)', () => {
  it('warningThreshold is 0.80', () => {
    expect(RATE_LIMITS.warningThreshold).toBe(0.80);
  });

  it('hardLimit is 1.00', () => {
    expect(RATE_LIMITS.hardLimit).toBe(1.00);
  });

  it('maxTokensPerRequest is 100,000', () => {
    expect(RATE_LIMITS.maxTokensPerRequest).toBe(100_000);
  });

  it('warningThreshold < hardLimit', () => {
    expect(RATE_LIMITS.warningThreshold).toBeLessThan(RATE_LIMITS.hardLimit);
  });
});

// ── MODEL_PRICING constants ───────────────────────────────────────────────────

describe('MODEL_PRICING constants', () => {
  it('orchestrator input price is $0.50 per 1M tokens', () => {
    expect(MODEL_PRICING.orchestrator.input).toBe(0.50);
  });

  it('orchestrator output price is $3.00 per 1M tokens', () => {
    expect(MODEL_PRICING.orchestrator.output).toBe(3.00);
  });

  it('searchWorker input price is $0.05 per 1M tokens', () => {
    expect(MODEL_PRICING.searchWorker.input).toBe(0.05);
  });

  it('searchWorker output price is $0.20 per 1M tokens', () => {
    expect(MODEL_PRICING.searchWorker.output).toBe(0.20);
  });
});
