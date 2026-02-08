/**
 * Clawer Smart Router Types
 * 
 * Adapted from ClawRouter (BlockRunAI) - MIT License
 * Stripped x402 payments, adapted for subscription model
 */

export type Tier = 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'REASONING';

export interface ScoringResult {
  score: number;
  tier: Tier | null;  // null = ambiguous, use fallback
  confidence: number;
  signals: string[];
}

export interface ScoringConfig {
  tokenCountThresholds: { simple: number; complex: number };
  
  // Keyword lists (multilingual)
  codeKeywords: string[];
  reasoningKeywords: string[];
  simpleKeywords: string[];
  technicalKeywords: string[];
  creativeKeywords: string[];
  imperativeVerbs: string[];
  constraintIndicators: string[];
  outputFormatKeywords: string[];
  referenceKeywords: string[];
  negationKeywords: string[];
  domainSpecificKeywords: string[];
  
  // Dimension weights (sum to 1.0)
  dimensionWeights: Record<string, number>;
  
  // Tier boundaries
  tierBoundaries: {
    simpleMedium: number;
    mediumComplex: number;
    complexReasoning: number;
  };
  
  // Confidence calibration
  confidenceSteepness: number;
  confidenceThreshold: number;
}

export interface TierConfig {
  primary: string;   // Model ID
  fallback: string[];
}

export interface RoutingConfig {
  version: string;
  scoring: ScoringConfig;
  tiers: Record<Tier, TierConfig>;
  overrides: {
    maxTokensForceComplex: number;
    ambiguousDefaultTier: Tier;
  };
}

export interface RoutingDecision {
  model: string;
  tier: Tier;
  confidence: number;
  reasoning: string;
  costEstimate: number;
  baselineCost: number;
  savings: number;
}

export interface ModelPricing {
  inputPrice: number;   // per 1M tokens
  outputPrice: number;
}
