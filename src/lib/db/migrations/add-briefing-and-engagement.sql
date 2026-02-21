-- Migration: Morning Briefing System + Day 1-7 Engagement Messages
-- Phase 2 + Phase 3 of the Clawer.ai Onboarding & Retention System
-- Run: psql $DATABASE_URL -f this_file.sql

-- ── Morning Briefing fields on users ─────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS briefing_enabled        INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS briefing_time           TEXT                 DEFAULT '07:30',
  ADD COLUMN IF NOT EXISTS briefing_channel        TEXT                 DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS briefing_timezone       TEXT                 DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS briefing_include_summary  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS briefing_include_working  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS briefing_include_reminders INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS briefing_include_news     INTEGER NOT NULL DEFAULT 0;

-- ── Engagement messages table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS engagement_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type    TEXT        NOT NULL,
  scheduled_for   TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'pending',
  skip_reason     TEXT,
  content         TEXT,
  channel         TEXT        NOT NULL DEFAULT 'web',
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_messages_user_id
  ON engagement_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_engagement_messages_status_scheduled
  ON engagement_messages(status, scheduled_for)
  WHERE status = 'pending';
