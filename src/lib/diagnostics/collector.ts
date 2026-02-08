/**
 * Diagnostic Data Collector
 * 
 * Gathers container state, logs, and health metrics
 */

import { DiagnosticContext } from './types';
import { containerApi, getContainerApiUrl } from '../container-client';

/**
 * Collect diagnostic data for a user's container
 */
export async function collectDiagnostics(
  containerPort: number | null,
  containerId: string | null
): Promise<DiagnosticContext> {
  const context: DiagnosticContext = {
    containerStatus: 'not_found',
    containerId,
    containerUptime: null,
    restartCount: 0,
    healthEndpoint: null,
    memoryUsage: null,
    cpuPercent: null,
    logs: [],
    recentErrors: [],
    configValid: true,
    configErrors: [],
    apiKeyConfigured: true,
    apiKeyError: null,
    lastSuccessfulChat: null,
    failedChatCount: 0,
    userReportedIssue: null,
  };

  // No container port = not provisioned
  if (!containerPort) {
    context.containerStatus = 'not_found';
    context.configErrors.push('Container not provisioned');
    return context;
  }

  // Check health endpoint
  try {
    const startTime = Date.now();
    const { data, error, status } = await containerApi.health(containerPort);
    const latencyMs = Date.now() - startTime;

    if (data) {
      context.containerStatus = 'running';
      context.healthEndpoint = {
        status,
        latencyMs,
        body: data,
      };
      
      // Extract uptime if available
      if (data.uptime) {
        context.containerUptime = formatUptime(data.uptime);
      }
    } else {
      context.containerStatus = 'error';
      context.healthEndpoint = {
        status,
        latencyMs,
        body: { error },
      };
    }
  } catch (err: any) {
    context.containerStatus = 'error';
    context.configErrors.push(`Health check failed: ${err.message}`);
  }

  // Fetch logs via Docker (if we have access)
  // For now, we'll use the API to get basic status
  // In production, this would call docker logs or a log aggregator

  // Check if ready
  try {
    const { data } = await containerApi.ready(containerPort);
    if (!data?.ready) {
      context.containerStatus = 'restarting';
    }
  } catch {
    // Ignore - health check already captured status
  }

  return context;
}

/**
 * Collect container logs (last N lines)
 * This requires Docker access - for now returns empty
 */
export async function collectLogs(
  containerId: string | null,
  lines: number = 100
): Promise<string[]> {
  if (!containerId) return [];
  
  // In production: docker logs --tail {lines} {containerId}
  // For now, return empty - admin can check manually
  return [];
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

/**
 * Sanitize logs to remove sensitive data
 */
export function sanitizeLogs(logs: string[]): string[] {
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/g,           // OpenAI keys
    /ANTHROPIC_API_KEY=[^\s]+/g,       // Anthropic keys
    /Bearer [a-zA-Z0-9._-]+/g,         // Bearer tokens
    /password[=:]\s*[^\s]+/gi,         // Passwords
    /api[_-]?key[=:]\s*[^\s]+/gi,      // Generic API keys
  ];

  return logs.map(line => {
    let sanitized = line;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[YOUR_SECRET]');
    }
    return sanitized;
  });
}
