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
import { provisionContainer, stopContainer } from '@/lib/provisioner';
import { sendWelcomeEmail } from '@/lib/email';
import { alertPaymentFailure } from '@/lib/alerts';
import { badRequest, serverError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return badRequest('Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // SECURITY: NEVER allow unsigned webhooks - reject if secret not configured
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured - blocking webhook request');
      return serverError('Webhook not configured');
    }
    
    // Always verify signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return badRequest('Webhook signature verification failed', err.message);
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

          // Send welcome email
          try {
            const subscribedUser = await db.query.users.findFirst({
              where: eq(users.id, userId),
              columns: { email: true, name: true },
            });
            if (subscribedUser?.email) {
              await sendWelcomeEmail(
                subscribedUser.email,
                subscribedUser.name || subscribedUser.email.split('@')[0]
              );
            }
          } catch (emailError) {
            console.error(`📧 Failed to send welcome email for user ${userId}:`, emailError);
            // Non-blocking — subscription still succeeds
          }

          // Provision Docker container for the user
          try {
            // Get user's team template preference
            const userRecord = await db.query.users.findFirst({
              where: eq(users.id, userId),
              columns: { teamTemplate: true },
            });
            const teamTemplate = userRecord?.teamTemplate || 'lifeos';
            
            const result = await provisionContainer(userId, teamTemplate);
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

        if (subscription.status === 'past_due') {
          console.log(`⚠️ Customer ${customerId} payment past due`);
          await alertPaymentFailure(customerId, 'Subscription past due — payment retry pending');
          
          // Notify user via email
          try {
            const pastDueUser = await db.query.users.findFirst({
              where: eq(users.stripeCustomerId, customerId),
              columns: { email: true, name: true },
            });
            if (pastDueUser?.email) {
              // TODO: Add sendPaymentFailedEmail template
              console.log(`📧 Payment past due for ${pastDueUser.email} — email notification pending template`);
            }
          } catch (notifyError) {
            console.error('Failed to notify user about past due:', notifyError);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const failedCustomerId = invoice.customer as string;
        console.log(`❌ Payment failed for customer ${failedCustomerId}`);
        await alertPaymentFailure(failedCustomerId, 'Invoice payment failed');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return serverError('Webhook handler failed', error.message);
  }
}

// App Router route handlers receive raw body by default (no body parsing config needed)
