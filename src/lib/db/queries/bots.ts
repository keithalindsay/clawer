import { eq, and } from 'drizzle-orm';
import { db } from '..';
import { bots, type BotConfig } from '../schema';

/**
 * Get bot by ID
 */
export async function getBotById(botId: string) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.id, botId))
    .limit(1);
  
  return bot ?? null;
}

/**
 * Get all bots for a user
 */
export async function getUserBots(userId: string, includeDeleted = false) {
  if (includeDeleted) {
    return db
      .select()
      .from(bots)
      .where(eq(bots.userId, userId));
  } else {
    return db
      .select()
      .from(bots)
      .where(
        and(
          eq(bots.userId, userId),
          eq(bots.status, 'active')
        )
      );
  }
}

/**
 * Get bot by user and type
 */
export async function getUserBotByType(
  userId: string,
  type: 'email' | 'calendar' | 'research' | 'assistant' | 'custom'
) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(
      and(
        eq(bots.userId, userId),
        eq(bots.type, type),
        eq(bots.status, 'active')
      )
    )
    .limit(1);
  
  return bot ?? null;
}

/**
 * Create a new bot instance
 */
export async function createBot(data: {
  userId: string;
  type: 'email' | 'calendar' | 'research' | 'assistant' | 'custom';
  name: string;
  description?: string;
  customSystemPrompt?: string;
  config?: BotConfig;
  requiredIntegrations?: string[];
}) {
  const [bot] = await db
    .insert(bots)
    .values({
      userId: data.userId,
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      customSystemPrompt: data.customSystemPrompt ?? null,
      config: data.config ?? {},
      requiredIntegrations: data.requiredIntegrations ?? [],
      status: 'active',
    })
    .returning();
  
  return bot;
}

/**
 * Update bot instance
 */
export async function updateBot(
  botId: string,
  data: {
    name?: string;
    description?: string;
    status?: 'active' | 'paused' | 'deleted';
    customSystemPrompt?: string;
    config?: Partial<BotConfig>;
    requiredIntegrations?: string[];
  }
) {
  // If updating config, merge with existing
  let configUpdate = data.config;
  if (data.config) {
    const bot = await getBotById(botId);
    if (bot) {
      configUpdate = {
        ...(bot.config as BotConfig),
        ...data.config,
      };
    }
  }
  
  const [bot] = await db
    .update(bots)
    .set({
      ...data,
      config: configUpdate,
      updatedAt: new Date(),
    })
    .where(eq(bots.id, botId))
    .returning();
  
  return bot ?? null;
}

/**
 * Soft delete bot
 */
export async function deleteBot(botId: string) {
  const [bot] = await db
    .update(bots)
    .set({
      status: 'deleted',
      updatedAt: new Date(),
    })
    .where(eq(bots.id, botId))
    .returning();
  
  return bot ?? null;
}

/**
 * Pause bot
 */
export async function pauseBot(botId: string) {
  const [bot] = await db
    .update(bots)
    .set({
      status: 'paused',
      updatedAt: new Date(),
    })
    .where(eq(bots.id, botId))
    .returning();
  
  return bot ?? null;
}

/**
 * Activate bot
 */
export async function activateBot(botId: string) {
  const [bot] = await db
    .update(bots)
    .set({
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(bots.id, botId))
    .returning();
  
  return bot ?? null;
}

/**
 * Count user's active bots
 */
export async function countUserActiveBots(userId: string) {
  const result = await db
    .select()
    .from(bots)
    .where(
      and(
        eq(bots.userId, userId),
        eq(bots.status, 'active')
      )
    );
  
  return result.length;
}
