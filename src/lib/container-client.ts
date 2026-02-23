/**
 * Container Client - Communicates with user containers
 * 
 * Abstracts the container URL construction and provides
 * typed methods for all container endpoints.
 * 
 * Also provides CLI wrappers for OpenClaw commands that run
 * inside containers via docker exec.
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(require('child_process').exec);

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


  // ── Command Center endpoints ────────────────────────────────────────────

  /**
   * GET /api/activity
   * Returns recent agent events from the container's local event store.
   * Response: { events: ContainerEvent[] }
   */
  activity: async (port: number, params?: { since?: string; limit?: number }) => {
    const token = await getGatewayToken(port);
    const qs = new URLSearchParams();
    if (params?.since) qs.set('since', params.since);
    if (params?.limit) qs.set('limit', String(params.limit));
    const path = `/api/activity${qs.toString() ? `?${qs.toString()}` : ''}`;
    return containerRequest<{ events: unknown[] }>(port, path, {}, token || undefined);
  },

  /**
   * GET /api/cron-status
   * Returns cron job health from the container.
   * Response: { jobs: CronJob[] }
   */
  cronStatus: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ jobs: unknown[] }>(port, '/api/cron-status', {}, token || undefined);
  },

  /**
   * GET /api/team-status
   * Returns team member status from the container (reads AGENTS.md / team config).
   * Response: { members: TeamMember[] }
   */
  teamStatus: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{ members: unknown[] }>(port, '/api/team-status', {}, token || undefined);
  },

  /**
   * POST /api/sessions/history
   * Get session history from OpenClaw
   * Response: { sessionKey, messages, totalMessages, hasMore, metadata }
   */
  getSessionHistory: async (
    port: number,
    sessionKey: string,
    options?: { limit?: number; offset?: number }
  ) => {
    const token = await getGatewayToken(port);
    return containerRequest<{
      sessionKey: string;
      messages: Array<{
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: string;
        timestamp: string;
      }>;
      totalMessages: number;
      hasMore: boolean;
      metadata?: {
        createdAt: string;
        updatedAt: string;
        compactionCount?: number;
        tokenEstimate?: number;
      };
    }>(
      port,
      '/api/sessions/history',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionKey,
          limit: options?.limit || 50,
          offset: options?.offset || 0,
        }),
      },
      token || undefined
    );
  },

  /**
   * GET /api/sessions
   * List user's sessions from OpenClaw
   * Response: { sessions }
   */
  getSessions: async (port: number) => {
    const token = await getGatewayToken(port);
    return containerRequest<{
      sessions: Array<{
        key: string;
        id: string;
        messageCount: number;
        tokenEstimate: number;
        createdAt: string;
        updatedAt: string;
        compactionCount?: number;
      }>;
    }>(port, '/api/sessions', {}, token || undefined);
  },
};


// ============================================================================
// OpenClaw CLI Wrappers
// ============================================================================
// These functions execute OpenClaw CLI commands inside user containers
// using docker exec. They provide a more secure alternative to SSH-based
// file reads.

// --- Types ---

export interface OpenClawAgent {
  id: string;
  name: string;
  role?: string;
  emoji?: string;
  identity?: string;
}

export interface OpenClawCron {
  id: string;
  schedule: string;
  command: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface OpenClawHook {
  name: string;
  enabled: boolean;
  description?: string;
}

export interface OpenClawMemorySearchResult {
  content: string;
  source: string;
  timestamp?: string;
  score?: number;
}

// --- Helper: Execute command in container ---

/**
 * Execute a command inside a container via docker exec.
 * Returns the stdout, or throws an error on non-zero exit.
 */
async function execInContainer(
  containerId: string,
  command: string,
  timeoutMs: number = 30_000
): Promise<string> {
  const fullCommand = `docker exec ${containerId} ${command}`;
  console.log(`[container-cli] ${fullCommand.substring(0, 100)}...`);
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, { 
      timeout: timeoutMs,
      encoding: 'utf-8',
    });
    
    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`[container-cli] stderr: ${stderr}`);
    }
    
    return stdout.trim();
  } catch (error: any) {
    console.error(`[container-cli] Failed: ${fullCommand}`, error.message);
    throw new Error(`Container CLI failed: ${error.message}`);
  }
}

