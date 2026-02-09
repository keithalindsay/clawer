-- Add Slack integration columns to users table
ALTER TABLE "users" ADD COLUMN "slack_app_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slack_signing_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slack_connected" integer DEFAULT 0;