import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB — health check does a SELECT 1 probe
vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import { GET } from '../health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear PRODUCTION_SERVER so SSH check is skipped in all tests
    delete process.env.PRODUCTION_SERVER;
  });

  it('returns 200 with status "healthy" when DB is reachable', async () => {
    (db.execute as any).mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  it('does not require authentication', async () => {
    // No auth mock needed — the handler should run without any auth check
    (db.execute as any).mockResolvedValue([]);

    const response = await GET();

    // Route should respond (not throw, not redirect to login)
    expect(response.status).toBeLessThan(400);
  });

  it('includes required fields in the response', async () => {
    (db.execute as any).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('totalMs');
    expect(data).toHaveProperty('checks');
  });

  it('timestamp is a valid ISO 8601 string', async () => {
    (db.execute as any).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    const parsed = new Date(data.timestamp);
    expect(parsed.toISOString()).toBe(data.timestamp);
  });

  it('totalMs is a non-negative number', async () => {
    (db.execute as any).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(typeof data.totalMs).toBe('number');
    expect(data.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('includes database check result', async () => {
    (db.execute as any).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.checks).toHaveProperty('database');
    expect(data.checks.database).toHaveProperty('ok');
    expect(data.checks.database.ok).toBe(true);
  });

  it('returns 503 with status "degraded" when DB is unreachable', async () => {
    (db.execute as any).mockRejectedValue(new Error('Connection refused'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.checks.database.ok).toBe(false);
    expect(data.checks.database.error).toBe('Connection refused');
  });

  it('responds quickly (does not make external SSH calls when PRODUCTION_SERVER unset)', async () => {
    (db.execute as any).mockResolvedValue([]);

    const before = Date.now();
    const response = await GET();
    const elapsed = Date.now() - before;
    const data = await response.json();

    // No SSH check configured, so no productionServer key
    expect(data.checks).not.toHaveProperty('productionServer');
    // Should complete very fast (under 1s in unit tests)
    expect(elapsed).toBeLessThan(1000);
  });
});
