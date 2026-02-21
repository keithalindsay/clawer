import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Temporary migration endpoint - delete after use
export async function GET() {
  try {
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

    const results = [];
    for (const stmt of statements) {
      await db.execute(sql.raw(stmt));
      results.push(`✓ ${stmt.substring(0, 60)}...`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
