-- Migration: Add onboarding context answers and channel preferences
-- Phase 1: Template Quick Starts + First Deliverable

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_channel" text DEFAULT 'web';

-- LifeOS context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_stress" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_start" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_stop" text;

-- Solopreneur context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_business" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_customer" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_platform" text;

-- Content Creator context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_niche" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_platforms" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_best_content" text;

-- E-Commerce context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_product" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_competitor" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_challenge" text;

-- Growth Ops context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_stage" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_blocker" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_tried" text;

-- Fitness context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_goal" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_days" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_restrictions" text;

-- Mom/Parent context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_kids_ages" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_schedule_complexity" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_pain_point" text;

-- Finance context
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_finance_goal" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_money_stress" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_income_range" text;

-- Morning briefing preferences
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_enabled" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_time" text DEFAULT '07:30';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_channel" text DEFAULT 'whatsapp';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_timezone" text DEFAULT 'America/Chicago';
