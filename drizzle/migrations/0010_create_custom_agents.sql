-- Migration: Create custom_agents table for AI Teams Phase 4
-- Created: 2026-02-23
-- Purpose: Allow users to create custom AI team members with specialized roles

CREATE TABLE IF NOT EXISTS "custom_agents" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "name" text NOT NULL,
  "emoji" text,
  "role" text,
  "personality" text,
  "skills" jsonb DEFAULT '[]'::jsonb,
  "delegation_config" jsonb DEFAULT '{}'::jsonb,
  "triggers" jsonb DEFAULT '[]'::jsonb,
  "quick_prompts" jsonb DEFAULT '[]'::jsonb,
  "config" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "updated_at" timestamp DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "custom_agents_user_id_idx" ON "custom_agents" ("user_id");
CREATE INDEX IF NOT EXISTS "custom_agents_agent_id_idx" ON "custom_agents" ("agent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "custom_agents_user_agent_unique" ON "custom_agents" ("user_id", "agent_id");

-- Add comments
COMMENT ON TABLE "custom_agents" IS 'User-created custom AI team members (Phase 4)';
COMMENT ON COLUMN "custom_agents"."user_id" IS 'Owner of this custom agent';
COMMENT ON COLUMN "custom_agents"."agent_id" IS 'Unique agent identifier (e.g., finance, coder)';
COMMENT ON COLUMN "custom_agents"."name" IS 'Display name for agent';
COMMENT ON COLUMN "custom_agents"."emoji" IS 'Agent emoji for UI';
COMMENT ON COLUMN "custom_agents"."role" IS 'Agent role/title';
COMMENT ON COLUMN "custom_agents"."personality" IS 'Agent personality description';
COMMENT ON COLUMN "custom_agents"."skills" IS 'Array of allowed tools/skills';
COMMENT ON COLUMN "custom_agents"."delegation_config" IS 'Inter-agent delegation rules';
COMMENT ON COLUMN "custom_agents"."triggers" IS 'Keywords that trigger this agent';
COMMENT ON COLUMN "custom_agents"."quick_prompts" IS 'Example prompts for this agent';
COMMENT ON COLUMN "custom_agents"."config" IS 'Full agent configuration JSON';
