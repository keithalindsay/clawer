-- Launch Engine Phase 0: Content Items, Thread Items, Campaigns, Content Metrics
-- Migration: 0011_launch_engine_phase0
-- Created: 2026-02-23
-- Schema: content_items, thread_items, campaigns, content_metrics

-- Create enums
CREATE TYPE "public"."content_type" AS ENUM('tweet', 'blog', 'thread', 'reddit', 'linkedin', 'newsletter', 'email');--> statement-breakpoint
CREATE TYPE "public"."content_voice" AS ENUM('founder', 'brand');--> statement-breakpoint
CREATE TYPE "public"."content_source_type" AS ENUM('trending', 'blog-promo', 'build-in-public', 'competitor', 'community', 'campaign', 'manual');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('generating', 'gate-review', 'failed-gate', 'queued', 'approved', 'scheduled', 'published', 'killed');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint

-- Create content_items table
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"campaign_id" uuid,
	"content_type" "content_type" NOT NULL,
	"voice" "content_voice",
	"content_pillar" text,
	"source_type" "content_source_type",
	"source_ref" jsonb,
	"title" text,
	"body_md" text,
	"body_platform" jsonb,
	"media_urls" jsonb,
	"status" "content_status" DEFAULT 'generating' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"published_url" text,
	"gate_score" numeric(3,1),
	"gate_scores" jsonb,
	"gate_flags" jsonb,
	"gate_passed" boolean,
	"gate_reviewed_at" timestamp,
	"word_count" integer,
	"char_count" integer,
	"seo_keywords" jsonb,
	"target_channel" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign key for workspace_id
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Create indexes for content_items
CREATE INDEX "idx_content_items_workspace_id" ON "content_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_content_items_campaign_id" ON "content_items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_content_items_status" ON "content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_items_content_type" ON "content_items" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "idx_content_items_scheduled_at" ON "content_items" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_content_items_created_at" ON "content_items" USING btree ("created_at" DESC);

-- Create thread_items table
CREATE TABLE "thread_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"body" text NOT NULL,
	"char_count" integer,
	"media_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign key for thread_items -> content_items
ALTER TABLE "thread_items" ADD CONSTRAINT "thread_items_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Create indexes for thread_items
CREATE INDEX "idx_thread_items_content_id" ON "thread_items" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_thread_items_position" ON "thread_items" USING btree ("position");

-- Create campaigns table
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"brief" text,
	"goal" text,
	"target_persona" text,
	"content_pillars" jsonb,
	"template" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"total_reach" bigint DEFAULT 0,
	"total_engagement" numeric(5,2) DEFAULT '0',
	"total_signups" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign key for campaigns -> users
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Create indexes for campaigns
CREATE INDEX "idx_campaigns_workspace_id" ON "campaigns" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_start_date" ON "campaigns" USING btree ("start_date");

-- Add foreign key for content_items -> campaigns
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;--> statement-breakpoint

-- Create content_metrics table
CREATE TABLE "content_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"impressions" bigint DEFAULT 0,
	"likes" integer DEFAULT 0,
	"retweets" integer DEFAULT 0,
	"replies" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"page_views" integer DEFAULT 0,
	"time_on_page" integer,
	"bounce_rate" numeric(5,2),
	"scroll_depth" numeric(5,2),
	"signups" integer DEFAULT 0,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign key for content_metrics -> content_items
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Create indexes for content_metrics
CREATE INDEX "idx_content_metrics_content_id" ON "content_metrics" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_content_metrics_platform" ON "content_metrics" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_content_metrics_fetched_at" ON "content_metrics" USING btree ("fetched_at" DESC);
