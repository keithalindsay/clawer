-- Migration: Add defaultAgentId field for AI Teams Phase 1
-- Created: 2026-02-23

ALTER TABLE "users" ADD COLUMN "default_agent_id" text;

-- Add comment
COMMENT ON COLUMN "users"."default_agent_id" IS 'Default/active agent ID for team (Phase 1: single agent provisioning)';
