import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Bot settings - user's AI personality customization
 */
export const botSettings = pgTable('bot_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** User ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  /** Bot name (e.g., "Aria", "Max", "Assistant") */
  botName: text('bot_name').notNull().default('Assistant'),
  
  /** Bot avatar emoji or URL */
  botAvatar: text('bot_avatar').default('🤖'),
  
  /** 
   * Personality description - becomes part of system prompt
   * e.g., "friendly and casual", "professional and concise", "witty with dark humor"
   */
  personality: text('personality').default('helpful and friendly'),
  
  /**
   * Custom instructions - additional context for the AI
   * e.g., "I work in finance", "Always respond in bullet points"
   */
  customInstructions: text('custom_instructions'),
  
  /**
   * Preferred communication style
   */
  communicationStyle: text('communication_style').default('balanced'), // casual, balanced, formal
  
  /**
   * Response length preference
   */
  responseLength: text('response_length').default('balanced'), // brief, balanced, detailed
  
  /**
   * Additional settings as JSON for extensibility
   */
  additionalSettings: jsonb('additional_settings'),
  
  /** Timestamps */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type BotSettings = typeof botSettings.$inferSelect;
export type NewBotSettings = typeof botSettings.$inferInsert;
