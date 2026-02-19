import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../webhooks/stripe/route';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
  },
}));

vi.mock('@/lib/provisioner', () => ({
  provisionContainer: vi.fn(),
  stopContainer: vi.fn(),
}));

vi.mock('@/lib/email', () => ({ sendWelcomeEmail: vi.fn() }));
vi.mock('@/lib/alerts', () => ({ alertPaymentFailure: vi.fn() }));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) =>
      name === 'stripe-signature' ? 'test-sig' : null
    ),
  })),
}));

// ── Imports of mocked modules ──────────────────────────────────────────────

import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { provisionContainer, stopContainer } from '@/lib/provisioner';
import { sendWelcomeEmail } from '@/lib/email';
import { alertPaymentFailure } from '@/lib/alerts';
import { headers } from 'next/headers';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildRequest(body: string, sig = 'test-sig') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': sig },
  });
}

function buildEvent(type: string, data: object): import('stripe').Stripe.Event {
  return {
    id: `evt_test_${type.replace(/\./g, '_')}`,
    type,
    data: { object: data },
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as unknown as import('stripe').Stripe.Event;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    // Default: constructEvent succeeds
    (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
      buildEvent('unknown.event', {})
    );

    // Default: headers return a valid signature
    (headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn((name: string) =>
        name === 'stripe-signature' ? 'test-sig' : null
      ),
    });
  });

  // ── Signature Verification ────────────────────────────────────────────────

  describe('Signature verification', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      (headers as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn(() => null),
      });

      const req = buildRequest('{}', '');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/missing stripe-signature/i);
    });

    it('returns 500 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toMatch(/webhook not configured/i);
    });

    it('returns 400 when constructEvent throws (bad signature)', async () => {
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockImplementation(
        () => { throw new Error('No signatures found matching the expected signature for payload'); }
      );

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/signature verification failed/i);
    });

    it('calls constructEvent with (body, signature, webhookSecret)', async () => {
      const bodyStr = JSON.stringify({ type: 'unknown.event' });
      const req = buildRequest(bodyStr);
      await POST(req as any);

      expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
        bodyStr,
        'test-sig',
        'whsec_test_secret'
      );
    });
  });

  // ── checkout.session.completed ────────────────────────────────────────────

  describe('checkout.session.completed', () => {
    const session = {
      client_reference_id: 'user_abc',
      customer: 'cus_stripe_123',
      subscription: 'sub_stripe_456',
    };

    beforeEach(() => {
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
        buildEvent('checkout.session.completed', session)
      );

      // First findFirst call (for email) → returns user with email/name
      // Second findFirst call (for teamTemplate) → returns user with template
      (db.query.users.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ email: 'alice@example.com', name: 'Alice' })
        .mockResolvedValueOnce({ teamTemplate: 'lifeos' });

      (provisionContainer as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        port: 3100,
      });
    });

    it('updates user tier="pro" and saves stripeCustomerId/stripeSubscriptionId', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);

      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCustomerId: 'cus_stripe_123',
          stripeSubscriptionId: 'sub_stripe_456',
          tier: 'pro',
        })
      );
    });

    it('calls provisionContainer with userId and teamTemplate from DB', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      const req = buildRequest('{}');
      await POST(req as any);

      expect(provisionContainer).toHaveBeenCalledWith('user_abc', 'lifeos');
    });

    it('calls sendWelcomeEmail with user email and name', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      const req = buildRequest('{}');
      await POST(req as any);

      expect(sendWelcomeEmail).toHaveBeenCalledWith('alice@example.com', 'Alice');
    });

    it('still returns { received: true } even when provisionContainer throws', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      (provisionContainer as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Docker daemon not available')
      );

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('still returns { received: true } even when sendWelcomeEmail throws', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      (sendWelcomeEmail as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('SMTP server unreachable')
      );

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('skips provisioning when userId (client_reference_id) is null', async () => {
      const sessionWithoutUser = {
        client_reference_id: null,
        customer: 'cus_no_user',
        subscription: 'sub_no_user',
      };
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
        buildEvent('checkout.session.completed', sessionWithoutUser)
      );

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
      expect(provisionContainer).not.toHaveBeenCalled();
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  // ── customer.subscription.deleted ────────────────────────────────────────

  describe('customer.subscription.deleted', () => {
    const subscription = {
      customer: 'cus_deleted_123',
      status: 'canceled',
    };

    beforeEach(() => {
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
        buildEvent('customer.subscription.deleted', subscription)
      );

      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_to_downgrade',
        stripeCustomerId: 'cus_deleted_123',
      });

      (stopContainer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    it('finds user by stripeCustomerId', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      const req = buildRequest('{}');
      await POST(req as any);

      expect(db.query.users.findFirst).toHaveBeenCalled();
    });

    it('downgrades user to tier="free" and clears stripeSubscriptionId', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: 'free',
          stripeSubscriptionId: null,
        })
      );
    });

    it('calls stopContainer with the user id', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      const req = buildRequest('{}');
      await POST(req as any);

      expect(stopContainer).toHaveBeenCalledWith('user_to_downgrade');
    });

    it('returns { received: true } even when stopContainer throws', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

      (stopContainer as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Container not found')
      );

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  // ── customer.subscription.updated (past_due) ──────────────────────────────

  describe('customer.subscription.updated with status="past_due"', () => {
    it('calls alertPaymentFailure with customerId and past_due message', async () => {
      const subscription = {
        customer: 'cus_past_due_456',
        status: 'past_due',
      };
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
        buildEvent('customer.subscription.updated', subscription)
      );

      (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (alertPaymentFailure as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
      expect(alertPaymentFailure).toHaveBeenCalledWith(
        'cus_past_due_456',
        expect.stringMatching(/past.?due/i)
      );
    });
  });

  // ── invoice.payment_failed ────────────────────────────────────────────────

  describe('invoice.payment_failed', () => {
    it('calls alertPaymentFailure with customerId', async () => {
      const invoice = {
        customer: 'cus_invoice_failed_789',
        status: 'open',
      };
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
        buildEvent('invoice.payment_failed', invoice)
      );

      (alertPaymentFailure as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
      expect(alertPaymentFailure).toHaveBeenCalledWith(
        'cus_invoice_failed_789',
        expect.any(String)
      );
    });
  });

  // ── Unknown event type ────────────────────────────────────────────────────

  describe('unknown event type', () => {
    it('returns { received: true } with 200 status and does not throw', async () => {
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue(
        buildEvent('totally.unknown.event', { foo: 'bar' })
      );

      const req = buildRequest('{}');
      const res = await POST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
