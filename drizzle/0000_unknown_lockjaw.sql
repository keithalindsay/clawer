CREATE TYPE "public"."bot_status" AS ENUM('active', 'paused', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."bot_type" AS ENUM('email', 'calendar', 'research', 'assistant', 'custom');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('gmail', 'google_calendar', 'google_drive', 'notion', 'slack');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'expired', 'revoked', 'error');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('message', 'tool_call', 'integration');--> statement-breakpoint
CREATE TABLE "bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "bot_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "bot_status" DEFAULT 'active' NOT NULL,
	"custom_system_prompt" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"required_integrations" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bot_id" uuid NOT NULL,
	"title" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "daily_usage_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"total_input_tokens" integer DEFAULT 0 NOT NULL,
	"total_output_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost_micros" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"provider_account_id" text,
	"provider_email" text,
	"encrypted_access_token" text NOT NULL,
	"encrypted_refresh_token" text,
	"token_iv" text NOT NULL,
	"token_auth_tag" text NOT NULL,
	"token_expires_at" timestamp,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_sync_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"tool_call_id" text,
	"model" text,
	"token_count" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bot_id" uuid,
	"type" "usage_type" NOT NULL,
	"model" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micros" integer DEFAULT 0 NOT NULL,
	"period_start" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"tier" "tier" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"daily_message_count" integer DEFAULT 0 NOT NULL,
	"daily_reset_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_usage_summary" ADD CONSTRAINT "daily_usage_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;