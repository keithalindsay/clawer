/**
 * Container Client - Communicates with user containers
 * 
 * Abstracts the container URL construction and provides
 * typed methods for all container endpoints.
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

// Container host - defaults to localhost for same-server deployment
const CONTAINER_HOST = process.env.CONTAINER_HOST || 'localhost';

/**
 * Get the base URL for a user's container API
 */
export function getContainerApiUrl(containerPort: number): string {
  // containerPort in DB is the exposed API server port directly
  return `http://${CONTAINER_HOST}:${containerPort}`;
}

/**
 * Get gateway token for a user by container port
 */
async function getGatewayToken(containerPort: number): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.containerPort, containerPort),
    columns: { gatewayToken: true },
  });
  return user?.gatewayToken || null;
}

/**
 * Make a request to a user's container
 */
export async function containerRequest<T>(
  containerPort: number,
  path: string,
  options: RequestInit = {},
  gatewayToken?: string
): Promise<{ data: T | null; error: string | null; status: number }> {
  const baseUrl = getContainerApiUrl(containerPort);
  const url = `${baseUrl}${path}`;
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    // Add authentication if token provided and not a health check
    if (gatewayToken && !path.includes('/health') && !path.includes('/ready')) {
      headers['Authorization'] = `Bearer ${gatewayToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        data: null,
        error: data.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }
    
    return { data, error: null, status: response.status };
  } catch (error: any) {
    console.error(`Container request failed: ${url}`, error);
    return {
      data: null,
      error: error.message || 'Container unreachable',
      status: 503,
    };
  }
}

// Typed container API methods

export interface WhatsAppQRResponse {
  linked: boolean;
  qrDataUrl?: string;
  message?: string;
  self?: { e164?: string; jid?: string };
}

export interface WhatsAppStatusResponse {
  linked: boolean;
  self?: { e164?: string; jid?: string };
}

export interface ChatResponse {
  content: string;
}

export interface HealthResponse {
  ready: boolean;
  gateway?: string;
  uptime?: number;
}

export const containerApi = {
  // Health check
  health: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<HealthResponse>(port, '/api/health', {}, token || undefined);
  },
  
  ready: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ ready: boolean }>(port, '/ready', {}, token || undefined);
  },
  
  // WhatsApp
  whatsappQR: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<WhatsAppQRResponse>(port, '/api/whatsapp/qr', {}, token || undefined);
  },
  
  whatsappStatus: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<WhatsAppStatusResponse>(port, '/api/whatsapp/status', {}, token || undefined);
  },
  
  whatsappLink: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<WhatsAppQRResponse>(port, '/api/whatsapp/link', { method: 'POST' }, token || undefined);
  },
  
  whatsappDisconnect: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ success: boolean }>(port, '/api/whatsapp/disconnect', { method: 'POST' }, token || undefined);
  },
  
  // Telegram
  telegramStatus: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ configured: boolean; connected: boolean; running: boolean; botUsername?: string | null }>(port, '/api/telegram/status', {}, token || undefined);
  },
  
  telegramConnect: async (port: number, botToken: string) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ success: boolean; botUsername?: string }>(port, '/api/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({ token: botToken }),
    }, token || undefined);
  },
  
  telegramDisconnect: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ success: boolean }>(port, '/api/telegram/disconnect', { method: 'POST' }, token || undefined);
  },
  
  // Slack
  slackStatus: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ configured: boolean; connected: boolean; running: boolean; teamName?: string | null; botName?: string | null; channel?: string | null }>(port, '/api/slack/status', {}, token || undefined);
  },
  
  slackConnect: async (port: number, botToken: string, appToken: string, signingSecret: string) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ success: boolean; teamName?: string; botName?: string }>(port, '/api/slack/connect', {
      method: 'POST',
      body: JSON.stringify({ botToken, appToken, signingSecret }),
    }, token || undefined);
  },
  
  slackDisconnect: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ success: boolean }>(port, '/api/slack/disconnect', { method: 'POST' }, token || undefined);
  },
  
  // Chat
  chat: async (port: number, message: string, context?: string, settings?: {
    botName?: string;
    personality?: string;
    customInstructions?: string;
    communicationStyle?: string;
    responseLength?: string;
    // Routing info
    model?: string;
    tier?: string;
    confidence?: number;
  }, explicitToken?: string) => {
    const token = explicitToken || await getGatewayToken(port);
    return containerRequest<ChatResponse>(port, '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, settings }),
    }, token || undefined);
  },
  
  // API Keys - push keys to container
  pushApiKeys: async (port: number, keys: {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
  }) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ success: boolean }>(port, '/api/keys/push', {
      method: 'POST',
      body: JSON.stringify(keys),
    }, token || undefined);
  },
};
