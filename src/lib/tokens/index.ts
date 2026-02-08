/**
 * Token tracking service for hybrid orchestrator system
 */

import { db } from '../db';
import { weeklyUsage, requestLog } from '../db/schema/weekly-usage';
import { users } from '../db/schema/users';
import { eq, and } from 'drizzle-orm';
import { 
  TOKEN_LIMITS, 
  RATE_LIMITS, 
  OET_WEIGHTS, 
  MODEL_PRICING,
  type UserTier 
} from './constants';
import { getCurrentWeekBoundaries, getNextMonday, isNewWeek } from './weekly-reset';

/**
 * Model tier for token tracking
 */
export type ModelTier = 'orchestrator' | 'worker';

/**
 * Token usage data structure
 */
export interface TokenUsage {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  orchestratorInputTokens: number;
  orchestratorOutputTokens: number;
  workerInputTokens: number;
  workerOutputTokens: number;
  totalOet: number;
  estimatedCostUsd: string;
  requestCount: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  warning?: string;
  percentUsed: number;
  tokensUsed: number;
  tokenLimit: number;
  resetDate: Date;
}

/**
 * Calculate OET (Orchestrator Equivalent Tokens)
 * Formula: orchestrator_tokens * 1.0 + worker_tokens * 0.15
 */
export function calculateOET(orchestratorTokens: number, workerTokens: number): number {
  return Math.round(
    orchestratorTokens * OET_WEIGHTS.orchestrator +
    workerTokens * OET_WEIGHTS.worker
  );
}

/**
 * Get token limit for a user tier
 */
export function getTokenLimit(tier: UserTier): number {
  return TOKEN_LIMITS[tier]?.weeklyOet ?? TOKEN_LIMITS.free.weeklyOet;
}

/**
 * Calculate cost in USD for token usage
 */
