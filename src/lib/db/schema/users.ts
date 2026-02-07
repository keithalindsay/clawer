import { pgTable, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

/**
 * User subscription tier enum
 * - free: Qwen3 only, 100 messages/day
 * - basic: Kimi access, 500 messages/day
 * - pro: Sonnet access, 2000 messages/day
 * - enterprise: Opus access, unlimited
 */
export const tierEnum = pgEnum('tier', ['free', 'basic', 'pro', 'enterprise']);

/**
 * Users table - synced from Clerk via webhook
 */
export const users = pgTable('users', {
  /** Clerk user ID (primary key) */
  id: text('id').primaryKey(),
  
  /** User email from Clerk */
  email: text('email').notNull(),
  
  /** Display name */
  name: text('name'),
  
  /** Subscription tier */
  tier: tierEnum('tier').notNull().default('free'),
  
  /** Stripe customer ID for billing */
  stripeCustomerId: text('stripe_customer_id'),
  
  /** Stripe subscription ID */
  stripeSubscriptionId: text('stripe_subscription_id'),
  
  /** Slack bot token (encrypted) - BYOB mode */
  slackBotToken: text('slack_bot_token'),
  
  /** Slack team/workspace ID */
  slackTeamId: text('slack_team_id'),
  
  /** Telegram bot token (encrypted) - BYOB mode */
  telegramBotToken: text('telegram_bot_token'),
  
  /** Telegram bot username */
  telegramBotUsername: text('telegram_bot_username'),
  
  /** Container ID (Docker) */
  containerId: text('container_id'),
  
  /** Container port number (for Docker orchestration) */
  containerPort: integer('container_port'),
  
  /** Container status */
  containerStatus: text('container_status'), // 'running' | 'stopped' | 'provisioning' | 'error'
  
  /** Container created timestamp */
  containerCreatedAt: timestamp('container_created_at'),
  
  /** WhatsApp connected status */
  whatsappConnected: integer('whatsapp_connected').default(0),
  
  /** Telegram connected status */
  telegramConnected: integer('telegram_connected').default(0),
  
  /** Monthly message count */
  monthlyMessageCount: integer('monthly_message_count').notNull().default(0),
  
  /** Monthly reset timestamp */
  monthlyResetAt: timestamp('monthly_reset_at').notNull().defaultNow(),
  
  /** Daily message count (reset at midnight UTC) */
  dailyMessageCount: integer('daily_message_count').notNull().default(0),
  
  /** Last message count reset timestamp */
  dailyResetAt: timestamp('daily_reset_at').notNull().defaultNow(),
  
  /** Account creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  /** Soft delete flag */
  deletedAt: timestamp('deleted_at'),
});
