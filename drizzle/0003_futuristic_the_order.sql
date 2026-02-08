CREATE TABLE "request_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"request_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"route_decision" text,
	"orchestrator_tokens" text,
	"worker_tokens" text,
	"total_tokens" integer,
	"latency_ms" integer,
	"estimated_cost_usd" numeric(10, 6)
);
--> statement-breakpoint
CREATE TABLE "usage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"orchestrator_input_tokens" bigint,
	"orchestrator_output_tokens" bigint,
	"worker_input_tokens" bigint,
	"worker_output_tokens" bigint,
	"total_oet" bigint,
	"estimated_cost_usd" numeric(10, 4),
	"request_count" integer,
	"peak_daily_usage" bigint,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"orchestrator_input_tokens" bigint DEFAULT 0 NOT NULL,
	"orchestrator_output_tokens" bigint DEFAULT 0 NOT NULL,
	"worker_input_tokens" bigint DEFAULT 0 NOT NULL,
	"worker_output_tokens" bigint DEFAULT 0 NOT NULL,
	"total_oet" bigint DEFAULT 0 NOT NULL,
	"estimated_cost_usd" numeric(10, 4) DEFAULT '0' NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_week_unique" UNIQUE("user_id","week_start")
);
--> statement-breakpoint
CREATE TABLE "instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"container_id" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"webhook_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instances_container_id_unique" UNIQUE("container_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "container_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "container_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "container_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_connected" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_connected" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthly_message_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthly_reset_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_usage" ADD CONSTRAINT "weekly_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_log_user_time_idx" ON "request_log" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "usage_history_user_idx" ON "usage_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_history_week_idx" ON "usage_history" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "weekly_usage_user_idx" ON "weekly_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_usage_week_idx" ON "weekly_usage" USING btree ("week_start");