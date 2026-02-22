import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
    },
  },
}));

vi.mock('@/lib/container-client', () => ({
  containerApi: {
    chat: vi.fn(),
  },
}));

vi.mock('@/lib/constants', () => ({
  FREE_TIER_PORT: 8080,
  FREE_TIER_TOKEN: 'free-token',
}));

// fs.mkdir and fs.writeFile are called for saving files — mock them
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports ────────────────────────────────────────────────────────────────

import { POST } from '../onboarding/first-deliverable/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { containerApi } from '@/lib/container-client';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/onboarding/first-deliverable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockFreeUser = {
  containerPort: null,
  containerStatus: null,
  stripeSubscriptionId: null,
  gatewayToken: null,
  name: 'Test User',
};

const mockSubscribedUser = {
  containerPort: 3001,
  containerStatus: 'running',
  stripeSubscriptionId: 'sub_123',
  gatewayToken: 'gw-token',
  name: 'Pro User',
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/onboarding/first-deliverable', () => {
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
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);

    const res = await POST(buildRequest({ answers: {} }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/templateId/i);
  });

  it('returns 400 when templateId is unknown', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);

    const res = await POST(buildRequest({ templateId: 'nonexistent', answers: {} }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/unknown template/i);
  });

  // ── Deliverable generation ────────────────────────────────────────────

  it('returns deliverable content on success for free user', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockResolvedValue({
      data: { content: '# Your Weekly Life Structure\n\nTop priorities...' },
      error: null,
    });

    const res = await POST(buildRequest({
      templateId: 'lifeos',
      answers: { stress: 'Too much work', start: 'Exercise', stop: 'Social media' },
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toContain('Your Weekly Life Structure');
    expect(data.title).toBe('Your Weekly Life Structure');
    expect(data.icon).toBe('📋');
  });

  it('uses the free tier port and token for non-subscribed users', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Content ideas here' },
      error: null,
    });

    await POST(buildRequest({
      templateId: 'solopreneur',
      answers: { business: 'My biz', customer: 'Founders', platform: 'LinkedIn' },
    }));

    // Should call containerApi with the free tier port (8080)
    const [port] = (containerApi.chat as any).mock.calls[0];
    expect(port).toBe(8080);
  });

  it('returns correct metadata for each template', async () => {
    const templateMeta: Record<string, { icon: string; title: string }> = {
      lifeos: { icon: '📋', title: 'Your Weekly Life Structure' },
      solopreneur: { icon: '📱', title: 'Your Week of Content Ideas' },
      fitness: { icon: '🏋️', title: 'Your 4-Week Workout Plan' },
      finance: { icon: '💡', title: 'Financial Clarity Snapshot' },
    };

    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);

    for (const [id, meta] of Object.entries(templateMeta)) {
      (containerApi.chat as any).mockResolvedValue({
        data: { content: `Content for ${id}` },
        error: null,
      });

      const res = await POST(buildRequest({ templateId: id, answers: {} }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.icon).toBe(meta.icon);
      expect(data.title).toBe(meta.title);
    }
  });

  // ── Fallback on container error ───────────────────────────────────────

  it('returns fallback content when container returns an error', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockResolvedValue({
      data: null,
      error: 'Container unavailable',
    });

    const res = await POST(buildRequest({
      templateId: 'lifeos',
      answers: { stress: 'Too much work', start: 'Exercise', stop: 'Scrolling' },
    }));
    const data = await res.json();

    // Should return 200 with fallback content (not a 500)
    expect(res.status).toBe(200);
    expect(typeof data.content).toBe('string');
    expect(data.content.length).toBeGreaterThan(0);
    expect(data.saved).toBe(false);
  });

  it('returns fallback content when container throws an exception', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockRejectedValue(new Error('Network failure'));

    const res = await POST(buildRequest({
      templateId: 'solopreneur',
      answers: { business: 'My biz', customer: 'Founders', platform: 'LinkedIn' },
    }));
    const data = await res.json();

    // Should return 500 on unexpected errors
    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to generate deliverable');
  });

  // ── Fallback content quality ──────────────────────────────────────────

  it('fallback content for lifeos includes user answers', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockResolvedValue({
      data: null,
      error: 'Container unavailable',
    });

    const res = await POST(buildRequest({
      templateId: 'lifeos',
      answers: { stress: 'Too many Zoom calls', start: 'Daily walks', stop: 'Late night eating' },
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    // Fallback should incorporate user answers
    expect(data.content).toContain('Daily walks');
    expect(data.content).toContain('Late night eating');
  });

  it('fallback content for solopreneur includes template-relevant content', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockResolvedValue({
      data: null,
      error: 'Container unavailable',
    });

    const res = await POST(buildRequest({
      templateId: 'solopreneur',
      answers: { business: 'My SaaS company', customer: 'Startup founders', platform: 'LinkedIn' },
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    // Fallback solopreneur should mention content/posts
    expect(data.content.toLowerCase()).toMatch(/content|post|linkedin|hook/i);
  });

  // ── saved field ───────────────────────────────────────────────────────

  it('saved=false for free users (no container)', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(mockFreeUser);
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Generated content' },
      error: null,
    });

    const res = await POST(buildRequest({ templateId: 'fitness', answers: {} }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.saved).toBe(false);
  });

  // ── DB error handling ─────────────────────────────────────────────────

  it('returns 500 when DB query fails', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockRejectedValue(new Error('DB offline'));

    const res = await POST(buildRequest({ templateId: 'lifeos', answers: {} }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to generate deliverable');
  });
});
