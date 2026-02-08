/**
 * Telegram bot handler using node-telegram-bot-api
 */

import TelegramBot from 'node-telegram-bot-api';

// Global bot registry to prevent multiple polling instances
const activeBots = new Map<string, TelegramBot>();

export interface TelegramBotConfig {
  token: string;
  userId: string;
  onMessage?: (chatId: number, text: string) => Promise<string>;
}

/**
 * Create and start a Telegram bot for a user
 */
export async function createTelegramBot(config: TelegramBotConfig): Promise<TelegramBot> {
  const { token, userId, onMessage } = config;

  // Stop existing bot if running
  if (activeBots.has(userId)) {
    await stopTelegramBot(userId);
  }

  // Create bot with polling
  const bot = new TelegramBot(token, { polling: true });

  // Handle incoming messages
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return; // Ignore non-text messages

    try {
      // Call custom message handler or default to chat API
      let response: string;
      
      if (onMessage) {
        response = await onMessage(chatId, text);
      } else {
        // Default: call local chat API
        const apiResponse = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: 'email-assistant',
            messages: [{ role: 'user', content: text }],
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        response = data.content || data.message || 'No response';
      }

      // Send response back to user
      await bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Telegram bot error:', error);
      await bot.sendMessage(
        chatId,
        'Sorry, I encountered an error processing your message. Please try again.'
      );
    }
  });

  // Handle polling errors
  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
  });

  // Store in registry
  activeBots.set(userId, bot);

  return bot;
}

/**
 * Stop a user's Telegram bot
 */
export async function stopTelegramBot(userId: string): Promise<void> {
  const bot = activeBots.get(userId);
  
  if (bot) {
    try {
      await bot.stopPolling();
      activeBots.delete(userId);
    } catch (error) {
      console.error('Error stopping Telegram bot:', error);
    }
  }
}

/**
 * Get active bot for a user
 */
export function getTelegramBot(userId: string): TelegramBot | undefined {
  return activeBots.get(userId);
}

/**
 * Validate a Telegram bot token by calling getMe
 */
export async function validateTelegramToken(token: string): Promise<{
  valid: boolean;
  botUsername?: string;
  botName?: string;
  error?: string;
}> {
  try {
    const bot = new TelegramBot(token);
    const me = await bot.getMe();
    
    return {
      valid: true,
      botUsername: me.username,
      botName: me.first_name,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid token',
    };
  }
}
