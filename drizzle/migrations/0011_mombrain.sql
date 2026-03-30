-- MomBrain schema extension
-- Adds family_members, family_preferences, push_tokens tables
-- and display_name / timezone columns to the users table

-- ── Family Members ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id                   TEXT        PRIMARY KEY,
  user_id              TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  birth_date           DATE,
  grade                TEXT,
  school               TEXT,
  interests            JSONB       DEFAULT '[]'::jsonb,
  dietary_restrictions JSONB       DEFAULT '[]'::jsonb,
  notes                TEXT,
  created_at           TIMESTAMP   DEFAULT NOW(),
  updated_at           TIMESTAMP   DEFAULT NOW()
);

-- ── Family Preferences ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_preferences (
  user_id              TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dietary_restrictions JSONB       DEFAULT '[]'::jsonb,
  cuisine_preferences  JSONB       DEFAULT '[]'::jsonb,
  budget_level         TEXT        DEFAULT 'moderate',
  cooking_skill        TEXT        DEFAULT 'intermediate',
  dinner_time          TEXT        DEFAULT '18:00',
  grocery_day          TEXT        DEFAULT 'saturday',
  created_at           TIMESTAMP   DEFAULT NOW(),
  updated_at           TIMESTAMP   DEFAULT NOW()
);

-- ── Push Tokens (Expo) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id    TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  platform   TEXT        NOT NULL,
  updated_at TIMESTAMP   DEFAULT NOW()
);

-- ── Users table — new columns ─────────────────────────────────────────────────
-- onboarding_completed already exists; only add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone     TEXT DEFAULT 'America/Chicago';
