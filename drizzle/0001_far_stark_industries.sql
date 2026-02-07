ALTER TYPE "public"."integration_provider" ADD VALUE 'whatsapp';--> statement-breakpoint
CREATE TABLE "whatsapp_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"phone_number" text,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"last_qr_code" text,
	"qr_expires_at" timestamp,
	"encrypted_auth_state" text,
	"auth_state_iv" text,
	"auth_state_auth_tag" text,
	"last_connected_at" timestamp,
	"last_error" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_connections_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "discord_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"encrypted_bot_token" text NOT NULL,
	"token_iv" text NOT NULL,
	"token_auth_tag" text NOT NULL,
	"bot_username" text,
	"bot_tag" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"last_error" text,
	"last_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slack_bot_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slack_team_id" text;--> statement-breakpoint
ALTER TABLE "whatsapp_connections" ADD CONSTRAINT "whatsapp_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_connections" ADD CONSTRAINT "discord_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;