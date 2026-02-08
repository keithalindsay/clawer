/**
 * API key and configuration validator
 */

import { MaintenanceLogger } from './logger';

export class Validator {
  private logger: MaintenanceLogger;
  private moonshotApiKey: string | null;

  constructor(logger: MaintenanceLogger, moonshotApiKey: string | null) {
    this.logger = logger;
    this.moonshotApiKey = moonshotApiKey;
  }

  /**
   * Validate Moonshot API key
   */
  async validateMoonshotApiKey(): Promise<boolean> {
    if (!this.moonshotApiKey) {
      await this.logger.error('Moonshot API key not configured');
      return false;
    }

    try {
      await this.logger.info('Validating Moonshot API key');

      // Test the API with a simple request
      const response = await fetch('https://api.moonshot.cn/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.moonshotApiKey}`,
        },
      });

      if (response.ok) {
        await this.logger.info('Moonshot API key validation successful');
        return true;
      } else {
        await this.logger.error('Moonshot API key validation failed', {
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }
    } catch (error) {
      await this.logger.error('Moonshot API key validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Validate all required environment variables
   */
  async validateEnvironment(): Promise<boolean> {
    await this.logger.info('Validating environment configuration');

    // Check API key but don't block on it
    if (!this.moonshotApiKey) {
      await this.logger.warn('MOONSHOT_API_KEY not set - new containers may fail to provision');
    } else {
      await this.logger.info('Environment configuration valid');
    }

    // Always return true - we can still monitor existing containers even without API key
    return true;
  }
}
