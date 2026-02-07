/**
 * POST /api/webhooks/clerk - Clerk webhook handler (stub)
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify Clerk webhook signature using svix
    // const svixId = request.headers.get('svix-id');
    // const svixTimestamp = request.headers.get('svix-timestamp');
    // const svixSignature = request.headers.get('svix-signature');
    
    // TODO: Parse webhook payload
    const payload = await request.json();
    
    // TODO: Handle different event types:
    // - user.created
    // - user.updated
    // - user.deleted
    // - session.created
    // - session.ended
    
    console.log('Clerk webhook received (stub):', payload.type);
    
    // Stub implementation - just log the event
    if (payload.type === 'user.created') {
      console.log('New user created:', payload.data.id);
      // TODO: Create user record in database
    }
    
    if (payload.type === 'user.updated') {
      console.log('User updated:', payload.data.id);
      // TODO: Update user record in database
    }
    
    if (payload.type === 'user.deleted') {
      console.log('User deleted:', payload.data.id);
      // TODO: Soft delete or anonymize user data
    }
    
    // For now, just acknowledge receipt
    return apiSuccess({ received: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return apiErrors.internalError();
  }
}
