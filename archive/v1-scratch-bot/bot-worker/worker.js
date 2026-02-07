const express = require('express');
const https = require('https');

const app = express();
app.use(express.json());

const PORT = 3001;
const USER_ID = process.env.USER_ID || 'unknown';
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

if (!MOONSHOT_API_KEY) {
  console.error('❌ MOONSHOT_API_KEY not set');
  process.exit(1);
}

console.log(`🤖 Bot worker starting for user: ${USER_ID}`);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    userId: USER_ID,
    timestamp: new Date().toISOString()
  });
});

/**
 * Message processing endpoint
 * POST /message
 * Body: { message: string, conversationId?: string }
 */
app.post('/message', async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log(`📨 User ${USER_ID} message: ${message.substring(0, 50)}...`);

  try {
    // Call Kimi API
    const response = await callKimi(message, conversationId);
    
    console.log(`✅ Response sent to user ${USER_ID}`);
    res.json({
      response: response.content,
      conversationId: response.conversationId,
      userId: USER_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error processing message for user ${USER_ID}:`, error.message);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * Call Kimi (Moonshot) API
 */
function callKimi(message, conversationId) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7
    });

    const options = {
      hostname: 'api.moonshot.cn',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Kimi API error: ${res.statusCode} - ${data}`));
            return;
          }

          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.message?.content || 'No response';
          
          resolve({
            content,
            conversationId: conversationId || parsed.id
          });
        } catch (err) {
          reject(new Error(`Failed to parse Kimi response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Kimi API request failed: ${err.message}`));
    });

    req.write(payload);
    req.end();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Bot worker listening on port ${PORT}`);
  console.log(`👤 User ID: ${USER_ID}`);
});
