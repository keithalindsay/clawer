-- Add agent columns to conversations table
-- Reuse conversations as agent threads (cleaner than new table)

ALTER TABLE "conversations" ADD COLUMN "agent_id" varchar(50);
ALTER TABLE "conversations" ADD COLUMN "agent_name" varchar(100);
ALTER TABLE "conversations" ADD COLUMN "agent_emoji" varchar(10);
ALTER TABLE "conversations" ADD COLUMN "agent_role" varchar(200);

-- Create index for efficient user+agent thread lookups
CREATE INDEX "conversations_user_agent_idx" ON "conversations" ("user_id", "agent_id");
