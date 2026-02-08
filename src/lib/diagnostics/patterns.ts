/**
 * Known Issue Patterns
 * 
 * Pattern matching for common container/API issues
 */

import { IssuePattern } from './types';

export const ISSUE_PATTERNS: IssuePattern[] = [
  {
    id: 'rate_limit',
    logPatterns: [/429/, /rate.?limit/i, /too many requests/i],
    severity: 'warning',
    title: 'Rate Limited',
    description: 'The AI provider is temporarily limiting requests.',
    cause: 'Too many requests sent in a short period.',
    autoFixable: false,
    manualSteps: [
      'Wait 2-3 minutes before retrying',
      'Try sending shorter messages',
    ],
  },
  
  {
    id: 'api_key_invalid',
    logPatterns: [/401/, /invalid.*key/i, /authentication.*failed/i, /unauthorized/i],
    severity: 'critical',
    title: 'API Key Invalid',
    description: 'The AI provider rejected the API key.',
    cause: 'API key is missing, expired, or incorrect.',
    autoFixable: false,
    manualSteps: [
      'Check your API key in admin settings',
      'Verify billing is active on your AI provider account',
      'Generate a new API key if needed',
    ],
  },
  
  {
    id: 'model_overloaded',
    logPatterns: [/503/, /overloaded/i, /capacity/i, /server.*busy/i],
    severity: 'warning',
    title: 'Model Overloaded',
    description: 'The AI provider is experiencing high demand.',
    cause: 'Server capacity temporarily exceeded.',
    autoFixable: false,
    manualSteps: [
      'Wait 1-2 minutes and try again',
      'Consider using a different model',
    ],
  },
  
  {
    id: 'model_not_found',
    logPatterns: [/model.*not.*found/i, /invalid.*model/i, /unknown.*model/i],
    severity: 'error',
    title: 'Model Not Found',
    description: 'The selected AI model is not available.',
    cause: 'Model ID is incorrect or not accessible with your API key.',
    autoFixable: false,
    manualSteps: [
      'Check model name in admin settings',
      'Verify model access on your AI provider account',
    ],
  },
  
  {
    id: 'config_invalid',
    logPatterns: [/config.*invalid/i, /validation.*failed/i, /schema.*error/i],
    severity: 'error',
    title: 'Configuration Error',
    description: 'Container configuration is invalid.',
    cause: 'Configuration file has syntax or validation errors.',
    autoFixable: true,
    autoFixAction: 'rebuild_config',
    manualSteps: [
      'Click "Fix" to rebuild configuration',
      'If issue persists, contact support',
    ],
  },
  
  {
    id: 'memory_exhausted',
    logPatterns: [/out of memory/i, /OOM/i, /killed/i, /memory.*limit/i],
    severity: 'critical',
    title: 'Memory Exhausted',
    description: 'Container ran out of memory.',
    cause: 'Memory usage exceeded container limit.',
    autoFixable: true,
    autoFixAction: 'restart_container',
    manualSteps: [
      'Click "Fix" to restart container',
      'If recurring, contact support for memory limit increase',
    ],
  },
  
  {
    id: 'gateway_disconnected',
    logPatterns: [/gateway.*disconnect/i, /websocket.*error/i, /connection.*lost/i],
    severity: 'error',
    title: 'Gateway Disconnected',
    description: 'Lost connection to the AI gateway.',
    cause: 'WebSocket connection dropped.',
    autoFixable: true,
    autoFixAction: 'restart_gateway',
    manualSteps: [
      'Click "Fix" to reconnect',
      'Check your internet connection',
    ],
  },
  
  {
    id: 'container_crash',
    logPatterns: [/crash/i, /fatal/i, /exited.*error/i, /segfault/i],
    severity: 'critical',
    title: 'Container Crashed',
    description: 'The container process crashed.',
    cause: 'Unexpected error caused process termination.',
    autoFixable: true,
    autoFixAction: 'restart_container',
    manualSteps: [
      'Click "Fix" to restart',
      'If recurring, contact support',
    ],
  },
  
  {
    id: 'timeout',
    logPatterns: [/timeout/i, /timed.*out/i, /deadline.*exceeded/i],
    severity: 'warning',
    title: 'Request Timeout',
    description: 'Request took too long to complete.',
    cause: 'AI provider or network response was slow.',
    autoFixable: false,
    manualSteps: [
      'Try again with a shorter message',
      'Check your internet connection',
    ],
  },
  
  {
    id: 'network_error',
    logPatterns: [/ECONNREFUSED/i, /ENOTFOUND/i, /network.*error/i, /DNS.*failed/i],
    severity: 'error',
    title: 'Network Error',
    description: 'Cannot reach the AI provider.',
    cause: 'Network connectivity issue.',
    autoFixable: false,
    manualSteps: [
      'Check your internet connection',
      'Try again in a few minutes',
    ],
  },
];

/**
 * Match logs against known patterns
 */
export function matchPatterns(logs: string[]): IssuePattern[] {
  const matches: IssuePattern[] = [];
  const logText = logs.join('\n');
  
  for (const pattern of ISSUE_PATTERNS) {
    for (const regex of pattern.logPatterns) {
      if (regex.test(logText)) {
        matches.push(pattern);
        break; // Don't match same pattern multiple times
      }
    }
  }
  
  return matches;
}

/**
 * Get highest severity from issues
 */
export function getHighestSeverity(patterns: IssuePattern[]): 'warning' | 'error' | 'critical' | 'healthy' {
  if (patterns.some(p => p.severity === 'critical')) return 'critical';
  if (patterns.some(p => p.severity === 'error')) return 'error';
  if (patterns.some(p => p.severity === 'warning')) return 'warning';
  return 'healthy';
}