/**
 * Get container ID from user ID
 */
async function getContainerIdFromUserId(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { containerId: true },
  });
  return user?.containerId || null;
}

/**
 * Get container ID from container port
 */
async function getContainerIdFromPort(containerPort: number): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.containerPort, containerPort),
    columns: { containerId: true },
  });
  return user?.containerId || null;
}

// --- CLI Wrappers ---

/**
 * List all agents from the container via `openclaw agents list`
 */
export async function listAgents(userId: string): Promise<{ agents: OpenClawAgent[]; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { agents: [], error: 'User container not found' };
    }
    
    const output = await execInContainer(containerId, 'openclaw agents list');
    
    // Parse JSON output
    let agents: OpenClawAgent[] = [];
    try {
      agents = JSON.parse(output);
    } catch {
      // If not JSON, try to parse line-by-line format
      const lines = output.split('\n').filter(line => line.trim());
      agents = lines.map((line, idx) => {
        const parts = line.split(/\s+/);
        return {
          id: parts[0] || `agent-${idx}`,
          name: parts[1] || line,
        };
      });
    }
    
    return { agents, error: null };
  } catch (error: any) {
    return { agents: [], error: error.message };
  }
}

/**
 * List all cron jobs from the container via `openclaw cron list`
 */
export async function listCrons(userId: string): Promise<{ crons: OpenClawCron[]; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { crons: [], error: 'User container not found' };
    }
    
    // Use --json flag to get structured output
    const output = await execInContainer(containerId, 'openclaw cron list --json');
    
    // Extract JSON from output (openclaw doctor output may appear before the JSON)
    // Find the first '{' and take everything from there
    const jsonStart = output.indexOf('{');
    if (jsonStart === -1) {
      // No JSON found, return empty
      return { crons: [], error: null };
    }
    
    const jsonStr = output.substring(jsonStart);
    
    // Parse JSON output
    let crons: OpenClawCron[] = [];
    try {
      const parsed = JSON.parse(jsonStr);
      // Handle both array format and {jobs: [...]} format
      crons = Array.isArray(parsed) ? parsed : (parsed.jobs || []);
    } catch (parseError: any) {
      console.error('[listCrons] JSON parse failed:', parseError.message);
      return { crons: [], error: `Failed to parse cron list: ${parseError.message}` };
    }
    
    return { crons, error: null };
  } catch (error: any) {
    return { crons: [], error: error.message };
  }
}

/**
 * Add a new cron job via `openclaw cron add --name <name> --cron <schedule> --message <command>`
 */
