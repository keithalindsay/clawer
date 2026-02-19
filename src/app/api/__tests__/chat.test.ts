/**
 * Tests for POST /api/chat
 * src/app/api/chat/route.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockUsersQuery,
  mockBotsQuery,
  mockConversationsQuery,
  mockUpdateSetWhere,
  mockUpdateSet,
  mockUpdate,
  mockInsertReturning,
  mockInsertValues,
  mockInsert,
} = vi.hoisted(() => {
  const mockUpdateSetWhere = vi.fn();
  const mockUpdateSet = vi.fn(() => ({ where: mockUpdateSetWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
  const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
  return {
    mockUsersQuery: vi.fn(),
    mockBotsQuery: vi.fn(),
    mockConversationsQuery: vi.fn(),
    mockUpdateSetWhere,
    mockUpdateSet,
    mockUpdate,
    mockInsertReturning,
    mockInsertValues,
    mockInsert,
  };
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkUserRateLimit: vi.fn(),
  trackDailyUsage: vi.fn(),
  checkDailyLimit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: mockUsersQuery },
      bots: { findFirst: mockBotsQuery },
      conversations: { findFirst: mockConversationsQuery },
    },
    update: mockUpdate,
    insert: mockInsert,
  },
}));

vi.mock('@/lib/container-client', () => ({
  containerApi: {
    chat: vi.fn(),
  },
}));

vi.mock('@/lib/router', () => ({
  routeRequest: vi.fn(() => ({
    tier: 'SIMPLE',
    model: 'google/gemini-2.0-flash-lite',
    confidence: 0.95,
    signals: ['simple_question'],
    costEstimate: 0.0001,
    baselineCost: 0.01,
    savings: 0.99,
    useOrchestrator: false,
  })),
}));

vi.mock('@/lib/teams', () => ({
  getTeamConfig: vi.fn(),
  getAgentFromTeam: vi.fn(),
  buildAgentSystemPrompt: vi.fn(() => 'You are Scout, a research agent.'),
}));

import { auth } from '@clerk/nextjs/server';
import { checkUserRateLimit, trackDailyUsage, checkDailyLimit } from '@/lib/rate-limit';
import { containerApi } from '@/lib/container-client';
import { getTeamConfig, getAgentFromTeam } from '@/lib/teams';
import { POST } from '../chat/route';

// Default mock returns
const DEFAULT_RATE_LIMIT_OK = {
  allowed: true,
  remaining: 99,
  limit: 100,
  resetAt: new Date(Date.now() + 60000),
};

const DEFAULT_FREE_USER = {
  id: 'user_123',
  tier: 'free',
  stripeSubscriptionId: null,
  containerPort: null,
  containerStatus: null,
  freeMessagesUsed: 0,
  teamTemplate: 'lifeos',
  name: 'Test User',
};

const DEFAULT_PAID_USER = {
  id: 'user_123',
  tier: 'pro',
  stripeSubscriptionId: 'sub_stripe_123',
  containerPort: 4100,
  containerStatus: 'running',
  freeMessagesUsed: 0,
  teamTemplate: 'lifeos',
  name: 'Test User',
};

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat — Authentication & validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it('returns 400 when message is missing', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const req = makeRequest({});
    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('returns 400 when message is not a string', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const req = makeRequest({ message: 42 });
    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('returns 400 when message exceeds MAX_MESSAGE_LENGTH (32768)', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const longMessage = 'a'.repeat(32769);
    const req = makeRequest({ message: longMessage });
    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/chat — Rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsersQuery.mockResolvedValue({ tier: 'free' });
  });

  it('returns 429 when rate limit exceeded', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (checkUserRateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 20,
      resetAt: new Date(Date.now() + 30000),
    });
    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(429);
  });

  it('429 response includes Retry-After header', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (checkUserRateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 20,
      resetAt: new Date(Date.now() + 30000),
    });
    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('429 response includes X-RateLimit headers', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (checkUserRateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 20,
      resetAt: new Date(Date.now() + 30000),
    });
    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
  });

  it('rate limited response has error=rate_limited', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (checkUserRateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 20,
      resetAt: new Date(Date.now() + 30000),
    });
    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    const body = await response.json();
    expect(body.error).toBe('rate_limited');
  });
});

describe('POST /api/chat — Free tier message cap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsersQuery.mockResolvedValue({ tier: 'free' });
    (checkUserRateLimit as any).mockResolvedValue(DEFAULT_RATE_LIMIT_OK);
  });

  it('returns 403 with free_trial_exceeded when freeMessagesUsed >= 200', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    // First call for tier check, second call for full user details
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({
        ...DEFAULT_FREE_USER,
        freeMessagesUsed: 200,
      });

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('free_trial_exceeded');
  });

  it('free_trial_exceeded response includes upgradeUrl', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER, freeMessagesUsed: 200 });

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    const body = await response.json();
    expect(body.upgradeUrl).toBe('/pricing');
  });

  it('returns 429 with daily_limit_exceeded when daily limit hit', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER, freeMessagesUsed: 5 });
    (checkDailyLimit as any).mockReturnValue(false);

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('daily_limit_exceeded');
  });

  it('calls trackDailyUsage when daily limit not hit', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER });
    (checkDailyLimit as any).mockReturnValue(true);
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Hello back!' },
      error: null,
      status: 200,
    });
    mockBotsQuery.mockResolvedValue({ id: 'bot_1', userId: 'user_123' });
    mockConversationsQuery.mockResolvedValue(null);
    mockInsertReturning.mockResolvedValue([{ id: 'conv_1' }]);
    mockUpdateSetWhere.mockResolvedValue(undefined);

    const req = makeRequest({ message: 'hello' });
    await POST(req as any);
    expect(trackDailyUsage).toHaveBeenCalledWith('user_123');
  });
});

describe('POST /api/chat — Paid tier routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkUserRateLimit as any).mockResolvedValue(DEFAULT_RATE_LIMIT_OK);
  });

  it('returns 503 when containerPort is null', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'pro' })
      .mockResolvedValueOnce({
        ...DEFAULT_PAID_USER,
        containerPort: null,
      });

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(503);
  });

  it('returns 503 when containerStatus is not running', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'pro' })
      .mockResolvedValueOnce({
        ...DEFAULT_PAID_USER,
        containerStatus: 'stopped',
      });

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(503);
  });
});

describe('POST /api/chat — Agent routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkUserRateLimit as any).mockResolvedValue(DEFAULT_RATE_LIMIT_OK);
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER });
    (checkDailyLimit as any).mockReturnValue(true);
  });

  it('returns 404 when agentId provided but team config not found', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (getTeamConfig as any).mockReturnValue(null);

    const req = makeRequest({ message: 'hello', agentId: 'researcher' });
    const response = await POST(req as any);
    expect(response.status).toBe(404);
  });

  it('returns 404 when agentId not found in team', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (getTeamConfig as any).mockReturnValue({
      name: 'Life OS',
      members: [{ id: 'researcher', name: 'Scout' }],
    });
    (getAgentFromTeam as any).mockReturnValue(null);

    const req = makeRequest({ message: 'hello', agentId: 'nonexistent' });
    const response = await POST(req as any);
    expect(response.status).toBe(404);
  });

  it('calls buildAgentSystemPrompt when valid agent provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const mockAgent = { id: 'researcher', name: 'Scout', role: 'Researcher', emoji: '🔬' };
    const mockTeam = { name: 'Life OS', members: [mockAgent] };
    (getTeamConfig as any).mockReturnValue(mockTeam);
    (getAgentFromTeam as any).mockReturnValue(mockAgent);
    mockConversationsQuery.mockResolvedValue(null);
    mockBotsQuery.mockResolvedValue({ id: 'bot_1', userId: 'user_123' });
    mockInsertReturning.mockResolvedValue([{ id: 'conv_agent_1' }]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Research complete!' },
      error: null,
      status: 200,
    });

    const { buildAgentSystemPrompt } = await import('@/lib/teams');
    const req = makeRequest({ message: 'research this', agentId: 'researcher' });
    await POST(req as any);
    expect(buildAgentSystemPrompt).toHaveBeenCalledWith(mockAgent, mockTeam, 'Test User');
  });

  it('saves user and assistant messages when conversationId exists', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    const mockAgent = { id: 'researcher', name: 'Scout', role: 'Researcher', emoji: '🔬' };
    const mockTeam = { name: 'Life OS', members: [mockAgent] };
    (getTeamConfig as any).mockReturnValue(mockTeam);
    (getAgentFromTeam as any).mockReturnValue(mockAgent);
    // Existing conversation
    mockConversationsQuery.mockResolvedValue({ id: 'conv_existing' });
    mockUpdateSetWhere.mockResolvedValue(undefined);
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Research done!' },
      error: null,
      status: 200,
    });
    mockInsertValues.mockResolvedValue(undefined);

    const req = makeRequest({ message: 'research this', agentId: 'researcher' });
    await POST(req as any);

    // messages.insert should have been called to save the conversation
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe('POST /api/chat — Success path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkUserRateLimit as any).mockResolvedValue(DEFAULT_RATE_LIMIT_OK);
    (checkDailyLimit as any).mockReturnValue(true);
    mockBotsQuery.mockResolvedValue({ id: 'bot_1', userId: 'user_123' });
    mockConversationsQuery.mockResolvedValue(null);
    mockInsertReturning.mockResolvedValue([{ id: 'conv_new' }]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
  });

  it('returns { content, conversationId, routing } on success', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER });
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Hello back!' },
      error: null,
      status: 200,
    });

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('content');
    expect(body).toHaveProperty('routing');
    expect(body.routing).toHaveProperty('tier');
    expect(body.routing).toHaveProperty('model');
    expect(body.routing).toHaveProperty('confidence');
  });

  it('strips null bytes from message before processing', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER });
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Response' },
      error: null,
      status: 200,
    });

    const req = makeRequest({ message: 'hello\0world' });
    await POST(req as any);

    // containerApi.chat should have been called with sanitized message (no null bytes)
    const chatCall = (containerApi.chat as any).mock.calls[0];
    expect(chatCall[1]).toBe('helloworld'); // null byte stripped
  });

  it('returns container error when result.error is set', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER });
    (containerApi.chat as any).mockResolvedValue({
      data: null,
      error: 'Model overloaded',
      status: 503,
    });

    const req = makeRequest({ message: 'hello' });
    const response = await POST(req as any);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Model overloaded');
  });

  it('routing object includes tier, model, confidence', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'free' })
      .mockResolvedValueOnce({ ...DEFAULT_FREE_USER });
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'ok' },
      error: null,
      status: 200,
    });

    const req = makeRequest({ message: 'test' });
    const response = await POST(req as any);
    const body = await response.json();
    expect(body.routing.tier).toBe('SIMPLE');
    expect(body.routing.model).toBe('google/gemini-2.0-flash-lite');
    expect(body.routing.confidence).toBe(0.95);
  });

  it('calls containerApi.chat with correct port for paid user', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    mockUsersQuery
      .mockResolvedValueOnce({ tier: 'pro' })
      .mockResolvedValueOnce({ ...DEFAULT_PAID_USER });
    (containerApi.chat as any).mockResolvedValue({
      data: { content: 'Pro response' },
      error: null,
      status: 200,
    });

    const req = makeRequest({ message: 'hello paid user' });
    await POST(req as any);

    const chatCall = (containerApi.chat as any).mock.calls[0];
    expect(chatCall[0]).toBe(4100); // containerPort
  });
});
