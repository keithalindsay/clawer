/**
 * Email sending utility for Clawer.ai
 * 
 * Uses Resend API if RESEND_API_KEY is set, otherwise logs to console.
 * All functions are safe to call without configuration — they degrade gracefully.
 */

import {
  welcomeEmailHtml,
  welcomeEmailText,
  usageAlertHtml,
  usageAlertText,
  weeklyDigestHtml,
  weeklyDigestText,
} from './templates';

/* ── Types ─────────────────────────────────────────────────────── */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/* ── Core send function ────────────────────────────────────────── */

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Clawer.ai <noreply@clawer.ai>';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options;

  // If no API key, log to console and return success (dev mode)
  if (!RESEND_API_KEY) {
    console.log(`📧 [Email - Dev Mode] Would send to: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   (Set RESEND_API_KEY to send real emails)`);
    return { success: true, id: `dev_${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Email send failed (${response.status}):`, errorBody);
      return { success: false, error: `Resend API error: ${response.status}` };
    }

    const data = await response.json();
    console.log(`✅ Email sent to ${to}: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: String(error) };
  }
}

/* ── Public API ────────────────────────────────────────────────── */

/**
 * Send welcome email after successful subscription
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: '🦞 Your AI team is ready! Welcome to Clawer.ai',
    html: welcomeEmailHtml(name),
    text: welcomeEmailText(name),
  });
}

/**
 * Send usage alert when user approaches their message limit
 */
export async function sendUsageAlert(
  to: string,
  name: string,
  percentUsed: number,
  messagesUsed: number,
  messageLimit: number
): Promise<EmailResult> {
  const urgency = percentUsed >= 90 ? '⚠️' : '📊';
  return sendEmail({
    to,
    subject: `${urgency} You've used ${percentUsed}% of your daily messages`,
    html: usageAlertHtml(name, percentUsed, messagesUsed, messageLimit),
    text: usageAlertText(name, percentUsed, messagesUsed, messageLimit),
  });
}

/**
 * Send weekly digest with usage stats
 */
export async function sendWeeklyDigest(
  to: string,
  name: string,
  stats: {
    totalConversations: number;
    totalMessages: number;
    topBots: { name: string; messages: number }[];
    streakDays: number;
  }
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `📬 Your AI handled ${stats.totalConversations} conversations this week`,
    html: weeklyDigestHtml(name, stats),
    text: weeklyDigestText(name, stats),
  });
}
