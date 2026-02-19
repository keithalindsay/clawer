import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    query: {
      conversations: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GET } from '../conversations/route';
import { DELETE, PATCH } from '../conversations/[id]/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a chainable mock for the main conversations select:
 * .select().from().leftJoin().where().orderBy().limit().offset() → Promise<rows>
 */
function makeConvoSelectMock(rows: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      leftJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(rows),
            }),
          }),
        }),
      }),
    }),
  };
}

/**
 * Build a chainable mock for the preview messages select:
 * .select().from().where().orderBy() → Promise<rows>
 */
function makePreviewSelectMock(rows: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

/**
 * Build a chainable mock for the count select:
 * .select().from().where() → Promise<[{ count: n }]>
 */
function makeCountSelectMock(count: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count }]),
    }),
  };
}

/** A sample conversation row returned by the DB */
function makeConvoRow(overrides: Partial<any> = {}) {
  return {
    id: 'conv_abc123',
    title: 'Test Conversation',
    messageCount: 5,
    lastMessageAt: new Date('2024-06-01T12:00:00Z'),
    createdAt: new Date('2024-06-01T10:00:00Z'),
    metadata: null,
    botId: null,
    botName: null,
    botType: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/conversations ──────────────────────────────────────────────────

  describe('GET /api/conversations', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const req = new Request('http://localhost:3000/api/conversations');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns a list of conversations with correct shape', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const row = makeConvoRow();

      // Call 1: main convos
      (db.select as any).mockImplementationOnce(() => makeConvoSelectMock([row]));
      // Call 2: preview messages (one convo → query runs)
      (db.select as any).mockImplementationOnce(() =>
        makePreviewSelectMock([{ conversationId: 'conv_abc123', content: 'Hello world' }])
      );
      // Call 3: total count
      (db.select as any).mockImplementationOnce(() => makeCountSelectMock(1));

      const req = new Request('http://localhost:3000/api/conversations');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.conversations)).toBe(true);
      expect(data.conversations).toHaveLength(1);

      const convo = data.conversations[0];
      expect(convo.id).toBe('conv_abc123');
      expect(convo.title).toBe('Test Conversation');
      expect(convo.messageCount).toBe(5);
      expect(convo.preview).toBe('Hello world');
      expect(typeof convo.lastMessageAt).toBe('string'); // ISO string
      expect(typeof convo.createdAt).toBe('string');
      expect(convo.starred).toBe(false);
      expect(convo.platform).toBe('web');
    });

    it('returns empty conversations list when none exist', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      // Call 1: no convos (skips preview query)
      (db.select as any).mockImplementationOnce(() => makeConvoSelectMock([]));
      // Call 2: count (no preview query when convoIds is empty)
      (db.select as any).mockImplementationOnce(() => makeCountSelectMock(0));

      const req = new Request('http://localhost:3000/api/conversations');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversations).toHaveLength(0);
    });

    it('returns correct pagination info', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      (db.select as any).mockImplementationOnce(() => makeConvoSelectMock([]));
      (db.select as any).mockImplementationOnce(() => makeCountSelectMock(42));

      const req = new Request('http://localhost:3000/api/conversations?page=2&limit=10');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(42);
      expect(data.pagination.totalPages).toBe(5); // ceil(42/10)
    });

    it('caps limit at 50', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      (db.select as any).mockImplementationOnce(() => makeConvoSelectMock([]));
      (db.select as any).mockImplementationOnce(() => makeCountSelectMock(0));

      // Request limit=200, should be capped at 50
      const req = new Request('http://localhost:3000/api/conversations?limit=200');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(50);
    });

    it('returns conversations with bot info when available', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const row = makeConvoRow({
        botId: 'bot_abc',
        botName: 'Research Bot',
        botType: 'research',
      });

      (db.select as any).mockImplementationOnce(() => makeConvoSelectMock([row]));
      (db.select as any).mockImplementationOnce(() => makePreviewSelectMock([]));
      (db.select as any).mockImplementationOnce(() => makeCountSelectMock(1));

      const req = new Request('http://localhost:3000/api/conversations');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      const convo = data.conversations[0];
      expect(convo.botId).toBe('bot_abc');
      expect(convo.botName).toBe('Research Bot');
      expect(convo.botType).toBe('research');
    });

    it('marks conversation as starred when metadata.starred is true', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const row = makeConvoRow({ metadata: { starred: true } });

      (db.select as any).mockImplementationOnce(() => makeConvoSelectMock([row]));
      (db.select as any).mockImplementationOnce(() => makePreviewSelectMock([]));
      (db.select as any).mockImplementationOnce(() => makeCountSelectMock(1));

      const req = new Request('http://localhost:3000/api/conversations?sort=starred');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversations[0].starred).toBe(true);
    });
  });

  // ── DELETE /api/conversations/[id] ─────────────────────────────────────────

  describe('DELETE /api/conversations/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const req = new Request('http://localhost:3000/api/conversations/conv_1', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any, {
        params: Promise.resolve({ id: 'conv_1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 404 when conversation not found', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/conversations/nonexistent', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Conversation not found');
    });

    it('prevents cross-user deletion (returns 404 for other users conversations)', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_attacker' });
      // findFirst with userId filter returns null — the WHERE includes userId
      (db.query.conversations.findFirst as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/conversations/conv_victim', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any, {
        params: Promise.resolve({ id: 'conv_victim' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
    });

    it('soft deletes by setting deletedAt and returns { success: true }', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue({
        id: 'conv_abc',
        userId: 'user_123',
        title: 'My Chat',
      });

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const req = new Request('http://localhost:3000/api/conversations/conv_abc', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any, {
        params: Promise.resolve({ id: 'conv_abc' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it set deletedAt (soft delete, not hard delete)
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );
    });
  });

  // ── PATCH /api/conversations/[id] ──────────────────────────────────────────

  describe('PATCH /api/conversations/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const req = new Request('http://localhost:3000/api/conversations/conv_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: true }),
      });
      const response = await PATCH(req as any, {
        params: Promise.resolve({ id: 'conv_1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 404 when conversation not found', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/conversations/missing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: true }),
      });
      const response = await PATCH(req as any, {
        params: Promise.resolve({ id: 'missing' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
    });

    it('toggles starred status and returns updated value', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue({
        id: 'conv_abc',
        userId: 'user_123',
        metadata: { starred: false },
      });

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const req = new Request('http://localhost:3000/api/conversations/conv_abc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: true }),
      });
      const response = await PATCH(req as any, {
        params: Promise.resolve({ id: 'conv_abc' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.starred).toBe(true);
    });
  });
});
