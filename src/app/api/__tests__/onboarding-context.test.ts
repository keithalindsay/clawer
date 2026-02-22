import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────

import { POST } from '../onboarding/context/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/onboarding/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setupDbMock() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn(() => ({ where: mockWhere }));
  (db.update as any).mockReturnValue({ set: mockSet });
  return { mockSet, mockWhere };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/onboarding/context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth ──────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const res = await POST(buildRequest({ templateId: 'lifeos', answers: {} }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  // ── Validation ────────────────────────────────────────────────────────

  it('returns 400 when templateId is missing', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });

    const res = await POST(buildRequest({ answers: {} }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/templateId/i);
  });

  it('returns 400 when answers is missing', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });

    const res = await POST(buildRequest({ templateId: 'lifeos' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/answers/i);
  });

  // ── Success ───────────────────────────────────────────────────────────

  it('returns { success: true } with 200 on valid request', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    setupDbMock();

    const res = await POST(buildRequest({
      templateId: 'lifeos',
      answers: { stress: 'Too many meetings', start: 'Exercise' },
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('calls db.update to save context', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'solopreneur',
      answers: { business: 'My SaaS', customer: 'Founders', platform: 'LinkedIn' },
    }));

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
  });

  // ── Field mapping ─────────────────────────────────────────────────────

  it('maps templateId to teamTemplate in update data', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'fitness',
      answers: {},
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.teamTemplate).toBe('fitness');
  });

  it('maps solopreneur answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'solopreneur',
      answers: {
        business: 'My company',
        customer: 'Founders',
        platform: 'Twitter',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingBusiness).toBe('My company');
    expect(updateArg.onboardingCustomer).toBe('Founders');
    expect(updateArg.onboardingPlatform).toBe('Twitter');
  });

  it('maps lifeos answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'lifeos',
      answers: {
        stress: 'Overwhelmed',
        start: 'Meditation',
        stop: 'Late night scrolling',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingStress).toBe('Overwhelmed');
    expect(updateArg.onboardingStart).toBe('Meditation');
    expect(updateArg.onboardingStop).toBe('Late night scrolling');
  });

  it('maps fitness answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'fitness',
      answers: {
        goal: 'Build muscle',
        days: '4',
        restrictions: 'None',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingGoal).toBe('Build muscle');
    expect(updateArg.onboardingDays).toBe('4');
    expect(updateArg.onboardingRestrictions).toBe('None');
  });

  it('maps mom answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'mom',
      answers: {
        kids_ages: '4 and 7',
        schedule_complexity: 'Moderate (3-5)',
        pain_point: 'Pickups conflict with calls',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingKidsAges).toBe('4 and 7');
    expect(updateArg.onboardingScheduleComplexity).toBe('Moderate (3-5)');
    expect(updateArg.onboardingPainPoint).toBe('Pickups conflict with calls');
  });

  it('maps finance answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'finance',
      answers: {
        finance_goal: 'Save money',
        money_stress: 'Overspending',
        income_range: '$50k-$100k',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingFinanceGoal).toBe('Save money');
    expect(updateArg.onboardingMoneyStress).toBe('Overspending');
    expect(updateArg.onboardingIncomeRange).toBe('$50k-$100k');
  });

  it('maps ecommerce answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'ecommerce',
      answers: {
        product: 'Leather goods',
        competitor: 'RivalBrand.com',
        challenge: 'Traffic',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingProduct).toBe('Leather goods');
    expect(updateArg.onboardingCompetitor).toBe('RivalBrand.com');
    expect(updateArg.onboardingChallenge).toBe('Traffic');
  });

  it('maps growth-ops answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'growth-ops',
      answers: {
        stage: 'Seed',
        blocker: 'Low conversion rate',
        tried: 'Cold outreach',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingStage).toBe('Seed');
    expect(updateArg.onboardingBlocker).toBe('Low conversion rate');
    expect(updateArg.onboardingTried).toBe('Cold outreach');
  });

  it('maps content-creator answer keys to correct DB fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'content-creator',
      answers: {
        niche: 'Personal finance',
        platforms: 'YouTube,TikTok',
        best_content: 'Passive income video',
      },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingNiche).toBe('Personal finance');
    expect(updateArg.onboardingPlatforms).toBe('YouTube,TikTok');
    expect(updateArg.onboardingBestContent).toBe('Passive income video');
  });

  // ── preferredChannel ──────────────────────────────────────────────────

  it('saves preferredChannel when provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'lifeos',
      answers: {},
      preferredChannel: 'whatsapp',
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.preferredChannel).toBe('whatsapp');
  });

  it('does not set preferredChannel when not provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'lifeos',
      answers: {},
    }));

    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.preferredChannel).toBeUndefined();
  });

  // ── Error handling ────────────────────────────────────────────────────

  it('returns 500 when db.update throws', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.update as any).mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const res = await POST(buildRequest({
      templateId: 'lifeos',
      answers: { stress: 'Too much work' },
    }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to save context answers');
  });

  // ── Unknown answer keys ───────────────────────────────────────────────

  it('ignores unknown answer keys gracefully', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    // Should not throw when an unrecognized key is in answers
    const res = await POST(buildRequest({
      templateId: 'lifeos',
      answers: { unknown_key: 'some value', stress: 'Real stress' },
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    // Real key should still be mapped
    const updateArg = mockSet.mock.calls[0][0];
    expect(updateArg.onboardingStress).toBe('Real stress');
    // Unknown key should NOT appear in the update
    expect(updateArg.unknown_key).toBeUndefined();
  });

  it('skips empty answer values', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const { mockSet } = setupDbMock();

    await POST(buildRequest({
      templateId: 'lifeos',
      answers: { stress: '', start: 'Exercise' },
    }));

    const updateArg = mockSet.mock.calls[0][0];
    // Empty string answers should not be stored
    expect(updateArg.onboardingStress).toBeUndefined();
    expect(updateArg.onboardingStart).toBe('Exercise');
  });
});
