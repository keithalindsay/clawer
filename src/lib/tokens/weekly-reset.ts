/**
 * Weekly token reset utilities
 * Handles archiving current week and resetting counters
 */

import { db } from '../db';
import { weeklyUsage, usageHistory } from '../db/schema/weekly-usage';
import { eq } from 'drizzle-orm';

/**
 * Get current week boundaries (Monday 00:00 UTC to Sunday 23:59:59 UTC)
 */
export function getCurrentWeekBoundaries(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days since last Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Week starts on Monday at 00:00:00 UTC
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  
  // Week ends on Sunday at 23:59:59 UTC
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

/**
 * Get next week's boundaries
 */
export function getNextWeekBoundaries(): { weekStart: Date; weekEnd: Date } {
  const { weekStart: currentStart } = getCurrentWeekBoundaries();
  
  const nextWeekStart = new Date(currentStart);
  nextWeekStart.setUTCDate(currentStart.getUTCDate() + 7);
  
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setUTCDate(nextWeekStart.getUTCDate() + 6);
  nextWeekEnd.setUTCHours(23, 59, 59, 999);
  
  return { weekStart: nextWeekStart, weekEnd: nextWeekEnd };
}

/**
 * Get next Monday 00:00 UTC
 */
export function getNextMonday(): Date {
  const { weekStart } = getNextWeekBoundaries();
  return weekStart;
}

/**
 * Archive current week's usage and reset counters
 * Should run every Monday at 00:00 UTC
 */
export async function weeklyReset() {
  console.log('[weekly-reset] Starting weekly token reset...');
  
  try {
    // Get all current weekly usage records
    const currentUsage = await db.select().from(weeklyUsage);
    
    console.log(`[weekly-reset] Found ${currentUsage.length} users to archive`);
    
    // Archive each user's usage to history
    if (currentUsage.length > 0) {
      const historyRecords = currentUsage.map((record) => ({
        userId: record.userId,
        weekStart: record.weekStart,
        weekEnd: record.weekEnd,
        orchestratorInputTokens: record.orchestratorInputTokens,
        orchestratorOutputTokens: record.orchestratorOutputTokens,
        workerInputTokens: record.workerInputTokens,
        workerOutputTokens: record.workerOutputTokens,
        totalOet: record.totalOet,
        estimatedCostUsd: record.estimatedCostUsd,
        requestCount: record.requestCount,
        peakDailyUsage: null, // TODO: Calculate from daily logs if needed
      }));
      
      await db.insert(usageHistory).values(historyRecords);
      console.log(`[weekly-reset] Archived ${historyRecords.length} records to history`);
    }
    
    // Delete old weekly usage records (they're now in history)
    await db.delete(weeklyUsage);
    
    console.log('[weekly-reset] Weekly reset completed successfully');
    
    return {
      success: true,
      archivedCount: currentUsage.length,
    };
  } catch (error) {
    console.error('[weekly-reset] Error during weekly reset:', error);
    throw error;
  }
}

/**
 * Archive a specific user's current week
 * Useful for testing or manual operations
 */
export async function archiveUserWeek(userId: string) {
  const userUsage = await db
    .select()
    .from(weeklyUsage)
    .where(eq(weeklyUsage.userId, userId))
    .limit(1);
  
  if (userUsage.length === 0) {
    return { success: false, message: 'No usage record found for user' };
  }
  
  const record = userUsage[0];
  
  // Archive to history
  await db.insert(usageHistory).values({
    userId: record.userId,
    weekStart: record.weekStart,
    weekEnd: record.weekEnd,
    orchestratorInputTokens: record.orchestratorInputTokens,
    orchestratorOutputTokens: record.orchestratorOutputTokens,
    workerInputTokens: record.workerInputTokens,
    workerOutputTokens: record.workerOutputTokens,
    totalOet: record.totalOet,
    estimatedCostUsd: record.estimatedCostUsd,
    requestCount: record.requestCount,
    peakDailyUsage: null,
  });
  
  // Delete current record
  await db.delete(weeklyUsage).where(eq(weeklyUsage.userId, userId));
  
  return { success: true, message: 'User week archived successfully' };
}

/**
 * Check if we're in a new week (past Sunday 23:59:59 UTC)
 */
export function isNewWeek(lastWeekStart: Date): boolean {
  const { weekStart } = getCurrentWeekBoundaries();
  return weekStart.getTime() !== lastWeekStart.getTime();
}
