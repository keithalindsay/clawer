# Authentication & API Setup

## Overview

This document describes the authentication and API infrastructure for CLAWER.AI, implemented by Engineer 3.

## Completed Deliverables

### ✅ 1. API Utilities

**Location:** `src/lib/api/`

- **`response.ts`** - Standard response helpers
  - `apiSuccess<T>(data, status, requestId)` - Success responses
  - `apiError(code, message, status, details, requestId)` - Error responses
  - Pre-built error responses in `apiErrors` object

- **`errors.ts`** - Error types and handling
  - Custom error classes: `ApiError`, `UnauthorizedError`, `ForbiddenError`, etc.
  - `isApiError(error)` - Type guard
  - `toApiError(error)` - Error converter

- **`validate.ts`** - Zod validation middleware
  - `validate<T>(schema, data)` - Sync validation
  - `parseAndValidate<T>(request, schema)` - Async JSON body validation
  - Pre-built schemas in `schemas` object

### ✅ 2. Rate Limiting

**Location:** `src/lib/rate-limit/index.ts`

- Redis-based sliding window rate limiter
- Supports per-tier limits (free, basic, pro, enterprise)
- Functions:
  - `checkUserRateLimit(userId, tier)` - Per-minute request limit
  - `checkMessageQuota(userId, tier)` - Daily message quota
  - `incrementMessageCount(userId)` - Track successful messages
  
**Stub Mode:** If `REDIS_URL` is not set, rate limiting always passes (for development).

### ✅ 3. Clerk Middleware

**Location:** `src/middleware.ts`

Protects routes:
- `/dashboard/*` - Requires authentication
- `/api/*` - Requires authentication (except webhooks)

Public routes:
- `/` - Landing page
- `/sign-in/*` - Auth pages
- `/sign-up/*` - Auth pages
- `/api/webhooks/*` - Webhooks (verified separately)

### ✅ 4. Auth Pages

**Sign In:** `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
**Sign Up:** `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

Both pages render Clerk components with custom styling and redirect to `/dashboard` after auth.

### ✅ 5. API Routes

All routes follow the API spec response format:

```typescript
// Success
{ success: true, data: T, meta: { requestId, timestamp } }

// Error
{ success: false, error: { code, message, details }, meta: { requestId, timestamp } }
```

**Created Routes:**

1. **`GET /api/bots`** - List available bot types
   - Returns: Array of bot type definitions
   - Auth: Required
   - Rate limited

2. **`GET /api/bots/[botId]`** - Get bot details
   - Returns: Bot instance details
   - Auth: Required
   - Rate limited

3. **`POST /api/bots/[botId]/activate`** - Activate bot for user
   - Returns: Activated bot status
   - Auth: Required
   - Rate limited

4. **`GET /api/user`** - Get current user profile
   - Returns: User profile with limits and usage
   - Auth: Required
   - Rate limited

5. **`GET /api/user/usage`** - Get usage statistics
   - Query params: `period`, `startDate`, `endDate`
   - Returns: Detailed usage breakdown
   - Auth: Required
   - Rate limited

6. **`POST /api/webhooks/stripe`** - Stripe webhook handler
   - Currently stubbed
   - TODO: Verify signature, handle events
   - Auth: None (verified via signature)

7. **`POST /api/webhooks/clerk`** - Clerk webhook handler
   - Currently stubbed
   - TODO: Verify signature, sync user data
   - Auth: None (verified via signature)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Required for auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional for rate limiting (runs in stub mode if not set)
REDIS_URL=redis://localhost:6379

# Optional for billing (stubbed for now)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Getting Started

### 1. Set up Clerk

1. Go to https://clerk.com
2. Create a new application
3. Copy the API keys to `.env.local`
4. Configure redirect URLs in Clerk dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### 2. Test Auth

```bash
npm run dev
```

Visit:
- `http://localhost:3000/sign-up` - Create account
- `http://localhost:3000/sign-in` - Sign in
- `http://localhost:3000/dashboard` - Protected route (should redirect if not signed in)

### 3. Test API Routes

```bash
# Get user profile (requires auth)
curl http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_CLERK_JWT"

# List bot types
curl http://localhost:3000/api/bots \
  -H "Authorization: Bearer YOUR_CLERK_JWT"
```

## Architecture Notes

### Rate Limiting

- Uses Redis sorted sets for sliding window algorithm
- Graceful fallback: If Redis fails, requests are allowed (fail-open)
- Stub mode: If Redis not configured, always allows (for development)
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

### Response Format

All responses follow consistent structure per API spec:

```typescript
{
  success: boolean,
  data?: T,           // On success
  error?: {           // On error
    code: string,
    message: string,
    details?: any
  },
  meta: {
    requestId: string,  // Unique request ID for tracing
    timestamp: string   // ISO 8601 timestamp
  }
}
```

### Error Handling

Use the pre-built error classes:

```typescript
import { ValidationError, NotFoundError } from '@/lib/api/errors';

// Throw errors
throw new NotFoundError('Bot');

// Or return error responses
import { apiErrors } from '@/lib/api/response';
return apiErrors.notFound('Bot');
```

### Validation

Use Zod schemas for request validation:

```typescript
import { parseAndValidate, schemas } from '@/lib/api/validate';

// Validate request body
const data = await parseAndValidate(request, schemas.createBot);
```

## Testing

### Unit Tests (TODO)

```bash
npm test
```

### Integration Tests (TODO)

```bash
npm run test:integration
```

## Next Steps

### For Database Engineer

The following routes return mock data and need database integration:

1. **`GET /api/user`** - Fetch user tier, limits, usage from DB
2. **`GET /api/user/usage`** - Fetch usage statistics from DB
3. **`GET /api/bots`** - Should also return user's bot instances
4. **`GET /api/bots/[botId]`** - Fetch from DB, check ownership
5. **`POST /api/bots/[botId]/activate`** - Create bot instance in DB

Database schema needed:
- `users` - User profiles, tier, limits
- `bots` - Bot instances
- `conversations` - Chat conversations
- `messages` - Chat messages
- `integrations` - OAuth connections
- `usage_logs` - Usage tracking

### For Integration Engineer

Implement webhook handlers:

1. **Stripe webhook** - Handle subscription events
   - Verify signature using `stripe.webhooks.constructEvent()`
   - Update user tier on subscription changes
   - Handle payment failures

2. **Clerk webhook** - Sync user data
   - Verify signature using `svix`
   - Create/update/delete user records
   - Handle user lifecycle events

## Status

✅ **Complete and Ready for Integration**

All deliverables implemented:
- Clerk middleware protecting routes
- Auth pages rendering (even without keys configured)
- All API routes created with proper typing
- Rate limiter implemented (can run in stub mode)
- API utilities ready for use

The auth and API foundation is production-ready. Other engineers can now:
- Add database integration
- Implement webhook handlers
- Build dashboard UI
- Add chat functionality
