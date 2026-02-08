/**
 * Bot Registry - Central registry of all available bots
 */

import { BotDefinition, UserTier } from '../types';
import { emailAssistantBot } from './email-assistant';
import { calendarManagerBot } from './calendar-manager';

/**
 * Registry of all available bot definitions
 */
export const BOT_REGISTRY: Record<string, BotDefinition> = {
  'email-assistant': emailAssistantBot,
  'calendar-manager': calendarManagerBot,
};

/**
 * Minimum tier required for each bot type
 */
const BOT_TIER_REQUIREMENTS: Record<string, UserTier> = {
  'email-assistant': 'basic',
  'calendar-manager': 'basic',
};

/**
 * Get bot definition by ID
 */
export function getBotDefinition(botId: string): BotDefinition | undefined {
  return BOT_REGISTRY[botId];
}

/**
 * Get all available bot definitions
 */
export function getAllBots(): BotDefinition[] {
  return Object.values(BOT_REGISTRY);
}

/**
 * Get bots available for a specific user tier
 */
export function getBotsForTier(tier: UserTier): BotDefinition[] {
  const tierOrder: UserTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const tierIndex = tierOrder.indexOf(tier);
  
  return Object.entries(BOT_REGISTRY)
    .filter(([botId]) => {
      const requiredTier = BOT_TIER_REQUIREMENTS[botId] || 'free';
      const requiredIndex = tierOrder.indexOf(requiredTier);
      return tierIndex >= requiredIndex;
    })
    .map(([, bot]) => bot);
}

/**
 * Check if a user can access a specific bot
 */
export function canAccessBot(botId: string, userTier: UserTier): boolean {
  const requiredTier = BOT_TIER_REQUIREMENTS[botId];
  if (!requiredTier) return true; // No requirement = accessible to all
  
  const tierOrder: UserTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const userIndex = tierOrder.indexOf(userTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  
  return userIndex >= requiredIndex;
}
