#!/usr/bin/env node
/**
 * Thin HTTP API wrapper for OpenClaw Gateway
 * Exposes REST endpoints for dashboard integration
 * Uses Node 22's native WebSocket (browser-style API)
 */

const http = require('http');

const API_PORT = process.env.API_PORT || 8081;
const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://127.0.0.1:8080';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';

let requestId = 0;
const pendingRequests = new Map();

let ws = null;
let wsConnected = false;
let connecting = false;
let reconnectTimer = null;
// Store pending chat requests by runId to receive async responses
const pendingChatByRunId = new Map();
// Store accumulated text for streaming responses
const chatTextByRunId = new Map();

function connectGateway() {
  // Prevent multiple simultaneous connection attempts
  if (connecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }
  
  connecting = true;
  console.log('[api] Connecting to gateway:', GATEWAY_URL);
  
  try {
    ws = new WebSocket(GATEWAY_URL);
  } catch (e) {
    console.error('[api] Failed to create WebSocket:', e.message);
    connecting = false;
    scheduleReconnect();
    return;
  }
  
  ws.addEventListener('open', () => {
    console.log('[api] Gateway connected, sending handshake...');
    ws.send(JSON.stringify({
      type: 'req',
      id: 'connect',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: { 
          id: 'gateway-client',  // Valid IDs: cli, gateway-client, test, etc.
          version: '1.0.0', 
          platform: 'linux', 
          mode: 'backend'  // Valid modes: cli, backend, ui, node, test
        },
        caps: [],
        auth: { token: GATEWAY_TOKEN },
        locale: 'en-US',
        userAgent: 'clawer-api/1.0.0'
      }
    }));
  });
  
  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      // Log all messages for debugging
      if (msg.type !== 'res' || msg.id !== 'connect') {
        console.log('[api] ws message:', msg.type, msg.event || msg.id, msg.payload?.status || '');
      }
      if (msg.type === 'res' && msg.id === 'connect') {
        connecting = false;
        if (msg.ok) {
          console.log('[api] Gateway handshake complete - API ready');
          wsConnected = true;
        } else {
          console.error('[api] Gateway handshake failed:', JSON.stringify(msg.error || msg));
          scheduleReconnect();
        }
      } else if (msg.type === 'res') {
        const pending = pendingRequests.get(msg.id);
        if (pending) {
          // For chat.send, we need to wait for the agent event
          if (msg.payload?.runId && msg.payload?.status === 'started') {
            // Move to runId-based tracking, remove from id-based
            pendingRequests.delete(msg.id);
            pendingChatByRunId.set(msg.payload.runId, pending);
            console.log('[api] chat started, waiting for runId:', msg.payload.runId);
            // Don't resolve yet, wait for agent.complete event
          } else {
            pendingRequests.delete(msg.id);
            pending.resolve(msg);
          }
        }
      } else if (msg.type === 'event' && msg.event === 'agent') {
        // Agent event - handle streaming response
        const runId = msg.payload?.runId;
        const stream = msg.payload?.stream;
        const data = msg.payload?.data;
        
        // Log agent events for debugging
        if (stream === 'assistant' || stream === 'lifecycle') {
          console.log('[api] agent stream:', stream, 'runId:', runId, 'data:', JSON.stringify(data).slice(0, 100));
        }
        
        // Track text from assistant stream
        if (stream === 'assistant' && data?.text) {
          chatTextByRunId.set(runId, data.text);
        }
        
        // When lifecycle ends, resolve the pending request
        if (stream === 'lifecycle' && data?.phase === 'end') {
          const pending = pendingChatByRunId.get(runId);
          if (pending) {
            const content = chatTextByRunId.get(runId) || 'Response complete';
            pendingChatByRunId.delete(runId);
            chatTextByRunId.delete(runId);
            console.log('[api] agent complete, content:', content);
            pending.resolve({
              type: 'res',
              ok: true,
              payload: { content }
            });
          }
        }
      }
    } catch (e) {
      console.error('[api] Failed to parse message:', e.message);
    }
  });
  
  ws.addEventListener('close', () => {
    console.log('[api] Gateway disconnected');
    wsConnected = false;
    connecting = false;
    ws = null;
    scheduleReconnect();
  });
  
  ws.addEventListener('error', (event) => {
    console.error('[api] Gateway WebSocket error');
    wsConnected = false;
    connecting = false;
    ws = null;
    // Native WebSocket may not always fire close after error
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return; // Already scheduled
  console.log('[api] Scheduling reconnect in 3 seconds...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectGateway();
  }, 3000);
}

