import { pgTable, text, timestamp, date, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Family members (children) — MomBrain profile data
 * Each record represents one child belonging to a user.
 */
export const familyMembers = pgTable('family_members', {
  /** UUID primary key */
  id: text('id').primaryKey(),

  /** Parent user ID */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  /** Child's first name */
  name: text('name').notNull(),

  /** Date of birth (for age-appropriate suggestions) */
  birthDate: date('birth_date'),

  /** Current school grade (e.g., '3rd', 'K', '8th') */
  grade: text('grade'),

  /** School name */
  school: text('school'),

  /** List of interests for activity/homework suggestions */
  interests: jsonb('interests').$type<string[]>().default([]),

  /** Per-child dietary restrictions */
  dietaryRestrictions: jsonb('dietary_restrictions').$type<string[]>().default([]),

  /** Free-form notes about this child */
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Family preferences — dietary, cooking, schedule settings
 * One row per user (userId is primary key).
 */
export const familyPreferences = pgTable('family_preferences', {
  /** Same as users.id — one row per user */
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),

  /** Family-level dietary restrictions (e.g., ['nut-free', 'vegetarian']) */
  dietaryRestrictions: jsonb('dietary_restrictions').$type<string[]>().default([]),

  /** Preferred cuisines (e.g., ['Mexican', 'Italian']) */
  cuisinePreferences: jsonb('cuisine_preferences').$type<string[]>().default([]),

  /** Budget level: 'budget' | 'moderate' | 'flexible' */
  budgetLevel: text('budget_level').default('moderate'),

  /** Cooking skill: 'beginner' | 'intermediate' | 'advanced' */
  cookingSkill: text('cooking_skill').default('intermediate'),

  /** Preferred dinner time in HH:MM (24h) */
  dinnerTime: text('dinner_time').default('18:00'),

  /** Preferred grocery shopping day */
  groceryDay: text('grocery_day').default('saturday'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Push tokens — Expo push notification tokens
 * One row per user (userId is primary key, so latest token wins per user).
 */
export const pushTokens = pgTable('push_tokens', {
  /** Same as users.id */
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),

  /** Expo push token (e.g., 'ExponentPushToken[xxx]') */
  token: text('token').notNull(),

  /** Device platform: 'ios' | 'android' */
  platform: text('platform').notNull(),

  updatedAt: timestamp('updated_at').defaultNow(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;

export type FamilyPreferences = typeof familyPreferences.$inferSelect;
export type NewFamilyPreferences = typeof familyPreferences.$inferInsert;

export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;
