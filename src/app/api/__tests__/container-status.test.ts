/**
 * Tests for GET /api/container/status
 * src/app/api/container/status/route.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GET } from '../container/status/route';

describe('GET /api/container/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const req = new Request('http://localhost/api/container/status');
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 404 when user not found in DB', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(404);
  });

  it('returns containerStatus as status field', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: new Date(),
      containerId: 'abc123',
      tier: 'pro',
    });
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('running');
  });

  it('returns offline when containerStatus is null', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: null,
      containerCreatedAt: null,
      containerId: null,
      tier: 'free',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.status).toBe('offline');
  });

  it('calculates uptime when container is running', async () => {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: oneHourAgo,
      containerId: 'abc123',
      tier: 'pro',
    });
    const response = await GET();
    const body = await response.json();
    // Uptime should be approximately 3600 seconds (allow some drift)
    expect(body.uptime).toBeGreaterThan(3590);
    expect(body.uptime).toBeLessThan(3610);
  });

  it('returns uptime=0 when containerStatus is not running', async () => {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'stopped',
      containerCreatedAt: oneHourAgo,
      containerId: 'abc123',
      tier: 'free',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.uptime).toBe(0);
  });

  it('returns uptime=0 when containerCreatedAt is null', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: null,
      containerId: 'abc123',
      tier: 'pro',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.uptime).toBe(0);
  });

  it('maps free tier → Qwen3 14B', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'stopped',
      containerCreatedAt: null,
      containerId: null,
      tier: 'free',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.model).toBe('Qwen3 14B');
  });

  it('maps basic tier → Kimi Flash', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'stopped',
      containerCreatedAt: null,
      containerId: null,
      tier: 'basic',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.model).toBe('Kimi Flash');
  });

  it('maps pro tier → Claude Sonnet 4', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: new Date(),
      containerId: 'ctr_pro',
      tier: 'pro',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.model).toBe('Claude Sonnet 4');
  });

  it('maps enterprise tier → Claude Opus 4', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: new Date(),
      containerId: 'ctr_ent',
      tier: 'enterprise',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.model).toBe('Claude Opus 4');
  });

  it('maps unknown tier → Unknown', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: new Date(),
      containerId: null,
      tier: 'mystery_tier',
    });
    const response = await GET();
    const body = await response.json();
    expect(body.model).toBe('Unknown');
  });

  it('returns { status, model, uptime, containerId, tier }', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: 'user_123',
      containerStatus: 'running',
      containerCreatedAt: new Date(),
      containerId: 'ctr_abc',
      tier: 'pro',
    });
    const response = await GET();
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('model');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('containerId');
    expect(body).toHaveProperty('tier');
  });

  it('returns 500 on unexpected DB error', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.users.findFirst as any).mockRejectedValue(new Error('DB connection lost'));
    const response = await GET();
    expect(response.status).toBe(500);
  });
});
