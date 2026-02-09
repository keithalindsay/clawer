-- Create API key provider enum
CREATE TYPE "public"."api_key_provider" AS ENUM('openai', 'anthropic', 'google', 'deepseek');--> statement-breakpoint

-- Create API keys table for BYOK (Bring Your Own Key)
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"provider" "api_key_provider" NOT NULL,
	"encrypted_key" text NOT NULL,
	"last_validated" timestamp,
	"is_valid" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_user_id_provider_key" UNIQUE("user_id","provider")
);--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Add index for faster lookups
CREATE INDEX "idx_api_keys_user_id" ON "api_keys" USING btree ("user_id");

-- NOTE: This migration file was created retroactively. The table already exists in production.
-- Created on: 2026-02-09 by db-migration-audit agent