/**
 * Diagnostic Analyzer
 * 
 * Analyzes collected data and generates diagnosis result
 */

import { DiagnosticContext, DiagnosticResult, DiagnosticIssue } from './types';
import { matchPatterns, getHighestSeverity, ISSUE_PATTERNS } from './patterns';

// Simple ID generator (no uuid dependency)
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Analyze diagnostic context and generate result
 */
export function analyze(context: DiagnosticContext): DiagnosticResult {
  const issues: DiagnosticIssue[] = [];
  
  // Check container status
  if (context.containerStatus === 'not_found') {
    issues.push({
      id: 'container_not_found',
      severity: 'critical',
      title: 'Container Not Found',
      description: 'Your AI assistant container has not been created.',
      cause: 'Container provisioning may have failed or not started.',
      autoFixable: false,
      autoFixAction: null,
      manualSteps: [
        'Try logging out and back in',
        'Contact support if issue persists',
      ],
      confidence: 1.0,
    });
  } else if (context.containerStatus === 'stopped') {
    issues.push({
      id: 'container_stopped',
      severity: 'critical',
      title: 'Container Stopped',
      description: 'Your AI assistant is not running.',
      cause: 'Container was stopped or crashed.',
      autoFixable: true,
      autoFixAction: 'restart_container',
      manualSteps: ['Click "Fix" to restart your assistant'],
      confidence: 1.0,
    });
  } else if (context.containerStatus === 'restarting') {
    issues.push({
      id: 'container_restarting',
      severity: 'warning',
      title: 'Container Restarting',
      description: 'Your AI assistant is currently restarting.',
      cause: 'Restart in progress.',
      autoFixable: false,
      autoFixAction: null,
      manualSteps: ['Wait 30 seconds and try again'],
      confidence: 1.0,
    });
  } else if (context.containerStatus === 'error') {
    issues.push({
      id: 'container_error',
      severity: 'error',
      title: 'Container Error',
      description: 'Your AI assistant is experiencing an error.',
      cause: 'Container health check failed.',
      autoFixable: true,
      autoFixAction: 'restart_container',
      manualSteps: ['Click "Fix" to restart your assistant'],
      confidence: 0.9,
    });
  }

  // Check health endpoint response
  if (context.healthEndpoint) {
    if (context.healthEndpoint.status >= 500) {
      issues.push({
        id: 'health_server_error',
        severity: 'error',
        title: 'Server Error',
        description: 'The AI assistant is returning server errors.',
        cause: 'Internal server error in container.',
        autoFixable: true,
        autoFixAction: 'restart_container',
        manualSteps: ['Click "Fix" to restart'],
        confidence: 0.85,
      });
    } else if (context.healthEndpoint.latencyMs > 5000) {
      issues.push({
        id: 'slow_response',
        severity: 'warning',
        title: 'Slow Response',
        description: 'Your AI assistant is responding slowly.',
        cause: 'High latency detected in health check.',
        autoFixable: false,
        autoFixAction: null,
        manualSteps: [
          'Check your internet connection',
          'Try again in a few minutes',
        ],
        confidence: 0.7,
      });
    }
  }

  // Check config errors
  if (context.configErrors.length > 0) {
    issues.push({
      id: 'config_errors',
      severity: 'error',
      title: 'Configuration Issues',
      description: `Found ${context.configErrors.length} configuration problem(s).`,
      cause: context.configErrors.join('; '),
      autoFixable: true,
      autoFixAction: 'rebuild_config',
      manualSteps: ['Click "Fix" to rebuild configuration'],
      confidence: 0.9,
    });
  }

  // Check API key
  if (!context.apiKeyConfigured) {
    issues.push({
      id: 'api_key_missing',
      severity: 'critical',
      title: 'API Key Missing',
      description: 'No AI provider API key is configured.',
      cause: 'API key not set in admin settings.',
      autoFixable: false,
      autoFixAction: null,
      manualSteps: [
        'Go to Admin Settings',
        'Add your AI provider API key',
      ],
      confidence: 1.0,
    });
  } else if (context.apiKeyError) {
    issues.push({
      id: 'api_key_error',
      severity: 'critical',
      title: 'API Key Error',
      description: 'There is an issue with your API key.',
      cause: context.apiKeyError,
      autoFixable: false,
      autoFixAction: null,
      manualSteps: [
        'Check your API key in admin settings',
        'Verify billing on your AI provider account',
      ],
      confidence: 0.95,
    });
  }

  // Match log patterns
  const patternMatches = matchPatterns(context.logs);
  for (const pattern of patternMatches) {
    issues.push({
      id: pattern.id,
      severity: pattern.severity,
      title: pattern.title,
      description: pattern.description,
      cause: pattern.cause,
      autoFixable: pattern.autoFixable,
      autoFixAction: pattern.autoFixAction || null,
      manualSteps: pattern.manualSteps,
      confidence: 0.8,
    });
  }

  // Determine overall status
  let status: DiagnosticResult['status'] = 'healthy';
  if (issues.some(i => i.severity === 'critical')) {
    status = 'unhealthy';
  } else if (issues.some(i => i.severity === 'error')) {
    status = 'degraded';
  } else if (issues.some(i => i.severity === 'warning')) {
    status = 'degraded';
  }

  // Generate recommendation
  let recommendation = 'Your AI assistant is healthy and ready to use.';
  if (issues.length > 0) {
    const critical = issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      recommendation = critical[0].description + ' ' + critical[0].manualSteps[0];
    } else {
      recommendation = issues[0].description;
    }
  }

  return {
    status,
    issues,
    containerHealth: {
      status: context.containerStatus,
      uptime: context.containerUptime,
      lastHealthCheck: new Date().toISOString(),
      apiResponsive: context.healthEndpoint?.status === 200,
      memoryUsage: context.memoryUsage 
        ? `${Math.round(context.memoryUsage.used / 1024 / 1024)}MB / ${Math.round(context.memoryUsage.limit / 1024 / 1024)}MB`
        : null,
      cpuUsage: context.cpuPercent !== null ? `${context.cpuPercent}%` : null,
    },
    recommendation,
    diagnosisId: `diag_${generateId()}`,
    timestamp: new Date().toISOString(),
  };
}
