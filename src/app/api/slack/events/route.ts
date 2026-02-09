/**
 * POST /api/slack/events
 * 
 * Slack Event Subscriptions webhook
 * Handles incoming Slack messages and routes them to Kimi AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { sendSlackMessage } from '@/lib/slack/client';
import crypto from 'crypto';

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// System prompt for Slack bot
const SLACK_BOT_PROMPT = `You are Clawer AI, a helpful assistant in Slack.
Be concise and professional. Use Slack formatting when helpful (e.g., *bold*, _italic_, \`code\`).
Keep responses focused and actionable. When you need more context, ask specific questions.`;

export async function POST(request: NextRequest) {
  try {
    const slackSignature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify Slack signature if signing secret is configured
    if (signingSecret && slackSignature && timestamp) {
      // Prevent replay attacks (5 min window)
      if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
        return NextResponse.json({ error: 'Request too old' }, { status: 401 });
      }
      
      const sigBasestring = `v0:${timestamp}:${rawBody}`;
      const mySignature = 'v0=' + crypto.createHmac('sha256', signingSecret)
        .update(sigBasestring).digest('hex');
      
      if (!crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (signingSecret) {
      // If signing secret is configured but headers missing, reject
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    // Parse the body (already consumed as text, need to parse)
    const body = JSON.parse(rawBody);

    // Handle Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle events
    if (body.type === 'event_callback') {
      const event = body.event;

      // Ignore bot messages to prevent loops
      if (event.bot_id || event.subtype === 'bot_message') {
        return NextResponse.json({ ok: true });
      }

      // Only handle direct messages and app mentions
      if (event.type === 'message' && (event.channel_type === 'im' || event.text?.includes('<@'))) {
        // Process message asynchronously (don't block Slack's 3s timeout)
        handleSlackMessage(event, body.team_id).catch(err => {
          console.error('Error handling Slack message:', err);
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Slack events error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Slack
  }
}

/**
 * Process incoming Slack message and respond with AI
 */
async function handleSlackMessage(event: any, teamId: string) {
  try {
    // Find user by Slack team ID
    const user = await db.query.users.findFirst({
      where: eq(users.slackTeamId, teamId),
    });

    if (!user || !user.slackBotToken) {
      console.error('No user found for Slack team:', teamId);
      return;
    }

    // Extract message text (remove bot mention if present)
    let messageText = event.text || '';
    messageText = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!messageText) {
      return; // Empty message, ignore
    }

    // Get Kimi API key
    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey) {
      await sendSlackMessage(
        user.slackBotToken,
        event.channel,
        'Sorry, the AI service is not configured. Please contact support.',
        event.thread_ts || event.ts
      );
      return;
    }

    // Call Kimi API
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: SLACK_BOT_PROMPT },
          { role: 'user', content: messageText },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kimi API error:', response.status, errorText);
      await sendSlackMessage(
        user.slackBotToken,
        event.channel,
        'Sorry, I encountered an error. Please try again later.',
        event.thread_ts || event.ts
      );
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Send response to Slack (in thread if applicable)
    await sendSlackMessage(
      user.slackBotToken,
      event.channel,
      aiResponse,
      event.thread_ts || event.ts
    );

  } catch (error) {
    console.error('Error in handleSlackMessage:', error);
  }
}
