/**
 * GET /api/user - Get current user profile
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { FREE_MESSAGE_LIMIT } from '@/lib/constants';

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
    
    // Fetch user from database
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Fallback: lookup by email if ID not found
    if (!user && userEmail) {
      user = await db.query.users.findFirst({
        where: eq(users.email, userEmail),
      });
    }

    const isSubscribed = user?.stripeSubscriptionId !== null;
    const freeMessagesUsed = user?.freeMessagesUsed ?? 0;
    
    const profile = {
      id: userId,
      email: userEmail || '',
      name: user?.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      tier: user?.tier || 'free',
      stripeSubscriptionId: user?.stripeSubscriptionId || null,
      stripeCustomerId: user?.stripeCustomerId || null,
      limits: {
        messagesPerDay: isSubscribed ? -1 : 100, // -1 = unlimited
        maxBots: 5,
        maxIntegrations: 2,
        availableModels: isSubscribed ? ['gpt-4', 'claude-3', 'qwen3'] : ['qwen3'],
        maxTokensPerMessage: 2000,
        customBotsAllowed: isSubscribed,
      },
      usage: {
        messagesToday: user?.dailyMessageCount || 0,
        messagesThisMonth: user?.monthlyMessageCount || 0,
        freeMessagesUsed,
        freeMessageLimit: FREE_MESSAGE_LIMIT,
        freeMessagesRemaining: Math.max(0, FREE_MESSAGE_LIMIT - freeMessagesUsed),
        resetsAt: new Date(
          new Date().setHours(24, 0, 0, 0)
        ).toISOString(),
      },
      connected: {
        whatsapp: user?.whatsappConnected || false,
        telegram: user?.telegramConnected || false,
        slack: user?.slackConnected || false,
      },
      integrationCount: 0,
      botCount: 0,
      createdAt: user?.createdAt ? new Date(user.createdAt).toISOString() : new Date(clerkUser.createdAt).toISOString(),
      teamTemplate: user?.teamTemplate || 'lifeos',
    };
    
    return apiSuccess(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return apiErrors.internalError();
  }
}
