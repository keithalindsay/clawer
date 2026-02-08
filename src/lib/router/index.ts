/**
 * Clawer Smart Router
 * 
 * Adapted from ClawRouter (BlockRunAI) - MIT License
 * 
 * Routes requests to the optimal model based on:
 * 1. 14-dimension weighted scoring of the prompt
 * 2. User's selected orchestrator + worker models
 * 3. Cost optimization within user's tier
 */

import { classifyByRules, estimateTokens } from './rules';
import { DEFAULT_ROUTING_CONFIG, MODEL_PRICING, BASELINE_MODEL } from './config';
import type { Tier, RoutingDecision, RoutingConfig, ModelPricing } from './types';

export { classifyByRules, estimateTokens };
export type { Tier, RoutingDecision, RoutingConfig, ModelPricing };

interface RouteRequestOptions {
  prompt: string;
  systemPrompt?: string;
  userOrchestratorModel?: string;  // User's selected orchestrator
  userWorkerModel?: string;         // User's selected worker
  maxOutputTokens?: number;
  config?: RoutingConfig;
}

interface RouteResult {
  model: string;
  tier: Tier;
  confidence: number;
  signals: string[];
  costEstimate: number;
  baselineCost: number;
  savings: number;
  useOrchestrator: boolean;  // true = use orchestrator, false = use worker
}

/**
 * Route a request to the optimal model
 * 
 * Logic:
 * - SIMPLE/MEDIUM → Use worker model (cheap, bulk tasks)
 * - COMPLEX/REASONING → Use orchestrator model (smart brain)
 */
export function routeRequest(options: RouteRequestOptions): RouteResult {
  const {
    prompt,
    systemPrompt,
    userOrchestratorModel = 'gpt-4o-mini',
    userWorkerModel = 'gemini-2.0-flash-lite',
    maxOutputTokens = 4096,
    config = DEFAULT_ROUTING_CONFIG,
  } = options;

  const estimatedInputTokens = estimateTokens(`${systemPrompt ?? ''} ${prompt}`);

  // Classify the request
  const classification = classifyByRules(
    prompt,
    systemPrompt,
    estimatedInputTokens,
    config.scoring,
  );

  // Handle ambiguous classification
  const tier = classification.tier ?? config.overrides.ambiguousDefaultTier;

  // Route to orchestrator or worker based on tier
  const useOrchestrator = tier === 'COMPLEX' || tier === 'REASONING';
  const model = useOrchestrator ? userOrchestratorModel : userWorkerModel;

  // Calculate costs
  const pricing = MODEL_PRICING[model] ?? { input: 0, output: 0 };
  const baselinePricing = MODEL_PRICING[BASELINE_MODEL] ?? { input: 15, output: 75 };

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.input;
  const outputCost = (maxOutputTokens / 1_000_000) * pricing.output;
  const costEstimate = inputCost + outputCost;

  const baselineInputCost = (estimatedInputTokens / 1_000_000) * baselinePricing.input;
  const baselineOutputCost = (maxOutputTokens / 1_000_000) * baselinePricing.output;
  const baselineCost = baselineInputCost + baselineOutputCost;

  const savings = baselineCost > 0 
    ? Math.max(0, (baselineCost - costEstimate) / baselineCost) 
    : 0;

  return {
    model,
    tier,
    confidence: classification.confidence,
    signals: classification.signals,
    costEstimate,
    baselineCost,
    savings,
    useOrchestrator,
  };
}

/**
 * Get tier distribution statistics from a batch of prompts
 * Useful for analyzing usage patterns
 */
export function analyzeTierDistribution(
  prompts: string[],
  config = DEFAULT_ROUTING_CONFIG,
): Record<Tier, { count: number; percentage: number }> {
  const counts: Record<Tier, number> = {
    SIMPLE: 0,
    MEDIUM: 0,
    COMPLEX: 0,
    REASONING: 0,
  };

  for (const prompt of prompts) {
    const result = classifyByRules(
      prompt,
      undefined,
      estimateTokens(prompt),
      config.scoring,
    );
    const tier = result.tier ?? config.overrides.ambiguousDefaultTier;
    counts[tier]++;
  }

  const total = prompts.length;
  return {
    SIMPLE: { count: counts.SIMPLE, percentage: (counts.SIMPLE / total) * 100 },
    MEDIUM: { count: counts.MEDIUM, percentage: (counts.MEDIUM / total) * 100 },
    COMPLEX: { count: counts.COMPLEX, percentage: (counts.COMPLEX / total) * 100 },
    REASONING: { count: counts.REASONING, percentage: (counts.REASONING / total) * 100 },
  };
}

/**
 * Estimate monthly cost based on usage pattern
 */
export function estimateMonthlyCost(
  requestsPerMonth: number,
  tierDistribution: Record<Tier, number>,  // percentages
  avgTokensPerRequest: number,
  orchestratorModel: string,
  workerModel: string,
): { estimated: number; baseline: number; savings: number } {
  const orchestratorPricing = MODEL_PRICING[orchestratorModel] ?? { input: 0, output: 0 };
  const workerPricing = MODEL_PRICING[workerModel] ?? { input: 0, output: 0 };
  const baselinePricing = MODEL_PRICING[BASELINE_MODEL];

  let estimated = 0;
  let baseline = 0;

  const tokensPerMillion = avgTokensPerRequest / 1_000_000;

  // SIMPLE + MEDIUM → Worker
  const workerRequests = requestsPerMonth * 
    ((tierDistribution.SIMPLE + tierDistribution.MEDIUM) / 100);
  estimated += workerRequests * tokensPerMillion * (workerPricing.input + workerPricing.output);

  // COMPLEX + REASONING → Orchestrator
  const orchestratorRequests = requestsPerMonth * 
    ((tierDistribution.COMPLEX + tierDistribution.REASONING) / 100);
  estimated += orchestratorRequests * tokensPerMillion * 
    (orchestratorPricing.input + orchestratorPricing.output);

  // Baseline: all requests to Opus
  baseline = requestsPerMonth * tokensPerMillion * 
    (baselinePricing.input + baselinePricing.output);

  const savings = baseline > 0 ? (baseline - estimated) / baseline : 0;

  return { estimated, baseline, savings };
}
