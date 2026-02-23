/**
 * Tests for skills API routes
 *
 * Covers:
 *  - GET /api/container/skills (list skills)
 *  - POST /api/container/skills/:id/enable (enable skill)
 *  - POST /api/container/skills/:id/disable (disable skill)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/db/schema', () => ({
  users: {},
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { GET } from '../route';
import { POST } from '../[skillId]/[action]/route';

// ─── Fetch mock ───────────────────────────────────────────────────────────────

let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> } = {
  ok: true,
  status: 200,
  json: async () => ({ available: [] }),
};

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async () => mockFetchResponse as Response);
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/container/skills', () => {
  it('returns 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const req = new NextRequest('http://localhost/api/container/skills');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if container not configured', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ 
        clerkId: 'user-123',
        containerPort: null,
        containerToken: null 
      }]),
    } as any);

    const req = new NextRequest('http://localhost/api/container/skills');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Container not configured');
  });

  it('proxies request to container and returns skills', async () => {
    const mockSkills = {
      available: [
        {
          skill_id: 'github',
          name: 'GitHub Operations',
          enabled: true,
        },
        {
          skill_id: 'slack',
          name: 'Slack Integration',
          enabled: false,
        },
      ],
    };

    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ 
        clerkId: 'user-123',
        containerPort: 4000,
        containerToken: 'test-token-123' 
      }]),
    } as any);

    mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => mockSkills,
    };

    const req = new NextRequest('http://localhost/api/container/skills');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.available).toHaveLength(2);
    expect(data.available[0].skill_id).toBe('github');

    // Verify fetch was called with correct params
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:4000/api/skills',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test-token-123',
        },
      })
    );
  });

  it('handles container errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ 
        clerkId: 'user-123',
        containerPort: 4000,
        containerToken: 'test-token-123' 
      }]),
    } as any);

    mockFetchResponse = {
      ok: false,
      status: 500,
      json: async () => ({}),
    };

    const req = new NextRequest('http://localhost/api/container/skills');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to fetch skills from container');
  });
});

describe('POST /api/container/skills/:id/:action', () => {
  it('returns 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const req = new NextRequest('http://localhost/api/container/skills/github/enable', {
      method: 'POST',
    });
    const res = await POST(req, { params: { skillId: 'github', action: 'enable' } });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid action', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ 
        clerkId: 'user-123',
        containerPort: 4000,
        containerToken: 'test-token-123' 
      }]),
    } as any);

    const req = new NextRequest('http://localhost/api/container/skills/github/invalid', {
      method: 'POST',
    });
    const res = await POST(req, { params: { skillId: 'github', action: 'invalid' as any } });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid action');
  });

  it('enables a skill successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ 
        clerkId: 'user-123',
        containerPort: 4000,
        containerToken: 'test-token-123' 
      }]),
    } as any);

    mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => ({ success: true, skill_id: 'github', enabled: true }),
    };

    const req = new NextRequest('http://localhost/api/container/skills/github/enable', {
      method: 'POST',
    });
    const res = await POST(req, { params: { skillId: 'github', action: 'enable' } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.enabled).toBe(true);

    // Verify fetch was called with correct params
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:4000/api/skills/github/enable',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123',
        }),
      })
    );
  });

  it('disables a skill successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ 
        clerkId: 'user-123',
        containerPort: 4000,
        containerToken: 'test-token-123' 
      }]),
    } as any);

    mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => ({ success: true, skill_id: 'github', enabled: false }),
    };

    const req = new NextRequest('http://localhost/api/container/skills/github/disable', {
      method: 'POST',
    });
    const res = await POST(req, { params: { skillId: 'github', action: 'disable' } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.enabled).toBe(false);
  });
});
