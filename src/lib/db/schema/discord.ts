import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Discord bot connections
 * Stores user's Discord bot tokens (BYOB mode)
 */
export const discordConnections = pgTable('discord_connections', {
  /** Unique connection ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Owner user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Encrypted bot token (AES-256-GCM) */
  encryptedBotToken: text('encrypted_bot_token').notNull(),
  
  /** Encryption IV */
  tokenIv: text('token_iv').notNull(),
  
  /** Encryption auth tag */
  tokenAuthTag: text('token_auth_tag').notNull(),
  
  /** Bot username (for display) */
  botUsername: text('bot_username'),
  
  /** Bot tag (username#discriminator) */
  botTag: text('bot_tag'),
  
  /** Whether bot is currently running */
  isActive: boolean('is_active').notNull().default(false),
  
  /** Last error message */
  lastError: text('last_error'),
  
  /** Last successful connection */
  lastConnectedAt: timestamp('last_connected_at'),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
