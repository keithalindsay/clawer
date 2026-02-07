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
          pendingRequests.delete(msg.id);
          pending.resolve(msg);
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
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Gateway request timeout'));
    }, 30000);
    
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
        res.writeHead(200);
        res.end(JSON.stringify({ 
          linked: false,
          message: 'WhatsApp not linked. Use Control UI to scan QR.',
          controlUrl: `http://localhost:${process.env.GATEWAY_PORT || 8080}`
        }));
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
