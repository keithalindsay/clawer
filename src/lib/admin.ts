/**
 * Admin authorization utility
 * 
 * Single source of truth for admin access control.
 * Uses email-based allowlist (more stable than Clerk user IDs).
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

/** Authorized admin emails */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'vavier@gmail.com,vavize@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

/**
 * Check if a Clerk user ID belongs to an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });
  return user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
}

/**
 * Check admin and return 401/403 response if not authorized.
 * Returns null if authorized (caller should proceed).
 */
export async function requireAdmin(userId: string | null): Promise<Response | null> {
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  return null;
}
