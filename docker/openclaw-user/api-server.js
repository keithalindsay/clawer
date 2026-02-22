#!/usr/bin/env node
/**
 * Thin HTTP API wrapper for OpenClaw Gateway
 * Exposes REST endpoints for dashboard integration
 * Uses Node 22's native WebSocket (browser-style API)
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const API_PORT = process.env.API_PORT || 8081;
const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://127.0.0.1:8080';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';

// ─── Event Store (for Command Center activity feed) ────────────────────────
const eventStore = [];
const MAX_EVENTS = 500; // circular buffer

function storeEvent(type, data) {
  eventStore.push({
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    type,
    data,
    timestamp: new Date().toISOString(),
  });
  if (eventStore.length > MAX_EVENTS) eventStore.shift();
}

// Generate or load a persistent device identity for gateway auth
const DEVICE_KEY_PATH = '/home/user/.openclaw/api-server-device.json';
let deviceIdentity = null;

function getOrCreateDeviceIdentity() {
  if (deviceIdentity) return deviceIdentity;
  try {
    if (fs.existsSync(DEVICE_KEY_PATH)) {
      deviceIdentity = JSON.parse(fs.readFileSync(DEVICE_KEY_PATH, 'utf8'));
      return deviceIdentity;
    }
  } catch {}
  
  // Generate Ed25519 keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pubKeyDer = publicKey.export({ type: 'spki', format: 'der' });
  // Extract raw 32-byte public key from DER (last 32 bytes)
  const rawPubKey = pubKeyDer.slice(-32);
  const pubKeyB64Url = rawPubKey.toString('base64url');
  const deviceId = crypto.createHash('sha256').update(rawPubKey).digest('hex');
  
  deviceIdentity = {
    id: deviceId,
    publicKey: pubKeyB64Url,
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
  
  fs.writeFileSync(DEVICE_KEY_PATH, JSON.stringify(deviceIdentity, null, 2));
  console.log('[api] Generated device identity:', deviceId);
  return deviceIdentity;
}

function buildDeviceAuthPayload(params) {
  const scopes = params.scopes.join(',');
  const token = params.token || '';
  return ['v1', params.deviceId, params.clientId, params.clientMode, params.role, scopes, String(params.signedAtMs), token].join('|');
}

function signPayload(payload) {
  const di = getOrCreateDeviceIdentity();
  const privKey = crypto.createPrivateKey(di.privateKeyPem);
  const sig = crypto.sign(null, Buffer.from(payload), privKey);
  return sig.toString('base64url');
}

function buildDeviceConnect() {
  const di = getOrCreateDeviceIdentity();
  const signedAtMs = Date.now();
  const payload = buildDeviceAuthPayload({
    deviceId: di.id,
    clientId: 'cli',
    clientMode: 'cli',
    role: 'operator',
    scopes: ['operator.read', 'operator.write', 'operator.admin'],
    signedAtMs,
    token: GATEWAY_TOKEN,
  });
  return {
    id: di.id,
    publicKey: di.publicKey,
    signature: signPayload(payload),
    signedAt: signedAtMs,
  };
}

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
    const device = buildDeviceConnect();
    ws.send(JSON.stringify({
      type: 'req',
      id: 'connect',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: { 
          id: 'cli',
          displayName: 'Clawer API Server',
          version: '2026.2.22', 
          platform: 'linux', 
          mode: 'cli'
        },
        device,
        caps: [],
        scopes: ['operator.read', 'operator.write', 'operator.admin'],
        auth: { token: GATEWAY_TOKEN },
        locale: 'en-US',
        userAgent: 'clawer-api/1.0.0'
      }
    }));
  });
  
  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      // Handle connect.challenge — respond with device signature
      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        const challenge = msg.payload?.challenge;
        if (challenge) {
          console.log('[api] Received connect.challenge, signing nonce...');
          const di = getOrCreateDeviceIdentity();
          const sig = signPayload(challenge);
          ws.send(JSON.stringify({
            type: 'req',
            id: 'connect.challenge',
            method: 'connect.challenge',
            params: { signature: sig }
          }));
        }
        return;
      }
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
      } else if (msg.type === 'res' && msg.id === 'connect.challenge') {
        if (msg.ok) {
          console.log('[api] Challenge response accepted');
        } else {
          console.error('[api] Challenge response failed:', JSON.stringify(msg.error || msg));
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
        
        // Store event for Command Center activity feed
        storeEvent(msg.event || 'unknown', msg.payload || {});
        
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
  
  // SECURITY: Verify authentication for all /api/* routes except health checks
  if (path.startsWith('/api/') && path !== '/api/health' && path !== '/api/status') {
    const authHeader = req.headers['authorization'];
    const expectedAuth = `Bearer ${GATEWAY_TOKEN}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      console.warn('[api] Unauthorized request to', path, 'from', req.socket.remoteAddress);
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }
  
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
      
    } else if (path === '/api/whatsapp/disconnect' && req.method === 'POST') {
      // Disconnect WhatsApp
      try {
        const logoutResult = await gatewayRequest('web.logout', {
          timeoutMs: 10000
        });
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: logoutResult.ok,
          message: logoutResult.ok ? 'WhatsApp disconnected' : 'Failed to disconnect'
        }));
      } catch (e) {
        console.error('[api] web.logout error:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
      
    } else if (path === '/api/telegram/status') {
      // Read config to check if telegram is configured
      const fs = require('fs');
      const configPath = '/home/user/.openclaw/openclaw.json';
      let configured = false;
      let botUsername = null;
      let configuredToken = null;
      
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        configured = !!(config.channels?.telegram?.token);
        configuredToken = config.channels?.telegram?.token || null;
      } catch (e) {
        console.error('[api] Failed to read config:', e.message);
      }
      
      // Also check gateway health for running status
      let running = false;
      let gatewayTelegram = {};
      try {
        const health = await gatewayRequest('health');
        gatewayTelegram = health.payload?.channels?.telegram || {};
        running = gatewayTelegram.connected || gatewayTelegram.running || false;
        if (gatewayTelegram.self?.username) {
          botUsername = gatewayTelegram.self.username;
        }
      } catch (e) {
        console.log('[api] Gateway health check failed:', e.message);
      }
      
      // If we have a token but no username from gateway, try to fetch bot info directly
      if (configured && configuredToken && !botUsername) {
        try {
          const tgResponse = await fetch(`https://api.telegram.org/bot${configuredToken}/getMe`);
          const tgData = await tgResponse.json();
          if (tgData.ok && tgData.result?.username) {
            botUsername = tgData.result.username;
          }
        } catch (e) {
          console.log('[api] Failed to fetch bot info from Telegram API:', e.message);
        }
      }
      
      res.writeHead(200);
      res.end(JSON.stringify({
        configured,
        connected: configured && running,
        running,
        botUsername: botUsername || null,
        ...gatewayTelegram
      }));
      
    } else if (path === '/api/telegram/connect' && req.method === 'POST') {
      // Configure Telegram bot token by writing to openclaw.json
      const fs = require('fs');
      const configPath = '/home/user/.openclaw/openclaw.json';
      
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const { token } = JSON.parse(body || '{}');
      
      if (!token || typeof token !== 'string') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Bot token is required' }));
        return;
      }
      
      // Validate token format (roughly: digits:alphanumeric)
      if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid bot token format. It should look like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz' }));
        return;
      }
      
      // Validate the token with Telegram API
      let botUsername = null;
      try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const tgData = await tgResponse.json();
        if (!tgData.ok) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid bot token. Telegram rejected it. Please check and try again.' }));
          return;
        }
        botUsername = tgData.result?.username || null;
        console.log('[api] Telegram bot validated:', botUsername);
      } catch (e) {
        console.error('[api] Telegram API validation failed:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Could not validate token with Telegram. Please try again.' }));
        return;
      }
      
      try {
        // Read current config
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Add telegram channel config
        if (!config.channels) config.channels = {};
        config.channels.telegram = {
          adapter: 'telegram',
          token: token
        };
        
        // Write updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('[api] Telegram config written to', configPath);
        
        // Restart the gateway to pick up the new channel
        // Send a restart signal - close the WebSocket and let entrypoint restart
        try {
          const restartResult = await gatewayRequest('gateway.restart', {});
          console.log('[api] Gateway restart requested:', restartResult.ok);
        } catch (e) {
          console.log('[api] Gateway restart request failed (may restart anyway):', e.message);
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: true,
          botUsername,
          message: 'Telegram bot connected successfully!'
        }));
      } catch (e) {
        console.error('[api] Failed to write telegram config:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to save configuration: ' + e.message }));
      }
      
    } else if (path === '/api/telegram/disconnect' && req.method === 'POST') {
      // Remove Telegram bot config
      const fs = require('fs');
      const configPath = '/home/user/.openclaw/openclaw.json';
      
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Remove telegram channel
        if (config.channels?.telegram) {
          delete config.channels.telegram;
        }
        
        // Write updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('[api] Telegram config removed from', configPath);
        
        // Restart gateway
        try {
          await gatewayRequest('gateway.restart', {});
        } catch (e) {
          console.log('[api] Gateway restart after disconnect:', e.message);
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Telegram bot disconnected' }));
      } catch (e) {
        console.error('[api] Failed to remove telegram config:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to disconnect: ' + e.message }));
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
      
      // Extract routing info from settings
      const routingModel = settings?.model;
      const routingTier = settings?.tier;
      const routingConfidence = settings?.confidence;
      
      if (routingTier) {
        console.log('[api] Smart routing:', {
          tier: routingTier,
          model: routingModel,
          confidence: routingConfidence
        });
      }
      
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
        
        // Prepare chat params with optional model override
        const chatParams = {
          message: fullMessage,
          sessionKey: sessionKey,
          idempotencyKey: idempotencyKey,
          timeoutMs: 60000  // Wait up to 60 seconds for response
        };
        
        // Note: model override not supported by gateway chat.send in v2026.2.16+
        
        const chatResult = await gatewayRequest('chat.send', chatParams);
        
        console.log('[api] chat.send response:', JSON.stringify(chatResult, null, 2));
        if (chatResult.ok) {
          // Extract content from the response
          const content = chatResult.payload?.content 
            || chatResult.payload?.message 
            || chatResult.payload?.text
            || chatResult.payload?.response
            || (typeof chatResult.payload === 'string' ? chatResult.payload : null)
            || 'Response received';
          
          // Build response with routing metadata if available
          const response = { content };
          if (routingTier) {
            response.routing = {
              tier: routingTier,
              model: routingModel,
              confidence: routingConfidence,
            };
          }
          
          res.writeHead(200);
          res.end(JSON.stringify(response));
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
      
    } else if (path === '/api/logs' || path === '/api/logs/') {
      // Fetch recent gateway logs (last 100 lines)
      try {
        const logsResult = await gatewayRequest('logs.fetch', {
          limit: 100,
          level: 'info'
        });
        
        if (logsResult.ok && logsResult.payload?.logs) {
          res.writeHead(200);
          res.end(JSON.stringify({
            logs: logsResult.payload.logs,
            count: logsResult.payload.logs.length
          }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ logs: [], count: 0 }));
        }
      } catch (e) {
        console.error('[api] logs fetch error:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
      
    } else if (path === '/api/keys/push' && req.method === 'POST') {
      // Receive API keys from dashboard and store in container environment
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      await new Promise(resolve => req.on('end', resolve));
      const body = Buffer.concat(chunks).toString();
      const { openaiKey, anthropicKey, googleKey } = JSON.parse(body || '{}');
      
      const fs = require('fs');
      const envPath = '/home/user/.openclaw/.env';
      
      try {
        // Read existing .env if it exists
        let envContent = '';
        try {
          envContent = fs.readFileSync(envPath, 'utf8');
        } catch (e) {
          // File doesn't exist, will create
        }
        
        // Parse existing env vars
        const envVars = {};
        envContent.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        });
        
        // Update with new keys
        if (openaiKey) envVars['OPENAI_API_KEY'] = openaiKey;
        if (anthropicKey) envVars['ANTHROPIC_API_KEY'] = anthropicKey;
        if (googleKey) envVars['GOOGLE_API_KEY'] = googleKey;
        
        // Write back
        const newEnvContent = Object.entries(envVars)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n');
        
        fs.writeFileSync(envPath, newEnvContent + '\n');
        console.log('[api] API keys updated in container');
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error('[api] Failed to write API keys:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
      
    } else if (path === '/api/activity' && req.method === 'GET') {
      // GET /api/activity?since=ISO&limit=N — Command Center activity feed
      const urlObj = new URL(req.url, `http://localhost`);
      const since = urlObj.searchParams.get('since');
      const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
      
      let events = eventStore;
      if (since) {
        const sinceDate = new Date(since);
        events = events.filter(e => new Date(e.timestamp) > sinceDate);
      }
      events = events.slice(-limit);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ events }));

    } else if (path === '/api/cron-status' && req.method === 'GET') {
      // GET /api/cron-status — proxy to gateway HTTP API for cron job status
      try {
        const cronRes = await fetch(`http://localhost:8080/api/jobs`, {
          headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }
        });
        if (cronRes.ok) {
          const data = await cronRes.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jobs: data.jobs || data || [] }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jobs: [] }));
        }
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jobs: [], error: e.message }));
      }

    } else if (path === '/api/team-status' && req.method === 'GET') {
      // GET /api/team-status — basic team status for Command Center
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ members: [], status: 'ok' }));

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
