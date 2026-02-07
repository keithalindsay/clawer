/**
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for $49/mo subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'No email found for user' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002';

    const session = await createCheckoutSession({
      userId,
      userEmail: email,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
