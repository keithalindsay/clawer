/**
 * Tests for src/lib/tokens/weekly-reset.ts
 * Uses vi.useFakeTimers() / vi.setSystemTime() to control the current date.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the db module so the module-level DATABASE_URL check doesn't throw.
// The pure date-utility functions we're testing never touch the database.
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Also stub out the schema imports that weekly-reset.ts pulls in at module level.
vi.mock('@/lib/db/schema/weekly-usage', () => ({
  weeklyUsage: {},
  usageHistory: {},
}));

import {
  getCurrentWeekBoundaries,
  getNextMonday,
  isNewWeek,
} from '../weekly-reset';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Freeze time to a specific UTC instant, run fn, then restore real timers. */
function withFakeTime<T>(isoDate: string, fn: () => T): T {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoDate));
  try {
    return fn();
  } finally {
    vi.useRealTimers();
  }
}

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentWeekBoundaries()
// ─────────────────────────────────────────────────────────────────────────────

describe('getCurrentWeekBoundaries()', () => {
  it('weekStart is Monday 00:00:00.000 UTC (mid-week call — Wednesday)', () => {
    withFakeTime('2026-02-18T10:30:00Z', () => {
      const { weekStart } = getCurrentWeekBoundaries();

      expect(weekStart.getUTCDay()).toBe(1); // 1 = Monday
      expect(weekStart.getUTCHours()).toBe(0);
      expect(weekStart.getUTCMinutes()).toBe(0);
      expect(weekStart.getUTCSeconds()).toBe(0);
      expect(weekStart.getUTCMilliseconds()).toBe(0);
      // 2026-02-18 (Wed) → week started on 2026-02-16 (Mon)
      expect(weekStart.toISOString()).toBe('2026-02-16T00:00:00.000Z');
    });
  });

  it('weekStart is Monday 00:00:00.000 UTC (called on Monday)', () => {
    withFakeTime('2026-02-16T05:00:00Z', () => {
      const { weekStart } = getCurrentWeekBoundaries();

      expect(weekStart.getUTCDay()).toBe(1);
      expect(weekStart.toISOString()).toBe('2026-02-16T00:00:00.000Z');
    });
  });

  it('weekStart is Monday 00:00:00.000 UTC (called on Sunday)', () => {
    withFakeTime('2026-02-22T23:00:00Z', () => {
      const { weekStart } = getCurrentWeekBoundaries();

      // Sunday belongs to the week that started on the previous Monday
      expect(weekStart.getUTCDay()).toBe(1);
      expect(weekStart.toISOString()).toBe('2026-02-16T00:00:00.000Z');
    });
  });

  it('weekEnd is the Sunday of the same week at 23:59:59.999 UTC', () => {
    withFakeTime('2026-02-18T10:30:00Z', () => {
      const { weekEnd } = getCurrentWeekBoundaries();

      expect(weekEnd.getUTCDay()).toBe(0); // 0 = Sunday
      expect(weekEnd.getUTCHours()).toBe(23);
      expect(weekEnd.getUTCMinutes()).toBe(59);
      expect(weekEnd.getUTCSeconds()).toBe(59);
      expect(weekEnd.getUTCMilliseconds()).toBe(999);
      expect(weekEnd.toISOString()).toBe('2026-02-22T23:59:59.999Z');
    });
  });

  it('weekEnd is 6 days after weekStart', () => {
    withFakeTime('2026-02-18T10:30:00Z', () => {
      const { weekStart, weekEnd } = getCurrentWeekBoundaries();

      const diffMs = weekEnd.getTime() - weekStart.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      // 6 days + 23:59:59.999 ≈ 6.9999... days
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThan(7);
    });
  });

  it('today falls within boundaries (weekStart <= now <= weekEnd)', () => {
    const nowISO = '2026-02-19T08:00:00Z'; // Thursday
    withFakeTime(nowISO, () => {
      const now = new Date(nowISO);
      const { weekStart, weekEnd } = getCurrentWeekBoundaries();

      expect(now.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
      expect(now.getTime()).toBeLessThanOrEqual(weekEnd.getTime());
    });
  });

  it('today falls within boundaries even when called on Monday at midnight', () => {
    const nowISO = '2026-02-16T00:00:00Z'; // Monday midnight
    withFakeTime(nowISO, () => {
      const now = new Date(nowISO);
      const { weekStart, weekEnd } = getCurrentWeekBoundaries();

      expect(now.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
      expect(now.getTime()).toBeLessThanOrEqual(weekEnd.getTime());
    });
  });

  it('today falls within boundaries when called on Sunday at 23:59', () => {
    const nowISO = '2026-02-22T23:59:00Z'; // Sunday just before midnight
    withFakeTime(nowISO, () => {
      const now = new Date(nowISO);
      const { weekStart, weekEnd } = getCurrentWeekBoundaries();

      expect(now.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
      expect(now.getTime()).toBeLessThanOrEqual(weekEnd.getTime());
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getNextMonday()
// ─────────────────────────────────────────────────────────────────────────────

describe('getNextMonday()', () => {
  it('returns next Monday for a mid-week date (Wednesday)', () => {
    withFakeTime('2026-02-18T10:30:00Z', () => {
      // Current week: Mon 2026-02-16 → next Monday is 2026-02-23
      const nextMonday = getNextMonday();

      expect(nextMonday.getUTCDay()).toBe(1); // Must be a Monday
      expect(nextMonday.toISOString()).toBe('2026-02-23T00:00:00.000Z');
    });
  });

  it('returns next Monday (7 days out) when called on a Monday', () => {
    withFakeTime('2026-02-16T00:00:00Z', () => {
      // Called on current Monday → returns the NEXT Monday (7 days later)
      const nextMonday = getNextMonday();

      expect(nextMonday.getUTCDay()).toBe(1); // Still a Monday
      expect(nextMonday.toISOString()).toBe('2026-02-23T00:00:00.000Z');
    });
  });

  it('time component is 00:00:00.000 UTC', () => {
    withFakeTime('2026-02-19T15:45:30Z', () => {
      const nextMonday = getNextMonday();

      expect(nextMonday.getUTCHours()).toBe(0);
      expect(nextMonday.getUTCMinutes()).toBe(0);
      expect(nextMonday.getUTCSeconds()).toBe(0);
      expect(nextMonday.getUTCMilliseconds()).toBe(0);
    });
  });

  it('returned date is always a Monday regardless of current day', () => {
    const days = [
      '2026-02-16T00:00:00Z', // Monday
      '2026-02-17T12:00:00Z', // Tuesday
      '2026-02-18T08:00:00Z', // Wednesday
      '2026-02-19T20:00:00Z', // Thursday
      '2026-02-20T04:00:00Z', // Friday
      '2026-02-21T16:00:00Z', // Saturday
      '2026-02-22T23:00:00Z', // Sunday
    ];

    days.forEach((isoDate) => {
      withFakeTime(isoDate, () => {
        const nextMonday = getNextMonday();
        expect(nextMonday.getUTCDay(), `getNextMonday() from ${isoDate} should be Monday`).toBe(1);
      });
    });
  });

  it('returned date is always in the future (after now)', () => {
    withFakeTime('2026-02-19T12:00:00Z', () => {
      const now = new Date('2026-02-19T12:00:00Z');
      const nextMonday = getNextMonday();

      expect(nextMonday.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isNewWeek()
// ─────────────────────────────────────────────────────────────────────────────

describe('isNewWeek()', () => {
  it('returns true when lastWeekStart is before the current Monday', () => {
    withFakeTime('2026-02-18T10:00:00Z', () => {
      // Current week started 2026-02-16; last recorded start is previous Monday
      const lastWeekStart = new Date('2026-02-09T00:00:00Z');
      expect(isNewWeek(lastWeekStart)).toBe(true);
    });
  });

  it('returns true when lastWeekStart is two weeks ago', () => {
    withFakeTime('2026-02-18T10:00:00Z', () => {
      const lastWeekStart = new Date('2026-02-02T00:00:00Z');
      expect(isNewWeek(lastWeekStart)).toBe(true);
    });
  });

  it('returns false when lastWeekStart IS the current Monday', () => {
    withFakeTime('2026-02-18T10:00:00Z', () => {
      // Current week started exactly 2026-02-16 00:00:00 UTC
      const lastWeekStart = new Date('2026-02-16T00:00:00Z');
      expect(isNewWeek(lastWeekStart)).toBe(false);
    });
  });

  it('returns false when called on Monday with lastWeekStart = today', () => {
    withFakeTime('2026-02-16T00:00:00Z', () => {
      // It IS Monday and lastWeekStart matches current weekStart → same week
      const lastWeekStart = new Date('2026-02-16T00:00:00Z');
      expect(isNewWeek(lastWeekStart)).toBe(false);
    });
  });

  it('returns true when lastWeekStart is from last week even mid-way through current week', () => {
    withFakeTime('2026-02-20T18:00:00Z', () => {
      // Friday of current week; last recorded start was previous Monday
      const lastWeekStart = new Date('2026-02-09T00:00:00Z');
      expect(isNewWeek(lastWeekStart)).toBe(true);
    });
  });
});
