/**
 * LLM Service
 * 
 * Main interface for calling LLMs
 * Handles provider selection, API key lookup, and error handling
 */

import { db } from '@/lib/db';
import { adminSettings, SETTING_KEYS } from '@/lib/db/schema/admin-settings';
import { eq } from 'drizzle-orm';
import { providers } from './providers';
import { LLMRequest, LLMResponse, getProviderForModel } from './types';

// Cache for API keys (refresh every 5 minutes)
const keyCache = new Map<string, { key: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get API key for a provider from admin settings
 */
async function getApiKey(provider: string): Promise<string | null> {
  const cacheKey = `api_key_${provider}`;
  const cached = keyCache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.key;
  }
  
  // Map provider to setting key
  const settingKeyMap: Record<string, string> = {
    openai: 'llm_api_key_openai',
    anthropic: 'llm_api_key_anthropic',
    google: 'llm_api_key_google',
    xai: 'llm_api_key_xai',
    deepseek: 'llm_api_key_deepseek',
  };
  
  const settingKey = settingKeyMap[provider];
  if (!settingKey) {
    // Fallback to primary LLM key if no provider-specific key
    const primarySetting = await db.query.adminSettings.findFirst({
      where: eq(adminSettings.key, SETTING_KEYS.LLM_API_KEY),
    });
    return (primarySetting?.value as string) || null;
  }
  
  const setting = await db.query.adminSettings.findFirst({
    where: eq(adminSettings.key, settingKey),
  });
  
  if (setting?.value) {
    const key = setting.value as string;
    keyCache.set(cacheKey, { key, expiry: Date.now() + CACHE_TTL_MS });
    return key;
  }
  
  // Fallback to primary LLM key
  const primarySetting = await db.query.adminSettings.findFirst({
    where: eq(adminSettings.key, SETTING_KEYS.LLM_API_KEY),
  });
  
  if (primarySetting?.value) {
    const key = primarySetting.value as string;
    keyCache.set(cacheKey, { key, expiry: Date.now() + CACHE_TTL_MS });
    return key;
  }
  
  return null;
}

/**
 * Get API key from environment variables (fallback)
 */
function getEnvApiKey(provider: string): string | null {
  const envKeyMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    xai: 'XAI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
  };
  
  const envKey = envKeyMap[provider];
  return envKey ? process.env[envKey] || null : null;
}

/**
 * Call an LLM with automatic provider routing
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const provider = getProviderForModel(request.model);
  const providerImpl = providers[provider];
  
  if (!providerImpl) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  // Get API key: DB first, then env
  const apiKey = await getApiKey(provider) || getEnvApiKey(provider);
  
  if (!apiKey) {
    throw new Error(`No API key configured for ${provider}. Add it in Admin Settings.`);
  }
  
  console.log('[llm] Calling:', {
    model: request.model,
    provider,
    messageCount: request.messages.length,
  });
  
  try {
    const response = await providerImpl.call(request, apiKey);
    
    console.log('[llm] Response:', {
      model: response.model,
      provider: response.provider,
      tokens: response.usage.totalTokens,
      latencyMs: response.latencyMs,
    });
    
    return response;
  } catch (error: any) {
    console.error('[llm] Error:', {
      model: request.model,
      provider,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Build messages array with system prompt and user message
 */
export function buildMessages(
  userMessage: string,
  systemPrompt?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  if (conversationHistory) {
    messages.push(...conversationHistory);
  }
  
  messages.push({ role: 'user', content: userMessage });
  
  return messages;
}

/**
 * Clear the API key cache (call after updating keys)
 */
export function clearKeyCache(): void {
  keyCache.clear();
}
