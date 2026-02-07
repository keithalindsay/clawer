/**
 * GET /api/user/usage - Get usage statistics
 */

import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { checkUserRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return apiErrors.unauthorized();
    }
    
    // Check rate limit
    const rateLimit = await checkUserRateLimit(userId);
    
    if (!rateLimit.allowed) {
      return apiErrors.rateLimited(
        rateLimit.limit,
        rateLimit.resetAt.toISOString()
      );
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // TODO: Fetch usage from database
    // For now, return mock data
    const usage = {
      summary: {
        totalMessages: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        byModel: {},
      },
      daily: [
        {
          date: new Date().toISOString().split('T')[0],
          messages: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        },
      ],
      period,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
    };
    
    return apiSuccess(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return apiErrors.internalError();
  }
}
