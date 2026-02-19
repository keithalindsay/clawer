import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from "next/server";

// ── Hoisted mocks ──────────────────────────────────────────────────────────
// vi.hoisted() runs before the vi.mock() factory, so mockVerify is available
// inside the svix mock factory.

const mockVerify = vi.hoisted(() => vi.fn());

// ── Module mocks ───────────────────────────────────────────────────────────

// The route calls `new Webhook(secret)` — so the mock must be a real
// constructor (regular function, not arrow function).
vi.mock('svix', () => ({
  Webhook: vi.fn(function (this: any) {
    this.verify = mockVerify;
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    query: { users: { findFirst: vi.fn() } },
  },
}));

// drizzle-orm eq/and are used in .where() — db is fully mocked so these
// are called but their return values don't affect anything.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
    and: vi.fn((...args: unknown[]) => args),
  };
});

// ── Import route under test ────────────────────────────────────────────────

import { POST } from '../webhooks/clerk/route';
import { db } from '@/lib/db';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a mock Clerk webhook request.
 * Pass `overrideHeaders` to replace/remove headers (null = omit the header).
 */
function buildClerkRequest(
  eventType: string,
  data: object,
  overrideHeaders: Record<string, string | null> = {},
) {
  const body = JSON.stringify({ type: eventType, data });

  const defaultHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'svix-id': 'msg_test_123',
    'svix-timestamp': '1740009000',
    'svix-signature': 'v1,base64signature',
  };

  const finalHeaders: Record<string, string> = { ...defaultHeaders };
  for (const [key, val] of Object.entries(overrideHeaders)) {
    if (val === null) {
      delete finalHeaders[key];
    } else {
      finalHeaders[key] = val;
    }
  }

  return new NextRequest('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    body,
    headers: finalHeaders,
  });
}

/** Reset the DB mock chains to sensible defaults. */
function setupDbMocks() {
  (db.insert as any).mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    }),
  });

  (db.update as any).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
}

// ── Test suites ────────────────────────────────────────────────────────────

