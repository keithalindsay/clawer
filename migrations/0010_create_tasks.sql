-- Migration: Create tasks table for Kanban task board
-- Run: psql $DATABASE_URL -f migrations/0010_create_tasks.sql

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',    -- backlog, queued, running, done, failed
  priority TEXT NOT NULL DEFAULT 'medium',   -- low, medium, high, urgent
  assigned_to TEXT,                          -- team member ID (from team template)
  result TEXT,                               -- agent's response/output
  error TEXT,                                -- error message if failed
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
