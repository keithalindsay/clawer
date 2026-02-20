/**
 * Email HTML templates for Clawer.ai
 * 
 * Professional email templates with:
 * - Orange header with Clawer.ai branding
 * - Clean white body
 * - Orange CTA button
 * - Gray footer with unsubscribe link
 */

const BRAND_COLOR = '#2563eb'; // blue-600
const BRAND_COLOR_DARK = '#1d4ed8'; // blue-700
const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clawer.ai';

function layout(content: string, preheader: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clawer.ai</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <span style="font-size:28px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">🦞 Clawer.ai</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                © ${new Date().getFullYear()} Clawer.ai — Your AI team, always on.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                <a href="${DASHBOARD_URL}/dashboard/settings" style="color:#6b7280;text-decoration:underline;">Manage notifications</a>
                &nbsp;·&nbsp;
                <a href="${DASHBOARD_URL}/dashboard/settings" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="background-color:${BRAND_COLOR};border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;background-color:${BRAND_COLOR};">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

/* ── Welcome Email ───────────────────────────────────────────── */

export function welcomeEmailHtml(name: string): string {
  const firstName = name?.split(' ')[0] || 'there';

  return layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Your AI team is ready! 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.5;">
      Hey ${firstName}, welcome to Clawer.ai — your personal AI crew is fired up and ready to help.
    </p>

    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">
      Get started in 3 steps:
    </h2>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-radius:8px;margin-bottom:8px;">
          <p style="margin:0;font-size:14px;color:#1e40af;">
            <strong>1.</strong> Connect WhatsApp or Telegram from your dashboard
          </p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-radius:8px;">
          <p style="margin:0;font-size:14px;color:#1e40af;">
            <strong>2.</strong> Customize your AI's personality and communication style
          </p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-radius:8px;">
          <p style="margin:0;font-size:14px;color:#1e40af;">
            <strong>3.</strong> Start chatting — your AI handles the rest
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Go to Dashboard →', `${DASHBOARD_URL}/dashboard`)}

    <p style="margin:0;font-size:14px;color:#9ca3af;text-align:center;">
      Questions? Just reply to this email.
    </p>
  `, 'Your AI team is ready — get started with Clawer.ai');
}

export function welcomeEmailText(name: string): string {
  const firstName = name?.split(' ')[0] || 'there';
  return `Your AI team is ready! 🎉

Hey ${firstName}, welcome to Clawer.ai — your personal AI crew is fired up and ready to help.

Get started in 3 steps:
1. Connect WhatsApp or Telegram from your dashboard
2. Customize your AI's personality and communication style
3. Start chatting — your AI handles the rest

Go to Dashboard: ${DASHBOARD_URL}/dashboard

Questions? Just reply to this email.

— Clawer.ai`;
}

/* ── Usage Alert Email ───────────────────────────────────────── */

export function usageAlertHtml(name: string, percentUsed: number, messagesUsed: number, messageLimit: number): string {
  const firstName = name?.split(' ')[0] || 'there';
  const isAlmostOut = percentUsed >= 90;
  const barColor = isAlmostOut ? '#ef4444' : '#f59e0b'; // red or amber
  const bgColor = isAlmostOut ? '#fef2f2' : '#fffbeb';

  return layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      ${isAlmostOut ? '⚠️ Almost out of messages' : '📊 Usage update'}
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.5;">
      Hey ${firstName}, you've used <strong>${percentUsed}%</strong> of your daily messages.
    </p>

    <!-- Usage bar -->
    <div style="background-color:#e5e7eb;border-radius:999px;height:12px;overflow:hidden;margin-bottom:8px;">
      <div style="background-color:${barColor};height:12px;width:${Math.min(percentUsed, 100)}%;border-radius:999px;"></div>
    </div>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280;text-align:center;">
      ${messagesUsed} / ${messageLimit} messages used today
    </p>

    <div style="padding:16px;background-color:${bgColor};border-radius:8px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#111827;">
        ${isAlmostOut
          ? '🔥 You\'re close to your limit! Upgrade to Pro for 2,000 messages/day and premium AI models.'
          : '💡 Running low? Pro gives you 20x more messages and access to Claude Sonnet.'}
      </p>
    </div>

    ${ctaButton('Upgrade to Pro →', `${DASHBOARD_URL}/pricing`)}
  `, `You've used ${percentUsed}% of your daily messages on Clawer.ai`);
}

export function usageAlertText(name: string, percentUsed: number, messagesUsed: number, messageLimit: number): string {
  const firstName = name?.split(' ')[0] || 'there';
  return `Usage Alert — ${percentUsed}% used

Hey ${firstName}, you've used ${messagesUsed} of ${messageLimit} messages today (${percentUsed}%).

${percentUsed >= 90
  ? 'You\'re close to your limit! Upgrade to Pro for 2,000 messages/day.'
  : 'Running low? Pro gives you 20x more messages.'}

Upgrade: ${DASHBOARD_URL}/pricing

— Clawer.ai`;
}

/* ── Weekly Digest Email ─────────────────────────────────────── */

interface WeeklyStats {
  totalConversations: number;
  totalMessages: number;
  topBots: { name: string; messages: number }[];
  streakDays: number;
}

export function weeklyDigestHtml(name: string, stats: WeeklyStats): string {
  const firstName = name?.split(' ')[0] || 'there';

  const botRows = (stats.topBots || [])
    .slice(0, 3)
    .map(
      (bot) => `
      <tr>
        <td style="padding:8px 12px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">${bot.name}</td>
        <td style="padding:8px 12px;font-size:14px;color:#6b7280;text-align:right;border-bottom:1px solid #f3f4f6;">${bot.messages} msgs</td>
      </tr>`
    )
    .join('');

  return layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Your weekly recap 📬
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.5;">
      Hey ${firstName}, here's what your AI team handled this week.
    </p>

    <!-- Stats grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="50%" style="padding:16px;background-color:#eff6ff;border-radius:8px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:${BRAND_COLOR};">${stats.totalConversations}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Conversations</div>
        </td>
        <td width="8"></td>
        <td width="50%" style="padding:16px;background-color:#eff6ff;border-radius:8px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:${BRAND_COLOR};">${stats.totalMessages}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Messages</div>
        </td>
      </tr>
    </table>

    ${stats.streakDays > 0 ? `
    <div style="padding:12px 16px;background-color:#fefce8;border-radius:8px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:14px;color:#854d0e;">
        🔥 ${stats.streakDays}-day streak! Your AI team has been busy.
      </p>
    </div>
    ` : ''}

    ${botRows ? `
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">Most active bots</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      ${botRows}
    </table>
    ` : ''}

    ${ctaButton('View Full Dashboard →', `${DASHBOARD_URL}/dashboard`)}
  `, `Your AI handled ${stats.totalConversations} conversations this week`);
}

export function weeklyDigestText(name: string, stats: WeeklyStats): string {
  const firstName = name?.split(' ')[0] || 'there';
  const botList = (stats.topBots || [])
    .slice(0, 3)
    .map((b) => `  • ${b.name}: ${b.messages} messages`)
    .join('\n');

  return `Weekly Recap — Clawer.ai

Hey ${firstName}, here's your week:

📊 ${stats.totalConversations} conversations · ${stats.totalMessages} messages
${stats.streakDays > 0 ? `🔥 ${stats.streakDays}-day streak!\n` : ''}
${botList ? `Most active bots:\n${botList}\n` : ''}
Dashboard: ${DASHBOARD_URL}/dashboard

— Clawer.ai`;
}
