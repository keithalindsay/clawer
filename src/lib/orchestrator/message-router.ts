/**
 * Message Router
 * Routes messages to the correct user's container
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export interface MessageRequest {
  message: string;
  conversationId?: string;
}

export interface MessageResponse {
  response: string;
  conversationId: string;
  userId: string;
  timestamp: string;
}

/**
 * Route a message to a user's container
 */
export async function routeMessage(
  userId: string,
  request: MessageRequest
): Promise<MessageResponse> {
  console.log(`📨 Routing message for user: ${userId}`);

  try {
    // Get user's container port
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
      },
    });

    if (!user || !user.containerPort) {
      throw new Error(`No active container for user ${userId}`);
    }

    const containerUrl = `http://localhost:${user.containerPort}`;

    // Send message to container
    const response = await sendToContainer(containerUrl, request);

    console.log(`✅ Message routed successfully for user ${userId}`);

    return response;
  } catch (error) {
    console.error(`❌ Failed to route message for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send message to container's HTTP endpoint
 */
async function sendToContainer(
  baseUrl: string,
  request: MessageRequest
): Promise<MessageResponse> {
  const url = `${baseUrl}/message`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Container returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data as MessageResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to send message to container: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Batch route messages to multiple users
 */
export async function batchRouteMessages(
  requests: Array<{ userId: string; request: MessageRequest }>
): Promise<Array<{ userId: string; response?: MessageResponse; error?: string }>> {
  console.log(`📨 Batch routing ${requests.length} messages`);

  const results = await Promise.allSettled(
    requests.map(async ({ userId, request }) => {
      const response = await routeMessage(userId, request);
      return { userId, response };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        userId: requests[index].userId,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

/**
 * Check if user's container is reachable
 */
export async function checkContainerReachable(userId: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
      },
    });

    if (!user || !user.containerPort) {
      return false;
    }

    const healthUrl = `http://localhost:${user.containerPort}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    return response.ok;
  } catch {
    return false;
  }
}
