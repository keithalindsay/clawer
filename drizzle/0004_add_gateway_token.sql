-- Add gateway token column for container API authentication
ALTER TABLE "users" ADD COLUMN "gateway_token" text;

-- Generate tokens for existing users with containers
UPDATE "users" 
SET "gateway_token" = encode(gen_random_bytes(32), 'hex')
WHERE "container_id" IS NOT NULL;
