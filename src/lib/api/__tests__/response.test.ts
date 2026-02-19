import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, apiErrors } from '../response';

// ─── No mocking needed — these are pure utility functions ───

describe('apiSuccess()', () => {
  it('returns status 200 by default', async () => {
    const response = apiSuccess({ hello: 'world' });
    expect(response.status).toBe(200);
  });

  it('response body has { success: true, data, meta }', async () => {
    const response = apiSuccess({ foo: 'bar' });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ foo: 'bar' });
    expect(body.meta).toBeDefined();
  });

  it('meta.requestId starts with "req_"', async () => {
    const response = apiSuccess({});
    const body = await response.json();
    expect(body.meta.requestId).toMatch(/^req_/);
  });

  it('meta.timestamp is a valid ISO 8601 string', async () => {
    const response = apiSuccess({});
    const body = await response.json();
    const ts = body.meta.timestamp;
    expect(typeof ts).toBe('string');
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('accepts a custom status code', async () => {
    const response = apiSuccess({ created: true }, 201);
    expect(response.status).toBe(201);
  });

  it('data is passed through unchanged', async () => {
    const payload = { id: 42, name: 'Alice', tags: ['a', 'b'] };
    const response = apiSuccess(payload);
    const body = await response.json();
    expect(body.data).toEqual(payload);
  });

  it('works with null data', async () => {
    const response = apiSuccess(null);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('works with array data', async () => {
    const response = apiSuccess([1, 2, 3]);
    const body = await response.json();
    expect(body.data).toEqual([1, 2, 3]);
  });

  it('accepts an optional requestId and includes it in meta', async () => {
    const response = apiSuccess({}, 200, 'req_custom_123');
    const body = await response.json();
    expect(body.meta.requestId).toBe('req_custom_123');
  });
});

describe('apiError()', () => {
  it('returns status 400 by default', async () => {
    const response = apiError('BAD_INPUT', 'Something went wrong');
    expect(response.status).toBe(400);
  });

  it('response body has { success: false, error: { code, message }, meta }', async () => {
    const response = apiError('MY_CODE', 'My message');
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MY_CODE');
    expect(body.error.message).toBe('My message');
    expect(body.meta).toBeDefined();
  });

  it('error.code and error.message match input', async () => {
    const response = apiError('TEST_CODE', 'Test message');
    const body = await response.json();
    expect(body.error.code).toBe('TEST_CODE');
    expect(body.error.message).toBe('Test message');
  });

  it('details is included when provided', async () => {
    const details = { field: 'email', reason: 'invalid format' };
    const response = apiError('VALIDATION_ERROR', 'Bad input', 400, details);
    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it('details is undefined when not provided', async () => {
    const response = apiError('NOT_FOUND', 'Not found');
    const body = await response.json();
    // details may be absent or undefined — just confirm it's not something we didn't pass
    expect(body.error.details).toBeUndefined();
  });

  it('accepts a custom status code', async () => {
    const response = apiError('SERVER_DOWN', 'Service unavailable', 503);
    expect(response.status).toBe(503);
  });

  it('meta.requestId starts with "req_"', async () => {
    const response = apiError('ERR', 'error');
    const body = await response.json();
    expect(body.meta.requestId).toMatch(/^req_/);
  });

  it('meta.timestamp is a valid ISO 8601 string', async () => {
    const response = apiError('ERR', 'error');
    const body = await response.json();
    const ts = body.meta.timestamp;
    expect(new Date(ts).toISOString()).toBe(ts);
  });
});

describe('apiErrors shortcuts', () => {
  it('.unauthorized() → status 401, code="UNAUTHORIZED"', async () => {
    const response = apiErrors.unauthorized();
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('.forbidden() → status 403, code="FORBIDDEN"', async () => {
    const response = apiErrors.forbidden();
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('.notFound("Widget") → status 404, code="NOT_FOUND", message contains "Widget"', async () => {
    const response = apiErrors.notFound('Widget');
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Widget');
  });

  it('.notFound() with default resource name still returns 404', async () => {
    const response = apiErrors.notFound();
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('.validationError({ field: "x" }) → status 400, code="VALIDATION_ERROR", details present', async () => {
    const details = { field: 'x', error: 'required' };
    const response = apiErrors.validationError(details);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual(details);
  });

  it('.rateLimited(100, "reset-time") → status 429, code="RATE_LIMITED"', async () => {
    const response = apiErrors.rateLimited(100, '2026-02-20T00:00:00.000Z');
    const body = await response.json();
    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(body.error.details).toMatchObject({ limit: 100, resetAt: '2026-02-20T00:00:00.000Z' });
  });

  it('.quotaExceeded() → status 429, code="QUOTA_EXCEEDED"', async () => {
    const response = apiErrors.quotaExceeded();
    const body = await response.json();
    expect(response.status).toBe(429);
    expect(body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('.internalError() → status 500, code="INTERNAL_ERROR"', async () => {
    const response = apiErrors.internalError();
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('.integrationRequired("slack") → status 400, code="INTEGRATION_REQUIRED", details.requiredIntegration="slack"', async () => {
    const response = apiErrors.integrationRequired('slack');
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INTEGRATION_REQUIRED');
    expect(body.error.details).toMatchObject({ requiredIntegration: 'slack' });
  });

  it('.integrationExpired("telegram") → status 400, code="INTEGRATION_EXPIRED"', async () => {
    const response = apiErrors.integrationExpired('telegram');
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INTEGRATION_EXPIRED');
    expect(body.error.message).toContain('telegram');
  });

  it('.modelError({ model: "gpt-4" }) → status 502, code="MODEL_ERROR"', async () => {
    const details = { model: 'gpt-4', reason: 'timeout' };
    const response = apiErrors.modelError(details);
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.error.code).toBe('MODEL_ERROR');
    expect(body.error.details).toEqual(details);
  });

  it('all shortcuts return success: false', async () => {
    const responses = await Promise.all([
      apiErrors.unauthorized().json(),
      apiErrors.forbidden().json(),
      apiErrors.notFound().json(),
      apiErrors.validationError({}).json(),
      apiErrors.rateLimited(10, 'now').json(),
      apiErrors.quotaExceeded().json(),
      apiErrors.internalError().json(),
      apiErrors.integrationRequired('x').json(),
      apiErrors.modelError({}).json(),
    ]);
    responses.forEach((body) => {
      expect(body.success).toBe(false);
    });
  });

  it('all shortcuts include meta with requestId and timestamp', async () => {
    const bodies = await Promise.all([
      apiErrors.unauthorized().json(),
      apiErrors.internalError().json(),
      apiErrors.notFound('Test').json(),
    ]);
    bodies.forEach((body) => {
      expect(body.meta).toBeDefined();
      expect(body.meta.requestId).toMatch(/^req_/);
      expect(typeof body.meta.timestamp).toBe('string');
    });
  });
});
