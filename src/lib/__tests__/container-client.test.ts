/**
 * Tests for container-client.ts
 *
 * Covers:
 *  - getContainerApiUrl
 *  - containerRequest (auth header injection, health endpoint skip, error handling)
 *  - containerApi methods (getGatewayToken integration, per-method behavior)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
    },
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { db } from '@/lib/db';
import {
  getContainerApiUrl,
  containerRequest,
  containerApi,
} from '@/lib/container-client';

// ─── Type helpers ─────────────────────────────────────────────────────────────

const mockFindFirst = db.query.users.findFirst as ReturnType<typeof vi.fn>;

// ─── Fetch mock ───────────────────────────────────────────────────────────────

let capturedFetchCalls: Array<{ url: string; init: RequestInit }> = [];
let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> } = {
  ok: true,
  status: 200,
  json: async () => ({ content: 'Hello!' }),
};

const originalFetch = global.fetch;

beforeEach(() => {
  capturedFetchCalls = [];
  global.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    capturedFetchCalls.push({ url: url.toString(), init: init || {} });
    return {
      ok: mockFetchResponse.ok,
      status: mockFetchResponse.status,
      json: mockFetchResponse.json,
    } as Response;
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ content: 'Hello!' }),
  };
});

// ─── Tests: getContainerApiUrl ────────────────────────────────────────────────

describe('getContainerApiUrl()', () => {
  it('returns http://localhost:<port> for default CONTAINER_HOST', () => {
    const url = getContainerApiUrl(4010);
    expect(url).toBe('http://localhost:4010');
  });

  it('returns correct URL for different ports', () => {
    expect(getContainerApiUrl(5000)).toBe('http://localhost:5000');
    expect(getContainerApiUrl(4200)).toBe('http://localhost:4200');
  });
});

// ─── Tests: containerRequest ──────────────────────────────────────────────────

describe('containerRequest()', () => {
  it('adds Authorization header when token is provided and path is not health/ready', async () => {
    await containerRequest(4010, '/api/chat', { method: 'POST', body: '{}' }, 'mytoken');

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer mytoken');
  });

  it('does NOT add Authorization header for /api/health path', async () => {
    await containerRequest(4010, '/api/health', {}, 'mytoken');

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('does NOT add Authorization header for /ready path', async () => {
    await containerRequest(4010, '/ready', {}, 'mytoken');

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('does NOT add Authorization header when no token is provided', async () => {
    await containerRequest(4010, '/api/chat', { method: 'POST' });

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('always sets Content-Type: application/json header', async () => {
    await containerRequest(4010, '/api/chat', {});

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('returns { data, error: null, status: 200 } on success', async () => {
    mockFetchResponse = { ok: true, status: 200, json: async () => ({ content: 'Hi' }) };

    const result = await containerRequest(4010, '/api/chat', {});

    expect(result.data).toEqual({ content: 'Hi' });
    expect(result.error).toBeNull();
    expect(result.status).toBe(200);
  });

  it('returns { data: null, error, status } when response.ok is false', async () => {
    mockFetchResponse = {
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service unavailable' }),
    };

    const result = await containerRequest(4010, '/api/chat', {});

    expect(result.data).toBeNull();
    expect(result.error).toBe('Service unavailable');
    expect(result.status).toBe(503);
  });

  it('returns { data: null, error: "Container unreachable", status: 503 } when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await containerRequest(4010, '/api/chat', {});

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.status).toBe(503);
  });

  it('constructs correct URL from port and path', async () => {
    await containerRequest(4200, '/api/whatsapp/qr', {});

    const [call] = capturedFetchCalls;
    expect(call.url).toBe('http://localhost:4200/api/whatsapp/qr');
  });

  it('passes method and body to fetch', async () => {
    const body = JSON.stringify({ message: 'hello' });
    await containerRequest(4010, '/api/chat', { method: 'POST', body });

    const [call] = capturedFetchCalls;
    expect(call.init.method).toBe('POST');
    expect(call.init.body).toBe(body);
  });

  it('falls back to generic error message when response.ok=false and no error field', async () => {
    mockFetchResponse = {
      ok: false,
      status: 404,
      json: async () => ({}), // no error field
    };

    const result = await containerRequest(4010, '/api/missing', {});

    expect(result.error).toMatch(/404/);
    expect(result.status).toBe(404);
  });
});

// ─── Tests: getGatewayToken (via containerApi) ────────────────────────────────

describe('containerApi — getGatewayToken integration', () => {
  it('queries DB for gateway token using containerPort', async () => {
    mockFindFirst.mockResolvedValue({ gatewayToken: 'abc123token' });

    await containerApi.health(4010);

    expect(mockFindFirst).toHaveBeenCalled();
  });

  it('returns null gateway token when user not found (token lookup returns null)', async () => {
    mockFindFirst.mockResolvedValue(null);

    // Should not throw — proceeds with no token
    const result = await containerApi.health(4010);

    // health is a /health path so no auth header regardless
    expect(result.status).toBe(200);
  });

  it('adds Authorization header to chat request using DB token', async () => {
    mockFindFirst.mockResolvedValue({ gatewayToken: 'secret-gateway-token-xyz' });

    await containerApi.chat(4010, 'Hello');

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer secret-gateway-token-xyz');
  });

  it('uses explicitToken over DB token for chat when provided', async () => {
    mockFindFirst.mockResolvedValue({ gatewayToken: 'db-token' });

    await containerApi.chat(4010, 'Hello', undefined, undefined, 'explicit-token');

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer explicit-token');
    // DB should NOT have been queried since explicit token was given
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});

// ─── Tests: containerApi — method coverage ────────────────────────────────────

describe('containerApi methods', () => {
  beforeEach(() => {
    mockFindFirst.mockResolvedValue({ gatewayToken: 'test-token-abc' });
  });

  it('containerApi.health calls /api/health (no auth header)', async () => {
    await containerApi.health(4010);

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(call.url).toContain('/api/health');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('containerApi.ready calls /ready (no auth header)', async () => {
    await containerApi.ready(4010);

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(call.url).toContain('/ready');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('containerApi.chat sends POST to /api/chat with message payload', async () => {
    await containerApi.chat(4010, 'Hello World', undefined, { model: 'gemini-flash' });

    const [call] = capturedFetchCalls;
    expect(call.url).toContain('/api/chat');
    expect(call.init.method).toBe('POST');

    const body = JSON.parse(call.init.body as string);
    expect(body.message).toBe('Hello World');
    expect(body.settings.model).toBe('gemini-flash');
  });

  it('containerApi.whatsappQR sends GET to /api/whatsapp/qr with auth', async () => {
    await containerApi.whatsappQR(4010);

    const [call] = capturedFetchCalls;
    const headers = call.init.headers as Record<string, string>;
    expect(call.url).toContain('/api/whatsapp/qr');
    expect(headers['Authorization']).toBe('Bearer test-token-abc');
  });

  it('containerApi.whatsappStatus sends GET to /api/whatsapp/status with auth', async () => {
    await containerApi.whatsappStatus(4010);

    const [call] = capturedFetchCalls;
    expect(call.url).toContain('/api/whatsapp/status');
    expect((call.init.headers as Record<string, string>)['Authorization']).toBeTruthy();
  });

  it('containerApi.whatsappLink sends POST to /api/whatsapp/link with auth', async () => {
    await containerApi.whatsappLink(4010);

    const [call] = capturedFetchCalls;
    expect(call.url).toContain('/api/whatsapp/link');
    expect(call.init.method).toBe('POST');
    expect((call.init.headers as Record<string, string>)['Authorization']).toBeTruthy();
  });

  it('containerApi.whatsappDisconnect sends POST to /api/whatsapp/disconnect with auth', async () => {
    await containerApi.whatsappDisconnect(4010);

    const [call] = capturedFetchCalls;
    expect(call.url).toContain('/api/whatsapp/disconnect');
    expect(call.init.method).toBe('POST');
    expect((call.init.headers as Record<string, string>)['Authorization']).toBeTruthy();
  });

  it('containerApi.pushApiKeys sends POST to /api/keys/push with key payload', async () => {
    await containerApi.pushApiKeys(4010, { openaiKey: 'sk-123', googleKey: 'goog-456' });

    const [call] = capturedFetchCalls;
    expect(call.url).toContain('/api/keys/push');
    expect(call.init.method).toBe('POST');

    const body = JSON.parse(call.init.body as string);
    expect(body.openaiKey).toBe('sk-123');
    expect(body.googleKey).toBe('goog-456');
  });
});
