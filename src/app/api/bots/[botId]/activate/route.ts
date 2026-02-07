/**
 * POST /api/bots/[botId]/activate - Activate bot for user
 */

import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { checkUserRateLimit } from '@/lib/rate-limit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
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
    
    const { botId } = await params;
    
    // TODO: Activate bot in database
    // For now, return mock success response
    const activatedBot = {
      id: botId,
      userId,
      status: 'active',
      activatedAt: new Date().toISOString(),
    };
    
    return apiSuccess(activatedBot, 201);
  } catch (error) {
    console.error('Error activating bot:', error);
    return apiErrors.internalError();
  }
}
