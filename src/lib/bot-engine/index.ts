/**
 * Bot Engine - Main export file
 */

// Core types
export * from './types';

// Model routing
export { modelRouter, MODELS, TIER_MODELS, DEFAULT_MODEL } from './model-router';

// Execution engine
export { botExecutor } from './executor';

// Tool sandbox
export { toolSandbox } from './tool-sandbox';

// Bot definitions
export {
  BOT_REGISTRY,
  getBotDefinition,
  getAllBots,
  getBotsForTier,
  canAccessBot,
} from './bots';

// Model clients
export * from './models';
