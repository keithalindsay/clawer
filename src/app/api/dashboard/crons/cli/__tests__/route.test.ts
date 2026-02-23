/**
 * Tests for CLI-based Cron Management API
 * 
 * Tests the /api/dashboard/crons/cli endpoints that use OpenClaw CLI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextResponse } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/container-client', () => ({
  listCrons: vi.fn(),
  addCron: vi.fn(),
  cronStatus: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { listCrons, addCron, cronStatus } from '@/lib/container-client';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockListCrons = listCrons as ReturnType<typeof vi.fn>;
const mockAddCron = addCron as ReturnType<typeof vi.fn>;
const mockCronStatus = cronStatus as ReturnType<typeof vi.fn>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/crons/cli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns crons and scheduler status on success', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockListCrons.mockResolvedValue({
      crons: [
        { id: 'cron-1', schedule: '0 2 * * *', command: 'echo test', enabled: true },
      ],
      error: null,
    });
    mockCronStatus.mockResolvedValue({
      running: true,
      jobsCount: 1,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.crons).toHaveLength(1);
    expect(data.crons[0].id).toBe('cron-1');
    expect(data.scheduler.running).toBe(true);
    expect(data.scheduler.jobsCount).toBe(1);
    expect(data.error).toBeNull();
  });

  it('handles listCrons error gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockListCrons.mockResolvedValue({
      crons: [],
      error: 'Container not found',
    });
    mockCronStatus.mockResolvedValue({
      running: false,
      jobsCount: 0,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.crons).toHaveLength(0);
    expect(data.error).toBe('Container not found');
  });

  it('includes scheduler error if cronStatus fails', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockListCrons.mockResolvedValue({
      crons: [{ id: 'cron-1', schedule: '0 2 * * *', command: 'test', enabled: true }],
      error: null,
    });
    mockCronStatus.mockResolvedValue({
      running: false,
      jobsCount: 0,
      error: 'Scheduler unavailable',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.error).toBe('Scheduler unavailable');
  });
});

describe('POST /api/dashboard/crons/cli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new Request('http://localhost/api/dashboard/crons/cli', {
      method: 'POST',
      body: JSON.stringify({ schedule: '0 2 * * *', command: 'echo test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if schedule is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });

    const request = new Request('http://localhost/api/dashboard/crons/cli', {
      method: 'POST',
      body: JSON.stringify({ command: 'echo test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 400 if command is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });

    const request = new Request('http://localhost/api/dashboard/crons/cli', {
      method: 'POST',
      body: JSON.stringify({ schedule: '0 2 * * *' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('adds cron job successfully', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockAddCron.mockResolvedValue({
      success: true,
      error: null,
    });

    const request = new Request('http://localhost/api/dashboard/crons/cli', {
      method: 'POST',
      body: JSON.stringify({ schedule: '0 2 * * *', command: 'echo test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAddCron).toHaveBeenCalledWith('user-123', '0 2 * * *', 'echo test');
  });

  it('handles addCron error', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockAddCron.mockResolvedValue({
      success: false,
      error: 'Invalid schedule format',
    });

    const request = new Request('http://localhost/api/dashboard/crons/cli', {
      method: 'POST',
      body: JSON.stringify({ schedule: 'invalid', command: 'echo test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid schedule format');
  });
});
