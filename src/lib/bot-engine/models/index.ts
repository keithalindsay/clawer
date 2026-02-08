/**
 * Unified Model Interface - Exports all model clients
 */

export { OllamaClient } from './ollama';
export { KimiClient } from './kimi';
export { AnthropicClient } from './anthropic';

/**
 * Model provider types
 */
export type ModelProvider = 'ollama' | 'kimi' | 'anthropic';
