/**
 * Tests for GET /api/dashboard/crons
 * src/app/api/dashboard/crons/route.ts
 *
 * Read-only endpoint that returns cron job statuses and history for the
 * authenticated user. Phase 1 — no mutations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (must be before any imports of the mocked modules) ─────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// We use a factory so we can control the resolved values per-test.
// The DB mock exposes a chainable builder that resolves at .limit() or .orderBy().
const makeChain = (result: unknown[]) => ({
  from: () => ({
    where: () => ({
      orderBy: vi.fn().mockImplementation(() => ({
        // for history query (with .limit)
        limit: vi.fn().mockResolvedValue(result),
        // also resolve directly (for jobs query which has no .limit)
        then: (resolve: (v: unknown[]) => void) => resolve(result),
      })),
    }),
  }),
});

// Two separate select calls in the route: jobs (no .limit) and history (.limit)
let jobsResult: unknown[] = [];
let historyResult: unknown[] = [];

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Schema references only need to exist as objects
vi.mock('@/lib/db/schema/cron-job-status', () => ({
  cronJobStatus: { userId: 'userId', jobName: 'jobName' },
}));

vi.mock('@/lib/db/schema/agent-events', () => ({
  agentEvents: { userId: 'userId', eventType: 'eventType', createdAt: 'createdAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ eq: { col, val } })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  desc: vi.fn((col: unknown) => ({ desc: col })),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GET } from '../dashboard/crons/route';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_JOB = {
  id: 'job-uuid-1',
  userId: 'user_123',
  jobName: 'morning-briefing',
  schedule: '0 7 * * *',
  lastStatus: 'ok',
  lastRunAt: new Date('2026-02-22T07:00:00Z'),
  lastDurationMs: 4200,
  consecutiveErrors: 0,
  updatedAt: new Date('2026-02-22T07:00:05Z'),
};

const MOCK_EVENT = {
  id: 'evt-uuid-1',
  userId: 'user_123',
  eventType: 'cron_run',
  agentName: 'Lex',
  agentEmoji: '🤖',
  summary: 'morning-briefing completed successfully',
  details: { status: 'ok', durationMs: 4200 },
  createdAt: new Date('2026-02-22T07:00:05Z'),
};

// ─── Helper to wire up select mock ───────────────────────────────────────────

function setupSelectMock(jobs: unknown[], history: unknown[]) {
  let callCount = 0;
  (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
    callCount++;
    const isFirst = callCount === 1;
    if (isFirst) {
      // Jobs query — chain ends at .orderBy() resolving directly
      return {
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(jobs),
          }),
        }),
      };
    }
    // History query — chain ends at .limit()
    return {
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(history),
          }),
        }),
      }),
    };
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/crons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 200 with jobs and history arrays when authenticated', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    setupSelectMock([MOCK_JOB], [MOCK_EVENT]);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('jobs');
    expect(body).toHaveProperty('history');
    expect(Array.isArray(body.jobs)).toBe(true);
    expect(Array.isArray(body.history)).toBe(true);
  });

  it('returns empty arrays when no data exists', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    setupSelectMock([], []);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.jobs).toEqual([]);
    expect(body.history).toEqual([]);
  });

  it('returns jobs with expected fields present', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    setupSelectMock([MOCK_JOB], []);

    const response = await GET();
    const body = await response.json();

    expect(body.jobs.length).toBe(1);
    const job = body.jobs[0];
    expect(job).toHaveProperty('jobName');
    expect(job).toHaveProperty('schedule');
    expect(job).toHaveProperty('lastStatus');
    expect(job).toHaveProperty('consecutiveErrors');
  });

  it('returns history with event fields present', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    setupSelectMock([], [MOCK_EVENT]);

    const response = await GET();
    const body = await response.json();

    expect(body.history.length).toBe(1);
    const event = body.history[0];
    expect(event).toHaveProperty('summary');
    expect(event).toHaveProperty('agentName');
  });

  it('is a read-only endpoint — exports only GET', async () => {
    const module = await import('../dashboard/crons/route');
    expect(typeof module.GET).toBe('function');
    expect((module as any).POST).toBeUndefined();
    expect((module as any).PUT).toBeUndefined();
    expect((module as any).DELETE).toBeUndefined();
  });
});
