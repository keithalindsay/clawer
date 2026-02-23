import { pgTable, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

/**
 * User subscription tier enum
 * - free: Qwen3 only, 100 total messages
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
  
  /** Slack app-level token (xapp-...) for Socket Mode */
  slackAppToken: text('slack_app_token'),
  
  /** Slack signing secret */
  slackSigningSecret: text('slack_signing_secret'),
  
  /** Slack team/workspace ID */
  slackTeamId: text('slack_team_id'),
  
  /** Slack connected status (container-based) */
  slackConnected: integer('slack_connected').default(0),
  
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
  /** Container image version */
  imageVersion: text('image_version'),
  
  /** Last backup timestamp */
  lastBackup: timestamp('last_backup'),
  
  /** Number of backups */
  backupCount: integer('backup_count').default(0),
  
  /** Gateway token for container API authentication */
  gatewayToken: text('gateway_token'),
  
  /** Selected AI team template */
  teamTemplate: text('team_template').default('lifeos'),
  
  /** WhatsApp connected status */
  whatsappConnected: integer('whatsapp_connected').default(0),
  
  /** Telegram connected status */
  telegramConnected: integer('telegram_connected').default(0),
  
  /** Whether onboarding has been completed */
  onboardingCompleted: integer('onboarding_completed').notNull().default(0),

  /* ── Morning Briefing Settings ─────────────────────────────── */

  /** Whether morning briefing is enabled */
  briefingEnabled: integer('briefing_enabled').notNull().default(0),

  /** Time to send briefing in "HH:MM" format (user's local time) */
  briefingTime: text('briefing_time').default('07:30'),

  /** Delivery channel for briefing */
  briefingChannel: text('briefing_channel').default('whatsapp'), // 'whatsapp' | 'telegram' | 'web'

  /** User's timezone for briefing scheduling */
  briefingTimezone: text('briefing_timezone').default('America/New_York'),

  /** Include daily summary in briefing */
  briefingIncludeSummary: integer('briefing_include_summary').notNull().default(1),

  /** Include current working task in briefing */
  briefingIncludeWorking: integer('briefing_include_working').notNull().default(1),

  /** Include upcoming event reminders in briefing */
  briefingIncludeReminders: integer('briefing_include_reminders').notNull().default(0),

  /** Include industry news in briefing */
  briefingIncludeNews: integer('briefing_include_news').notNull().default(0),

  // ─── Onboarding context answers ───────────────────────────────────────
  /** Preferred notification channel (whatsapp | telegram | slack | web) */
  preferredChannel: text('preferred_channel').default('web'),

  // LifeOS template
  onboardingStress: text('onboarding_stress'),
  onboardingStart: text('onboarding_start'),
  onboardingStop: text('onboarding_stop'),

  // Solopreneur template
  onboardingBusiness: text('onboarding_business'),
  onboardingCustomer: text('onboarding_customer'),
  onboardingPlatform: text('onboarding_platform'),

  // Content Creator template
  onboardingNiche: text('onboarding_niche'),
  onboardingPlatforms: text('onboarding_platforms'),
  onboardingBestContent: text('onboarding_best_content'),

  // E-Commerce template
  onboardingProduct: text('onboarding_product'),
  onboardingCompetitor: text('onboarding_competitor'),
  onboardingChallenge: text('onboarding_challenge'),

  // Growth Ops template
  onboardingStage: text('onboarding_stage'),
  onboardingBlocker: text('onboarding_blocker'),
  onboardingTried: text('onboarding_tried'),

  // Fitness template
  onboardingGoal: text('onboarding_goal'),
  onboardingDays: text('onboarding_days'),
  onboardingRestrictions: text('onboarding_restrictions'),

  // Mom/Parent template
  onboardingKidsAges: text('onboarding_kids_ages'),
  onboardingScheduleComplexity: text('onboarding_schedule_complexity'),
  onboardingPainPoint: text('onboarding_pain_point'),

  // Finance template
  onboardingFinanceGoal: text('onboarding_finance_goal'),
  onboardingMoneyStress: text('onboarding_money_stress'),
  onboardingIncomeRange: text('onboarding_income_range'),

  // ─── Morning briefing ─────────────────────────────────────────────────
  morningBriefingEnabled: integer('morning_briefing_enabled').default(0),
  morningBriefingTime: text('morning_briefing_time').default('07:30'),
  morningBriefingChannel: text('morning_briefing_channel').default('whatsapp'),
  morningBriefingTimezone: text('morning_briefing_timezone').default('America/Chicago'),

  /** Free trial messages used (out of 100, no credit card required) */
  freeMessagesUsed: integer('free_messages_used').notNull().default(0),
  
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
