/**
 * Clawer Bot Worker
 * 
 * Lightweight bot worker that:
 * - Runs Telegram bot (if token provided)
 * - Provides health check endpoint
 * - Calls Kimi API for responses
 */

import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const PORT = 8080;

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const USER_ID = process.env.USER_ID || 'unknown';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Track bot status
let telegramBot = null;
let telegramConnected = false;
let messageCount = 0;

/**
 * Call Kimi API for response
 */
async function getAIResponse(message) {
  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI assistant provided by clawer.ai. Be concise, friendly, and helpful. Help with email, scheduling, research, writing, and general tasks.' 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
  } catch (error) {
    console.error('Kimi API error:', error);
    return 'Sorry, something went wrong. Please try again.';
  }
}

/**
 * Initialize Telegram bot if token provided
 */
function initTelegram() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('No Telegram bot token provided, skipping Telegram init');
    return;
  }

  try {
    telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    
    telegramBot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      
      if (!text) return;
      
      messageCount++;
      console.log(`[Telegram] Message #${messageCount} from ${chatId}: ${text.substring(0, 50)}...`);
      
      try {
        const reply = await getAIResponse(text);
        await telegramBot.sendMessage(chatId, reply);
      } catch (error) {
        console.error('Error handling Telegram message:', error);
        await telegramBot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
      }
    });

    telegramBot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error.message);
      telegramConnected = false;
    });

    telegramConnected = true;
    console.log('Telegram bot initialized and polling');
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    userId: USER_ID,
    telegram: telegramConnected,
    messageCount,
    uptime: process.uptime(),
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    userId: USER_ID,
    telegram: {
      connected: telegramConnected,
      token: TELEGRAM_BOT_TOKEN ? '***configured***' : null,
    },
    messageCount,
    uptime: process.uptime(),
  });
});

// Webhook for receiving messages (future use for WhatsApp)
app.use(express.json());
app.post('/webhook', async (req, res) => {
  // Placeholder for webhook handling
  res.json({ received: true });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clawer bot worker started on port ${PORT}`);
  console.log(`User ID: ${USER_ID}`);
  console.log(`Moonshot API Key: ${MOONSHOT_API_KEY ? '***configured***' : 'NOT SET'}`);
  
  // Initialize Telegram if token provided
  initTelegram();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  if (telegramBot) {
    telegramBot.stopPolling();
  }
  process.exit(0);
});
