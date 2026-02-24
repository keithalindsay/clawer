/**
 * Tests for API error utility functions
 * 
 * Validates that each error helper returns:
 * - Correct HTTP status code
 * - Correct response body shape: { error: string, details?: string }
 */

import { describe, it, expect } from 'vitest';
import * as apiErrors from '../api-errors';

describe('API Error Utilities', () => {
  describe('unauthorized()', () => {
    it('returns 401 status code', async () => {
      const response = apiErrors.unauthorized();
      expect(response.status).toBe(401);
    });

    it('returns error message', async () => {
      const response = apiErrors.unauthorized();
      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Unauthorized');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.unauthorized('Missing auth token');
      const json = await response.json();
      expect(json).toHaveProperty('details');
      expect(json.details).toBe('Missing auth token');
    });

    it('omits details when not provided', async () => {
      const response = apiErrors.unauthorized();
      const json = await response.json();
      expect(json).not.toHaveProperty('details');
    });
  });

  describe('forbidden()', () => {
    it('returns 403 status code', async () => {
      const response = apiErrors.forbidden('Access denied');
      expect(response.status).toBe(403);
    });

    it('returns custom error message', async () => {
      const response = apiErrors.forbidden('Insufficient permissions');
      const json = await response.json();
      expect(json.error).toBe('Insufficient permissions');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.forbidden('Admin only', 'Requires admin role');
      const json = await response.json();
      expect(json.details).toBe('Requires admin role');
    });
  });

  describe('notFound()', () => {
    it('returns 404 status code', async () => {
      const response = apiErrors.notFound('User');
      expect(response.status).toBe(404);
    });

    it('formats error message with resource name', async () => {
      const response = apiErrors.notFound('Task');
      const json = await response.json();
      expect(json.error).toBe('Task not found');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.notFound('Agent', 'ID: abc123');
      const json = await response.json();
      expect(json.details).toBe('ID: abc123');
    });
  });

  describe('badRequest()', () => {
    it('returns 400 status code', async () => {
      const response = apiErrors.badRequest('Invalid input');
      expect(response.status).toBe(400);
    });

    it('returns custom error message', async () => {
      const response = apiErrors.badRequest('Missing required field');
      const json = await response.json();
      expect(json.error).toBe('Missing required field');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.badRequest('Validation failed', 'Field: email');
      const json = await response.json();
      expect(json.details).toBe('Field: email');
    });
  });

  describe('conflict()', () => {
    it('returns 409 status code', async () => {
      const response = apiErrors.conflict('Resource already exists');
      expect(response.status).toBe(409);
    });

    it('returns custom error message', async () => {
      const response = apiErrors.conflict('Email already registered');
      const json = await response.json();
      expect(json.error).toBe('Email already registered');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.conflict('Duplicate entry', 'email: test@example.com');
      const json = await response.json();
      expect(json.details).toBe('email: test@example.com');
    });
  });

  describe('rateLimited()', () => {
    it('returns 429 status code', async () => {
      const response = apiErrors.rateLimited('Too many requests');
      expect(response.status).toBe(429);
    });

    it('returns error message', async () => {
      const response = apiErrors.rateLimited('Rate limit exceeded');
      const json = await response.json();
      expect(json.error).toBe('Rate limit exceeded');
    });

    it('includes retryAfter in body when provided', async () => {
      const response = apiErrors.rateLimited('Too many requests', 60);
      const json = await response.json();
      expect(json.retryAfter).toBe(60);
    });

    it('sets Retry-After header when retryAfter provided', () => {
      const response = apiErrors.rateLimited('Too many requests', 120);
      expect(response.headers.get('Retry-After')).toBe('120');
    });

    it('omits Retry-After header when not provided', () => {
      const response = apiErrors.rateLimited('Too many requests');
      expect(response.headers.get('Retry-After')).toBeNull();
    });

    it('includes metadata when provided', async () => {
      const response = apiErrors.rateLimited(
        'Daily limit exceeded',
        3600,
        { limit: 100, remaining: 0 }
      );
      const json = await response.json();
      expect(json.limit).toBe(100);
      expect(json.remaining).toBe(0);
    });
  });

  describe('serverError()', () => {
    it('returns 500 status code', async () => {
      const response = apiErrors.serverError();
      expect(response.status).toBe(500);
    });

    it('returns default error message when none provided', async () => {
      const response = apiErrors.serverError();
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });

    it('returns custom error message', async () => {
      const response = apiErrors.serverError('Database connection failed');
      const json = await response.json();
      expect(json.error).toBe('Database connection failed');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.serverError('Query failed', 'Connection timeout');
      const json = await response.json();
      expect(json.details).toBe('Connection timeout');
    });
  });

  describe('serviceUnavailable()', () => {
    it('returns 503 status code', async () => {
      const response = apiErrors.serviceUnavailable('Service down');
      expect(response.status).toBe(503);
    });

    it('returns error message', async () => {
      const response = apiErrors.serviceUnavailable('Container not running');
      const json = await response.json();
      expect(json.error).toBe('Container not running');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.serviceUnavailable('API unavailable', 'Maintenance mode');
      const json = await response.json();
      expect(json.details).toBe('Maintenance mode');
    });
  });

  describe('customError()', () => {
    it('returns custom status code', async () => {
      const response = apiErrors.customError(418, "I'm a teapot");
      expect(response.status).toBe(418);
    });

    it('returns error message', async () => {
      const response = apiErrors.customError(422, 'Unprocessable entity');
      const json = await response.json();
      expect(json.error).toBe('Unprocessable entity');
    });

    it('includes details when provided', async () => {
      const response = apiErrors.customError(422, 'Invalid data', 'Schema validation failed');
      const json = await response.json();
      expect(json.details).toBe('Schema validation failed');
    });

    it('includes metadata when provided', async () => {
      const response = apiErrors.customError(
        422,
        'Validation failed',
        'Multiple errors',
        { fields: ['name', 'email'] }
      );
      const json = await response.json();
      expect(json.fields).toEqual(['name', 'email']);
    });
  });

  describe('response body shape consistency', () => {
    it('all errors follow { error, details? } shape', async () => {
      const responses = [
        apiErrors.unauthorized(),
        apiErrors.forbidden('Denied'),
        apiErrors.notFound('Resource'),
        apiErrors.badRequest('Invalid'),
        apiErrors.conflict('Exists'),
        apiErrors.rateLimited('Limited'),
        apiErrors.serverError(),
        apiErrors.serviceUnavailable('Down'),
        apiErrors.customError(418, 'Teapot'),
      ];

      for (const response of responses) {
        const json = await response.json();
        expect(json).toHaveProperty('error');
        expect(typeof json.error).toBe('string');
        
        // details is optional
        if ('details' in json) {
          expect(typeof json.details).toBe('string');
        }
      }
    });
  });
});
