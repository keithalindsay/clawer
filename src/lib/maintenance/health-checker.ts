/**
 * Health checker for user containers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ContainerInfo, HealthCheckResult, ContainerState } from './types';
import { MaintenanceLogger } from './logger';

const execAsync = promisify(exec);

export class HealthChecker {
  private logger: MaintenanceLogger;
  private apiTimeoutMs: number;

  constructor(logger: MaintenanceLogger, apiTimeoutMs: number = 5000) {
    this.logger = logger;
    this.apiTimeoutMs = apiTimeoutMs;
  }

  /**
   * Execute a Docker command
   */
  private async dockerExec(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execAsync(`docker ${command}`);
    } catch (error: any) {
      throw new Error(`Docker command failed: ${error.message}`);
    }
  }

  /**
   * Get all managed containers (clawer_user_* containers)
   */
  async getAllContainers(): Promise<ContainerInfo[]> {
    try {
      const { stdout } = await this.dockerExec(
        'ps -a --filter name=clawer_user_ --format "{{.ID}}|{{.Names}}|{{.State}}"'
      );

      const lines = stdout.trim().split('\n').filter(Boolean);
      const containers: ContainerInfo[] = [];

      for (const line of lines) {
        const [containerId, containerName, state] = line.split('|');
        
        // Extract userId from container name (clawer_user_<userId>)
        const userId = containerName?.replace('clawer_user_', '') || '';
        
        // Get port from container
        const portInfo = await this.getContainerPort(containerId);
        
        containers.push({
          containerId,
          containerName,
          userId,
          port: portInfo,
          state,
        });
      }

      return containers;
    } catch (error) {
      await this.logger.error('Failed to list containers', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

  /**
   * Get the exposed port for a container
   */
  private async getContainerPort(containerId: string): Promise<number> {
    try {
      const { stdout } = await this.dockerExec(
        `port ${containerId} 8080`
      );
      
      // Output format: "0.0.0.0:4001"
      const match = stdout.match(/:(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if container is running
   */
  private async isContainerRunning(containerId: string): Promise<boolean> {
    try {
      const { stdout } = await this.dockerExec(
        `inspect --format='{{.State.Running}}' ${containerId}`
      );
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Get container memory and CPU usage
   */
  private async getContainerStats(containerId: string): Promise<{ memoryPercent: number; cpuPercent: number } | null> {
    try {
      const { stdout } = await this.dockerExec(
        `stats --no-stream --format "{{.MemPerc}}|{{.CPUPerc}}" ${containerId}`
      );
      
      const [memStr, cpuStr] = stdout.trim().split('|');
      
      return {
        memoryPercent: parseFloat(memStr.replace('%', '')),
        cpuPercent: parseFloat(cpuStr.replace('%', '')),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if API is responsive
   */
  private async checkApiHealth(port: number): Promise<boolean> {
    if (!port || port === 0) return false;

    const apiPort = port + 1; // API runs on gateway port + 1
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.apiTimeoutMs);

      const response = await fetch(`http://localhost:${apiPort}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if .next build exists in container
   */
  private async hasNextBuild(containerId: string): Promise<boolean> {
    try {
      const { stdout } = await this.dockerExec(
        `exec ${containerId} test -d /app/.next && echo "exists"`
      );
      return stdout.trim() === 'exists';
    } catch {
      return false;
    }
  }

  /**
   * Perform health check on a single container
   */
  async checkContainerHealth(container: ContainerInfo): Promise<HealthCheckResult> {
    const issues: string[] = [];
    
    // Check 1: Container running
    const containerRunning = await this.isContainerRunning(container.containerId);
    if (!containerRunning) {
      issues.push('Container not running');
    }

    // Check 2: API responsive
    const apiResponsive = containerRunning ? await this.checkApiHealth(container.port) : false;
    if (containerRunning && !apiResponsive) {
      issues.push('API unresponsive');
    }

    // Check 3: Resource usage (only if running)
    let memoryUsage: number | undefined;
    let cpuUsage: number | undefined;
    
    if (containerRunning) {
      const stats = await this.getContainerStats(container.containerId);
      if (stats) {
        memoryUsage = stats.memoryPercent;
        cpuUsage = stats.cpuPercent;
        
        if (memoryUsage > 90) {
          issues.push(`High memory usage: ${memoryUsage.toFixed(1)}%`);
        }
        if (cpuUsage > 90) {
          issues.push(`High CPU usage: ${cpuUsage.toFixed(1)}%`);
        }
      }
    }

    // Check 4: .next build exists
    if (containerRunning) {
      const hasNext = await this.hasNextBuild(container.containerId);
      if (!hasNext) {
        issues.push('Missing .next build');
      }
    }

    // Determine overall state
    const state = this.determineState(containerRunning, apiResponsive, issues);

    return {
      containerId: container.containerId,
      containerName: container.containerName,
      state,
      checks: {
        containerRunning,
        apiResponsive,
        memoryUsage,
        cpuUsage,
      },
      issues,
      timestamp: new Date(),
    };
  }

  /**
   * Determine container state based on checks
   */
  private determineState(
    containerRunning: boolean,
    apiResponsive: boolean,
    issues: string[]
  ): ContainerState {
    if (!containerRunning) {
      return 'DEAD';
    }
    
    if (!apiResponsive) {
      return 'UNHEALTHY';
    }

    const criticalIssues = issues.filter(i => 
      i.includes('High memory') || i.includes('High CPU')
    );

    if (criticalIssues.length > 0) {
      return 'DEGRADED';
    }

    if (issues.length > 0) {
      return 'DEGRADED';
    }

    return 'HEALTHY';
  }

  /**
   * Health check all containers
   */
  async checkAllContainers(): Promise<HealthCheckResult[]> {
    const containers = await this.getAllContainers();
    const results: HealthCheckResult[] = [];

    for (const container of containers) {
      try {
        const result = await this.checkContainerHealth(container);
        results.push(result);

        // Log if unhealthy
        if (result.state !== 'HEALTHY') {
          await this.logger.warn(
            `Container unhealthy: ${result.state}`,
            { issues: result.issues, checks: result.checks },
            container.containerId
          );
        }
      } catch (error) {
        await this.logger.error(
          'Health check failed',
          { error: error instanceof Error ? error.message : error },
          container.containerId
        );
      }
    }

    return results;
  }
}