export async function addCron(
  userId: string,
  schedule: string,
  command: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { success: false, error: 'User container not found' };
    }
    
    // Generate a unique name from schedule and timestamp
    const name = `cron_${Date.now()}`;
    
    // Escape quotes for shell
    const safeSchedule = schedule.replace(/"/g, '\\"');
    const safeCommand = command.replace(/"/g, '\\"');
    
    await execInContainer(
      containerId, 
      `openclaw cron add --name "${name}" --cron "${safeSchedule}" --message "${safeCommand}"`
    );
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Enable a cron job via `openclaw cron enable <id>`
 */
export async function enableCron(
  userId: string,
  cronId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { success: false, error: 'User container not found' };
    }
    
    await execInContainer(containerId, `openclaw cron enable ${cronId}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Disable a cron job via `openclaw cron disable <id>`
 */
export async function disableCron(
  userId: string,
  cronId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { success: false, error: 'User container not found' };
    }
    
    await execInContainer(containerId, `openclaw cron disable ${cronId}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove a cron job via `openclaw cron rm <id>`
 */
export async function removeCron(
  userId: string,
  cronId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { success: false, error: 'User container not found' };
    }
    
    await execInContainer(containerId, `openclaw cron rm ${cronId}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get cron scheduler status via `openclaw cron status`
 */
export async function cronStatus(
  userId: string
): Promise<{ running: boolean; jobsCount: number; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { running: false, jobsCount: 0, error: 'User container not found' };
    }
    
    const output = await execInContainer(containerId, 'openclaw cron status');
    
    // Parse simple status output
    const running = output.toLowerCase().includes('running');
    const jobsMatch = output.match(/(\d+)\s*job/i);
    const jobsCount = jobsMatch ? parseInt(jobsMatch[1], 10) : 0;
    
    return { running, jobsCount, error: null };
  } catch (error: any) {
    return { running: false, jobsCount: 0, error: error.message };
  }
}

/**
 * List all hooks from the container via `openclaw hooks list`
 */
export async function listHooks(userId: string): Promise<{ hooks: OpenClawHook[]; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { hooks: [], error: 'User container not found' };
    }
    
    const output = await execInContainer(containerId, 'openclaw hooks list --json');
    
    // Parse JSON output, skipping doctor diagnostic noise
    let hooks: OpenClawHook[] = [];
    try {
      // Find first JSON structure in output (skip doctor box-drawing output)
      const jsonStart = output.indexOf('[');
      const jsonStartObj = output.indexOf('{');
      const start = jsonStart === -1 ? jsonStartObj : (jsonStartObj === -1 ? jsonStart : Math.min(jsonStart, jsonStartObj));
      if (start === -1) throw new Error('No JSON found');
      const jsonStr = output.slice(start);
      const parsed = JSON.parse(jsonStr);
      hooks = Array.isArray(parsed) ? parsed : (parsed.hooks || []);
    } catch {
      // Fallback: filter lines to only those that look like hook names (no box-drawing chars)
      const lines = output.split('\n').filter(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 2) return false;
        // Skip box-drawing, doctor output, and config warnings
        if (/[│├╮╯◇─╭┤┬┴┼]/.test(trimmed)) return false;
        if (/Doctor|doctor|config|Run "|Unknown|configured|enabled automatically/.test(trimmed)) return false;
        if (trimmed.startsWith('Hook') || trimmed.startsWith('File:') || trimmed.startsWith('Problem:')) return false;
        return true;
      });
      hooks = lines.map(line => {
        const enabled = !line.includes('[disabled]') && !line.includes('disabled');
        return {
          name: line.replace(/[\[\]]/g, '').trim().split(/\s+/)[0],
          enabled,
        };
      });
    }
    
    return { hooks, error: null };
  } catch (error: any) {
    return { hooks: [], error: error.message };
  }
}

/**
 * Enable a hook via `openclaw hooks enable <hook>`
 */
export async function enableHook(
  userId: string,
  hookName: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { success: false, error: 'User container not found' };
    }
    
    await execInContainer(containerId, `openclaw hooks enable ${hookName}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Disable a hook via `openclaw hooks disable <hook>`
 */
export async function disableHook(
  userId: string,
  hookName: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { success: false, error: 'User container not found' };
    }
    
    await execInContainer(containerId, `openclaw hooks disable ${hookName}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Search memory via `openclaw memory search <query>`
 */
export async function searchMemory(
  userId: string,
  query: string
): Promise<{ results: OpenClawMemorySearchResult[]; error: string | null }> {
  try {
    const containerId = await getContainerIdFromUserId(userId);
    if (!containerId) {
      return { results: [], error: 'User container not found' };
    }
    
    const safeQuery = query.replace(/"/g, '\\"');
    const output = await execInContainer(containerId, `openclaw memory search "${safeQuery}"`);
    
    // Parse JSON output
    let results: OpenClawMemorySearchResult[] = [];
    try {
      results = JSON.parse(output);
    } catch {
      // If not JSON, treat each line as a result
      results = output.split('\n').filter(line => line.trim()).map(line => ({
        content: line,
        source: 'unknown',
      }));
    }
    
    return { results, error: null };
  } catch (error: any) {
    return { results: [], error: error.message };
  }
}
