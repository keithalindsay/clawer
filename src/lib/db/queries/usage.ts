import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '..';
import { usageRecords, dailyUsageSummary } from '../schema';

/**
 * Record usage for billing
 */
export async function recordUsage(data: {
  userId: string;
  botId?: string;
  type: 'message' | 'tool_call' | 'integration';
  model?: string;
  inputTokens: number;
  outputTokens: number;
  costMicros: number;
  periodStart?: Date;
}) {
  const [record] = await db
    .insert(usageRecords)
    .values({
      userId: data.userId,
      botId: data.botId ?? null,
      type: data.type,
      model: data.model ?? null,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      costMicros: data.costMicros,
      periodStart: data.periodStart ?? new Date(),
    })
    .returning();
  
  // Update daily summary
  await updateDailySummary(data.userId, new Date());
  
  return record;
}

/**
 * Update daily usage summary
 */
export async function updateDailySummary(userId: string, date: Date) {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Calculate totals for the day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const records = await db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        gte(usageRecords.periodStart, dayStart),
        lte(usageRecords.periodStart, dayEnd)
      )
    );
  
  const messageCount = records.filter(r => r.type === 'message').length;
  const totalInputTokens = records.reduce((sum, r) => sum + r.inputTokens, 0);
  const totalOutputTokens = records.reduce((sum, r) => sum + r.outputTokens, 0);
  const totalCostMicros = records.reduce((sum, r) => sum + r.costMicros, 0);
  
  // Upsert daily summary - check if exists
  const [existing] = await db
    .select()
    .from(dailyUsageSummary)
    .where(
      and(
        eq(dailyUsageSummary.userId, userId),
        eq(dailyUsageSummary.date, dateStr)
      )
    )
    .limit(1);
  
  if (existing) {
    // Update existing
    await db
      .update(dailyUsageSummary)
      .set({
        messageCount,
        totalInputTokens,
        totalOutputTokens,
        totalCostMicros,
        updatedAt: new Date(),
      })
      .where(eq(dailyUsageSummary.id, existing.id));
  } else {
    // Insert new
    await db
      .insert(dailyUsageSummary)
      .values({
        userId,
        date: dateStr,
        messageCount,
        totalInputTokens,
        totalOutputTokens,
        totalCostMicros,
        updatedAt: new Date(),
      });
  }
}

/**
 * Get daily usage for a user
 */
export async function getDailyUsage(userId: string, date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  
  const [summary] = await db
    .select()
    .from(dailyUsageSummary)
    .where(
      and(
        eq(dailyUsageSummary.userId, userId),
        eq(dailyUsageSummary.date, dateStr)
      )
    )
    .limit(1);
  
  return summary ?? {
    messageCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostMicros: 0,
  };
}

/**
 * Get monthly usage for a user
 */
export async function getMonthlyUsage(userId: string, year: number, month: number) {
  // Get first and last day of month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  
  const summaries = await db
    .select()
    .from(dailyUsageSummary)
    .where(
      and(
        eq(dailyUsageSummary.userId, userId),
        gte(dailyUsageSummary.date, startDate),
        lte(dailyUsageSummary.date, endDate)
      )
    );
  
  return {
    messageCount: summaries.reduce((sum, s) => sum + s.messageCount, 0),
    totalInputTokens: summaries.reduce((sum, s) => sum + s.totalInputTokens, 0),
    totalOutputTokens: summaries.reduce((sum, s) => sum + s.totalOutputTokens, 0),
    totalCostMicros: summaries.reduce((sum, s) => sum + s.totalCostMicros, 0),
  };
}

/**
 * Get usage by date range
 */
export async function getUsageByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  const summaries = await db
    .select()
    .from(dailyUsageSummary)
    .where(
      and(
        eq(dailyUsageSummary.userId, userId),
        gte(dailyUsageSummary.date, start),
        lte(dailyUsageSummary.date, end)
      )
    );
  
  return summaries;
}

/**
 * Get usage records for a specific period
 */
export async function getUsageRecords(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit = 100
) {
  return db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        gte(usageRecords.periodStart, startDate),
        lte(usageRecords.periodStart, endDate)
      )
    )
    .orderBy(sql`${usageRecords.createdAt} DESC`)
    .limit(limit);
}

/**
 * Get total token usage for current month
 */
export async function getCurrentMonthTokens(userId: string) {
  const now = new Date();
  return getMonthlyUsage(userId, now.getFullYear(), now.getMonth() + 1);
}
