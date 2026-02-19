import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      botSettings: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock drizzle-orm eq (used in source, not tested directly)
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

// Mock schema objects (used as arguments to mocked db functions)
vi.mock('@/lib/db/schema/users', () => ({
  users: {},
}));

vi.mock('@/lib/db/schema/bot-settings', () => ({
  botSettings: {},
}));

import { POST } from '../onboarding/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// Helper: build a mock onboarding POST request
function buildRequest(body: object) {
  return new Request('http://localhost/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/onboarding', () => {
  // Tracked chain mocks, recreated each test
  let mockWhere: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;
  let mockValues: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-setup chainable db.update mock: db.update(...).set(...).where(...)
    mockWhere = vi.fn().mockResolvedValue(undefined);
    mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    (db.update as any).mockReturnValue({ set: mockSet });

    // Re-setup chainable db.insert mock: db.insert(...).values(...)
    mockValues = vi.fn().mockResolvedValue(undefined);
    (db.insert as any).mockReturnValue({ values: mockValues });
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const response = await POST(buildRequest({ botName: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('calls INSERT when no existing botSettings record (new user)', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_new' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const response = await POST(buildRequest({ botName: 'MyBot' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalled();
  });

  it('calls UPDATE when botSettings record already exists', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_existing' });
    (db.query.botSettings.findFirst as any).mockResolvedValue({ id: 1, userId: 'user_existing' });

    const response = await POST(buildRequest({ botName: 'UpdatedBot' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it('maps communicationStyle "casual" to correct personality', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ communicationStyle: 'casual' }));

    // INSERT path: mockValues receives the full settings object
    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.personality).toBe('friendly, relaxed, uses emojis, approachable');
  });

  it('maps communicationStyle "professional" to correct personality', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ communicationStyle: 'professional' }));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.personality).toBe('clear, polished, business-appropriate, concise');
  });

  it('maps communicationStyle "technical" to correct personality', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ communicationStyle: 'technical' }));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.personality).toBe('precise, detailed, technical, no fluff');
  });

  it('defaults to "helpful and friendly" for unknown communicationStyle', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ communicationStyle: 'vibes-only' }));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.personality).toBe('helpful and friendly');
  });

  it('defaults botName to "Assistant" when not provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({}));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.botName).toBe('Assistant');
  });

  it('uses provided botName when given', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ botName: 'Aria' }));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.botName).toBe('Aria');
  });

  it('defaults botAvatar to "🤖" when no emoji provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({}));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.botAvatar).toBe('🤖');
  });

  it('uses provided botEmoji as botAvatar', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ botEmoji: '🦊' }));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.botAvatar).toBe('🦊');
  });

  it('stores channels array in additionalSettings', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ channels: ['slack', 'telegram'] }));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.additionalSettings).toEqual({ channels: ['slack', 'telegram'] });
  });

  it('stores empty channels array when channels not provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({}));

    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.additionalSettings).toEqual({ channels: [] });
  });

  it('saves teamTemplate to users table when provided as string', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ teamTemplate: 'solopreneur' }));

    // db.update is called for users table — find the call that includes teamTemplate
    const updateCalls = mockSet.mock.calls;
    const userUpdateCall = updateCalls.find((args: any[]) => 'teamTemplate' in args[0]);
    expect(userUpdateCall).toBeDefined();
    expect(userUpdateCall![0].teamTemplate).toBe('solopreneur');
  });

  it('does not save teamTemplate when it is not a string', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({ teamTemplate: 42 }));

    // None of the set() calls should include teamTemplate
    const updateCalls = mockSet.mock.calls;
    const hasTeamTemplate = updateCalls.some((args: any[]) => 'teamTemplate' in args[0]);
    expect(hasTeamTemplate).toBe(false);
  });

  it('sets onboardingCompleted=1 in users table', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    await POST(buildRequest({}));

    // At least one of the set() calls should contain onboardingCompleted: 1
    const updateCalls = mockSet.mock.calls;
    const userUpdateCall = updateCalls.find((args: any[]) => 'onboardingCompleted' in args[0]);
    expect(userUpdateCall).toBeDefined();
    expect(userUpdateCall![0].onboardingCompleted).toBe(1);
  });

  it('returns { success: true } with status 200', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockResolvedValue(null);

    const response = await POST(buildRequest({ botName: 'Test', communicationStyle: 'casual' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 when DB throws an error', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (db.query.botSettings.findFirst as any).mockRejectedValue(new Error('DB connection failed'));

    const response = await POST(buildRequest({ botName: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('UPDATE path also sets onboardingCompleted in users table', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_existing' });
    (db.query.botSettings.findFirst as any).mockResolvedValue({ id: 1, userId: 'user_existing' });

    await POST(buildRequest({ botName: 'UpdatedBot', communicationStyle: 'professional' }));

    // Both botSettings update and users update should have happened
    expect(db.update).toHaveBeenCalledTimes(2);

    const userUpdateCall = mockSet.mock.calls.find((args: any[]) => 'onboardingCompleted' in args[0]);
    expect(userUpdateCall).toBeDefined();
    expect(userUpdateCall![0].onboardingCompleted).toBe(1);
  });

  it('UPDATE path applies personality mapping correctly', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_existing' });
    (db.query.botSettings.findFirst as any).mockResolvedValue({ id: 1, userId: 'user_existing' });

    await POST(buildRequest({ communicationStyle: 'technical' }));

    // First set() call should be botSettings update with personality
    const botSettingsUpdate = mockSet.mock.calls[0][0];
    expect(botSettingsUpdate.personality).toBe('precise, detailed, technical, no fluff');
  });
});
