import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * WhatsApp connections table - stores Baileys session data per user
 */
export const whatsappConnections = pgTable('whatsapp_connections', {
  /** Unique connection ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Owner user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  /** WhatsApp phone number (with country code, no + sign) */
  phoneNumber: text('phone_number'),
  
  /** Connection status */
  status: text('status').notNull().default('disconnected'), // disconnected, connecting, qr_ready, connected, error
  
  /** Last QR code string (for display) */
  lastQrCode: text('last_qr_code'),
  
  /** QR code expiration timestamp */
  qrExpiresAt: timestamp('qr_expires_at'),
  
  /** Encrypted Baileys auth state (credentials) */
  encryptedAuthState: text('encrypted_auth_state'),
  
  /** Encryption IV for auth state */
  authStateIv: text('auth_state_iv'),
  
  /** Encryption auth tag */
  authStateAuthTag: text('auth_state_auth_tag'),
  
  /** Last connection timestamp */
  lastConnectedAt: timestamp('last_connected_at'),
  
  /** Last error message */
  lastError: text('last_error'),
  
  /** Is currently active */
  isActive: boolean('is_active').notNull().default(false),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
