/**
 * Container Client - Communicates with user containers
 * 
 * Abstracts the container URL construction and provides
 * typed methods for all container endpoints.
 */

// Container host - defaults to localhost for same-server deployment
const CONTAINER_HOST = process.env.CONTAINER_HOST || 'localhost';

/**
 * Get the base URL for a user's container API
 */
export function getContainerApiUrl(containerPort: number): string {
  const apiPort = containerPort + 1; // API server is gateway port + 1
  return `http://${CONTAINER_HOST}:${apiPort}`;
}

/**
 * Make a request to a user's container
 */
export async function containerRequest<T>(
  containerPort: number,
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const baseUrl = getContainerApiUrl(containerPort);
  const url = `${baseUrl}${path}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
  health: (port: number) => 
    containerRequest<HealthResponse>(port, '/api/health'),
  
  ready: (port: number) =>
    containerRequest<{ ready: boolean }>(port, '/ready'),
  
  // WhatsApp
  whatsappQR: (port: number) =>
    containerRequest<WhatsAppQRResponse>(port, '/api/whatsapp/qr'),
  
  whatsappStatus: (port: number) =>
    containerRequest<WhatsAppStatusResponse>(port, '/api/whatsapp/status'),
  
  whatsappLink: (port: number) =>
    containerRequest<WhatsAppQRResponse>(port, '/api/whatsapp/link', { method: 'POST' }),
  
  // Telegram
  telegramStatus: (port: number) =>
    containerRequest<{ connected: boolean; username?: string }>(port, '/api/telegram/status'),
  
  telegramConnect: (port: number, botToken: string) =>
    containerRequest<{ success: boolean }>(port, '/api/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({ botToken }),
    }),
  
  // Chat
  chat: (port: number, message: string, context?: string) =>
    containerRequest<ChatResponse>(port, '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};
