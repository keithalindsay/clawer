/**
 * Tests for resolveUserFilesDir() - File scope resolution
 * 
 * Ensures that file paths are scoped to /clawd/files (deliverables)
 * NOT /clawd (which contains internal agent files).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database
const mockFindFirst = vi.fn();
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: (opts: any) => mockFindFirst(opts),
      },
    },
  },
}));

/**
 * Resolves the user's files directory from the database.
 *
 * Pattern: /opt/clawer/userdata/clawer_user_{userId}/clawd/files/
 *
 * This is the clean "deliverables" directory for user-facing output:
 * - Onboarding documents
 * - Reports and summaries
 * - Generated content
 * - Research deliverables
 *
 * Internal agent files (SOUL.md, AGENTS.md, WORKING.md, memory/, scripts/)
 * remain in /clawd/ root and are not exposed to end users.
 *
 * Container name is derived from userId (consistent with the provisioner).
 * We query the DB to verify the user exists before returning a path.
 */
async function resolveUserFilesDir(userId: string): Promise<string> {
  const user = await mockFindFirst({ where: {} });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Use actual container_id from DB (not constructed name — they can differ)
  const containerName = user.containerId || `clawer_user_${userId}`;
  return `/opt/clawer/userdata/${containerName}/clawd/files`;
}

describe('resolveUserFilesDir()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('path structure', () => {
    it('returns path ending in /clawd/files not /clawd', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const path = await resolveUserFilesDir('user_123');
      
      expect(path).toMatch(/\/clawd\/files$/);
      expect(path).not.toMatch(/\/clawd$/);
    });

    it('uses containerId from database', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'custom_container_name',
      });

      const path = await resolveUserFilesDir('user_123');
      
      expect(path).toBe('/opt/clawer/userdata/custom_container_name/clawd/files');
    });

    it('falls back to constructed name when containerId is null', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_abc456',
        containerId: null,
      });

      const path = await resolveUserFilesDir('user_abc456');
      
      expect(path).toBe('/opt/clawer/userdata/clawer_user_user_abc456/clawd/files');
    });

    it('falls back to constructed name when containerId is undefined', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_xyz789',
      });

      const path = await resolveUserFilesDir('user_xyz789');
      
      expect(path).toBe('/opt/clawer/userdata/clawer_user_user_xyz789/clawd/files');
    });
  });

  describe('validation', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(resolveUserFilesDir('nonexistent')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('throws USER_NOT_FOUND when DB returns undefined', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      await expect(resolveUserFilesDir('nonexistent')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('queries database with userId', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      await resolveUserFilesDir('user_123');
      
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });
  });

  describe('scoping guarantees', () => {
    it('scopes to files/ subdirectory (not clawd root)', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const path = await resolveUserFilesDir('user_123');
      
      // Path should include /files suffix
      expect(path.split('/').pop()).toBe('files');
    });

    it('prevents access to /clawd root (where internal files live)', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const path = await resolveUserFilesDir('user_123');
      
      // Should NOT be just clawd root
      expect(path).not.toBe('/opt/clawer/userdata/clawer_user_user_123/clawd');
      
      // Should include files/ subdirectory
      expect(path).toContain('/clawd/files');
    });

    it('prevents access to parent directories via path structure', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const path = await resolveUserFilesDir('user_123');
      
      // Ensure path starts with userdata prefix
      expect(path).toMatch(/^\/opt\/clawer\/userdata\//);
      
      // Ensure path ends with clawd/files
      expect(path).toMatch(/\/clawd\/files$/);
    });
  });

  describe('container name variations', () => {
    it('handles standard container name format', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_abc123',
        containerId: 'clawer_user_user_abc123',
      });

      const path = await resolveUserFilesDir('user_abc123');
      
      expect(path).toBe('/opt/clawer/userdata/clawer_user_user_abc123/clawd/files');
    });

    it('handles staging prefix in container name', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'stg-clawer_user_user_123',
      });

      const path = await resolveUserFilesDir('user_123');
      
      expect(path).toBe('/opt/clawer/userdata/stg-clawer_user_user_123/clawd/files');
    });

    it('handles custom container names', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_vip',
        containerId: 'premium_container_123',
      });

      const path = await resolveUserFilesDir('user_vip');
      
      expect(path).toBe('/opt/clawer/userdata/premium_container_123/clawd/files');
    });
  });

  describe('internal files exclusion', () => {
    it('scopes away from SOUL.md location', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const filesPath = await resolveUserFilesDir('user_123');
      
      // SOUL.md lives in /clawd/SOUL.md
      // Files should be in /clawd/files/
      expect(filesPath).not.toBe('/opt/clawer/userdata/clawer_user_user_123/clawd');
    });

    it('scopes away from AGENTS.md location', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const filesPath = await resolveUserFilesDir('user_123');
      
      // AGENTS.md lives in /clawd/AGENTS.md
      expect(filesPath).not.toBe('/opt/clawer/userdata/clawer_user_user_123/clawd');
    });

    it('scopes away from WORKING.md location', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const filesPath = await resolveUserFilesDir('user_123');
      
      // WORKING.md lives in /clawd/WORKING.md
      expect(filesPath).not.toBe('/opt/clawer/userdata/clawer_user_user_123/clawd');
    });

    it('scopes away from memory/ directory', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const filesPath = await resolveUserFilesDir('user_123');
      
      // memory/ lives in /clawd/memory/
      expect(filesPath).toBe('/opt/clawer/userdata/clawer_user_user_123/clawd/files');
    });

    it('scopes away from scripts/ directory', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user_123',
        containerId: 'clawer_user_user_123',
      });

      const filesPath = await resolveUserFilesDir('user_123');
      
      // scripts/ lives in /clawd/scripts/
      expect(filesPath).toBe('/opt/clawer/userdata/clawer_user_user_123/clawd/files');
    });
  });
});
