import dotenv from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const statements = [
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_channel" text DEFAULT 'web'`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_stress" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_start" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_stop" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_business" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_customer" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_platform" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_niche" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_platforms" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_best_content" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_product" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_competitor" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_challenge" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_stage" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_blocker" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_tried" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_goal" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_days" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_restrictions" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_kids_ages" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_schedule_complexity" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_pain_point" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_finance_goal" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_money_stress" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_income_range" text`,
  // Morning Briefing fields (Phase 2)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_enabled" integer NOT NULL DEFAULT 0`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_time" text DEFAULT '07:30'`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_channel" text DEFAULT 'whatsapp'`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_timezone" text DEFAULT 'America/New_York'`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_include_summary" integer NOT NULL DEFAULT 1`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_include_working" integer NOT NULL DEFAULT 1`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_include_reminders" integer NOT NULL DEFAULT 0`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "briefing_include_news" integer NOT NULL DEFAULT 0`,

  // Engagement messages table (Phase 3)
  `CREATE TABLE IF NOT EXISTS "engagement_messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "message_type" text NOT NULL,
    "scheduled_for" timestamptz NOT NULL,
    "sent_at" timestamptz,
    "status" text NOT NULL DEFAULT 'pending',
    "skip_reason" text,
    "content" text,
    "channel" text NOT NULL DEFAULT 'web',
    "metadata" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_engagement_messages_user_id" ON "engagement_messages"("user_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_engagement_messages_status_scheduled" ON "engagement_messages"("status", "scheduled_for") WHERE "status" = 'pending'`,
];

async function main() {
  const client = postgres(DATABASE_URL!, { max: 1, onnotice: () => {} });
  
  // Test connection first  
  try {
    const result = await client`SELECT 1 as ok`;
    console.log('✅ Connected!', result);
  } catch (e: any) {
    console.error('❌ Connection failed:', e.message, e.code);
    await client.end();
    process.exit(1);
  }
  
  const db = drizzle(client);
  let success = 0, errors = 0;

  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
      const colMatch = stmt.match(/ADD COLUMN IF NOT EXISTS "([^"]+)"/);
      console.log(`  ✓ ${colMatch?.[1]}`);
      success++;
    } catch (e: any) {
      const cause = e.cause || e;
      console.error(`  ✗ ${cause.message || e.message}`);
      errors++;
    }
  }

  await client.end();
  console.log(`\nDone: ${success} added, ${errors} errors`);
  if (errors > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
