import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    stat: vi.fn(),
    mkdir: vi.fn(),
  },
}));

import { GET, PUT } from '../agent/files/route';
import { POST } from '../agent/files/reset/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';

const MOCK_USER_ID = 'user_abc123';
const MOCK_USER = {
  id: MOCK_USER_ID,
  containerId: 'container_abc',
  containerStatus: 'running',
};
const CONTAINER_PATH = `/opt/clawer/userdata/clawer_user_${MOCK_USER_ID}/clawd`;

describe('Agent Files API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── GET /api/agent/files ────────────────────────────────────────────────────

  describe('GET /api/agent/files', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns 404 when user not found in DB', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('returns { files: [], containerReady: false } when container not running', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue({
        id: MOCK_USER_ID,
        containerId: null,
        containerStatus: 'stopped',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.files).toEqual([]);
      expect(data.data.containerReady).toBe(false);
    });

    it('returns all 5 files when container is running', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue('file content');
      (fs.stat as any).mockResolvedValue({ mtime: new Date('2026-01-01T00:00:00Z') });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.containerReady).toBe(true);
      expect(data.data.files).toHaveLength(5);

      const filenames = data.data.files.map((f: any) => f.filename);
      expect(filenames).toContain('SOUL.md');
      expect(filenames).toContain('AGENTS.md');
      expect(filenames).toContain('USER.md');
      expect(filenames).toContain('IDENTITY.md');
      expect(filenames).toContain('MEMORY.md');
    });

    it('returns file content when file exists', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue('# Soul content');
      (fs.stat as any).mockResolvedValue({ mtime: new Date('2026-01-01T00:00:00Z') });

      const response = await GET();
      const data = await response.json();

      const soulFile = data.data.files.find((f: any) => f.filename === 'SOUL.md');
      expect(soulFile.content).toBe('# Soul content');
      expect(soulFile.exists).toBe(true);
    });

    it('returns exists=false with empty content when file is missing', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);

      const enoent = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
      (fs.readFile as any).mockRejectedValue(enoent);
      (fs.stat as any).mockRejectedValue(enoent);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      const soulFile = data.data.files.find((f: any) => f.filename === 'SOUL.md');
      expect(soulFile.exists).toBe(false);
      expect(soulFile.content).toBe('');
    });

    it('includes lastModified from fs.stat', async () => {
      const mockDate = new Date('2026-02-15T12:00:00Z');
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue('content');
      (fs.stat as any).mockResolvedValue({ mtime: mockDate });

      const response = await GET();
      const data = await response.json();

      const soulFile = data.data.files.find((f: any) => f.filename === 'SOUL.md');
      expect(soulFile.lastModified).toBe(mockDate.toISOString());
    });

    it('includes description for each known file', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue('content');
      (fs.stat as any).mockResolvedValue({ mtime: new Date() });

      const response = await GET();
      const data = await response.json();

      for (const file of data.data.files) {
        expect(typeof file.description).toBe('string');
        expect(file.description.length).toBeGreaterThan(0);
      }
    });

    it('constructs correct path for user files', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue('content');
      (fs.stat as any).mockResolvedValue({ mtime: new Date() });

      await GET();

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining(`/opt/clawer/userdata/clawer_user_${MOCK_USER_ID}/clawd/`),
        'utf-8'
      );
    });
  });

  // ─── PUT /api/agent/files ────────────────────────────────────────────────────

  describe('PUT /api/agent/files', () => {
    function buildPutRequest(body: object) {
      return new Request('http://localhost:3000/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const response = await PUT(buildPutRequest({ filename: 'SOUL.md', content: 'hello' }) as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns 400 (INVALID_FILENAME) for path traversal attempt', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });

      const response = await PUT(buildPutRequest({ filename: '../../etc/passwd', content: 'x' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_FILENAME');
    });

    it('returns 400 (INVALID_FILENAME) for disallowed filename', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });

      const response = await PUT(buildPutRequest({ filename: 'README.md', content: 'x' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_FILENAME');
    });

    it('returns 400 (VALIDATION_ERROR) when content is not a string', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });

      const response = await PUT(buildPutRequest({ filename: 'SOUL.md', content: 123 }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 (CONTENT_TOO_LARGE) when content exceeds 500KB', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });

      const largeContent = 'x'.repeat(500_001);
      const response = await PUT(buildPutRequest({ filename: 'SOUL.md', content: largeContent }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONTENT_TOO_LARGE');
    });

    it('creates directory recursively before writing', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: new Date(), size: 5 });

      await PUT(buildPutRequest({ filename: 'SOUL.md', content: 'hello' }) as any);

      expect(fs.mkdir).toHaveBeenCalledWith(
        CONTAINER_PATH,
        { recursive: true }
      );
    });

    it('writes file to correct path', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: new Date(), size: 10 });

      await PUT(buildPutRequest({ filename: 'USER.md', content: 'my content' }) as any);

      expect(fs.writeFile).toHaveBeenCalledWith(
        `${CONTAINER_PATH}/USER.md`,
        'my content',
        'utf-8'
      );
    });

    it('returns { filename, lastModified, size } on success', async () => {
      const mockDate = new Date('2026-02-15T12:00:00Z');
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: mockDate, size: 42 });

      const response = await PUT(buildPutRequest({ filename: 'SOUL.md', content: 'content' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filename).toBe('SOUL.md');
      expect(data.data.lastModified).toBe(mockDate.toISOString());
      expect(data.data.size).toBe(42);
    });

    it('returns 404 when user not found', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(null);

      const response = await PUT(buildPutRequest({ filename: 'SOUL.md', content: 'x' }) as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  // ─── POST /api/agent/files/reset ────────────────────────────────────────────

  describe('POST /api/agent/files/reset', () => {
    function buildResetRequest(body: object) {
      return new Request('http://localhost:3000/api/agent/files/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    it('returns 401 when unauthenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const response = await POST(buildResetRequest({ filename: 'SOUL.md' }) as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns 400 for invalid filename', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });

      const response = await POST(buildResetRequest({ filename: 'INVALID.md' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_FILENAME');
    });

    it('returns 400 for missing filename', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });

      const response = await POST(buildResetRequest({}) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_FILENAME');
    });

    it('reads default content from /opt/defaults/{filename}', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue('# Default Soul Content');
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: new Date(), size: 100 });

      await POST(buildResetRequest({ filename: 'SOUL.md' }) as any);

      expect(fs.readFile).toHaveBeenCalledWith('/opt/defaults/SOUL.md', 'utf-8');
    });

    it('falls back to empty string when no default file exists', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      const enoent = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
      (fs.readFile as any).mockRejectedValue(enoent);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: new Date(), size: 0 });

      const response = await POST(buildResetRequest({ filename: 'SOUL.md' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        '',
        'utf-8'
      );
    });

    it('writes default content to user clawd directory', async () => {
      const defaultContent = '# Default AGENTS content';
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue(defaultContent);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: new Date(), size: 100 });

      await POST(buildResetRequest({ filename: 'AGENTS.md' }) as any);

      expect(fs.writeFile).toHaveBeenCalledWith(
        `${CONTAINER_PATH}/AGENTS.md`,
        defaultContent,
        'utf-8'
      );
    });

    it('returns { filename, content, lastModified, resetToDefault: true }', async () => {
      const mockDate = new Date('2026-02-15T12:00:00Z');
      const defaultContent = '# Default User Content';
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(MOCK_USER);
      (fs.readFile as any).mockResolvedValue(defaultContent);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.stat as any).mockResolvedValue({ mtime: mockDate, size: 100 });

      const response = await POST(buildResetRequest({ filename: 'USER.md' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filename).toBe('USER.md');
      expect(data.data.content).toBe(defaultContent);
      expect(data.data.lastModified).toBe(mockDate.toISOString());
      expect(data.data.resetToDefault).toBe(true);
    });

    it('returns 404 when user not found', async () => {
      (auth as any).mockResolvedValue({ userId: MOCK_USER_ID });
      (db.query.users.findFirst as any).mockResolvedValue(null);

      const response = await POST(buildResetRequest({ filename: 'SOUL.md' }) as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
