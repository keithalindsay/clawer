import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';

/**
 * Admin/System Settings - Global configuration managed by admins
 */
export const adminSettings = pgTable('admin_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Setting key (unique identifier) */
  key: text('key').notNull().unique(),
  
  /** Setting value (JSON for flexibility) */
  value: jsonb('value').notNull(),
  
  /** Human-readable description */
  description: text('description'),
  
  /** Is this setting sensitive (hide in UI)? */
  sensitive: boolean('sensitive').default(false),
  
  /** Last updated by (user ID) */
  updatedBy: text('updated_by'),
  
  /** Timestamps */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Known setting keys
 */
export const SETTING_KEYS = {
  // LLM Provider Settings
  LLM_PROVIDER: 'llm_provider',           // 'openai' | 'anthropic' | 'google' | 'openrouter'
  LLM_API_KEY: 'llm_api_key',             // Encrypted API key
  LLM_MODEL: 'llm_model',                  // Model ID (e.g., 'gpt-4o-mini')
  LLM_BASE_URL: 'llm_base_url',           // Optional custom base URL
  
  // Support Agent Settings
  SUPPORT_AGENT_ENABLED: 'support_agent_enabled',
  SUPPORT_AGENT_MODEL: 'support_agent_model',
  SUPPORT_AGENT_MAX_DIAGNOSES_HOUR: 'support_agent_max_diagnoses_hour',
  
  // Container Defaults
  DEFAULT_CONTAINER_MODEL: 'default_container_model',
  DEFAULT_CONTAINER_PROVIDER: 'default_container_provider',
  
  // Feature Flags
  FEATURE_MODEL_SELECTION: 'feature_model_selection',
  FEATURE_WHATSAPP: 'feature_whatsapp',
  FEATURE_TELEGRAM: 'feature_telegram',
  FEATURE_SLACK: 'feature_slack',
} as const;

export type AdminSettings = typeof adminSettings.$inferSelect;
export type NewAdminSettings = typeof adminSettings.$inferInsert;
