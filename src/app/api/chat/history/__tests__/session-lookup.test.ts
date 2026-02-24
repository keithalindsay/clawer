/**
 * Tests for findSessionKey() - Chat history session lookup
 * 
 * Session keys follow the pattern: agent:main:web-chat-{agentId}-{timestamp}
 * This function finds the most recent session for a specific agent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the container API
const mockGetSessions = vi.fn();
vi.mock('@/lib/container-client', () => ({
  containerApi: {
    getSessions: (port: number) => mockGetSessions(port),
  },
}));

/**
 * Find the active OpenClaw session for a given agent
 * 
 * Session keys are now agent-specific: agent:main:web-chat-{agentId}-{timestamp}
 * e.g., "agent:main:web-chat-executive-assistant-1771880431560"
 * 
 * We find the most recently updated session for the specific agent.
 */
async function findSessionKey(port: number, agentId: string): Promise<string | null> {
  const sessionsResult = await mockGetSessions(port);
  
  if (sessionsResult.error || !sessionsResult.data?.sessions) {
    console.error('[history] Failed to list sessions:', sessionsResult.error);
    return null;
  }

  // Find sessions matching this specific agent
  // Pattern: agent:main:web-chat-{agentId}-{timestamp}
  const agentSessions = sessionsResult.data.sessions
    .filter((s: any) => s.key.includes(`web-chat-${agentId}-`))
    .sort((a: any, b: any) => {
      // Handle updatedAt as either ISO string or unix ms
      const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
      const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
      return bTime - aTime;
    });

  if (agentSessions.length > 0) {
    console.log(`[history] Found session: ${agentSessions[0].key} for agent ${agentId}`);
    return agentSessions[0].key;
  }
  
  // Fallback: check custom-agent:* pattern for custom agents
  for (const session of sessionsResult.data.sessions) {
    if (session.key.startsWith(`custom-agent:${agentId}:`)) {
      console.log(`[history] Found custom session: ${session.key}`);
      return session.key;
    }
  }
  
  // Legacy fallback: check for old-style sessions without agent ID
  // This supports migration from the old shared session format
  const legacySessions = sessionsResult.data.sessions
    .filter((s: any) => s.key.startsWith('agent:main:web-chat-') && !s.key.includes('web-chat-default-'))
    .sort((a: any, b: any) => {
      const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
      const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
      return bTime - aTime;
    });
  
  if (legacySessions.length > 0 && agentId !== 'default') {
    // Only show legacy session for the first agent to preserve history
    // New messages will go to agent-specific sessions
    console.log(`[history] Found legacy session: ${legacySessions[0].key}`);
  }
  
  console.log('[history] No session found for agent:', agentId, 'Available:', sessionsResult.data.sessions.map((s: any) => s.key));
  return null;
}

describe('findSessionKey()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('agent-specific session lookup', () => {
    it('finds session with web-chat-{agentId}-{timestamp} pattern', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: '2026-02-23T19:10:00Z' },
            { key: 'agent:main:web-chat-leo-1771880500000', updatedAt: '2026-02-23T19:15:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-1771880431560');
    });

    it('finds most recent session when multiple exist for same agent', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880000000', updatedAt: '2026-02-23T18:00:00Z' },
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: '2026-02-23T19:10:00Z' },
            { key: 'agent:main:web-chat-claire-1771880500000', updatedAt: '2026-02-23T19:15:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-1771880500000');
    });

    it('handles updatedAt as unix timestamp (number)', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880000000', updatedAt: 1771880000000 },
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: 1771880431560 },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-1771880431560');
    });

    it('handles mix of ISO string and unix timestamp', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-old', updatedAt: '2026-02-23T18:00:00Z' },
            { key: 'agent:main:web-chat-claire-new', updatedAt: 1771880431560 },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-new');
    });
  });

  describe('multiple agents (Claire vs Leo)', () => {
    it('returns correct session for Claire when both agents have sessions', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: '2026-02-23T19:10:00Z' },
            { key: 'agent:main:web-chat-leo-1771880500000', updatedAt: '2026-02-23T19:15:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-1771880431560');
    });

    it('returns correct session for Leo when both agents have sessions', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: '2026-02-23T19:10:00Z' },
            { key: 'agent:main:web-chat-leo-1771880500000', updatedAt: '2026-02-23T19:15:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'leo');
      expect(result).toBe('agent:main:web-chat-leo-1771880500000');
    });

    it('returns null for agent with no sessions', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: '2026-02-23T19:10:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'leo');
      expect(result).toBeNull();
    });
  });

  describe('custom agent pattern', () => {
    it('finds custom-agent: sessions', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'custom-agent:my-bot:session-123', updatedAt: '2026-02-23T19:10:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'my-bot');
      expect(result).toBe('custom-agent:my-bot:session-123');
    });

    it('prefers web-chat pattern over custom-agent pattern', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1771880431560', updatedAt: '2026-02-23T19:10:00Z' },
            { key: 'custom-agent:claire:old-session', updatedAt: '2026-02-23T18:00:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-1771880431560');
    });
  });

  describe('error handling', () => {
    it('returns null when getSessions returns error', async () => {
      mockGetSessions.mockResolvedValue({
        error: 'Connection failed',
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBeNull();
    });

    it('returns null when no sessions exist', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBeNull();
    });

    it('returns null when sessions array is undefined', async () => {
      mockGetSessions.mockResolvedValue({
        data: {},
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBeNull();
    });

    it('handles missing updatedAt gracefully', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-claire-1', updatedAt: 0 },
            { key: 'agent:main:web-chat-claire-2' }, // no updatedAt
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBe('agent:main:web-chat-claire-1');
    });
  });

  describe('legacy session support', () => {
    it('does NOT return legacy sessions for non-default agents', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-1771880000000', updatedAt: '2026-02-23T19:00:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'claire');
      expect(result).toBeNull(); // Legacy sessions not returned for named agents
    });

    it('skips legacy sessions with "default" in the name', async () => {
      mockGetSessions.mockResolvedValue({
        data: {
          sessions: [
            { key: 'agent:main:web-chat-default-1771880000000', updatedAt: '2026-02-23T19:00:00Z' },
          ],
        },
      });

      const result = await findSessionKey(4000, 'any-agent');
      expect(result).toBeNull();
    });
  });
});
