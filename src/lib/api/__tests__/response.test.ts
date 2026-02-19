/**
 * Tests for src/lib/api/response.ts
 * API response helpers: apiSuccess, apiError, apiErrors
 */

import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, apiErrors } from '@/lib/api/response';

describe('apiSuccess()', () => {
  it('returns status 200 by default', async () => {
    const response = apiSuccess({ foo: 'bar' });
    expect(response.status).toBe(200);
  });

  it('returns { success: true, data, meta }', async () => {
    const response = apiSuccess({ id: '123', name: 'Test' });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: '123', name: 'Test' });
    expect(body.meta).toBeDefined();
  });

  it('meta.requestId starts with req_', async () => {
    const response = apiSuccess({});
    const body = await response.json();
    expect(body.meta.requestId).toMatch(/^req_/);
  });

  it('meta.timestamp is a valid ISO 8601 string', async () => {
    const response = apiSuccess({});
    const body = await response.json();
    expect(() => new Date(body.meta.timestamp)).not.toThrow();
    expect(new Date(body.meta.timestamp).toISOString()).toBe(body.meta.timestamp);
  });

  it('accepts custom status code', async () => {
    const response = apiSuccess({ created: true }, 201);
    expect(response.status).toBe(201);
  });

  it('passes data through unchanged', async () => {
    const data = { nested: { array: [1, 2, 3], bool: true } };
    const response = apiSuccess(data);
    const body = await response.json();
    expect(body.data).toEqual(data);
  });

  it('accepts custom requestId', async () => {
    const response = apiSuccess({}, 200, 'req_custom_123');
    const body = await response.json();
    expect(body.meta.requestId).toBe('req_custom_123');
  });
});

describe('apiError()', () => {
  it('returns status 400 by default', async () => {
    const response = apiError('SOME_ERROR', 'Something went wrong');
    expect(response.status).toBe(400);
  });

  it('returns { success: false, error: { code, message }, meta }', async () => {
    const response = apiError('MY_CODE', 'My message');
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MY_CODE');
    expect(body.error.message).toBe('My message');
    expect(body.meta).toBeDefined();
  });

  it('includes details when provided', async () => {
    const details = { field: 'email', reason: 'invalid format' };
    const response = apiError('VALIDATION_ERROR', 'Bad input', 400, details);
    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it('accepts custom status code', async () => {
    const response = apiError('SERVICE_DOWN', 'Unavailable', 503);
    expect(response.status).toBe(503);
  });
});

describe('apiErrors shortcuts', () => {
  it('unauthorized() → 401, UNAUTHORIZED', async () => {
    const res = apiErrors.unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('forbidden() → 403, FORBIDDEN', async () => {
    const res = apiErrors.forbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('notFound("Widget") → 404, NOT_FOUND, message contains Widget', async () => {
    const res = apiErrors.notFound('Widget');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Widget');
  });

  it('notFound() defaults to Resource', async () => {
    const res = apiErrors.notFound();
    const body = await res.json();
    expect(body.error.message).toContain('Resource');
  });

  it('validationError({ field }) → 400, VALIDATION_ERROR, has details', async () => {
    const res = apiErrors.validationError({ field: 'name', issue: 'required' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual({ field: 'name', issue: 'required' });
  });

  it('rateLimited(100, resetAt) → 429, RATE_LIMITED', async () => {
    const res = apiErrors.rateLimited(100, '2026-01-01T00:00:00Z');
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(body.error.details).toEqual({ limit: 100, resetAt: '2026-01-01T00:00:00Z' });
  });

  it('quotaExceeded() → 429, QUOTA_EXCEEDED', async () => {
    const res = apiErrors.quotaExceeded();
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('internalError() → 500, INTERNAL_ERROR', async () => {
    const res = apiErrors.internalError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('integrationRequired("slack") → 400, INTEGRATION_REQUIRED, details.requiredIntegration=slack', async () => {
    const res = apiErrors.integrationRequired('slack');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('INTEGRATION_REQUIRED');
    expect(body.error.details).toEqual({ requiredIntegration: 'slack' });
  });

  it('integrationExpired("telegram") → 400, INTEGRATION_EXPIRED', async () => {
    const res = apiErrors.integrationExpired('telegram');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('INTEGRATION_EXPIRED');
    expect(body.error.details).toEqual({ expiredIntegration: 'telegram' });
  });

  it('modelError({ model: "gpt-4" }) → 502, MODEL_ERROR', async () => {
    const res = apiErrors.modelError({ model: 'gpt-4' });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.code).toBe('MODEL_ERROR');
    expect(body.error.details).toEqual({ model: 'gpt-4' });
  });

  it('all error responses have success: false', async () => {
    const responses = [
      apiErrors.unauthorized(),
      apiErrors.forbidden(),
      apiErrors.notFound(),
      apiErrors.quotaExceeded(),
      apiErrors.internalError(),
    ];
    for (const res of responses) {
      const body = await res.json();
      expect(body.success).toBe(false);
    }
  });

  it('all error responses have meta with requestId and timestamp', async () => {
    const res = apiErrors.internalError();
    const body = await res.json();
    expect(body.meta.requestId).toMatch(/^req_/);
    expect(body.meta.timestamp).toBeTruthy();
  });
});
