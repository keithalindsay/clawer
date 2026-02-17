/**
 * Lightweight analytics helper for Umami custom events.
 * Tracks conversion funnel: landing → signup → onboarding → first message → upgrade
 * 
 * Usage: trackEvent('funnel_signup_complete') or trackEvent('chat_message_sent', { agent: 'max' })
 */

// Funnel events (ordered)
export type FunnelEvent =
  | 'funnel_landing_view'       // Landed on homepage
  | 'funnel_pricing_view'       // Viewed pricing page
  | 'funnel_signup_start'       // Clicked sign up
  | 'funnel_signup_complete'    // Finished Clerk signup
  | 'funnel_onboard_step1'     // Customize bot
  | 'funnel_onboard_step2'     // Choose team
  | 'funnel_onboard_step3'     // Accept terms
  | 'funnel_onboard_complete'  // Finished onboarding
  | 'funnel_first_message'     // Sent first chat message
  | 'funnel_upgrade_click'     // Clicked upgrade/pricing CTA
  | 'funnel_checkout_start'    // Started Stripe checkout

// Feature events
  | 'chat_message_sent'
  | 'chat_agent_switched'
  | 'task_created'
  | 'task_executed'
  | 'whatsapp_connect_start'
  | 'whatsapp_connect_success'
  | 'telegram_connect_start'
  | 'team_template_changed'
  | 'settings_opened'
  | 'quick_prompt_clicked';

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
    };
  }
}

/**
 * Track a custom event. Safe to call server-side (no-ops).
 */
export function trackEvent(event: FunnelEvent | string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  try {
    window.umami?.track(event, data);
  } catch {
    // Silent fail — analytics should never break the app
  }
}

/**
 * Track a page view with custom properties.
 */
export function trackPageView(url: string, referrer?: string) {
  if (typeof window === 'undefined') return;
  try {
    window.umami?.track('pageview', { url, referrer: referrer || '' });
  } catch {
    // Silent fail
  }
}
