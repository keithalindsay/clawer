import { pgTable, text, timestamp, uuid, integer, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Model configuration per user
 * Stores their selected orchestrator and worker models
 */
export const modelConfigs = pgTable('model_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Selected models
  orchestratorModel: text('orchestrator_model').notNull().default('gpt-4o-mini'),
  workerModel: text('worker_model').notNull().default('gemini-2.0-flash-lite'),
  
  // Calculated pricing (in cents for precision)
  orchestratorAddonCents: integer('orchestrator_addon_cents').notNull().default(800),
  workerAddonCents: integer('worker_addon_cents').notNull().default(200),
  totalMonthlyCents: integer('total_monthly_cents').notNull().default(3900),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Stripe integration - custom price ID if needed
  stripePriceId: text('stripe_price_id'),
}, (table) => ({
  userUnique: unique('model_configs_user_unique').on(table.userId),
  userIdx: index('model_configs_user_idx').on(table.userId),
}));

/**
 * Orchestrator models (main brain)
 * Handles intent understanding, planning, response synthesis
 */
export const ORCHESTRATOR_MODELS = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable. Best for complex reasoning.',
    addonCents: 3500,
    quality: 5,
    inputPer1M: 2.50,
    outputPer1M: 10.00,
    recommended: false,
  },
  'gemini-3-flash': {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'google',
    description: 'Fast and smart. Great all-rounder.',
    addonCents: 2000,
    quality: 4,
    inputPer1M: 0.50,
    outputPer1M: 3.00,
    recommended: false,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Reliable and efficient. Best value.',
    addonCents: 800,
    quality: 3,
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    recommended: true,  // Default recommendation
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Budget-friendly. Good for simple tasks.',
    addonCents: 500,
    quality: 3,
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    recommended: false,
  },
} as const;

/**
 * Worker models (task execution)
 * Handles bulk operations: search, summarization, code
 */
export const WORKER_MODELS = {
  'gemini-2.0-flash-lite': {
    id: 'gemini-2.0-flash-lite',
    name: 'Flash Lite',
    provider: 'google',
    description: 'Ultra-efficient for bulk tasks.',
    addonCents: 200,
    bestFor: 'General',
    inputPer1M: 0.05,
    outputPer1M: 0.20,
    recommended: true,  // Default recommendation
  },
  'grok-4.1-fast': {
    id: 'grok-4.1-fast',
    name: 'Grok Fast',
    provider: 'xai',
    description: 'Optimized for code and technical tasks.',
    addonCents: 500,
    bestFor: 'Code',
    inputPer1M: 0.20,
    outputPer1M: 0.50,
    recommended: false,
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini Flash',
    provider: 'google',
    description: 'Faster responses, slightly higher cost.',
    addonCents: 400,
    bestFor: 'Speed',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    recommended: false,
  },
} as const;

/**
 * Base platform price (in cents)
 */
export const BASE_PRICE_CENTS = 2900;  // $29.00

/**
 * Type definitions
 */
export type OrchestratorModelId = keyof typeof ORCHESTRATOR_MODELS;
export type WorkerModelId = keyof typeof WORKER_MODELS;

export interface ModelConfig {
  orchestrator: OrchestratorModelId;
  worker: WorkerModelId;
}

/**
 * Calculate total monthly price for a configuration
 */
export function calculateTotalPrice(config: ModelConfig): number {
  const orchestrator = ORCHESTRATOR_MODELS[config.orchestrator];
  const worker = WORKER_MODELS[config.worker];
  
  if (!orchestrator || !worker) {
    throw new Error('Invalid model configuration');
  }
  
  return BASE_PRICE_CENTS + orchestrator.addonCents + worker.addonCents;
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): ModelConfig {
  return {
    orchestrator: 'gpt-4o-mini',
    worker: 'gemini-2.0-flash-lite',
  };
}

/**
 * Validate a model configuration
 */
export function validateConfig(config: Partial<ModelConfig>): config is ModelConfig {
  return (
    typeof config.orchestrator === 'string' &&
    typeof config.worker === 'string' &&
    config.orchestrator in ORCHESTRATOR_MODELS &&
    config.worker in WORKER_MODELS
  );
}

/**
 * Pre-defined popular configurations for quick selection
 */
export const PRESET_CONFIGS = {
  budget: {
    name: 'Budget',
    description: 'Cost-effective for simple tasks',
    orchestrator: 'gemini-2.0-flash' as const,
    worker: 'gemini-2.0-flash-lite' as const,
    totalCents: 3600,  // $36
  },
  balanced: {
    name: 'Balanced',
    description: 'Best value for most users',
    orchestrator: 'gpt-4o-mini' as const,
    worker: 'gemini-2.0-flash-lite' as const,
    totalCents: 3900,  // $39
    recommended: true,
  },
  smart: {
    name: 'Smart',
    description: 'Enhanced intelligence',
    orchestrator: 'gemini-3-flash' as const,
    worker: 'gemini-2.0-flash-lite' as const,
    totalCents: 5100,  // $51
  },
  developer: {
    name: 'Developer',
    description: 'Optimized for coding tasks',
    orchestrator: 'gpt-4o-mini' as const,
    worker: 'grok-4.1-fast' as const,
    totalCents: 4200,  // $42
  },
  power: {
    name: 'Power User',
    description: 'Maximum capability',
    orchestrator: 'gpt-4o' as const,
    worker: 'gemini-2.0-flash-lite' as const,
    totalCents: 6600,  // $66
  },
} as const;
