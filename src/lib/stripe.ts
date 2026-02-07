/**
 * Stripe configuration and helpers
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Price ID for $49/mo subscription
export const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1SxtZMKtZGLqQJF6DYKV6Cup';

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
  });

  return session;
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status for a customer
 */
export async function getSubscriptionStatus(
  customerId: string
): Promise<'active' | 'canceled' | 'past_due' | 'none'> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return 'none';
  }

  const subscription = subscriptions.data[0];
  
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return 'active';
  }
  
  if (subscription.status === 'canceled') {
    return 'canceled';
  }
  
  if (subscription.status === 'past_due') {
    return 'past_due';
  }

  return 'none';
}
