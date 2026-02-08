import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const instances = pgTable('instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  containerId: text('container_id').notNull().unique(),
  status: text('status').notNull().default('running'), // 'running' | 'stopped' | 'error'
  webhookUrl: text('webhook_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Instance = typeof instances.$inferSelect;
export type NewInstance = typeof instances.$inferInsert;
