/**
 * Model Router - Routes requests to appropriate LLM based on tier
 */

import { UserTier, ModelConfig, ModelRequest, ModelResponse } from './types';
import { OllamaClient } from './models/ollama';
import { KimiClient } from './models/kimi';
import { AnthropicClient } from './models/anthropic';

/**
 * Model configuration with pricing and capabilities
 */
export const MODELS: Record<string, ModelConfig> = {
  'qwen3': {
    provider: 'ollama',
    modelId: 'qwen3:14b',
    displayName: 'Qwen3 14B',
    tier: 'free',
    inputCostPer1k: 0,        // Free (local)
    outputCostPer1k: 0,
    maxTokens: 4096,
    contextWindow: 32768,
  },
  
  'kimi': {
    provider: 'kimi',
    modelId: 'moonshot-v1-8k',
    displayName: 'Kimi 8K',
    tier: 'basic',
    inputCostPer1k: 0.001,    // $0.001/1k tokens
    outputCostPer1k: 0.002,
    maxTokens: 8192,
    contextWindow: 8192,
  },
  
  'sonnet': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    tier: 'pro',
    inputCostPer1k: 0.003,    // $3/1M tokens
    outputCostPer1k: 0.015,   // $15/1M tokens
    maxTokens: 8192,
    contextWindow: 200000,
  },
  
  'opus': {
    provider: 'anthropic',
    modelId: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    tier: 'enterprise',
    inputCostPer1k: 0.015,    // $15/1M tokens
    outputCostPer1k: 0.075,   // $75/1M tokens
    maxTokens: 8192,
    contextWindow: 200000,
  },
};

/**
 * Model availability by tier
 */
export const TIER_MODELS: Record<UserTier, string[]> = {
  free: ['qwen3'],
  basic: ['qwen3', 'kimi'],
  pro: ['qwen3', 'kimi', 'sonnet'],
  enterprise: ['qwen3', 'kimi', 'sonnet', 'opus'],
};

/**
 * Default model per tier
 */
export const DEFAULT_MODEL: Record<UserTier, string> = {
  free: 'qwen3',
  basic: 'kimi',
  pro: 'sonnet',
  enterprise: 'opus',
};

/**
 * Routes model requests to the appropriate provider
 */
export class ModelRouter {
  private ollama: OllamaClient;
  private kimi: KimiClient;
  private anthropic: AnthropicClient;

  constructor() {
    this.ollama = new OllamaClient();
    this.kimi = new KimiClient();
    this.anthropic = new AnthropicClient();
  }

  /**
   * Select the best model for the request
   */
  selectModel(tier: UserTier, preferredModel?: string): string {
    const availableModels = TIER_MODELS[tier] || TIER_MODELS.free;
    
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }
    
    return DEFAULT_MODEL[tier] || 'qwen3';
  }

  /**
   * Generate a completion using the appropriate model
   */
  async complete(request: ModelRequest): Promise<ModelResponse> {
    const modelKey = this.selectModel(request.tier, request.preferredModel);
    const model = MODELS[modelKey];
    
    if (!model) {
      throw new Error(`Unknown model: ${modelKey}`);
    }
    
    console.log(`[ModelRouter] Routing to ${model.provider}/${model.modelId}`);
    
    switch (model.provider) {
      case 'ollama':
        return this.ollama.complete(model.modelId, request);
      case 'kimi':
        return this.kimi.complete(model.modelId, request);
      case 'anthropic':
        return this.anthropic.complete(model.modelId, request);
      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(modelKey: string, inputTokens: number, outputTokens: number): number {
    const model = MODELS[modelKey];
    if (!model) return 0;
    
    const inputCost = (inputTokens / 1000) * model.inputCostPer1k;
    const outputCost = (outputTokens / 1000) * model.outputCostPer1k;
    
    return inputCost + outputCost;
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();