export function calculateCost(
  modelTier: ModelTier,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[modelTier === 'orchestrator' ? 'orchestrator' : 'searchWorker'];
  
  // Pricing is per 1M tokens
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Get or create weekly usage record for a user
 */
async function getOrCreateWeeklyUsage(userId: string): Promise<TokenUsage> {
  const { weekStart, weekEnd } = getCurrentWeekBoundaries();
  
  // Try to find existing record
  const existing = await db
    .select()
    .from(weeklyUsage)
    .where(
      and(
        eq(weeklyUsage.userId, userId),
        eq(weeklyUsage.weekStart, weekStart)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    const record = existing[0];
    
    // Check if we're in a new week (shouldn't happen, but defensive)
    if (isNewWeek(record.weekStart)) {
      console.warn(`[tokens] User ${userId} has stale weekly record - creating new one`);
      // Delete old record (should have been archived by cron)
      await db.delete(weeklyUsage).where(eq(weeklyUsage.userId, userId));
      // Fall through to create new record
    } else {
      return {
        userId: record.userId,
        weekStart: record.weekStart,
        weekEnd: record.weekEnd,
        orchestratorInputTokens: record.orchestratorInputTokens,
        orchestratorOutputTokens: record.orchestratorOutputTokens,
        workerInputTokens: record.workerInputTokens,
        workerOutputTokens: record.workerOutputTokens,
        totalOet: record.totalOet,
        estimatedCostUsd: record.estimatedCostUsd,
        requestCount: record.requestCount,
      };
    }
  }
  
  // Create new record
  const newRecord = await db
    .insert(weeklyUsage)
    .values({
      userId,
      weekStart,
      weekEnd,
      orchestratorInputTokens: 0,
      orchestratorOutputTokens: 0,
      workerInputTokens: 0,
      workerOutputTokens: 0,
      totalOet: 0,
      estimatedCostUsd: '0',
      requestCount: 0,
    })
    .returning();
  
  return {
    userId: newRecord[0].userId,
    weekStart: newRecord[0].weekStart,
    weekEnd: newRecord[0].weekEnd,
    orchestratorInputTokens: newRecord[0].orchestratorInputTokens,
    orchestratorOutputTokens: newRecord[0].orchestratorOutputTokens,
    workerInputTokens: newRecord[0].workerInputTokens,
    workerOutputTokens: newRecord[0].workerOutputTokens,
    totalOet: newRecord[0].totalOet,
    estimatedCostUsd: newRecord[0].estimatedCostUsd,
    requestCount: newRecord[0].requestCount,
  };
}

/**
 * Track token usage for a request
 */
export async function trackTokenUsage(
  userId: string,
  modelTier: ModelTier,
  inputTokens: number,
  outputTokens: number,
  requestId?: string
): Promise<TokenUsage> {
  // Get or create weekly usage record
  const usage = await getOrCreateWeeklyUsage(userId);
  
  // Calculate new values
  let newOrchestratorInput = usage.orchestratorInputTokens;
  let newOrchestratorOutput = usage.orchestratorOutputTokens;
  let newWorkerInput = usage.workerInputTokens;
  let newWorkerOutput = usage.workerOutputTokens;
  
  if (modelTier === 'orchestrator') {
    newOrchestratorInput += inputTokens;
    newOrchestratorOutput += outputTokens;
  } else {
    newWorkerInput += inputTokens;
    newWorkerOutput += outputTokens;
  }
  
  // Calculate new OET
  const newTotalOet = calculateOET(
    newOrchestratorInput + newOrchestratorOutput,
    newWorkerInput + newWorkerOutput
  );
  
  // Calculate cost
  const additionalCost = calculateCost(modelTier, inputTokens, outputTokens);
  const newEstimatedCost = parseFloat(usage.estimatedCostUsd) + additionalCost;
  
  // Update weekly usage
  const { weekStart } = getCurrentWeekBoundaries();
  
  const updated = await db
    .update(weeklyUsage)
    .set({
      orchestratorInputTokens: newOrchestratorInput,
      orchestratorOutputTokens: newOrchestratorOutput,
      workerInputTokens: newWorkerInput,
      workerOutputTokens: newWorkerOutput,
      totalOet: newTotalOet,
      estimatedCostUsd: newEstimatedCost.toFixed(4),
      requestCount: usage.requestCount + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(weeklyUsage.userId, userId),
        eq(weeklyUsage.weekStart, weekStart)
      )
    )
    .returning();
  
  // Log the request if requestId provided
  if (requestId) {
    await db.insert(requestLog).values({
      userId,
      requestId,
      timestamp: new Date(),
      orchestratorTokens: modelTier === 'orchestrator' 
        ? JSON.stringify({ input: inputTokens, output: outputTokens })
        : JSON.stringify({ input: 0, output: 0 }),
      workerTokens: modelTier === 'worker'
        ? JSON.stringify({ [modelTier]: { input: inputTokens, output: outputTokens } })
        : JSON.stringify({}),
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: additionalCost.toFixed(6),
    });
  }
  
  return {
    userId: updated[0].userId,
    weekStart: updated[0].weekStart,
    weekEnd: updated[0].weekEnd,
    orchestratorInputTokens: updated[0].orchestratorInputTokens,
    orchestratorOutputTokens: updated[0].orchestratorOutputTokens,
    workerInputTokens: updated[0].workerInputTokens,
    workerOutputTokens: updated[0].workerOutputTokens,
    totalOet: updated[0].totalOet,
    estimatedCostUsd: updated[0].estimatedCostUsd,
    requestCount: updated[0].requestCount,
  };
}

/**
 * Get current weekly usage for a user
 */
export async function getWeeklyUsage(userId: string): Promise<TokenUsage> {
  return getOrCreateWeeklyUsage(userId);
}

/**
 * Check if user is within rate limits
 */
export async function checkRateLimit(
  userId: string,
  tier: UserTier = 'free'
): Promise<RateLimitResult> {
  const usage = await getOrCreateWeeklyUsage(userId);
  const limit = getTokenLimit(tier);
  const percentUsed = limit > 0 ? (usage.totalOet / limit) : 0;
  
  const resetDate = getNextMonday();
  
  // Hard limit check
  if (percentUsed >= RATE_LIMITS.hardLimit) {
    return {
      allowed: false,
      warning: `🛑 Weekly limit reached. Your token budget resets Monday at midnight UTC.`,
      percentUsed: Math.round(percentUsed * 100),
      tokensUsed: usage.totalOet,
      tokenLimit: limit,
      resetDate,
    };
  }
  
  // Soft warning check
  if (percentUsed >= RATE_LIMITS.warningThreshold) {
    return {
      allowed: true,
      warning: `⚠️ You've used ${Math.round(percentUsed * 100)}% of your weekly token budget. Consider upgrading for more capacity.`,
      percentUsed: Math.round(percentUsed * 100),
      tokensUsed: usage.totalOet,
      tokenLimit: limit,
      resetDate,
    };
  }
  
  // All good
  return {
    allowed: true,
    percentUsed: Math.round(percentUsed * 100),
    tokensUsed: usage.totalOet,
    tokenLimit: limit,
    resetDate,
  };
}

/**
 * Get user's tier from database
 * Falls back to 'free' if not found
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (user.length === 0) {
      return 'free';
    }
    
    // Assuming users table has a 'tier' column
    // Adjust based on actual schema
    const tier = (user[0] as any).tier as string | undefined;
    
    if (tier && tier in TOKEN_LIMITS) {
      return tier as UserTier;
    }
    
    return 'free';
  } catch (error) {
    console.error('[tokens] Error fetching user tier:', error);
    return 'free';
  }
}
