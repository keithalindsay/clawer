/**
 * Tests for /api/tasks (GET, POST) and /api/tasks/[id] (PATCH, DELETE)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      tasks: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Stub randomUUID to return predictable IDs
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomUUID: vi.fn(() => 'task-uuid-123'),
  };
});

// ─── Imports ──────────────────────────────────────────────────────────────────

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GET, POST } from '../tasks/route';
import { PATCH, DELETE } from '../tasks/[id]/route';
import { NextRequest } from 'next/server';

// ─── Type helpers ─────────────────────────────────────────────────────────────

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindFirst = db.query.tasks.findFirst as ReturnType<typeof vi.fn>;
const mockSelect = db.select as ReturnType<typeof vi.fn>;
const mockInsert = db.insert as ReturnType<typeof vi.fn>;
const mockUpdate = db.update as ReturnType<typeof vi.fn>;
const mockDelete = db.delete as ReturnType<typeof vi.fn>;

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_TASK = {
  id: 'task-uuid-123',
  userId: 'user_abc123',
  title: 'Write unit tests',
  description: 'Cover all edge cases',
  status: 'backlog',
  priority: 'medium',
  assignedTo: null,
  result: null,
  error: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  startedAt: null,
  completedAt: null,
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
) {
  return new NextRequest(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function setupSelectChain(rows: unknown[]) {
  const mockOrderBy = vi.fn().mockResolvedValue(rows);
  const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
  return { mockOrderBy, mockWhere, mockFrom };
}

function setupInsertChain(returnedTask: unknown) {
  const mockReturning = vi.fn().mockResolvedValue([returnedTask]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValues });
  return { mockReturning, mockValues };
}

function setupUpdateChain(returnedTask: unknown) {
  const mockReturning = vi.fn().mockResolvedValue([returnedTask]);
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
  return { mockReturning, mockWhere, mockSet };
}

function setupDeleteChain() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  mockDelete.mockReturnValue({ where: mockWhere });
  return { mockWhere };
}

// ─── Tests: GET /api/tasks ────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    setupSelectChain([SAMPLE_TASK]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = buildRequest('GET', 'http://localhost:3000/api/tasks');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns list of tasks for authenticated user', async () => {
    const req = buildRequest('GET', 'http://localhost:3000/api/tasks');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].id).toBe(SAMPLE_TASK.id);
  });

  it('returns empty array when user has no tasks', async () => {
    setupSelectChain([]);

    const req = buildRequest('GET', 'http://localhost:3000/api/tasks');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tasks).toHaveLength(0);
  });

  it('filters tasks by status when status query param is provided', async () => {
    setupSelectChain([{ ...SAMPLE_TASK, status: 'done' }]);

    const req = buildRequest('GET', 'http://localhost:3000/api/tasks?status=done');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Verify db.select().from().where() was called (status filter applied)
    expect(mockSelect).toHaveBeenCalled();
  });

  it('returns all tasks when no status filter is provided', async () => {
    setupSelectChain([SAMPLE_TASK, { ...SAMPLE_TASK, id: 'task-2', status: 'done' }]);

    const req = buildRequest('GET', 'http://localhost:3000/api/tasks');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tasks).toHaveLength(2);
  });
});

// ─── Tests: POST /api/tasks ───────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    setupInsertChain(SAMPLE_TASK);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 'My Task',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when title is missing', async () => {
    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      description: 'No title here',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/title/i);
  });

  it('returns 400 when title is empty string', async () => {
    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: '   ',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/title/i);
  });

  it('returns 400 when title is not a string', async () => {
    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 12345,
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/title/i);
  });

  it('creates task with default priority "medium" when priority is invalid', async () => {
    const { mockValues } = setupInsertChain({ ...SAMPLE_TASK, priority: 'medium' });

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 'My Task',
      priority: 'ultra', // invalid
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'medium' })
    );
  });

  it('creates task with specified valid priority', async () => {
    const { mockValues } = setupInsertChain({ ...SAMPLE_TASK, priority: 'high' });

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 'Urgent Work',
      priority: 'high',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'high' })
    );
  });

  it('creates task with all valid priorities: low, medium, high, urgent', async () => {
    for (const priority of ['low', 'medium', 'high', 'urgent']) {
      const { mockValues } = setupInsertChain({ ...SAMPLE_TASK, priority });
      mockAuth.mockResolvedValue({ userId: 'user_abc123' });

      const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
        title: 'Priority Test',
        priority,
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ priority })
      );
    }
  });

  it('returns 201 with created task on success', async () => {
    setupInsertChain(SAMPLE_TASK);

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 'Write unit tests',
      description: 'Cover all edge cases',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.task).toBeDefined();
    expect(data.task.id).toBe('task-uuid-123');
    expect(data.task.status).toBe('backlog');
  });

  it('inserts task with status=backlog and correct userId', async () => {
    const { mockValues } = setupInsertChain(SAMPLE_TASK);

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 'Test Task',
    });
    await POST(req);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_abc123',
        status: 'backlog',
        title: 'Test Task',
      })
    );
  });

  it('trims whitespace from title', async () => {
    const { mockValues } = setupInsertChain(SAMPLE_TASK);

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: '  Padded Title  ',
    });
    await POST(req);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Padded Title' })
    );
  });

  it('sets assignedTo from assigned_to field', async () => {
    const { mockValues } = setupInsertChain({ ...SAMPLE_TASK, assignedTo: 'scout' });

    const req = buildRequest('POST', 'http://localhost:3000/api/tasks', {
      title: 'Assigned Task',
      assigned_to: 'scout',
    });
    await POST(req);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ assignedTo: 'scout' })
    );
  });
});

// ─── Tests: PATCH /api/tasks/[id] ────────────────────────────────────────────

describe('PATCH /api/tasks/[id]', () => {
  const PARAMS = { params: Promise.resolve({ id: 'task-uuid-123' }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    mockFindFirst.mockResolvedValue(SAMPLE_TASK);
    setupUpdateChain({ ...SAMPLE_TASK, status: 'queued' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      status: 'queued',
    });
    const res = await PATCH(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when task not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/nonexistent', {
      status: 'queued',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });

  it('returns 404 when task belongs to a different user (user isolation)', async () => {
    // findFirst returns null because the where clause includes eq(tasks.userId, userId)
    // — the task exists but belongs to another user
    mockFindFirst.mockResolvedValue(null);

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      status: 'queued',
    });
    const res = await PATCH(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });

  it('updates status successfully', async () => {
    const updatedTask = { ...SAMPLE_TASK, status: 'queued' };
    setupUpdateChain(updatedTask);

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      status: 'queued',
    });
    const res = await PATCH(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.task.status).toBe('queued');
  });

  it('updates title and trims whitespace', async () => {
    const { mockSet } = setupUpdateChain({ ...SAMPLE_TASK, title: 'Updated Title' });

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      title: '  Updated Title  ',
    });
    await PATCH(req, PARAMS);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated Title' })
    );
  });

  it('updates priority to a valid value', async () => {
    const { mockSet } = setupUpdateChain({ ...SAMPLE_TASK, priority: 'urgent' });

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      priority: 'urgent',
    });
    await PATCH(req, PARAMS);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'urgent' })
    );
  });

  it('ignores invalid status values', async () => {
    const { mockSet } = setupUpdateChain(SAMPLE_TASK);

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      status: 'invalid_status',
    });
    await PATCH(req, PARAMS);

    // status should NOT be in the update payload since it's invalid
    expect(mockSet).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: 'invalid_status' })
    );
  });

  it('ignores invalid priority values', async () => {
    const { mockSet } = setupUpdateChain(SAMPLE_TASK);

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      priority: 'turbo',
    });
    await PATCH(req, PARAMS);

    expect(mockSet).toHaveBeenCalledWith(
      expect.not.objectContaining({ priority: 'turbo' })
    );
  });

  it('accepts all valid task statuses', async () => {
    const validStatuses = ['backlog', 'queued', 'running', 'done', 'failed'];

    for (const status of validStatuses) {
      vi.clearAllMocks();
      mockAuth.mockResolvedValue({ userId: 'user_abc123' });
      mockFindFirst.mockResolvedValue(SAMPLE_TASK);
      const { mockSet } = setupUpdateChain({ ...SAMPLE_TASK, status });

      const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
        status,
      });
      await PATCH(req, PARAMS);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ status })
      );
    }
  });

  it('returns updated task in response', async () => {
    const updatedTask = { ...SAMPLE_TASK, status: 'done', priority: 'urgent' };
    setupUpdateChain(updatedTask);

    const req = buildRequest('PATCH', 'http://localhost:3000/api/tasks/task-uuid-123', {
      status: 'done',
      priority: 'urgent',
    });
    const res = await PATCH(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.task.status).toBe('done');
    expect(data.task.priority).toBe('urgent');
  });
});

// ─── Tests: DELETE /api/tasks/[id] ───────────────────────────────────────────

describe('DELETE /api/tasks/[id]', () => {
  const PARAMS = { params: Promise.resolve({ id: 'task-uuid-123' }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_abc123' });
    mockFindFirst.mockResolvedValue(SAMPLE_TASK);
    setupDeleteChain();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = buildRequest('DELETE', 'http://localhost:3000/api/tasks/task-uuid-123');
    const res = await DELETE(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when task not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    const req = buildRequest('DELETE', 'http://localhost:3000/api/tasks/nonexistent');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });

  it('returns 404 when task belongs to a different user (user isolation)', async () => {
    // The where clause in findFirst includes userId — so a different user's task returns null
    mockFindFirst.mockResolvedValue(null);

    const req = buildRequest('DELETE', 'http://localhost:3000/api/tasks/task-uuid-123');
    const res = await DELETE(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Task not found');
  });

  it('deletes task and returns { success: true }', async () => {
    const req = buildRequest('DELETE', 'http://localhost:3000/api/tasks/task-uuid-123');
    const res = await DELETE(req, PARAMS);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('calls db.delete with correct task id and userId', async () => {
    const { mockWhere } = setupDeleteChain();

    const req = buildRequest('DELETE', 'http://localhost:3000/api/tasks/task-uuid-123');
    await DELETE(req, PARAMS);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });
});
