/**
 * Clawer Container Maintenance Agent (CCMA)
 * Main service coordinator
 */

import { resolve } from 'path';
import type { MaintenanceConfig } from './types';
import { MaintenanceLogger } from './logger';
import { HealthChecker } from './health-checker';
import { Remediator } from './remediation';
import { Validator } from './validator';

export class MaintenanceAgent {
  private config: MaintenanceConfig;
  private logger: MaintenanceLogger;
  private healthChecker: HealthChecker;
  private remediator: Remediator;
  private validator: Validator;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<MaintenanceConfig>) {
    // Default configuration
    this.config = {
      healthCheckIntervalMs: config?.healthCheckIntervalMs ?? 5 * 60 * 1000, // 5 minutes
      maxRestartAttempts: config?.maxRestartAttempts ?? 3,
      apiTimeoutMs: config?.apiTimeoutMs ?? 5000,
      moonshotApiKey: config?.moonshotApiKey ?? process.env.MOONSHOT_API_KEY ?? null,
      logPath: config?.logPath ?? resolve(process.cwd(), 'logs/maintenance.log'),
    };

    // Initialize components
    this.logger = new MaintenanceLogger(this.config.logPath);
    this.healthChecker = new HealthChecker(this.logger, this.config.apiTimeoutMs);
    this.remediator = new Remediator(this.logger, this.config.maxRestartAttempts);
    this.validator = new Validator(this.logger, this.config.moonshotApiKey);
  }

  /**
   * Initialize the agent - validate configuration
   */
  async initialize(): Promise<boolean> {
    await this.logger.info('=== Maintenance Agent Initializing ===');
    await this.logger.info('Configuration', {
      healthCheckIntervalMs: this.config.healthCheckIntervalMs,
      maxRestartAttempts: this.config.maxRestartAttempts,
      apiTimeoutMs: this.config.apiTimeoutMs,
      logPath: this.config.logPath,
    });

    // Validate environment
    const envValid = await this.validator.validateEnvironment();
    if (!envValid) {
      await this.logger.error('Environment validation failed - agent cannot start');
      return false;
    }

    // Validate Moonshot API key
    const apiKeyValid = await this.validator.validateMoonshotApiKey();
    if (!apiKeyValid) {
      await this.logger.warn('Moonshot API key validation failed - containers may not function properly');
      // Continue anyway - this is a warning, not a blocker
    }

    await this.logger.info('Maintenance Agent initialized successfully');
    return true;
  }

  /**
   * Run a single maintenance check cycle
   */
  async runCheck(): Promise<void> {
    const startTime = Date.now();
    await this.logger.info('=== Starting maintenance check ===');

    try {
      // 1. Health check all containers
      const healthResults = await this.healthChecker.checkAllContainers();
      
      await this.logger.info('Health check complete', {
        totalContainers: healthResults.length,
        healthy: healthResults.filter(r => r.state === 'HEALTHY').length,
        degraded: healthResults.filter(r => r.state === 'DEGRADED').length,
        unhealthy: healthResults.filter(r => r.state === 'UNHEALTHY').length,
        dead: healthResults.filter(r => r.state === 'DEAD').length,
      });

      // 2. Remediate unhealthy containers
      const remediationAttempts = [];
      
      for (const result of healthResults) {
        if (result.state !== 'HEALTHY') {
          const attempt = await this.remediator.remediate(result);
          if (attempt) {
            remediationAttempts.push(attempt);
          }
        }
      }

      // 3. Log remediation results
      if (remediationAttempts.length > 0) {
        await this.logger.info('Remediation attempts completed', {
          totalAttempts: remediationAttempts.length,
          successful: remediationAttempts.filter(a => a.success).length,
          failed: remediationAttempts.filter(a => !a.success).length,
        });
      }

      // 4. Get overall stats
      const stats = this.remediator.getStats();
      await this.logger.info('Maintenance check complete', {
        durationMs: Date.now() - startTime,
        stats,
      });

    } catch (error) {
      await this.logger.error('Maintenance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
    }
  }

  /**
   * Start the maintenance agent (continuous monitoring)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      await this.logger.warn('Maintenance agent already running');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize maintenance agent');
    }

    this.isRunning = true;
    await this.logger.info('Maintenance agent started', {
      intervalMinutes: this.config.healthCheckIntervalMs / 60000,
    });

    // Run first check immediately
    await this.runCheck();

    // Schedule recurring checks
    this.checkInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.runCheck();
      }
    }, this.config.healthCheckIntervalMs);

    await this.logger.info('Scheduled monitoring active');
  }

  /**
   * Stop the maintenance agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.logger.info('Stopping maintenance agent');

    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    await this.logger.info('Maintenance agent stopped');
  }

  /**
   * Get agent status
   */
  getStatus(): {
    isRunning: boolean;
    config: MaintenanceConfig;
    stats: ReturnType<Remediator['getStats']>;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.remediator.getStats(),
    };
  }
}

// Export types and components
export * from './types';
export { MaintenanceLogger } from './logger';
export { HealthChecker } from './health-checker';
export { Remediator } from './remediation';
export { Validator } from './validator';
