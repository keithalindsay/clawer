/**
 * Clerk Middleware — Global auth protection
 * 
 * Protects all /api/* and /dashboard/* routes.
 * Exceptions: webhooks (verify their own signatures), public pages, static assets.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/chat(.*)',
  '/admin(.*)',
  '/api/chat(.*)',
  '/api/bots(.*)',
  '/api/messages(.*)',
  '/api/conversations(.*)',
  '/api/diagnose(.*)',
  '/api/container(.*)',
  '/api/telegram(.*)',
  '/api/stripe/checkout(.*)',
  '/api/stripe/portal(.*)',
  '/api/bot/(.*)',
  '/api/onboarding(.*)',
  '/api/feedback(.*)',
  '/api/user(.*)',
  '/api/models(.*)',
  '/api/usage(.*)',
  '/api/admin(.*)',
  '/api/agents(.*)',
  '/api/teams(.*)',
  '/api/slack/connect(.*)',
]);

// Routes that must NOT have auth middleware (they verify signatures themselves)
// These are excluded by not being in isProtectedRoute above:
// - /api/webhooks/stripe
// - /api/webhooks/clerk
// - /api/slack/events (Slack verifies its own signatures)

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all routes except static files and _next internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
