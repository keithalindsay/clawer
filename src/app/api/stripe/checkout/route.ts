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

/**
 * Core checkout logic — returns { url, error } instead of a Response
 * so both GET and POST can use it without double-consuming the body.
 */
async function createCheckout(request: NextRequest): Promise<{ url?: string; error?: string; status?: number }> {
  const { userId } = await auth();
  
  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  if (!email) {
    return { error: 'No email found for user', status: 400 };
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

  return { url: session.url || undefined };
}

export async function POST(request: NextRequest) {
  try {
    const result = await createCheckout(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await createCheckout(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    if (result.url) {
      return NextResponse.redirect(result.url);
    }
    return NextResponse.json({ error: 'No checkout URL generated' }, { status: 500 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
