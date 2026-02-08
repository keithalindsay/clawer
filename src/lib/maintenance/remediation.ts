/**
 * Auto-remediation for unhealthy containers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { HealthCheckResult, FixAttempt, FixLevel } from './types';
import { MaintenanceLogger } from './logger';

const execAsync = promisify(exec);

export class Remediator {
  private logger: MaintenanceLogger;
  private maxRestartAttempts: number;
  private recentAttempts: Map<string, FixAttempt[]> = new Map();

  constructor(logger: MaintenanceLogger, maxRestartAttempts: number = 3) {
    this.logger = logger;
    this.maxRestartAttempts = maxRestartAttempts;
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
   * Get recent fix attempts for a container (last 30 minutes)
   */
  private getRecentAttempts(containerId: string): FixAttempt[] {
    const attempts = this.recentAttempts.get(containerId) || [];
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    
    // Filter to last 30 minutes
    const recent = attempts.filter(a => a.timestamp.getTime() > thirtyMinsAgo);
    
    // Update map
    this.recentAttempts.set(containerId, recent);
    
    return recent;
  }

  /**
   * Record a fix attempt
   */
  private recordAttempt(attempt: FixAttempt): void {
    const attempts = this.recentAttempts.get(attempt.containerId) || [];
    attempts.push(attempt);
    this.recentAttempts.set(attempt.containerId, attempts);
  }

  /**
   * Check if we've exceeded restart attempts
   */
  private hasExceededAttempts(containerId: string, level: FixLevel): boolean {
    const attempts = this.getRecentAttempts(containerId);
    const levelAttempts = attempts.filter(a => a.level === level);
    return levelAttempts.length >= this.maxRestartAttempts;
  }

  /**
   * Level 1: In-process fixes (no restart needed)
   */
  private async fixLevel1(containerId: string, containerName: string): Promise<FixAttempt> {
    const startTime = Date.now();
    const action = 'clear-cache';

    try {
      await this.logger.info('Attempting Level 1 fix: clear cache', { action }, containerId);
      
      // Clear PM2 logs
      await this.dockerExec(`exec ${containerId} pm2 flush`);
      
      // Give it a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      const attempt: FixAttempt = {
        containerId,
        level: 1,
        action,
        timestamp: new Date(),
        success: true,
        durationMs: Date.now() - startTime,
      };

      this.recordAttempt(attempt);
      await this.logger.info('Level 1 fix succeeded', { attempt }, containerId);
      
      return attempt;
    } catch (error) {
      const attempt: FixAttempt = {
        containerId,
        level: 1,
        action,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };

      this.recordAttempt(attempt);
      await this.logger.warn('Level 1 fix failed', { attempt }, containerId);
      
      return attempt;
    }
  }

  /**
   * Level 2: Process restart (brief interruption)
   */
  private async fixLevel2(containerId: string, containerName: string): Promise<FixAttempt> {
    const startTime = Date.now();
    const action = 'pm2-restart';

    try {
      await this.logger.info('Attempting Level 2 fix: PM2 restart', { action }, containerId);
      
      // Restart all PM2 processes
      await this.dockerExec(`exec ${containerId} pm2 restart all`);
      
      // Wait for processes to stabilize
      await new Promise(resolve => setTimeout(resolve, 10000));

      const attempt: FixAttempt = {
        containerId,
        level: 2,
        action,
        timestamp: new Date(),
        success: true,
        durationMs: Date.now() - startTime,
      };

      this.recordAttempt(attempt);
      await this.logger.info('Level 2 fix succeeded', { attempt }, containerId);
      
      return attempt;
    } catch (error) {
      const attempt: FixAttempt = {
        containerId,
        level: 2,
        action,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };

      this.recordAttempt(attempt);
      await this.logger.warn('Level 2 fix failed', { attempt }, containerId);
      
      return attempt;
    }
  }

  /**
   * Level 3: Container restart (30-60s downtime)
   */
  private async fixLevel3(containerId: string, containerName: string): Promise<FixAttempt> {
    const startTime = Date.now();
    const action = 'container-restart';

    try {
      await this.logger.info('Attempting Level 3 fix: container restart', { action }, containerId);
      
      // Graceful restart with 30s timeout
      await this.dockerExec(`restart -t 30 ${containerId}`);
      
      // Wait for container to be healthy
      await new Promise(resolve => setTimeout(resolve, 15000));

      const attempt: FixAttempt = {
        containerId,
        level: 3,
        action,
        timestamp: new Date(),
        success: true,
        durationMs: Date.now() - startTime,
      };

      this.recordAttempt(attempt);
      await this.logger.info('Level 3 fix succeeded', { attempt }, containerId);
      
      return attempt;
    } catch (error) {
      const attempt: FixAttempt = {
        containerId,
        level: 3,
        action,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };

      this.recordAttempt(attempt);
      await this.logger.error('Level 3 fix failed', { attempt }, containerId);
      
      return attempt;
    }
  }

  /**
   * Attempt to remediate an unhealthy container
   */
  async remediate(healthResult: HealthCheckResult): Promise<FixAttempt | null> {
    const { containerId, containerName, state, issues } = healthResult;

    // No action needed for healthy containers
    if (state === 'HEALTHY') {
      return null;
    }

    await this.logger.info(
      `Starting remediation for ${state} container`,
      { state, issues },
      containerId
    );

    // Level 3: Container is DEAD - restart immediately
    if (state === 'DEAD') {
      if (this.hasExceededAttempts(containerId, 3)) {
        await this.logger.error(
          'Container DEAD - exceeded restart attempts, manual intervention required',
          { attempts: this.getRecentAttempts(containerId) },
          containerId
        );
        return null;
      }
      
      return await this.fixLevel3(containerId, containerName);
    }

    // Level 2: Container is UNHEALTHY - try process restart first
    if (state === 'UNHEALTHY') {
      if (!this.hasExceededAttempts(containerId, 2)) {
        const result = await this.fixLevel2(containerId, containerName);
        if (result.success) {
          return result;
        }
      }
      
      // If Level 2 failed or exceeded, try Level 3
      if (!this.hasExceededAttempts(containerId, 3)) {
        return await this.fixLevel3(containerId, containerName);
      }
      
      await this.logger.error(
        'Container UNHEALTHY - all fix levels exhausted',
        { attempts: this.getRecentAttempts(containerId) },
        containerId
      );
      return null;
    }

    // Level 1: Container is DEGRADED - try light fixes
    if (state === 'DEGRADED') {
      if (!this.hasExceededAttempts(containerId, 1)) {
        return await this.fixLevel1(containerId, containerName);
      }
      
      await this.logger.warn(
        'Container DEGRADED - monitoring for escalation',
        { issues },
        containerId
      );
      return null;
    }

    return null;
  }

  /**
   * Get remediation statistics
   */
  getStats(): {
    totalAttempts: number;
    successRate: number;
    attemptsByLevel: Record<FixLevel, number>;
  } {
    const allAttempts: FixAttempt[] = [];
    for (const attempts of this.recentAttempts.values()) {
      allAttempts.push(...attempts);
    }

    const totalAttempts = allAttempts.length;
    const successCount = allAttempts.filter(a => a.success).length;
    const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

    const attemptsByLevel: Record<FixLevel, number> = {
      1: allAttempts.filter(a => a.level === 1).length,
      2: allAttempts.filter(a => a.level === 2).length,
      3: allAttempts.filter(a => a.level === 3).length,
      4: allAttempts.filter(a => a.level === 4).length,
    };

    return {
      totalAttempts,
      successRate,
      attemptsByLevel,
    };
  }
}
