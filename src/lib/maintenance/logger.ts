/**
 * Maintenance agent logger
 */

import { appendFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  containerId?: string;
  details?: any;
}

export class MaintenanceLogger {
  private logPath: string;

  constructor(logPath: string) {
    this.logPath = logPath;
    
    // Ensure log directory exists
    const dir = dirname(logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  async log(level: LogEntry['level'], event: string, details?: any, containerId?: string): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      containerId,
      details,
    };

    const logLine = JSON.stringify(entry) + '\n';
    
    // Write to file
    try {
      await appendFile(this.logPath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }

    // Also log to console
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    const message = containerId ? `${event} (container: ${containerId})` : event;
    
    if (level === 'error') {
      console.error(prefix, message, details || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, details || '');
    } else {
      console.log(prefix, message, details || '');
    }
  }

  async info(event: string, details?: any, containerId?: string): Promise<void> {
    await this.log('info', event, details, containerId);
  }

  async warn(event: string, details?: any, containerId?: string): Promise<void> {
    await this.log('warn', event, details, containerId);
  }

  async error(event: string, details?: any, containerId?: string): Promise<void> {
    await this.log('error', event, details, containerId);
  }
}
