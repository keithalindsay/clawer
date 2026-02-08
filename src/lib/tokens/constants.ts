/**
 * Token tracking constants for hybrid orchestrator system
 */

/**
 * Model pricing (per 1M tokens)
 */
export const MODEL_PRICING = {
  orchestrator: {
    input: 0.50,   // Gemini 3 Flash
    output: 3.00,
  },
  searchWorker: {
    input: 0.05,   // Gemini 2.0 Flash-Lite
    output: 0.20,
  },
  documentWorker: {
    input: 0.05,   // Gemini 2.0 Flash-Lite
    output: 0.20,
  },
  codeWorker: {
    input: 0.20,   // Grok 4.1 Fast
    output: 0.50,
  },
} as const;

/**
 * User tier token limits (weekly OET)
 */
export const TOKEN_LIMITS = {
  basic: {
    weeklyOet: 3_750_000,    // ~15M monthly
    priceMonthly: 49,
  },
  pro: {
    weeklyOet: 10_000_000,   // ~40M monthly
    priceMonthly: 99,
  },
  enterprise: {
    weeklyOet: 25_000_000,   // ~100M monthly
    priceMonthly: 249,
  },
  free: {
    weeklyOet: 500_000,      // Free tier for testing
    priceMonthly: 0,
  },
} as const;

export type UserTier = keyof typeof TOKEN_LIMITS;

/**
 * Rate limit thresholds
 */
export const RATE_LIMITS = {
  /** Soft warning threshold (80% usage) */
  warningThreshold: 0.80,
  
  /** Hard limit threshold (100% usage) */
  hardLimit: 1.00,
  
  /** Maximum tokens allowed per single request */
  maxTokensPerRequest: 100_000,
  
  /** Maximum requests per minute */
  maxRequestsPerMinute: 20,
  
  /** Maximum requests per hour */
  maxRequestsPerHour: 200,
} as const;

/**
 * OET (Orchestrator Equivalent Tokens) weights
 * Workers are ~10x cheaper, so they count less against user limits
 */
export const OET_WEIGHTS = {
  orchestrator: 1.0,   // Full weight
  worker: 0.15,        // 15% weight (workers are cheaper)
} as const;

/**
 * Token counting formula
 */
export const TOKEN_FORMULAS = {
  /**
   * Calculate total tokens from input + output
   */
  totalTokens: (input: number, output: number) => input + output,
  
  /**
   * Calculate OET from orchestrator and worker tokens
   */
  calculateOET: (orchestratorTokens: number, workerTokens: number) => {
    return (
      orchestratorTokens * OET_WEIGHTS.orchestrator +
      workerTokens * OET_WEIGHTS.worker
    );
  },
} as const;
