import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth at module level (before imports)
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock the db module with chainable Drizzle ORM stubs
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      bots: { findFirst: vi.fn() },
      conversations: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GET, POST, DELETE } from '../messages/route';

// ─── Chain helpers ────────────────────────────────────────────────────────────

/**
 * Configures db.select() to produce a chainable mock that resolves with `result`.
 * Returns `limitFn` so tests can assert it was called with the right value.
 */
function makeSelectChain(result: any[] = []) {
  const limitFn = vi.fn().mockResolvedValue(result);
  const orderByFn = vi.fn().mockReturnValue({ limit: limitFn });
  const whereFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
  const fromFn = vi.fn().mockReturnValue({ where: whereFn });
  (db.select as any).mockReturnValue({ from: fromFn });
  return { limitFn, orderByFn, whereFn, fromFn };
}

/**
 * Sets up the NEXT call to db.insert() to return a chainable mock resolving with
 * `[record]` from .values().returning().
 */
function mockInsertReturning(record: any) {
  (db.insert as any).mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([record]),
    }),
  });
}

/**
 * Sets up the NEXT call to db.update() to return a chainable mock with .set().where().
 * Optionally captures the args passed to .set() via `onSet`.
 */
function mockUpdateChain(onSet?: (args: any) => void) {
  (db.update as any).mockReturnValueOnce({
    set: vi.fn().mockImplementation((args: any) => {
      if (onSet) onSet(args);
      return { where: vi.fn().mockResolvedValue(undefined) };
    }),
  });
}

/**
 * Sets up the NEXT call to db.delete() to return a chainable mock with .where().
 */
