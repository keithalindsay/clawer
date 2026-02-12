import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { bots } from './bots';

/**
 * Conversations table - chat threads
 */
export const conversations = pgTable('conversations', {
  /** Unique conversation ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Owner user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** Associated bot ID */
  botId: uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  
  /** Conversation title (auto-generated or user-set) */
  title: text('title'),
  
  /** Message count in conversation */
  messageCount: integer('message_count').notNull().default(0),
  
  /** Total tokens used in conversation */
  totalTokens: integer('total_tokens').notNull().default(0),
  
  /** Conversation metadata */
  metadata: jsonb('metadata').notNull().default({}),
  
  /** Agent ID for agent-specific threads (null for general conversation) */
  agentId: text('agent_id'),
  
  /** Agent name (denormalized for quick display) */
  agentName: text('agent_name'),
  
  /** Agent emoji avatar */
  agentEmoji: text('agent_emoji'),
  
  /** Agent role description */
  agentRole: text('agent_role'),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last message timestamp */
  lastMessageAt: timestamp('last_message_at').notNull().defaultNow(),
  
  /** Soft delete timestamp */
  deletedAt: timestamp('deleted_at'),
});
