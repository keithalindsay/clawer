/**
 * GET /api/user/api-keys — List user's API keys (masked)
 * POST /api/user/api-keys — Add or update an API key
 * DELETE /api/user/api-keys — Remove an API key
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { apiKeys, API_KEY_PROVIDERS, type ApiKeyProvider } from '@/lib/db/schema/api-keys';
import { users } from '@/lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import { containerRequest } from '@/lib/container-client';

const VALID_PROVIDERS = Object.keys(API_KEY_PROVIDERS) as ApiKeyProvider[];

/**
 * Mask an API key for display: show first 4 and last 4 chars
 */
function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/**
 * GET — List all API keys for the current user (masked)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    const maskedKeys = keys.map((key) => ({
      id: key.id,
      provider: key.provider,
      maskedKey: maskKey(key.encryptedKey),
      isValid: key.isValid,
      lastValidated: key.lastValidated?.toISOString() || null,
      createdAt: key.createdAt.toISOString(),
      updatedAt: key.updatedAt.toISOString(),
    }));

    // Build a map with all providers (including those without keys)
    const providerMap = VALID_PROVIDERS.map((provider) => {
      const existing = maskedKeys.find((k) => k.provider === provider);
      const defaults = {
        id: null,
        maskedKey: null,
        isValid: null,
        lastValidated: null,
        createdAt: null,
        updatedAt: null,
      };
      return {
        ...API_KEY_PROVIDERS[provider],
        configured: !!existing,
        ...(existing || defaults),
        provider,
      };
    });

    return apiSuccess(providerMap);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return apiErrors.internalError();
  }
}

/**
 * POST — Add or update an API key
 * Body: { provider: string, key: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await request.json();
    const { provider, key } = body as { provider: string; key: string };

    // Validate provider
    if (!provider || !VALID_PROVIDERS.includes(provider as ApiKeyProvider)) {
      return apiError(
        'INVALID_PROVIDER',
        `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
        400
      );
    }

    // Validate key is present
    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      return apiError('INVALID_KEY', 'API key must be at least 10 characters', 400);
    }

    const trimmedKey = key.trim();
    const now = new Date();

    // Upsert: check if key exists for this user+provider
    const existing = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider as ApiKeyProvider)));

    if (existing.length > 0) {
      // Update
      await db
        .update(apiKeys)
        .set({
          encryptedKey: trimmedKey,
          isValid: null, // Reset validation on update
          lastValidated: null,
          updatedAt: now,
        })
        .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider as ApiKeyProvider)));
    } else {
      // Insert
      await db.insert(apiKeys).values({
        userId,
        provider: provider as ApiKeyProvider,
        encryptedKey: trimmedKey,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Push keys to container config
    await pushKeysToContainer(userId);

    return apiSuccess({
      provider,
      maskedKey: maskKey(trimmedKey),
      isValid: null,
      message: existing.length > 0 ? 'API key updated' : 'API key added',
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    return apiErrors.internalError();
  }
}

/**
 * DELETE — Remove an API key
 * Body: { provider: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await request.json();
    const { provider } = body as { provider: string };

    if (!provider || !VALID_PROVIDERS.includes(provider as ApiKeyProvider)) {
      return apiError(
        'INVALID_PROVIDER',
        `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
        400
      );
    }

    await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider as ApiKeyProvider)));

    // Push updated keys to container
    await pushKeysToContainer(userId);

    return apiSuccess({ provider, message: 'API key removed' });
  } catch (error) {
    console.error('Error removing API key:', error);
    return apiErrors.internalError();
  }
}

/**
 * Push all API keys to the user's container config
 */
async function pushKeysToContainer(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerPort: true, gatewayToken: true },
    });

    if (!user?.containerPort || !user?.gatewayToken) {
      console.log('No container configured for user, skipping key push');
      return;
    }

    // Fetch all keys for this user
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    const keyMap: Record<string, string> = {};
    for (const k of keys) {
      keyMap[k.provider] = k.encryptedKey;
    }

    // Push to container /api/config/api-keys endpoint
    await containerRequest(
      user.containerPort,
      '/api/config/api-keys',
      {
        method: 'POST',
        body: JSON.stringify({ keys: keyMap }),
      },
      user.gatewayToken
    );
  } catch (error) {
    console.error('Failed to push keys to container:', error);
    // Don't throw - key save should succeed even if container push fails
  }
}
