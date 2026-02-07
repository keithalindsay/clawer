import { pgTable, text, timestamp, pgEnum, jsonb, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Bot type enum - defines available bot specializations
 */
export const botTypeEnum = pgEnum('bot_type', [
  'email',      // Gmail integration
  'calendar',   // Google Calendar integration
  'research',   // Web search and summarization
  'assistant',  // General purpose
  'custom',     // User-defined (enterprise only)
]);

/**
 * Bot status enum
 */
export const botStatusEnum = pgEnum('bot_status', [
  'active',     // Currently usable
  'paused',     // Temporarily disabled
  'deleted',    // Soft deleted
]);

/**
 * Bots table - user's bot instances
 */
export const bots = pgTable('bots', {
  /** Unique bot instance ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Owner user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Bot type */
  type: botTypeEnum('type').notNull(),
  
  /** User-defined name */
  name: text('name').notNull(),
  
  /** Bot description */
  description: text('description'),
  
  /** Current status */
  status: botStatusEnum('status').notNull().default('active'),
  
  /** Custom system prompt override (enterprise only) */
  customSystemPrompt: text('custom_system_prompt'),
  
  /** Bot-specific configuration (JSON) */
  config: jsonb('config').notNull().default({}),
  
  /** Required integrations for this bot */
  requiredIntegrations: text('required_integrations').array().notNull().default([]),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Bot configuration type
 */
export interface BotConfig {
  /** Preferred model override */
  preferredModel?: string;
  
  /** Max tokens per response */
  maxTokens?: number;
  
  /** Temperature setting */
  temperature?: number;
  
  /** Custom tool restrictions */
  allowedTools?: string[];
  
  /** Custom response format */
  responseFormat?: 'text' | 'markdown' | 'json';
}
