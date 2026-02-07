import { eq } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user ?? null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user ?? null;
}

/**
 * Create new user (from Clerk webhook)
 */
export async function createUser(data: {
  id: string;
  email: string;
  name?: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email,
      name: data.name ?? null,
      tier: 'free',
      dailyMessageCount: 0,
      dailyResetAt: new Date(),
    })
    .returning();
  
  return user;
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  data: {
    email?: string;
    name?: string;
    tier?: 'free' | 'basic' | 'pro' | 'enterprise';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
) {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  
  return user ?? null;
}

/**
 * Increment daily message count
 */
export async function incrementDailyMessageCount(userId: string) {
  // Check if daily count needs reset
  const user = await getUserById(userId);
  if (!user) return null;
  
  const now = new Date();
  const resetTime = new Date(user.dailyResetAt);
  const shouldReset = now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000;
  
  if (shouldReset) {
    // Reset counter
    const [updated] = await db
      .update(users)
      .set({
        dailyMessageCount: 1,
        dailyResetAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updated;
  } else {
    // Increment counter
    const [updated] = await db
      .update(users)
      .set({
        dailyMessageCount: user.dailyMessageCount + 1,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updated;
  }
}

/**
 * Get user's current daily message count
 */
export async function getDailyMessageCount(userId: string) {
  const user = await getUserById(userId);
  if (!user) return 0;
  
  const now = new Date();
  const resetTime = new Date(user.dailyResetAt);
  const shouldReset = now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000;
  
  return shouldReset ? 0 : user.dailyMessageCount;
}

/**
 * Soft delete user
 */
export async function deleteUser(userId: string) {
  const [user] = await db
    .update(users)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  
  return user ?? null;
}
