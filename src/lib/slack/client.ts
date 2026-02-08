/**
 * Slack Bot Client
 * 
 * Manages Slack bot instances with stored bot tokens.
 * Supports BYOB (Bring Your Own Bot) mode where users provide their own bot token.
 */

import { App, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

interface SlackBotConfig {
  botToken: string;
  userId: string;
}

// Cache of active bot instances
const botCache = new Map<string, App>();

/**
 * Create or get cached Slack bot instance
 */
export function getSlackBot(config: SlackBotConfig): App {
  const cacheKey = `${config.userId}-${config.botToken.slice(-8)}`;
  
  if (botCache.has(cacheKey)) {
    return botCache.get(cacheKey)!;
  }

  const app = new App({
    token: config.botToken,
    logLevel: LogLevel.INFO,
    socketMode: false, // Use HTTP mode for events
  });

  botCache.set(cacheKey, app);
  return app;
}

/**
 * Test if a bot token is valid
 */
export async function testBotToken(botToken: string): Promise<{
  valid: boolean;
  teamName?: string;
  botName?: string;
  error?: string;
}> {
  try {
    const client = new WebClient(botToken);
    const authTest = await client.auth.test();
    
    return {
      valid: true,
      teamName: authTest.team as string,
      botName: authTest.user as string,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid bot token',
    };
  }
}

/**
 * Send a message to a Slack channel or DM
 */
export async function sendSlackMessage(
  botToken: string,
  channel: string,
  text: string,
  threadTs?: string
): Promise<void> {
  const client = new WebClient(botToken);
  
  await client.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs,
  });
}

/**
 * Get conversation history (for DMs)
 */
export async function getConversationHistory(
  botToken: string,
  channel: string,
  limit: number = 50
): Promise<any[]> {
  const client = new WebClient(botToken);
  
  const result = await client.conversations.history({
    channel,
    limit,
  });
  
  return result.messages || [];
}
