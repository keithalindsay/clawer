/**
 * GET /api/bots/[botId] - Get bot details
 */

import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { checkUserRateLimit } from '@/lib/rate-limit';

export async function GET(
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
    
    // TODO: Fetch bot from database
    // For now, return mock data
    const bot = {
      id: botId,
      type: 'email',
      name: 'My Email Bot',
      description: 'Handles email drafting and responses',
      status: 'active',
      config: {
        preferredModel: null,
        maxTokens: 2000,
        temperature: 0.7,
      },
      requiredIntegrations: ['gmail'],
      integrationStatuses: {
        gmail: 'connected',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return apiSuccess(bot);
  } catch (error) {
    console.error('Error fetching bot:', error);
    return apiErrors.internalError();
  }
}
