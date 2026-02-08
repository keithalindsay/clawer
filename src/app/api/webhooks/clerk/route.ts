/**
 * POST /api/webhooks/clerk - Clerk webhook handler
 * 
 * Handles user lifecycle events from Clerk:
 * - user.created: Create user in database
 * - user.updated: Update user email/metadata
 * - user.deleted: Soft delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; id: string }>;
    primary_email_address_id?: string;
    first_name?: string;
    last_name?: string;
    created_at?: number;
    updated_at?: number;
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Get Svix headers for verification
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers');
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  // Get raw body for signature verification
  const body = await request.text();

  // Verify webhook signature
  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Clerk webhook received: ${event.type}`, { userId: event.data.id });

  try {
    switch (event.type) {
      case 'user.created': {
        const primaryEmail = event.data.email_addresses?.find(
          e => e.id === event.data.primary_email_address_id
        )?.email_address;

        const name = [event.data.first_name, event.data.last_name]
          .filter(Boolean)
          .join(' ') || null;

        await db.insert(users).values({
          id: event.data.id,
          email: primaryEmail || `${event.data.id}@clerk.user`,
          name,
          tier: 'basic',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onConflictDoNothing();

        console.log(`Created user: ${event.data.id} (${primaryEmail})`);
        break;
      }

      case 'user.updated': {
        const primaryEmail = event.data.email_addresses?.find(
          e => e.id === event.data.primary_email_address_id
        )?.email_address;

        const name = [event.data.first_name, event.data.last_name]
          .filter(Boolean)
          .join(' ') || null;

        await db.update(users)
          .set({
            email: primaryEmail,
            name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, event.data.id));

        console.log(`Updated user: ${event.data.id}`);
        break;
      }

      case 'user.deleted': {
        // Soft delete - set deletedAt timestamp
        await db.update(users)
          .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, event.data.id));

        console.log(`Soft deleted user: ${event.data.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
