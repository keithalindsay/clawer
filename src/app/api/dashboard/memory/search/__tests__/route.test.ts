/**
 * Tests for Memory Search API
 * 
 * Tests the /api/dashboard/memory/search endpoint that uses OpenClaw CLI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/container-client', () => ({
  searchMemory: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { searchMemory } from '@/lib/container-client';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockSearchMemory = searchMemory as ReturnType<typeof vi.fn>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/dashboard/memory/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if query is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing or invalid query');
  });

  it('returns 400 if query is not a string', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: 123 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing or invalid query');
  });

  it('returns search results on success', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockSearchMemory.mockResolvedValue({
      results: [
        {
          content: 'User likes pizza',
          source: 'MEMORY.md',
          timestamp: '2024-02-22T12:00:00Z',
          score: 0.95,
        },
        {
          content: 'Favorite color is blue',
          source: 'memory/2024-02-22.md',
          timestamp: '2024-02-22T14:00:00Z',
          score: 0.87,
        },
      ],
      error: null,
    });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'user preferences' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].content).toBe('User likes pizza');
    expect(data.results[0].score).toBe(0.95);
    expect(data.error).toBeNull();
    expect(mockSearchMemory).toHaveBeenCalledWith('user-123', 'user preferences');
  });

  it('handles searchMemory error gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockSearchMemory.mockResolvedValue({
      results: [],
      error: 'Container not running',
    });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // Graceful error
    expect(data.results).toHaveLength(0);
    expect(data.error).toBe('Container not running');
  });

  it('trims query whitespace', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockSearchMemory.mockResolvedValue({
      results: [],
      error: null,
    });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: '  test query  ' }),
    });

    await POST(request);

    expect(mockSearchMemory).toHaveBeenCalledWith('user-123', 'test query');
  });

  it('handles empty results', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockSearchMemory.mockResolvedValue({
      results: [],
      error: null,
    });

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'nonexistent topic' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(0);
    expect(data.error).toBeNull();
  });

  it('returns 500 on unexpected error', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockSearchMemory.mockRejectedValue(new Error('Unexpected failure'));

    const request = new Request('http://localhost/api/dashboard/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.results).toHaveLength(0);
    expect(data.error).toBe('Unexpected failure');
  });
});
