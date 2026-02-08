/**
 * Diagnostic Types
 */

export interface DiagnosticContext {
  // Container State
  containerStatus: 'running' | 'stopped' | 'restarting' | 'error' | 'not_found';
  containerId: string | null;
  containerUptime: string | null;
  restartCount: number;
  
  // Health Metrics
  healthEndpoint: {
    status: number;
    latencyMs: number;
    body: any;
  } | null;
  
  // Resource Usage
  memoryUsage: { used: number; limit: number } | null;
  cpuPercent: number | null;
  
  // Recent Logs (last 100 lines, sanitized)
  logs: string[];
  
  // Error Patterns
  recentErrors: {
    timestamp: string;
    message: string;
    count: number;
  }[];
  
  // Config Validation
  configValid: boolean;
  configErrors: string[];
  
  // API Key Status (no actual key values!)
  apiKeyConfigured: boolean;
  apiKeyError: string | null;
  
  // User Context
  lastSuccessfulChat: string | null;
  failedChatCount: number;
  userReportedIssue: string | null;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  cause: string;
  autoFixable: boolean;
  autoFixAction: 'restart_container' | 'clear_cache' | 'restart_gateway' | 'rebuild_config' | null;
  manualSteps: string[];
  confidence: number;
}

export interface DiagnosticResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  issues: DiagnosticIssue[];
  containerHealth: {
    status: string;
    uptime: string | null;
    lastHealthCheck: string;
    apiResponsive: boolean;
    memoryUsage: string | null;
    cpuUsage: string | null;
  };
  recommendation: string;
  diagnosisId: string;
  timestamp: string;
}

export interface IssuePattern {
  id: string;
  logPatterns: RegExp[];
  severity: 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  cause: string;
  autoFixable: boolean;
  autoFixAction?: 'restart_container' | 'clear_cache' | 'restart_gateway' | 'rebuild_config';
  manualSteps: string[];
}
