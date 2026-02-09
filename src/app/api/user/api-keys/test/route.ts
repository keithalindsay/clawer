/**
 * POST /api/user/api-keys/test — Test an API key against its provider
 * Body: { provider: string, key: string }
 * 
 * Tests by making a minimal API call to each provider.
 * Also updates the validation status in the database if the key is saved.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { apiKeys, type ApiKeyProvider } from '@/lib/db/schema/api-keys';
import { eq, and } from 'drizzle-orm';

const VALID_PROVIDERS = ['openai', 'anthropic', 'google', 'deepseek'] as const;

/**
 * Test an OpenAI API key by listing models
 */
async function testOpenAI(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { valid: true };
    const data = await res.json().catch(() => ({}));
    return { valid: false, error: data?.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Connection failed' };
  }
}

/**
 * Test an Anthropic API key by listing models
 */
async function testAnthropic(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    // 200 = valid, 401 = invalid key, other errors might just be quota/rate issues
    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    if (res.status === 403) return { valid: false, error: 'API key lacks permissions' };
    // 429 or 529 means the key is valid but rate limited / overloaded
    if (res.status === 429 || res.status === 529) return { valid: true };
    const data = await res.json().catch(() => ({}));
    return { valid: false, error: data?.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Connection failed' };
  }
}

/**
 * Test a Google Gemini API key by listing models
 */
async function testGoogle(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${key}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) return { valid: true };
    if (res.status === 400 || res.status === 403) {
      const data = await res.json().catch(() => ({}));
      return { valid: false, error: data?.error?.message || 'Invalid API key' };
    }
    return { valid: false, error: `HTTP ${res.status}` };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Connection failed' };
  }
}

/**
 * Test a DeepSeek API key by listing models
 */
async function testDeepSeek(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.deepseek.com/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    // 429 means valid but rate limited
    if (res.status === 429) return { valid: true };
    const data = await res.json().catch(() => ({}));
    return { valid: false, error: data?.error?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Connection failed' };
  }
}

const testers: Record<string, (key: string) => Promise<{ valid: boolean; error?: string }>> = {
  openai: testOpenAI,
  anthropic: testAnthropic,
  google: testGoogle,
  deepseek: testDeepSeek,
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await request.json();
    const { provider, key } = body as { provider: string; key: string };

    if (!provider || !VALID_PROVIDERS.includes(provider as typeof VALID_PROVIDERS[number])) {
      return apiError(
        'INVALID_PROVIDER',
        `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
        400
      );
    }

    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      return apiError('INVALID_KEY', 'API key must be at least 10 characters', 400);
    }

    const tester = testers[provider];
    const result = await tester(key.trim());

    // Update validation status if this key is already saved
    const now = new Date();
    await db
      .update(apiKeys)
      .set({
        isValid: result.valid,
        lastValidated: now,
        updatedAt: now,
      })
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider as ApiKeyProvider)));

    return apiSuccess({
      provider,
      valid: result.valid,
      error: result.error || null,
      testedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    return apiErrors.internalError();
  }
}
