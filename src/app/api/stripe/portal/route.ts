/**
 * POST /api/stripe/portal
 * 
 * Creates a Stripe Customer Portal session for managing subscription
 * This is the "one-click cancel" flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPortalSession } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002';

    const session = await createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
