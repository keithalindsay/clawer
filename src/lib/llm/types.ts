/**
 * LLM Types
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

export interface LLMProvider {
  name: string;
  call(request: LLMRequest, apiKey: string): Promise<LLMResponse>;
  models: string[];
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Model to provider mapping
 */
export const MODEL_PROVIDERS: Record<string, string> = {
  // OpenAI
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-3.5-turbo': 'openai',
  
  // Anthropic
  'claude-opus-4': 'anthropic',
  'claude-opus-4-5': 'anthropic',
  'claude-sonnet-4': 'anthropic',
  'claude-sonnet-4-5': 'anthropic',
  'claude-haiku-4': 'anthropic',
  'claude-haiku-4-5': 'anthropic',
  
  // Google
  'gemini-2.0-flash': 'google',
  'gemini-2.0-flash-lite': 'google',
  'gemini-3-flash': 'google',
  'gemini-2.5-pro': 'google',
  'gemini-1.5-pro': 'google',
  
  // xAI
  'grok-4.1-fast': 'xai',
  'grok-3': 'xai',
  'grok-2': 'xai',
  
  // DeepSeek
  'deepseek-chat': 'deepseek',
  'deepseek-reasoner': 'deepseek',
};

/**
 * Get provider for a model
 */
export function getProviderForModel(model: string): string {
  return MODEL_PROVIDERS[model] || 'openai';  // Default to OpenAI
}
