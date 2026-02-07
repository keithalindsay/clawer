import { pgTable, text, timestamp, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Integration provider enum
 */
export const integrationProviderEnum = pgEnum('integration_provider', [
  'gmail',
  'google_calendar',
  'google_drive',
  'notion',
  'slack',
  'whatsapp',
]);

/**
 * Integration status enum
 */
export const integrationStatusEnum = pgEnum('integration_status', [
  'active',       // Working correctly
  'expired',      // Token expired, needs refresh
  'revoked',      // User revoked access
  'error',        // Integration error
]);

/**
 * Integrations table - OAuth connections per user
 */
export const integrations = pgTable('integrations', {
  /** Unique integration ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Owner user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Integration provider */
  provider: integrationProviderEnum('provider').notNull(),
  
  /** Current status */
  status: integrationStatusEnum('status').notNull().default('active'),
  
  /** Provider account ID (for identification) */
  providerAccountId: text('provider_account_id'),
  
  /** Provider account email */
  providerEmail: text('provider_email'),
  
  /** Encrypted access token (AES-256-GCM) */
  encryptedAccessToken: text('encrypted_access_token').notNull(),
  
  /** Encrypted refresh token (AES-256-GCM) */
  encryptedRefreshToken: text('encrypted_refresh_token'),
  
  /** Encryption IV */
  tokenIv: text('token_iv').notNull(),
  
  /** Encryption auth tag */
  tokenAuthTag: text('token_auth_tag').notNull(),
  
  /** Token expiration timestamp */
  tokenExpiresAt: timestamp('token_expires_at'),
  
  /** OAuth scopes granted */
  scopes: text('scopes').array().notNull().default([]),
  
  /** Integration-specific settings */
  settings: jsonb('settings').notNull().default({}),
  
  /** Last successful sync timestamp */
  lastSyncAt: timestamp('last_sync_at'),
  
  /** Last error message */
  lastError: text('last_error'),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
