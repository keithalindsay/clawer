import { pgTable, text, timestamp, serial, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Feedback category enum
 */
export const feedbackCategoryEnum = pgEnum('feedback_category', [
  'feature_request',
  'bug',
  'skill_request',
  'general'
]);

/**
 * Feedback status enum
 */
export const feedbackStatusEnum = pgEnum('feedback_status', [
  'new',
  'reviewed',
  'planned',
  'done',
  'wont_fix'
]);

/**
 * Feedback table - user feedback and feature requests
 */
export const feedback = pgTable('feedback', {
  /** Auto-incrementing primary key */
  id: serial('id').primaryKey(),
  
  /** User ID from Clerk (nullable for anonymous feedback) */
  userId: text('user_id'),
  
  /** Feedback category */
  category: feedbackCategoryEnum('category').notNull(),
  
  /** Feedback message */
  message: text('message').notNull(),
  
  /** Email for anonymous feedback */
  email: text('email'),
  
  /** Page where feedback was submitted */
  page: text('page'),
  
  /** Feedback status */
  status: feedbackStatusEnum('status').notNull().default('new'),
  
  /** Creation timestamp */
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
  /** Last update timestamp */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
