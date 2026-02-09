/**
 * POST /api/stripe/checkout
 * GET /api/stripe/checkout (for URL params from pricing page)
 * 
 * Creates a Stripe Checkout session for subscription
 * Query param: ?plan=monthly or ?plan=annual
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession } from '@/lib/stripe';

async function handleCheckout(request: NextRequest) {
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

    // Get plan from query params (default to monthly)
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan') === 'annual' ? 'annual' : 'monthly';

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002';

    const session = await createCheckoutSession({
      userId,
      userEmail: email,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=canceled`,
      plan,
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

export async function POST(request: NextRequest) {
  return handleCheckout(request);
}

export async function GET(request: NextRequest) {
  // Handle GET requests from links (redirect to Stripe)
  const response = await handleCheckout(request);
  const data = await response.json();
  
  if (data.url) {
    return NextResponse.redirect(data.url);
  }
  
  return response;
}
