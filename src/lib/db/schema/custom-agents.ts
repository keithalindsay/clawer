import { pgTable, text, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';

/**
 * Custom Agents - User-created team members
 * 
 * Allows users to create their own agents beyond template teams.
 */
export const customAgents = pgTable('custom_agents', {
  /** Auto-incrementing ID */
  id: serial('id').primaryKey(),
  
  /** User who owns this agent */
  userId: text('user_id').notNull(),
  
  /** Unique agent ID (e.g., "finance", "coder") */
  agentId: text('agent_id').notNull(),
  
  /** Display name */
  name: text('name').notNull(),
  
  /** Agent emoji */
  emoji: text('emoji'),
  
  /** Agent role (e.g., "Financial Advisor") */
  role: text('role'),
  
  /** Agent personality description */
  personality: text('personality'),
  
  /** Skills/tools allowed for this agent */
  skills: jsonb('skills').$type<string[]>().default([]),
  
  /** Delegation configuration */
  delegationConfig: jsonb('delegation_config').$type<{
    canDelegateTo?: string[];
    canReceiveFrom?: string[];
  }>().default({}),
  
  /** Agent triggers (keywords) */
  triggers: jsonb('triggers').$type<string[]>().default([]),
  
  /** Quick prompts */
  quickPrompts: jsonb('quick_prompts').$type<string[]>().default([]),
  
  /** Full agent configuration */
  config: jsonb('config').$type<Record<string, any>>().default({}),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type CustomAgent = typeof customAgents.$inferSelect;
export type NewCustomAgent = typeof customAgents.$inferInsert;
