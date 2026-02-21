import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────
// Module mocks (hoisted — must precede all imports)
// ──────────────────────────────────────────────

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
      users: { findFirst: vi.fn() },
      bots: { findFirst: vi.fn() },
      conversations: { findFirst: vi.fn() },
    },
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/container-client', () => ({
  containerApi: {
    chat: vi.fn(),
  },
}));

vi.mock('@/lib/router', () => ({
  routeRequest: vi.fn(),
}));

vi.mock('@/lib/teams', () => ({
  getTeamConfig: vi.fn(),
  getAgentFromTeam: vi.fn(),
  buildAgentSystemPrompt: vi.fn(),
}));

// ──────────────────────────────────────────────
// Imports (after mocks)
// ──────────────────────────────────────────────

import { POST } from '../chat/route';
import { auth } from '@clerk/nextjs/server';
import { checkUserRateLimit, trackDailyUsage, checkDailyLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { containerApi } from '@/lib/container-client';
import { routeRequest } from '@/lib/router';
import { getTeamConfig, getAgentFromTeam, buildAgentSystemPrompt } from '@/lib/teams';

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setupRateLimitPassed() {
  (checkUserRateLimit as any).mockResolvedValue({
    allowed: true,
    remaining: 99,
    limit: 100,
    resetAt: new Date(Date.now() + 3_600_000),
  });
}

function setupRateLimitFailed() {
  const resetAt = new Date(Date.now() + 30_000); // 30 seconds from now
  (checkUserRateLimit as any).mockResolvedValue({
    allowed: false,
    remaining: 0,
    limit: 100,
    resetAt,
  });
  return resetAt;
}

/** Queues two findFirst responses: tier-only record, then full user record. */
function setupFreeUserDB(overrides: Record<string, unknown> = {}) {
  const fullUser = {
    stripeSubscriptionId: null,
    containerPort: null,
    containerStatus: null,
    freeMessagesUsed: 0,
    teamTemplate: 'lifeos',
    name: 'Test User',
    ...overrides,
  };
  (db.query.users.findFirst as any)
    .mockResolvedValueOnce({ tier: 'free' }) // first call: tier check
    .mockResolvedValueOnce(fullUser);         // second call: full user
}

/** Queues two findFirst responses for a paid/pro user. */
function setupPaidUserDB(overrides: Record<string, unknown> = {}) {
  const fullUser = {
    stripeSubscriptionId: 'sub_123',
    containerPort: 4200,
    containerStatus: 'running',
    freeMessagesUsed: 50,
    teamTemplate: 'lifeos',
    name: 'Paid User',
    ...overrides,
  };
  (db.query.users.findFirst as any)
    .mockResolvedValueOnce({ tier: 'pro' }) // first call: tier check
    .mockResolvedValueOnce(fullUser);        // second call: full user
}

function setupContainerSuccess(content = 'Hello! How can I help?') {
  (containerApi.chat as any).mockResolvedValue({
    data: { content },
    error: null,
    status: 200,
  });
}

// ──────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default smart-router response
    (routeRequest as any).mockReturnValue({
      tier: 'SIMPLE',
      model: 'google/gemini-2.0-flash-lite',
      confidence: 0.95,
      signals: ['simple_greeting'],
    });

    // Default: daily limit is not hit, trackDailyUsage is a no-op
    (checkDailyLimit as any).mockReturnValue(true);
    (trackDailyUsage as any).mockReturnValue(undefined);

    // Default db.update chain (used for freeMessagesUsed increment)
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    // Default db.insert chain — supports both:
    //   db.insert(conversations).values({}).returning()   → returns array
    //   db.insert(messages).values([...])                 → return value unused
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: 'conv_new', userId: 'user_123', agentId: 'agent_1' },
        ]),
      }),
    });

    // Default: no existing agent conversation; a bot exists for the user
    (db.query.conversations.findFirst as any).mockResolvedValue(null);
    (db.query.bots.findFirst as any).mockResolvedValue({
      id: 'bot_123',
      userId: 'user_123',
    });

    // Default agent prompt builder response
    (buildAgentSystemPrompt as any).mockReturnValue('You are a helpful agent.');

    // Default container success response
    setupContainerSuccess();
  });

  // ──────────────────────────────────────────
  describe('Authentication & input validation', () => {
    it('1. returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('2. returns 400 when message is missing', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const res = await POST(buildRequest({}) as any);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/message/i);
    });

    it('3. returns 400 when message is not a string', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const res = await POST(buildRequest({ message: 123 }) as any);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/message/i);
    });

    it('4. returns 400 when message exceeds MAX_MESSAGE_LENGTH (32768 chars)', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const tooLong = 'a'.repeat(32_769);
      const res = await POST(buildRequest({ message: tooLong }) as any);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/too long/i);
    });

    it('5. strips null bytes from message before processing', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();

      const res = await POST(buildRequest({ message: 'hello\0world' }) as any);

      expect(res.status).toBe(200);
      // containerApi.chat must receive the sanitized string (no null bytes)
      expect(containerApi.chat).toHaveBeenCalled();
      const [, receivedMessage] = (containerApi.chat as any).mock.calls[0];
      expect(receivedMessage).toBe('helloworld');
    });
  });

  // ──────────────────────────────────────────
  describe('Rate limiting', () => {
    it('6. returns 429 with error=rate_limited when rate limit exceeded', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.users.findFirst as any).mockResolvedValueOnce({ tier: 'free' });
      setupRateLimitFailed();

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBe('rate_limited');
    });

    it('7. includes Retry-After header in rate-limited response', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.users.findFirst as any).mockResolvedValueOnce({ tier: 'free' });
      setupRateLimitFailed();

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      const retryAfter = res.headers.get('Retry-After');
      expect(retryAfter).toBeTruthy();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });

    it('8. includes X-RateLimit-Limit and X-RateLimit-Remaining headers when rate limited', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.users.findFirst as any).mockResolvedValueOnce({ tier: 'free' });
      setupRateLimitFailed();

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  // ──────────────────────────────────────────
  describe('Free tier — total message cap', () => {
    it('9. returns 403 with free_trial_exceeded when freeMessagesUsed >= 100', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB({ freeMessagesUsed: 100 });

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('free_trial_exceeded');
    });

    it('10. 403 response includes upgradeUrl, freeMessagesUsed, and freeMessageLimit', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB({ freeMessagesUsed: 100 });

      const res = await POST(buildRequest({ message: 'hello' }) as any);
      const data = await res.json();

      expect(data.upgradeUrl).toBe('/pricing');
      expect(data.freeMessagesUsed).toBe(100);
      expect(data.freeMessageLimit).toBe(100);
    });
  });

  // ──────────────────────────────────────────
  describe('Free tier — daily limit', () => {
    it('11. returns 429 with daily_limit_exceeded when daily limit is hit', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB({ freeMessagesUsed: 5 });
      (checkDailyLimit as any).mockReturnValue(false);

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBe('daily_limit_exceeded');
    });

    it('12. calls trackDailyUsage when daily limit is not hit', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();

      await POST(buildRequest({ message: 'hello' }) as any);

      expect(trackDailyUsage).toHaveBeenCalledWith('user_123');
    });

    it('13. routes free users to FREE_TIER_PORT (4000)', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();

      await POST(buildRequest({ message: 'hello' }) as any);

      expect(containerApi.chat).toHaveBeenCalled();
      const [port] = (containerApi.chat as any).mock.calls[0];
      expect(port).toBe(4000);
    });

    it('14. increments freeMessagesUsed counter on successful free-tier message', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();

      await POST(buildRequest({ message: 'hello' }) as any);

      expect(db.update).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  describe('Paid tier routing', () => {
    it('15. returns 503 when user has no containerPort', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupPaidUserDB({ containerPort: null });

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toMatch(/not provisioned/i);
    });

    it('16. returns 503 when containerStatus is not running', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupPaidUserDB({ containerStatus: 'stopped' });

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toMatch(/stopped/i);
    });

    it('17. routes paid users to their dedicated containerPort', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupPaidUserDB({ containerPort: 4200, containerStatus: 'running' });

      await POST(buildRequest({ message: 'hello' }) as any);

      expect(containerApi.chat).toHaveBeenCalled();
      const [port] = (containerApi.chat as any).mock.calls[0];
      expect(port).toBe(4200);
    });
  });

  // ──────────────────────────────────────────
  describe('Agent routing', () => {
    const mockAgent = {
      id: 'scout',
      name: 'Scout',
      role: 'Research',
      emoji: '🔍',
      description: 'Research agent',
      triggers: [],
    };
    const mockTeamConfig = { id: 'lifeos', name: 'Personal Assistant', agents: [mockAgent] };

    it('18. returns 404 when team template not found', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (getTeamConfig as any).mockReturnValue(null);

      const res = await POST(buildRequest({ message: 'hello', agentId: 'scout' }) as any);

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/team template/i);
    });

    it('19. returns 404 when agentId not found in team', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (getTeamConfig as any).mockReturnValue(mockTeamConfig);
      (getAgentFromTeam as any).mockReturnValue(null);

      const res = await POST(buildRequest({ message: 'hello', agentId: 'bad_agent' }) as any);

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/agent not found/i);
    });

    it('20. calls buildAgentSystemPrompt with agent, teamConfig, and user name', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB({ name: 'Alice' });
      (getTeamConfig as any).mockReturnValue(mockTeamConfig);
      (getAgentFromTeam as any).mockReturnValue(mockAgent);

      await POST(buildRequest({ message: 'hello', agentId: 'scout' }) as any);

      expect(buildAgentSystemPrompt).toHaveBeenCalledWith(mockAgent, mockTeamConfig, 'Alice');
    });

    it('21. creates new agent conversation when none exists', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (getTeamConfig as any).mockReturnValue(mockTeamConfig);
      (getAgentFromTeam as any).mockReturnValue(mockAgent);
      (db.query.conversations.findFirst as any).mockResolvedValue(null); // no existing conv

      await POST(buildRequest({ message: 'hello', agentId: 'scout' }) as any);

      // db.insert should have been called to create the new conversation
      expect(db.insert).toHaveBeenCalled();
    });

    it('22. uses existing agent conversation when found', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (getTeamConfig as any).mockReturnValue(mockTeamConfig);
      (getAgentFromTeam as any).mockReturnValue(mockAgent);
      (db.query.conversations.findFirst as any).mockResolvedValue({
        id: 'conv_existing',
        userId: 'user_123',
        agentId: 'scout',
      });

      const res = await POST(buildRequest({ message: 'hello', agentId: 'scout' }) as any);
      const data = await res.json();

      expect(data.conversationId).toBe('conv_existing');
    });

    it('23. saves both user and assistant messages to DB after successful response', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (getTeamConfig as any).mockReturnValue(mockTeamConfig);
      (getAgentFromTeam as any).mockReturnValue(mockAgent);
      // Use an existing conversation so conversationId is set
      (db.query.conversations.findFirst as any).mockResolvedValue({
        id: 'conv_123',
        userId: 'user_123',
        agentId: 'scout',
      });
      setupContainerSuccess('Great answer!');

      await POST(buildRequest({ message: 'test message', agentId: 'scout' }) as any);

      // db.insert should be called (for messages persistence)
      expect(db.insert).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  describe('Success path', () => {
    it('24. calls containerApi.chat with port, sanitized message, context, settings+routing, and token', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();

      await POST(buildRequest({ message: 'hello', context: { history: [] } }) as any);

      expect(containerApi.chat).toHaveBeenCalled();
      const [port, msg, , settings] = (containerApi.chat as any).mock.calls[0];
      expect(port).toBe(4000);                          // FREE_TIER_PORT
      expect(msg).toBe('hello');                        // sanitized message
      expect(settings).toMatchObject({                  // routing fields merged into settings
        model: 'google/gemini-2.0-flash-lite',
        tier: 'SIMPLE',
        confidence: 0.95,
      });
    });

    it('25. returns { content, routing } on success (conversationId present when agent used)', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      setupContainerSuccess('Here is the answer!');

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.content).toBe('Here is the answer!');
      // conversationId is undefined (no agentId) so it's omitted from JSON
      expect(data.conversationId).toBeUndefined();
      expect(data).toHaveProperty('routing');
    });

    it('26. returns container error with original status code', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (containerApi.chat as any).mockResolvedValue({
        error: 'Model overloaded',
        status: 503,
        data: null,
      });

      const res = await POST(buildRequest({ message: 'hello' }) as any);

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toBe('Model overloaded');
    });

    it('27. routing object includes tier, model, and confidence', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      setupRateLimitPassed();
      setupFreeUserDB();
      (routeRequest as any).mockReturnValue({
        tier: 'COMPLEX',
        model: 'google/gemini-3-flash',
        confidence: 0.85,
        signals: ['complex_reasoning'],
      });

      const res = await POST(buildRequest({ message: 'analyze this carefully' }) as any);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.routing).toEqual({
        tier: 'COMPLEX',
        model: 'google/gemini-3-flash',
        confidence: 0.85,
      });
    });
  });
});
