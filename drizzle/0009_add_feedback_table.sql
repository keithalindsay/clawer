-- Create feedback category enum
CREATE TYPE "public"."feedback_category" AS ENUM('feature_request', 'bug', 'skill_request', 'general');--> statement-breakpoint

-- Create feedback status enum
CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewed', 'planned', 'done', 'wont_fix');--> statement-breakpoint

-- Create feedback table
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"category" "feedback_category" NOT NULL,
	"message" text NOT NULL,
	"email" text,
	"page" text,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign key constraint for user_id (nullable)
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;--> statement-breakpoint

-- Add indexes for common queries
CREATE INDEX "idx_feedback_user_id" ON "feedback" USING btree ("user_id");
CREATE INDEX "idx_feedback_status" ON "feedback" USING btree ("status");
CREATE INDEX "idx_feedback_created_at" ON "feedback" USING btree ("created_at" DESC);
