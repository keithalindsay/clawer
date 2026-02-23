/**
 * Container Authentication Helper
 * 
 * Authenticates requests from container api-servers by looking up
 * the user associated with a gateway token.
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export interface ContainerAuthResult {
  userId: string | null;
  user: typeof users.$inferSelect | null;
  error: string | null;
}

/**
 * Authenticate a request from a container by gateway token.
 * Expects: Authorization: Bearer <gateway_token>
 * 
 * Returns the userId if valid, or an error.
 */
export async function authenticateContainer(req: NextRequest): Promise<ContainerAuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, user: null, error: 'Missing or invalid Authorization header' };
  }
  
  const token = authHeader.slice(7); // Remove "Bearer "
  
  if (!token || token.length < 10) {
    return { userId: null, user: null, error: 'Invalid gateway token' };
  }
  
  // Look up user by gateway token
  const user = await db.query.users.findFirst({
    where: eq(users.gatewayToken, token),
  });
  
  if (!user) {
    return { userId: null, user: null, error: 'Invalid gateway token - user not found' };
  }
  
  return { userId: user.id, user, error: null };
}
