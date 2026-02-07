/**
 * Standard API response helpers for CLAWER.AI
 * Follows the spec format: { success, data, error, meta }
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create meta object for responses
 */
function createMeta(requestId?: string) {
  return {
    requestId: requestId || generateRequestId(),
    timestamp: getTimestamp(),
  };
}

/**
 * Success response
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: createMeta(requestId),
    } as ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Error response
 */
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: createMeta(requestId),
    } as ApiErrorResponse,
    { status }
  );
}

/**
 * Common error responses
 */
export const apiErrors = {
  unauthorized: (requestId?: string) =>
    apiError('UNAUTHORIZED', 'Missing or invalid authentication', 401, undefined, requestId),
  
  forbidden: (message = 'Insufficient permissions or tier', requestId?: string) =>
    apiError('FORBIDDEN', message, 403, undefined, requestId),
  
  notFound: (resource = 'Resource', requestId?: string) =>
    apiError('NOT_FOUND', `${resource} not found`, 404, undefined, requestId),
  
  validationError: (details: unknown, requestId?: string) =>
    apiError('VALIDATION_ERROR', 'Invalid request body or parameters', 400, details, requestId),
  
  rateLimited: (limit: number, resetAt: string, requestId?: string) =>
    apiError('RATE_LIMITED', 'Too many requests', 429, { limit, resetAt }, requestId),
  
  quotaExceeded: (requestId?: string) =>
    apiError('QUOTA_EXCEEDED', 'Daily message limit exceeded', 429, undefined, requestId),
  
  integrationRequired: (integration: string, requestId?: string) =>
    apiError(
      'INTEGRATION_REQUIRED',
      `Bot requires ${integration} integration`,
      400,
      { requiredIntegration: integration },
      requestId
    ),
  
  integrationExpired: (integration: string, requestId?: string) =>
    apiError(
      'INTEGRATION_EXPIRED',
      `${integration} OAuth token expired`,
      400,
      { expiredIntegration: integration },
      requestId
    ),
  
  modelError: (details: unknown, requestId?: string) =>
    apiError('MODEL_ERROR', 'Model provider error', 502, details, requestId),
  
  internalError: (requestId?: string) =>
    apiError('INTERNAL_ERROR', 'Internal server error', 500, undefined, requestId),
};