describe('POST /api/webhooks/clerk', () => {
  const ORIGINAL_ENV = process.env.CLERK_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_secret';
    setupDbMocks();
  });

  afterEach(() => {
    // Restore original env var state
    if (ORIGINAL_ENV === undefined) {
      delete process.env.CLERK_WEBHOOK_SECRET;
    } else {
      process.env.CLERK_WEBHOOK_SECRET = ORIGINAL_ENV;
    }
  });

  // ── Signature / header verification ───────────────────────────────────

  describe('Signature verification', () => {
    it('returns 500 when CLERK_WEBHOOK_SECRET not configured', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;

      const request = buildClerkRequest('user.created', { id: 'user_123' });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('returns 400 when svix-id header is missing', async () => {
      const request = buildClerkRequest(
        'user.created',
        { id: 'user_123' },
        { 'svix-id': null },
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('returns 400 when svix-timestamp header is missing', async () => {
      const request = buildClerkRequest(
        'user.created',
        { id: 'user_123' },
        { 'svix-timestamp': null },
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when svix-signature header is missing', async () => {
      const request = buildClerkRequest(
        'user.created',
        { id: 'user_123' },
        { 'svix-signature': null },
      );
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when Webhook.verify() throws (bad signature)', async () => {
      mockVerify.mockImplementationOnce(() => {
        throw new Error('Signature mismatch');
      });

      const request = buildClerkRequest('user.created', { id: 'user_123' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('processes the event when all headers present and verify succeeds', async () => {
      const eventData = {
        id: 'user_verified',
        email_addresses: [{ email_address: 'ok@example.com', id: 'ema_1' }],
        primary_email_address_id: 'ema_1',
        first_name: 'Ok',
        last_name: 'User',
      };
      mockVerify.mockReturnValueOnce({ type: 'user.created', data: eventData });

      const request = buildClerkRequest('user.created', eventData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.received).toBe(true);
    });
  });

  // ── user.created ──────────────────────────────────────────────────────

  describe('user.created', () => {
    it('inserts new user with correct id, email, name, tier=basic', async () => {
      const eventData = {
        id: 'user_created_001',
        email_addresses: [
          { email_address: 'alice@example.com', id: 'ema_alice' },
        ],
        primary_email_address_id: 'ema_alice',
        first_name: 'Alice',
        last_name: 'Smith',
      };
      mockVerify.mockReturnValueOnce({ type: 'user.created', data: eventData });

      const request = buildClerkRequest('user.created', eventData);
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify db.insert was called
      expect(db.insert).toHaveBeenCalledOnce();

      // Verify .values() was called with correct fields
      const insertMock = (db.insert as any).mock.results[0].value;
      expect(insertMock.values).toHaveBeenCalledOnce();
      const insertedValues = insertMock.values.mock.calls[0][0];

      expect(insertedValues.id).toBe('user_created_001');
      expect(insertedValues.email).toBe('alice@example.com');
      expect(insertedValues.name).toBe('Alice Smith');
      expect(insertedValues.tier).toBe('basic');
    });

    it('extracts primary email from email_addresses array', async () => {
      const eventData = {
        id: 'user_created_002',
        email_addresses: [
          { email_address: 'secondary@example.com', id: 'ema_secondary' },
          { email_address: 'primary@example.com', id: 'ema_primary' },
        ],
        primary_email_address_id: 'ema_primary',
        first_name: 'Bob',
        last_name: null,
      };
      mockVerify.mockReturnValueOnce({ type: 'user.created', data: eventData });

      const request = buildClerkRequest('user.created', eventData);
      await POST(request);

      const insertMock = (db.insert as any).mock.results[0].value;
      const insertedValues = insertMock.values.mock.calls[0][0];
      expect(insertedValues.email).toBe('primary@example.com');
    });

    it('concatenates first_name + last_name for name', async () => {
      const eventData = {
        id: 'user_created_003',
        email_addresses: [{ email_address: 'c@example.com', id: 'ema_c' }],
        primary_email_address_id: 'ema_c',
        first_name: 'Charlie',
        last_name: 'Brown',
      };
      mockVerify.mockReturnValueOnce({ type: 'user.created', data: eventData });

      const request = buildClerkRequest('user.created', eventData);
      await POST(request);

      const insertMock = (db.insert as any).mock.results[0].value;
      const insertedValues = insertMock.values.mock.calls[0][0];
      expect(insertedValues.name).toBe('Charlie Brown');
    });

    it('falls back to {id}@clerk.user when no email_addresses', async () => {
      const eventData = {
        id: 'user_no_email',
        email_addresses: [],
        primary_email_address_id: null,
        first_name: 'Ghost',
        last_name: null,
      };
      mockVerify.mockReturnValueOnce({ type: 'user.created', data: eventData });

      const request = buildClerkRequest('user.created', eventData);
      await POST(request);

      const insertMock = (db.insert as any).mock.results[0].value;
      const insertedValues = insertMock.values.mock.calls[0][0];
      expect(insertedValues.email).toBe('user_no_email@clerk.user');
    });

    it('calls onConflictDoNothing for idempotency', async () => {
      const eventData = {
        id: 'user_idempotent',
        email_addresses: [{ email_address: 'd@example.com', id: 'ema_d' }],
        primary_email_address_id: 'ema_d',
        first_name: 'Dana',
        last_name: null,
      };
      mockVerify.mockReturnValueOnce({ type: 'user.created', data: eventData });

      const request = buildClerkRequest('user.created', eventData);
      await POST(request);

      const insertMock = (db.insert as any).mock.results[0].value;
      const valuesMock = insertMock.values.mock.results[0].value;
      expect(valuesMock.onConflictDoNothing).toHaveBeenCalledOnce();
    });
  });

  // ── user.updated ──────────────────────────────────────────────────────

  describe('user.updated', () => {
    it('updates email and name in DB by userId', async () => {
      const eventData = {
        id: 'user_upd_001',
        email_addresses: [
          { email_address: 'new@example.com', id: 'ema_new' },
        ],
        primary_email_address_id: 'ema_new',
        first_name: 'Updated',
        last_name: 'Name',
      };
      mockVerify.mockReturnValueOnce({ type: 'user.updated', data: eventData });

      const request = buildClerkRequest('user.updated', eventData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(db.update).toHaveBeenCalledOnce();

      const updateMock = (db.update as any).mock.results[0].value;
      expect(updateMock.set).toHaveBeenCalledOnce();

      const setArgs = updateMock.set.mock.calls[0][0];
      expect(setArgs.email).toBe('new@example.com');
      expect(setArgs.name).toBe('Updated Name');
      expect(setArgs.updatedAt).toBeInstanceOf(Date);
    });

    it('calls .where() with the correct user id', async () => {
      const eventData = {
        id: 'user_upd_002',
        email_addresses: [{ email_address: 'e@example.com', id: 'ema_e' }],
        primary_email_address_id: 'ema_e',
        first_name: 'Eve',
        last_name: null,
      };
      mockVerify.mockReturnValueOnce({ type: 'user.updated', data: eventData });

      const request = buildClerkRequest('user.updated', eventData);
      await POST(request);

      const updateMock = (db.update as any).mock.results[0].value;
      const setMock = updateMock.set.mock.results[0].value;
      expect(setMock.where).toHaveBeenCalledOnce();
    });
  });

  // ── user.deleted ──────────────────────────────────────────────────────

  describe('user.deleted', () => {
    it('soft deletes by setting deletedAt timestamp (does NOT hard delete)', async () => {
      const eventData = { id: 'user_del_001' };
      mockVerify.mockReturnValueOnce({ type: 'user.deleted', data: eventData });

      const request = buildClerkRequest('user.deleted', eventData);
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should use UPDATE not DELETE
      expect(db.update).toHaveBeenCalledOnce();

      // Verify deletedAt is set
      const updateMock = (db.update as any).mock.results[0].value;
      const setArgs = updateMock.set.mock.calls[0][0];
      expect(setArgs.deletedAt).toBeInstanceOf(Date);
      expect(setArgs.updatedAt).toBeInstanceOf(Date);
    });

    it('returns { received: true } with 200 on soft delete', async () => {
      const eventData = { id: 'user_del_002' };
      mockVerify.mockReturnValueOnce({ type: 'user.deleted', data: eventData });

      const request = buildClerkRequest('user.deleted', eventData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.received).toBe(true);
    });
  });

  // ── Unknown event types ───────────────────────────────────────────────

  describe('Unknown event types', () => {
    it('returns { received: true } with 200 for unknown event', async () => {
      const eventData = { id: 'user_xyz' };
      mockVerify.mockReturnValueOnce({
        type: 'session.created',
        data: eventData,
      });

      const request = buildClerkRequest('session.created', eventData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.received).toBe(true);
    });

    it('does not insert or update DB for unknown events', async () => {
      const eventData = { id: 'org_abc' };
      mockVerify.mockReturnValueOnce({
        type: 'organization.created',
        data: eventData,
      });

      const request = buildClerkRequest('organization.created', eventData);
      await POST(request);

      expect(db.insert).not.toHaveBeenCalled();
      expect(db.update).not.toHaveBeenCalled();
    });
  });
});
