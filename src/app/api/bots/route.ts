/**
 * GET /api/bots - List available bot types
 */

import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { checkUserRateLimit } from '@/lib/rate-limit';

export async function GET() {
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
    
    // Return available bot types (from spec)
    const botTypes = [
      {
        type: 'email',
        name: 'Email Assistant',
        description: 'Draft, reply to, and manage emails with AI assistance',
        icon: '📧',
        requiredIntegrations: ['gmail'],
        minTier: 'basic',
        tools: [
          {
            name: 'gmail_send',
            description: 'Send an email',
          },
          {
            name: 'gmail_search',
            description: 'Search emails',
          },
          {
            name: 'gmail_read',
            description: 'Read email content',
          },
        ],
      },
      {
        type: 'calendar',
        name: 'Calendar Assistant',
        description: 'Manage your calendar, schedule meetings, check availability',
        icon: '📅',
        requiredIntegrations: ['google_calendar'],
        minTier: 'basic',
        tools: [
          {
            name: 'calendar_list',
            description: 'List upcoming events',
          },
          {
            name: 'calendar_create',
            description: 'Create a new event',
          },
          {
            name: 'calendar_update',
            description: 'Update an event',
          },
        ],
      },
      {
        type: 'research',
        name: 'Research Assistant',
        description: 'Search the web, summarize articles, compile research',
        icon: '🔍',
        requiredIntegrations: [],
        minTier: 'free',
        tools: [
          {
            name: 'web_search',
            description: 'Search the web',
          },
          {
            name: 'web_fetch',
            description: 'Fetch and read a webpage',
          },
        ],
      },
      {
        type: 'assistant',
        name: 'General Assistant',
        description: 'General-purpose AI assistant for various tasks',
        icon: '🤖',
        requiredIntegrations: [],
        minTier: 'free',
        tools: [],
      },
    ];
    
    return apiSuccess(botTypes);
  } catch (error) {
    console.error('Error listing bot types:', error);
    return apiErrors.internalError();
  }
}
