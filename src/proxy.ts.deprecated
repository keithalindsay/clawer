/**
 * Clerk proxy middleware for CLAWER.AI
 * Protects routes and handles admin access
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Admin user IDs - these users have access to /admin routes
const ADMIN_USER_IDS = [
  process.env.ADMIN_USER_ID,
].filter(Boolean);

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/chat(.*)',
  '/admin(.*)',
  '/api(.*)',
]);

// Public routes (webhooks don't require auth)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)', // Webhooks are public but verified separately
  '/api/slack/events', // Slack Event Subscriptions webhook
]);

// Admin routes require admin user
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Check if route requires protection
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Admin routes require admin user ID
  if (isAdminRoute(req)) {
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