function mockDeleteChain() {
  const whereFn = vi.fn().mockResolvedValue(undefined);
  (db.delete as any).mockReturnValueOnce({ where: whereFn });
  return { whereFn };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockBot = {
  id: 'bot_123',
  userId: 'user_123',
  type: 'assistant',
  name: 'AI Assistant',
  description: 'Your personal AI assistant',
  status: 'active',
};

const mockConversation = {
  id: 'conv_123',
  userId: 'user_123',
  botId: 'bot_123',
  title: 'Chat',
  messageCount: 3,
  totalTokens: 100,
  lastMessageAt: new Date('2024-01-01T12:00:00Z'),
};

const mockMessage = {
  id: 'msg_123',
  conversationId: 'conv_123',
  role: 'user',
  content: 'Hello!',
  tokenCount: 2,
  createdAt: new Date('2024-01-01T12:00:00Z'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // GET /api/messages
  // ===========================================================================
  describe('GET /api/messages', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const req = new Request('http://localhost:3000/api/messages');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('creates default assistant bot if none exists', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(null); // no bot
      mockInsertReturning(mockBot);                              // creates bot
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      makeSelectChain([]);

      const req = new Request('http://localhost:3000/api/messages');
      const response = await GET(req as any);

      expect(response.status).toBe(200);
      expect(db.insert).toHaveBeenCalled();
    });

    it('creates new conversation if none exists', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(null); // no conversation
      mockInsertReturning(mockConversation);                              // creates it
      makeSelectChain([]);

      const req = new Request('http://localhost:3000/api/messages');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.insert).toHaveBeenCalled();
      expect(data.conversationId).toBe('conv_123');
    });

    it('returns existing conversation messages with correct { id, role, content, timestamp } shape', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);

      const date1 = new Date('2024-01-01T10:00:00Z');
      const date2 = new Date('2024-01-01T10:01:00Z');
      makeSelectChain([
        { id: 'msg_1', role: 'user', content: 'Hello', createdAt: date1 },
        { id: 'msg_2', role: 'assistant', content: 'Hi there!', createdAt: date2 },
      ]);

      const req = new Request('http://localhost:3000/api/messages');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversationId).toBe('conv_123');
      expect(data.messages).toHaveLength(2);

      // First message shape
      expect(data.messages[0]).toMatchObject({
        id: 'msg_1',
        role: 'user',
        content: 'Hello',
        timestamp: date1.toISOString(),
      });

      // Second message shape
      expect(data.messages[1]).toMatchObject({
        id: 'msg_2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: date2.toISOString(),
      });
    });

    it('respects ?limit param — caps at 100 when 200 is requested', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      const { limitFn } = makeSelectChain([]);

      const req = new Request('http://localhost:3000/api/messages?limit=200');
      await GET(req as any);

      expect(limitFn).toHaveBeenCalledWith(100);
    });

    it('uses default limit of 50 when no limit param provided', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      const { limitFn } = makeSelectChain([]);

      const req = new Request('http://localhost:3000/api/messages');
      await GET(req as any);

      expect(limitFn).toHaveBeenCalledWith(50);
    });

    it('uses ?conversationId param to fetch specific conversation', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue({
        ...mockConversation,
        id: 'conv_specific',
      });
      makeSelectChain([]);

      const req = new Request('http://localhost:3000/api/messages?conversationId=conv_specific');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversationId).toBe('conv_specific');
      // findFirst was called to look up the conversation
      expect(db.query.conversations.findFirst).toHaveBeenCalled();
    });

    it('handles ?agentId param — returns agent-specific conversation messages', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      const agentConversation = { ...mockConversation, id: 'conv_agent_123', agentId: 'agent_abc' };
      (db.query.conversations.findFirst as any).mockResolvedValue(agentConversation);

      const msgDate = new Date('2024-03-01T09:00:00Z');
      makeSelectChain([
        { id: 'msg_a1', role: 'user', content: 'Agent message', createdAt: msgDate },
      ]);

      const req = new Request('http://localhost:3000/api/messages?agentId=agent_abc');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversationId).toBe('conv_agent_123');
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].timestamp).toBe(msgDate.toISOString());
    });

    it('returns empty messages array when no agent conversation exists yet', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(null); // no conversation for agent

      const req = new Request('http://localhost:3000/api/messages?agentId=agent_new');
      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toEqual([]);
    });

    it('formats message timestamp as ISO string from createdAt', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);

      const testDate = new Date('2025-12-31T23:59:59Z');
      makeSelectChain([
        { id: 'msg_ts', role: 'system', content: 'Timestamp test', createdAt: testDate },
      ]);

      const req = new Request('http://localhost:3000/api/messages');
      const response = await GET(req as any);
      const data = await response.json();

      expect(data.messages[0].timestamp).toBe(testDate.toISOString());
    });
  });

  // ===========================================================================
  // POST /api/messages
  // ===========================================================================
  describe('POST /api/messages', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'Hello' }),
      });
      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when role is missing', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Hello' }),
      });
      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });

    it('returns 400 when content is missing', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      });
      const response = await POST(req as any);

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid role (not user/assistant/system)', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'invalid', content: 'Hello' }),
      });
      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid role');
    });

    it('saves message to existing conversation by conversationId', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);

      // Only one insert: the message itself (bot and conversation already exist)
      mockInsertReturning(mockMessage);
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'Hello!', conversationId: 'conv_123' }),
      });
      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversationId).toBe('conv_123');
      expect(data.role).toBe('user');
      expect(data.content).toBe('Hello!');
    });

    it('creates new conversation when conversationId not provided', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      // conversations.findFirst is NOT called when no conversationId in body

      // Two inserts: conversation first, then message
      mockInsertReturning({ ...mockConversation, messageCount: 0 });
      mockInsertReturning(mockMessage);
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'New conversation message' }),
      });
      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.insert).toHaveBeenCalledTimes(2); // conversation + message
    });

    it('estimates tokenCount as ceil(content.length / 4)', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);

      const content = 'Hello World!!'; // 13 chars → ceil(13/4) = 4
      let capturedValues: any;

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockImplementation((vals: any) => {
          capturedValues = vals;
          return {
            returning: vi.fn().mockResolvedValue([{
              ...mockMessage,
              content: vals.content,
              tokenCount: vals.tokenCount,
            }]),
          };
        }),
      });
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content, conversationId: 'conv_123' }),
      });
      await POST(req as any);

      expect(capturedValues).toBeDefined();
      expect(capturedValues.tokenCount).toBe(Math.ceil(content.length / 4));
    });

    it('updates conversation messageCount + 1 and lastMessageAt', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      mockInsertReturning(mockMessage);

      let capturedSetArgs: any;
      mockUpdateChain((args) => { capturedSetArgs = args; });

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'Hello!', conversationId: 'conv_123' }),
      });
      await POST(req as any);

      expect(capturedSetArgs).toBeDefined();
      expect(capturedSetArgs.messageCount).toBe(mockConversation.messageCount + 1);
      expect(capturedSetArgs.lastMessageAt).toBeInstanceOf(Date);
    });

    it('returns { id, conversationId, role, content, timestamp } shape', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      mockInsertReturning(mockMessage);
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'Hello!', conversationId: 'conv_123' }),
      });
      const response = await POST(req as any);
      const data = await response.json();

      expect(data).toHaveProperty('id', 'msg_123');
      expect(data).toHaveProperty('conversationId', 'conv_123');
      expect(data).toHaveProperty('role', 'user');
      expect(data).toHaveProperty('content', 'Hello!');
      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp).toISOString()).toBe(mockMessage.createdAt.toISOString());
    });

    it.each(['user', 'assistant', 'system'])('accepts valid role: %s', async (role) => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.bots.findFirst as any).mockResolvedValue(mockBot);
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      mockInsertReturning({ ...mockMessage, role });
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content: 'Test content', conversationId: 'conv_123' }),
      });
      const response = await POST(req as any);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================================================
  // DELETE /api/messages
  // ===========================================================================
  describe('DELETE /api/messages', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const req = new Request('http://localhost:3000/api/messages?conversationId=conv_123', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when conversationId param is missing', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });

      const req = new Request('http://localhost:3000/api/messages', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('conversationId is required');
    });

    it('returns 404 when conversation not found or belongs to different user', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(null); // ownership check fails

      const req = new Request('http://localhost:3000/api/messages?conversationId=conv_other', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Conversation not found');
    });

    it('deletes all messages in the conversation', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);

      const { whereFn } = mockDeleteChain();
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages?conversationId=conv_123', {
        method: 'DELETE',
      });
      await DELETE(req as any);

      expect(db.delete).toHaveBeenCalled();
      expect(whereFn).toHaveBeenCalled();
    });

    it('resets conversation messageCount and totalTokens to 0', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      mockDeleteChain();

      let capturedSetArgs: any;
      mockUpdateChain((args) => { capturedSetArgs = args; });

      const req = new Request('http://localhost:3000/api/messages?conversationId=conv_123', {
        method: 'DELETE',
      });
      await DELETE(req as any);

      expect(capturedSetArgs).toBeDefined();
      expect(capturedSetArgs.messageCount).toBe(0);
      expect(capturedSetArgs.totalTokens).toBe(0);
    });

    it('returns { success: true } on successful deletion', async () => {
      (auth as any).mockResolvedValue({ userId: 'user_123' });
      (db.query.conversations.findFirst as any).mockResolvedValue(mockConversation);
      mockDeleteChain();
      mockUpdateChain();

      const req = new Request('http://localhost:3000/api/messages?conversationId=conv_123', {
        method: 'DELETE',
      });
      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
