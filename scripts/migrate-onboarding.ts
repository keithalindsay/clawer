/**
 * Migration script: Add onboarding context columns  
 * Run: cd ~/projects/clawer && pnpm tsx scripts/migrate-onboarding.ts
 */

// Must load env FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🔌 Connecting to DB:', DATABASE_URL.substring(0, 45) + '...');

// Dynamic imports AFTER env is loaded
const { drizzle } = await import('drizzle-orm/postgres-js');
const postgresModule = await import('postgres');
const postgres = postgresModule.default;
const { sql } = await import('drizzle-orm');

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

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
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_enabled" integer DEFAULT 0`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_time" text DEFAULT '07:30'`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_channel" text DEFAULT 'whatsapp'`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "morning_briefing_timezone" text DEFAULT 'America/Chicago'`,
];

console.log('🏃 Running migration...\n');
let success = 0, skip = 0, errors = 0;

for (const stmt of statements) {
  try {
    await db.execute(sql.raw(stmt));
    const colMatch = stmt.match(/ADD COLUMN IF NOT EXISTS "([^"]+)"/);
    const col = colMatch?.[1] || 'unknown';
    console.log(`  ✓ ${col}`);
    success++;
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log(`  ↷ (already exists)`);
      skip++;
    } else {
      console.error(`  ✗ Error: ${e.message}`);
      errors++;
    }
  }
}

await client.end();

console.log(`\n✅ Done: ${success} added, ${skip} skipped, ${errors} errors`);
if (errors > 0) process.exit(1);