async function gatewayRequest(method, params = {}) {
  if (!wsConnected) {
    throw new Error('Gateway not connected');
  }
  
  const id = String(++requestId);
  // Use longer timeout for chat requests
  const timeoutMs = method === 'chat.send' ? 120000 : 30000;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Gateway request timeout'));
    }, timeoutMs);
    
    pendingRequests.set(id, {
      resolve: (msg) => {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
    
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${API_PORT}`);
  const path = url.pathname;
  
  try {
    if (path === '/api/health' || path === '/health') {
      const result = await gatewayRequest('health');
      res.writeHead(result.ok ? 200 : 500);
      res.end(JSON.stringify(result.payload || result.error));
      
    } else if (path === '/api/status') {
      const result = await gatewayRequest('status');
      res.writeHead(result.ok ? 200 : 500);
      res.end(JSON.stringify(result.payload || result.error));
      
    } else if (path === '/api/whatsapp/qr') {
      const health = await gatewayRequest('health');
      const waHealth = health.payload?.channels?.whatsapp;
      
      if (waHealth?.linked) {
        res.writeHead(200);
        res.end(JSON.stringify({ linked: true, self: waHealth.self }));
      } else {
        // Start web login to get QR code
        try {
          const loginResult = await gatewayRequest('web.login.start', { 
            force: false,
            timeoutMs: 60000 
          });
          
          if (loginResult.ok && loginResult.payload?.qrDataUrl) {
            res.writeHead(200);
            res.end(JSON.stringify({ 
              linked: false,
              qrDataUrl: loginResult.payload.qrDataUrl,
              message: loginResult.payload.message
            }));
          } else {
            res.writeHead(200);
            res.end(JSON.stringify({ 
              linked: false,
              message: loginResult.payload?.message || 'QR generation in progress',
              controlUrl: `http://localhost:${process.env.GATEWAY_PORT || 8080}`
            }));
          }
        } catch (e) {
          console.error('[api] web.login.start error:', e.message);
          res.writeHead(200);
          res.end(JSON.stringify({ 
            linked: false,
            message: 'WhatsApp not linked. Use Control UI to scan QR.',
            controlUrl: `http://localhost:${process.env.GATEWAY_PORT || 8080}`
          }));
        }
      }
      
    } else if (path === '/api/whatsapp/link' && req.method === 'POST') {
      // Start WhatsApp linking flow
      try {
        const loginResult = await gatewayRequest('web.login.start', { 
          force: true,
          timeoutMs: 120000 
        });
        res.writeHead(200);
        res.end(JSON.stringify(loginResult.payload || loginResult.error));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
      
    } else if (path === '/api/whatsapp/wait' && req.method === 'POST') {
      // Wait for QR scan completion
      try {
        const waitResult = await gatewayRequest('web.login.wait', { 
          timeoutMs: 120000 
        });
        res.writeHead(200);
        res.end(JSON.stringify(waitResult.payload || waitResult.error));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
      
    } else if (path === '/api/whatsapp/status') {
      const health = await gatewayRequest('health');
      const waHealth = health.payload?.channels?.whatsapp || {};
      res.writeHead(200);
      res.end(JSON.stringify(waHealth));
      
    } else if (path === '/api/telegram/status') {
      const health = await gatewayRequest('health');
      const tgHealth = health.payload?.channels?.telegram || {};
      res.writeHead(200);
      res.end(JSON.stringify(tgHealth));
      
    } else if (path === '/api/telegram/connect' && req.method === 'POST') {
      // Configure Telegram bot token
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const { token } = JSON.parse(body || '{}');
      
      if (!token) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Token required' }));
        return;
      }
      
      // Use config.patch to set telegram token
      try {
        const patchResult = await gatewayRequest('config.patch', {
          raw: JSON.stringify({
            channels: {
              telegram: {
                enabled: true,
                token: token
              }
            }
          })
        });
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: patchResult.ok,
          message: patchResult.ok ? 'Telegram configured. Restarting...' : 'Failed to configure'
        }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
      
    } else if (path === '/api/chat' && req.method === 'POST') {
      // Handle chat message via agent endpoint
      console.log('[api] /api/chat received');
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      await new Promise(resolve => req.on('end', resolve));
      const body = Buffer.concat(chunks).toString();
      console.log('[api] body:', body);
      const { message, context, settings } = JSON.parse(body || '{}');
      
      if (!message) {
        console.log('[api] no message in body');
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Message required' }));
        return;
      }
      console.log('[api] message:', message);
      
      // Build personalized system prompt if settings provided
      let systemPrompt = '';
      if (settings) {
        const parts = [];
        if (settings.botName) {
          parts.push(`You are ${settings.botName}, a personal AI assistant.`);
        }
        if (settings.personality) {
          parts.push(`Your personality is ${settings.personality}.`);
        }
        if (settings.communicationStyle) {
          const styles = {
            'casual': 'Use a casual, conversational tone.',
            'balanced': 'Use a balanced, professional but approachable tone.',
            'formal': 'Use a formal, business-appropriate tone.'
          };
          parts.push(styles[settings.communicationStyle] || '');
        }
        if (settings.responseLength) {
          const lengths = {
            'brief': 'Keep responses concise and to-the-point.',
            'balanced': 'Provide well-rounded responses.',
            'detailed': 'Provide comprehensive, thorough responses.'
          };
          parts.push(lengths[settings.responseLength] || '');
        }
        if (settings.customInstructions) {
          parts.push(`Additional context: ${settings.customInstructions}`);
        }
        systemPrompt = parts.filter(Boolean).join(' ');
        console.log('[api] system prompt:', systemPrompt);
      }
      
      try {
        // Use the gateway's chat.send endpoint which waits for response
        // Use unique session key per request to avoid stream mixing
        const idempotencyKey = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const sessionKey = context || `web-chat-${Date.now()}`;
        
        // Build the full message with system context if provided
        const fullMessage = systemPrompt 
          ? `[System: ${systemPrompt}]\n\nUser: ${message}`
          : message;
        
        const chatResult = await gatewayRequest('chat.send', {
          message: fullMessage,
          sessionKey: sessionKey,
          idempotencyKey: idempotencyKey,
          timeoutMs: 60000  // Wait up to 60 seconds for response
        });
        
        console.log('[api] chat.send response:', JSON.stringify(chatResult, null, 2));
        if (chatResult.ok) {
          // Extract content from the response
          const content = chatResult.payload?.content 
            || chatResult.payload?.message 
            || chatResult.payload?.text
            || chatResult.payload?.response
            || (typeof chatResult.payload === 'string' ? chatResult.payload : null)
            || 'Response received';
          res.writeHead(200);
          res.end(JSON.stringify({ content }));
        } else {
          console.log('[api] chat.send error:', chatResult.error);
          res.writeHead(200);
          res.end(JSON.stringify({ 
            content: 'I received your message but encountered an issue processing it. Please try again.'
          }));
        }
      } catch (e) {
        console.error('[api] chat error:', e.message);
        res.writeHead(200);
        res.end(JSON.stringify({ 
          content: 'The AI is thinking... but taking longer than expected. Please try again.'
        }));
      }
      
    } else if (path === '/ready') {
      res.writeHead(wsConnected ? 200 : 503);
      res.end(JSON.stringify({ ready: wsConnected }));
      
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error('[api] Request error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[api] Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[api] Unhandled rejection:', reason);
});

// Start
console.log(`[api] HTTP API server starting on port ${API_PORT}`);
server.listen(API_PORT, '0.0.0.0', () => {
  console.log(`[api] HTTP API server listening on port ${API_PORT}`);
  // Wait for gateway to be ready (it starts after us)
  setTimeout(connectGateway, 5000);
});
