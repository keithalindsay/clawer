/**
 * Tests for /api/files (GET) and /api/files/content (GET, DELETE)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/files', () => ({
  resolveUserFilesDir: vi.fn(),
  getUserContainerStatus: vi.fn(),
  listFiles: vi.fn(),
  validatePath: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { auth } from '@clerk/nextjs/server';
import {
  resolveUserFilesDir,
  getUserContainerStatus,
  listFiles,
  validatePath,
  readFile,
  deleteFile,
} from '@/lib/files';

// Route handlers (imported after mocks)
import { GET as filesGET } from '../files/route';
import { GET as contentGET, DELETE as contentDELETE } from '../files/content/route';
import { NextRequest } from 'next/server';

// ─── Type helpers ─────────────────────────────────────────────────────────────

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockResolveUserFilesDir = resolveUserFilesDir as ReturnType<typeof vi.fn>;
const mockGetUserContainerStatus = getUserContainerStatus as ReturnType<typeof vi.fn>;
const mockListFiles = listFiles as ReturnType<typeof vi.fn>;
const mockValidatePath = validatePath as ReturnType<typeof vi.fn>;
const mockReadFile = readFile as ReturnType<typeof vi.fn>;
const mockDeleteFile = deleteFile as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEmptyFileTree() {
  return {
    containerReady: true,
    totalFiles: 0,
    totalSizeBytes: 0,
    truncated: false,
    folders: [],
    rootFiles: [],
  };
}

function buildContentRequest(
  path: string | null,
  opts: { download?: boolean; method?: string } = {}
) {
  const url = new URL('http://localhost:3000/api/files/content');
  if (path !== null) url.searchParams.set('path', path);
  if (opts.download) url.searchParams.set('download', 'true');
  return new NextRequest(url.toString(), { method: opts.method || 'GET' });
}

// ─── Tests: GET /api/files ────────────────────────────────────────────────────

describe('GET /api/files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    // Full workspace path (not just /files subdirectory) — agents write here
    mockResolveUserFilesDir.mockResolvedValue('/opt/clawer/userdata/clawer_user_user_abc123/clawd');
    mockGetUserContainerStatus.mockResolvedValue('running');
    mockListFiles.mockResolvedValue(makeEmptyFileTree());
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await filesGET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns file tree on success', async () => {
    const tree = {
      ...makeEmptyFileTree(),
      totalFiles: 2,
      rootFiles: [
        { name: 'notes.md', path: 'notes.md', sizeBytes: 1024, modifiedAt: new Date().toISOString(), type: 'md' },
        { name: 'data.csv', path: 'data.csv', sizeBytes: 512, modifiedAt: new Date().toISOString(), type: 'csv' },
      ],
    };
    mockListFiles.mockResolvedValue(tree);

    const res = await filesGET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalFiles).toBe(2);
    expect(body.data.rootFiles).toHaveLength(2);
  });

  it('sets containerReady=true when containerStatus is "running"', async () => {
    mockGetUserContainerStatus.mockResolvedValue('running');
    const tree = makeEmptyFileTree();
    mockListFiles.mockResolvedValue(tree);

    const res = await filesGET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.containerReady).toBe(true);
  });

  it('sets containerReady=false when containerStatus is "stopped"', async () => {
    mockGetUserContainerStatus.mockResolvedValue('stopped');
    const tree = makeEmptyFileTree();
    mockListFiles.mockResolvedValue(tree);

    const res = await filesGET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.containerReady).toBe(false);
  });

  it('returns 404 when user not found (resolveUserFilesDir throws USER_NOT_FOUND)', async () => {
    mockResolveUserFilesDir.mockRejectedValue(
      Object.assign(new Error('USER_NOT_FOUND'), { message: 'USER_NOT_FOUND' })
    );

    const res = await filesGET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 500 on unexpected listFiles error', async () => {
    mockListFiles.mockRejectedValue(new Error('Filesystem unavailable'));

    const res = await filesGET();

    expect(res.status).toBe(500);
  });

  it('calls listFiles with the resolved base directory', async () => {
    const baseDir = '/opt/clawer/userdata/clawer_user_user_abc123/clawd';
    mockResolveUserFilesDir.mockResolvedValue(baseDir);

    await filesGET();

    expect(mockListFiles).toHaveBeenCalledWith(baseDir);
  });
});

// ─── Tests: GET /api/files/content ───────────────────────────────────────────

describe('GET /api/files/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    // Full workspace path — file browser now shows all agent files
    mockResolveUserFilesDir.mockResolvedValue('/opt/clawer/userdata/clawer_user_user_abc123/clawd');
    mockReadFile.mockResolvedValue({
      path: 'notes.md',
      name: 'notes.md',
      type: 'md',
      content: '# Hello World',
      sizeBytes: 13,
      modifiedAt: new Date().toISOString(),
      truncated: false,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = buildContentRequest('notes.md');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when path param is missing', async () => {
    const req = buildContentRequest(null);
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('MISSING_PATH');
  });

  it('returns 400 when path param is empty string', async () => {
    const req = buildContentRequest('   ');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('MISSING_PATH');
  });

  it('returns file content for a valid path', async () => {
    const req = buildContentRequest('notes.md');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.content).toBe('# Hello World');
    expect(body.data.name).toBe('notes.md');
  });

  it('returns 404 when file not found', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    const req = buildContentRequest('nonexistent.md');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('blocks path traversal attacks (../../etc/passwd)', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' })
    );

    const req = buildContentRequest('../../etc/passwd');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PATH');
  });

  it('blocks null bytes in path', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' })
    );

    const req = buildContentRequest('notes.md\0evil');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PATH');
  });

  it('blocks absolute paths (/etc/passwd)', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' })
    );

    const req = buildContentRequest('/etc/passwd');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PATH');
  });

  it('returns 404 when user not found', async () => {
    mockResolveUserFilesDir.mockRejectedValue(
      Object.assign(new Error('USER_NOT_FOUND'), { message: 'USER_NOT_FOUND' })
    );

    const req = buildContentRequest('notes.md');
    const res = await contentGET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 500 on unexpected error', async () => {
    mockReadFile.mockRejectedValue(new Error('Disk failure'));

    const req = buildContentRequest('notes.md');
    const res = await contentGET(req);

    expect(res.status).toBe(500);
  });

  it('calls readFile with baseDir and path', async () => {
    const req = buildContentRequest('research/report.md');
    await contentGET(req);

    expect(mockReadFile).toHaveBeenCalledWith(
      '/opt/clawer/userdata/clawer_user_user_abc123/clawd',
      'research/report.md'
    );
  });
});

// ─── Tests: DELETE /api/files/content ────────────────────────────────────────

describe('DELETE /api/files/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    // Full workspace path — file browser now shows all agent files
    mockResolveUserFilesDir.mockResolvedValue('/opt/clawer/userdata/clawer_user_user_abc123/clawd');
    mockDeleteFile.mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = buildContentRequest('notes.md', { method: 'DELETE' });
    const res = await contentDELETE(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when path param is missing', async () => {
    const req = buildContentRequest(null, { method: 'DELETE' });
    const res = await contentDELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('MISSING_PATH');
  });

  it('deletes file and returns success', async () => {
    const req = buildContentRequest('notes.md', { method: 'DELETE' });
    const res = await contentDELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe('notes.md');
  });

  it('returns 404 when file not found', async () => {
    mockDeleteFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    const req = buildContentRequest('missing.md', { method: 'DELETE' });
    const res = await contentDELETE(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 when path traversal is attempted on delete', async () => {
    mockDeleteFile.mockRejectedValue(
      Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' })
    );

    const req = buildContentRequest('../etc/passwd', { method: 'DELETE' });
    const res = await contentDELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PATH');
  });

  it('returns 400 when target is a directory, not a file', async () => {
    mockDeleteFile.mockRejectedValue(
      Object.assign(new Error('Target is not a file'), { code: 'NOT_A_FILE' })
    );

    const req = buildContentRequest('some-folder', { method: 'DELETE' });
    const res = await contentDELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('NOT_A_FILE');
  });

  it('calls deleteFile with baseDir and relative path', async () => {
    const req = buildContentRequest('reports/q1.md', { method: 'DELETE' });
    await contentDELETE(req);

    expect(mockDeleteFile).toHaveBeenCalledWith(
      '/opt/clawer/userdata/clawer_user_user_abc123/clawd',
      'reports/q1.md'
    );
  });
});
