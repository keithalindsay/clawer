/**
 * API Keys table - Stores user-provided API keys for AI model providers
 * 
 * Users bring their own keys (BYOK) for models in their container.
 * Keys are stored as plaintext (encryption not yet implemented).
 * 
 * MIGRATION NEEDED:
 * Run: npx drizzle-kit generate && npx drizzle-kit migrate
 * 
 * Or manually:
 * ```sql
 * CREATE TYPE api_key_provider AS ENUM ('openai', 'anthropic', 'google', 'deepseek');
 * 
 * CREATE TABLE api_keys (
 *   id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
 *   user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   provider api_key_provider NOT NULL,
 *   encrypted_key TEXT NOT NULL,
 *   last_validated TIMESTAMP,
 *   is_valid BOOLEAN DEFAULT NULL,
 *   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
 *   UNIQUE(user_id, provider)
 * );
 * 
 * CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
 * ```
 */

import { pgTable, text, timestamp, boolean, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const apiKeyProviderEnum = pgEnum('api_key_provider', [
  'openai',
  'anthropic',
  'google',
  'deepseek',
]);

export const apiKeys = pgTable('api_keys', {
  /** Unique key ID */
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  /** Owner user ID (references users table) */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  /** AI provider name */
  provider: apiKeyProviderEnum('provider').notNull(),

  /** API key (plaintext — encryption not yet implemented) */
  encryptedKey: text('encrypted_key').notNull(),

  /** Last time the key was validated against the provider */
  lastValidated: timestamp('last_validated'),

  /** Whether the key passed validation (null = untested) */
  isValid: boolean('is_valid'),

  /** Record creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('api_keys_user_provider_idx').on(table.userId, table.provider),
]);

/** Provider display names and metadata */
export const API_KEY_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4, GPT-3.5',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude Opus, Sonnet, Haiku',
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    name: 'Google Gemini',
    description: 'Gemini Pro, Flash',
    keyPrefix: 'AI',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'DeepSeek V3, R1',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.deepseek.com/api_keys',
  },
} as const;

export type ApiKeyProvider = keyof typeof API_KEY_PROVIDERS;
