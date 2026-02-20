/**
 * Custom error types for Clawer.ai API
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Missing or invalid authentication') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Insufficient permissions or tier') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', 'Invalid request body or parameters', 400, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(limit: number, resetAt: string) {
    super('RATE_LIMITED', 'Too many requests', 429, { limit, resetAt });
  }
}

export class QuotaExceededError extends ApiError {
  constructor() {
    super('QUOTA_EXCEEDED', 'Daily message limit exceeded', 429);
  }
}

export class IntegrationRequiredError extends ApiError {
  constructor(integration: string) {
    super(
      'INTEGRATION_REQUIRED',
      `Bot requires ${integration} integration`,
      400,
      { requiredIntegration: integration }
    );
  }
}

export class IntegrationExpiredError extends ApiError {
  constructor(integration: string) {
    super(
      'INTEGRATION_EXPIRED',
      `${integration} OAuth token expired`,
      400,
      { expiredIntegration: integration }
    );
  }
}

export class ModelError extends ApiError {
  constructor(details: unknown) {
    super('MODEL_ERROR', 'Model provider error', 502, details);
  }
}

export class InternalError extends ApiError {
  constructor() {
    super('INTERNAL_ERROR', 'Internal server error', 500);
  }
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convert any error to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new InternalError();
  }
  
  return new InternalError();
}
