import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from "next/server";

// ── Mocks (hoisted to top by vitest) ──────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      botSettings: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { POST } from '../onboarding/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default chain setup — restored fresh before every test
    (db.update as any).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    });
    (db.insert as any).mockReturnValue({
      values: vi.fn(),
    });
  });

  // ── 1. Auth ──────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const response = await POST(buildRequest({ botName: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  // ── 2. INSERT vs UPDATE ───────────────────────────────────────────────────

  it('calls INSERT botSettings when no existing record (new user)', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_new' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    const response = await POST(buildRequest({ botName: 'MyBot', botEmoji: '🚀' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_new', botName: 'MyBot', botAvatar: '🚀' })
    );
  });

  it('calls UPDATE botSettings when record already exists', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_existing' });
    (db.query.botSettings.findFirst as any).mockResolvedValue({ userId: 'user_existing' });

    const mockWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    (db.update as any).mockReturnValue({ set: mockSet });

    const response = await POST(buildRequest({ botName: 'UpdatedBot' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // INSERT should NOT be called for botSettings
    expect(db.insert).not.toHaveBeenCalled();
    // UPDATE called twice: once for botSettings, once for users
    expect(db.update).toHaveBeenCalledTimes(2);
    // First set() call is for botSettings
    expect(mockSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ botName: 'UpdatedBot' })
    );
  });

  // ── 3–6. Personality mapping & defaults ──────────────────────────────────

  it('maps communicationStyle "casual" to correct personality', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ communicationStyle: 'casual' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ personality: 'friendly, relaxed, uses emojis, approachable' })
    );
  });

  it('maps communicationStyle "professional" to correct personality', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ communicationStyle: 'professional' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ personality: 'clear, polished, business-appropriate, concise' })
    );
  });

  it('maps communicationStyle "technical" to correct personality', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ communicationStyle: 'technical' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ personality: 'precise, detailed, technical, no fluff' })
    );
  });

  it('maps unknown communicationStyle to "helpful and friendly"', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ communicationStyle: 'aggressive' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ personality: 'helpful and friendly' })
    );
  });

  it('defaults botName to "Assistant" when not provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ communicationStyle: 'casual' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ botName: 'Assistant' })
    );
  });

  it('defaults botAvatar to "🤖" when no emoji provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ botName: 'MyBot' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ botAvatar: '🤖' })
    );
  });

  // ── 7–8. teamTemplate handling ────────────────────────────────────────────

  it('saves teamTemplate to users table when provided as a string', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    (db.update as any).mockReturnValue({ set: mockSet });

    const response = await POST(buildRequest({ teamTemplate: 'solopreneur' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    // Last update call (users table) should contain teamTemplate
    const lastSetArg = (mockSet.mock.calls[mockSet.mock.calls.length - 1] as any)[0];
    expect(lastSetArg).toMatchObject({ teamTemplate: 'solopreneur' });
  });

  it('ignores teamTemplate when not a string (type safety)', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    (db.update as any).mockReturnValue({ set: mockSet });

    // teamTemplate is a number — should be ignored
    await POST(buildRequest({ teamTemplate: 42 }));

    const lastSetArg = (mockSet.mock.calls[mockSet.mock.calls.length - 1] as any)[0];
    expect(lastSetArg).not.toHaveProperty('teamTemplate');
  });

  // ── 9. onboardingCompleted ────────────────────────────────────────────────

  it('sets onboardingCompleted=1 in users table update', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    (db.update as any).mockReturnValue({ set: mockSet });

    await POST(buildRequest({ botName: 'MyBot' }));

    // The users-table update (last set() call) must include onboardingCompleted=1
    const lastSetArg = (mockSet.mock.calls[mockSet.mock.calls.length - 1] as any)[0];
    expect(lastSetArg).toMatchObject({ onboardingCompleted: 1 });
  });

  // ── 10. channels in additionalSettings ───────────────────────────────────

  it('stores channels array in additionalSettings', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    const channels = ['slack', 'telegram', 'whatsapp'];
    await POST(buildRequest({ botName: 'MyBot', channels }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ additionalSettings: { channels } })
    );
  });

  it('stores empty channels array when channels not provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const mockValues = vi.fn();
    (db.insert as any).mockReturnValue({ values: mockValues });

    await POST(buildRequest({ botName: 'MyBot' }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ additionalSettings: { channels: [] } })
    );
  });

  // ── 11. Success response ──────────────────────────────────────────────────

  it('returns { success: true } with 200 status on success', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const response = await POST(buildRequest({ botName: 'MyBot', communicationStyle: 'casual' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  // ── 12. Error handling ────────────────────────────────────────────────────

  it('returns 500 when DB throws an error', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockRejectedValue(
      new Error('Database unavailable')
    );

    const response = await POST(buildRequest({ botName: 'MyBot' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to save preferences');
  });
});
