import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth (POST allows anonymous, but GET/PATCH require admin)
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

// Mock DB insert
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { POST } from '../feedback/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRequest(body: object, headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

/** Mock a successful DB insert that returns a feedback record */
function mockSuccessfulInsert(overrides: Partial<any> = {}) {
  const record = {
    id: 1,
    userId: null,
    category: 'general',
    message: 'Test feedback',
    email: null,
    page: null,
    status: 'new',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  const mockReturning = vi.fn().mockResolvedValue([record]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  (db.insert as any).mockReturnValue({ values: mockValues });
  return { mockReturning, mockValues, record };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows authenticated users to submit feedback', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_auth_001' });
    const { record } = mockSuccessfulInsert({ userId: 'user_auth_001', category: 'general' });

    const req = buildRequest({ category: 'general', message: 'Great product!' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.feedback).toBeDefined();
  });

  it('allows anonymous users to submit feedback when email is provided', async () => {
    (auth as any).mockResolvedValue({ userId: null });
    mockSuccessfulInsert({ email: 'anon@example.com' });

    const req = buildRequest({
      category: 'feature_request',
      message: 'Please add dark mode',
      email: 'anon@example.com',
    });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 400 when anonymous user submits without email', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const req = buildRequest({ category: 'general', message: 'Anonymous with no email' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/email/i);
  });

  it('returns 400 when category is missing', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_auth_002' });

    const req = buildRequest({ message: 'Missing category' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/category/i);
  });

  it('returns 400 when message is missing', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_auth_003' });

    const req = buildRequest({ category: 'general' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/message/i);
  });

  it('returns 400 for an invalid category', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_auth_004' });

    const req = buildRequest({ category: 'invalid_category', message: 'Hello' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid category/i);
  });

  it('accepts all valid categories', async () => {
    const validCategories = ['feature_request', 'bug', 'skill_request', 'general'];

    for (const [i, category] of validCategories.entries()) {
      (auth as any).mockResolvedValue({ userId: `user_cat_${i}` });
      mockSuccessfulInsert({ category });

      const req = buildRequest({ category, message: `Feedback for ${category}` });
      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });

  it('saves feedback to DB with correct fields', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_save_001' });
    const { mockValues } = mockSuccessfulInsert({ userId: 'user_save_001' });

    const req = buildRequest({
      category: 'bug',
      message: '  Spaces around message  ',
      page: '/dashboard',
    });
    await POST(req as any);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_save_001',
        category: 'bug',
        message: 'Spaces around message', // trimmed
        page: '/dashboard',
        status: 'new',
      })
    );
  });

  it('saves email to DB when provided by anonymous user', async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const { mockValues } = mockSuccessfulInsert({ email: 'user@example.com' });

    const req = buildRequest({
      category: 'general',
      message: 'Hello from anonymous',
      email: '  user@example.com  ', // should be trimmed
    });
    await POST(req as any);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        email: 'user@example.com',
      })
    );
  });

  it('sets userId to null for anonymous submissions', async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const { mockValues } = mockSuccessfulInsert({ email: 'anon@test.com' });

    const req = buildRequest({
      category: 'feature_request',
      message: 'Add more features',
      email: 'anon@test.com',
    });
    await POST(req as any);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null })
    );
  });

  it('returns 429 when rate limit exceeded', async () => {
    // The route has a simple in-memory rate limiter: 10 submissions per hour
    // Use a unique identifier that we'll exhaust
    const userId = 'user_ratelimit_exhausted';
    (auth as any).mockResolvedValue({ userId });

    // Burn through the 10 allowed submissions
    for (let i = 0; i < 10; i++) {
      mockSuccessfulInsert();
      const req = buildRequest({ category: 'general', message: `Submission ${i}` });
      await POST(req as any);
    }

    // 11th submission should be rate-limited
    const req = buildRequest({ category: 'general', message: 'Over the limit' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toMatch(/rate limit/i);
  });

  it('returns { success: true, feedback: {...} } on success', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_shape_check' });
    const { record } = mockSuccessfulInsert({
      id: 42,
      userId: 'user_shape_check',
      category: 'general',
      message: 'Shape test',
      status: 'new',
    });

    const req = buildRequest({ category: 'general', message: 'Shape test' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.feedback).toBeDefined();
    expect(data.feedback.id).toBe(record.id);
    expect(data.feedback.category).toBe(record.category);
    expect(data.feedback.status).toBe('new');
  });

  it('returns 500 when DB insert throws', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_dberror' });

    const mockReturning = vi.fn().mockRejectedValue(new Error('DB connection lost'));
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as any).mockReturnValue({ values: mockValues });

    const req = buildRequest({ category: 'general', message: 'Trigger DB error' });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
