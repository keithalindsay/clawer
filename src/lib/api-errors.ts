/**
 * Standardized API Error Responses
 * 
 * Provides consistent error response formatting across all API routes.
 * All errors follow the shape: { error: string, details?: string }
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * 401 Unauthorized - User not authenticated
 */
export function unauthorized(details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      ...(details && { details }),
    },
    { status: 401 }
  );
}

/**
 * 403 Forbidden - User authenticated but lacks permission
 */
export function forbidden(message: string, details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: 403 }
  );
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export function notFound(resource: string, details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: `${resource} not found`,
      ...(details && { details }),
    },
    { status: 404 }
  );
}

/**
 * 400 Bad Request - Invalid input
 */
export function badRequest(message: string, details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: 400 }
  );
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export function conflict(message: string, details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: 409 }
  );
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export function rateLimited(
  message: string,
  retryAfter?: number,
  metadata?: Record<string, any>
): NextResponse<ApiErrorResponse & Record<string, any>> {
  const headers: Record<string, string> = {};
  
  if (retryAfter !== undefined) {
    headers['Retry-After'] = String(retryAfter);
  }

  return NextResponse.json(
    {
      error: message,
      ...(retryAfter !== undefined && { retryAfter }),
      ...metadata,
    },
    { 
      status: 429,
      headers,
    }
  );
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export function serverError(message: string = 'Internal server error', details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: 500 }
  );
}

/**
 * 503 Service Unavailable - Service temporarily down
 */
export function serviceUnavailable(message: string, details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: 503 }
  );
}

/**
 * Custom error with specific status code
 */
export function customError(
  status: number,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): NextResponse<ApiErrorResponse & Record<string, any>> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
      ...metadata,
    },
    { status }
  );
}
