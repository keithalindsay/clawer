/**
 * Type definitions for maintenance agent
 */

export type ContainerState = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'DEAD' | 'UNKNOWN';

export type FixLevel = 1 | 2 | 3 | 4;

export interface ContainerInfo {
  containerId: string;
  containerName: string;
  userId: string;
  port: number;
  state: string; // Docker state: running, exited, etc.
}

export interface HealthCheckResult {
  containerId: string;
  containerName: string;
  state: ContainerState;
  checks: {
    containerRunning: boolean;
    apiResponsive: boolean;
    memoryUsage?: number; // percentage
    cpuUsage?: number; // percentage
  };
  issues: string[];
  timestamp: Date;
}

export interface FixAttempt {
  containerId: string;
  level: FixLevel;
  action: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  durationMs?: number;
}

export interface MaintenanceConfig {
  healthCheckIntervalMs: number;
  maxRestartAttempts: number;
  apiTimeoutMs: number;
  moonshotApiKey: string | null;
  logPath: string;
}
