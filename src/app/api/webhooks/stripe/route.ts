/**
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events for subscription lifecycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { provisionContainer, stopContainer } from '@/lib/orchestrator';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // SECURITY: NEVER allow unsigned webhooks - reject if secret not configured
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured - blocking webhook request');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }
    
    // Always verify signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          // Update user with Stripe customer and subscription IDs
          await db
            .update(users)
            .set({
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              tier: 'pro', // Activate their account
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          console.log(`✅ User ${userId} subscribed successfully`);

          // Provision Docker container for the user
          try {
            const result = await provisionContainer(userId);
            if (result.success) {
              console.log(`🐳 Container provisioned for user ${userId} on port ${result.port}`);
            } else {
              console.error(`❌ Failed to provision container for user ${userId}: ${result.error}`);
            }
          } catch (error) {
            console.error(`❌ Failed to provision container for user ${userId}:`, error);
            // Continue anyway - container can be provisioned later
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID and downgrade
        const user = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId),
        });

        if (user) {
          await db
            .update(users)
            .set({
              tier: 'free', // Downgrade to free
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          console.log(`⚠️ User ${user.id} subscription canceled`);

          // Stop Docker container (keep data for potential re-subscription)
          try {
            await stopContainer(user.id);
            console.log(`🐳 Container stopped for user ${user.id}`);
          } catch (error) {
            console.error(`❌ Failed to stop container for user ${user.id}:`, error);
            // Continue anyway
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Handle payment failures, etc.
        if (subscription.status === 'past_due') {
          console.log(`⚠️ Customer ${customerId} payment past due`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`❌ Payment failed for customer ${invoice.customer}`);
        // Could send email notification here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripe webhooks need raw body, disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};
