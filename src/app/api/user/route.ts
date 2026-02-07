/**
 * GET /api/user - Get current user profile
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { checkUserRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return apiErrors.unauthorized();
    }
    
    // Get Clerk user data
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
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
    
    // TODO: Fetch user profile from database
    // For now, return mock data with Clerk user info
    const profile = {
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      tier: 'free', // TODO: Get from database
      limits: {
        messagesPerDay: 100,
        maxBots: 5,
        maxIntegrations: 2,
        availableModels: ['qwen3'],
        maxTokensPerMessage: 2000,
        customBotsAllowed: false,
      },
      usage: {
        messagesToday: 0,
        messagesRemaining: 100,
        tokensThisMonth: 0,
        costThisMonth: 0,
        resetsAt: new Date(
          new Date().setHours(24, 0, 0, 0)
        ).toISOString(),
      },
      integrationCount: 0,
      botCount: 0,
      createdAt: new Date(clerkUser.createdAt).toISOString(),
    };
    
    return apiSuccess(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return apiErrors.internalError();
  }
}
