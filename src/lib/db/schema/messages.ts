import { pgTable, text, timestamp, uuid, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';

/**
 * Message role enum
 */
export const messageRoleEnum = pgEnum('message_role', [
  'user',       // User input
  'assistant',  // Bot response
  'system',     // System message
  'tool',       // Tool call result
]);

/**
 * Messages table - individual chat messages
 */
export const messages = pgTable('messages', {
  /** Unique message ID */
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Parent conversation ID */
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  
  /** Message role */
  role: messageRoleEnum('role').notNull(),
  
  /** Message content */
  content: text('content').notNull(),
  
  /** Tool calls made in this message */
  toolCalls: jsonb('tool_calls'),
  
  /** Tool call ID (for tool responses) */
  toolCallId: text('tool_call_id'),
  
  /** Model used for this message */
  model: text('model'),
  
  /** Token count for this message */
  tokenCount: integer('token_count'),
  
  /** Input tokens (for assistant messages) */
  inputTokens: integer('input_tokens'),
  
  /** Output tokens (for assistant messages) */
  outputTokens: integer('output_tokens'),
  
  /** Message metadata */
  metadata: jsonb('metadata').notNull().default({}),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Tool call structure
 */
export interface ToolCall {
  /** Unique tool call ID */
  id: string;
  
  /** Tool name */
  name: string;
  
  /** Tool arguments (JSON) */
  arguments: Record<string, unknown>;
}
