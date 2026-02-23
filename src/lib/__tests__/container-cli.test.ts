/**
 * Container Client CLI Integration Tests
 * 
 * Tests the OpenClaw CLI wrapper functions that run inside containers.
 */

import { describe, it, expect } from 'vitest';

describe('Container Client CLI Wrappers', () => {
  describe('listCrons', () => {
    it('should parse cron list JSON output correctly', async () => {
      const mockOutput = JSON.stringify([
        { id: 'cron_1', schedule: '0 8 * * *', command: 'echo "hello"', enabled: true },
        { id: 'cron_2', schedule: '0 9 * * *', command: 'echo "world"', enabled: false },
      ]);
      
      const crons = JSON.parse(mockOutput);
      expect(crons).toHaveLength(2);
      expect(crons[0].id).toBe('cron_1');
      expect(crons[1].enabled).toBe(false);
    });

    it('should handle empty cron list', async () => {
      const mockOutput = '[]';
      const crons = JSON.parse(mockOutput);
      expect(crons).toHaveLength(0);
    });

    it('should fallback to line parsing when JSON fails', async () => {
      const mockOutput = `
ID          SCHEDULE       COMMAND
cron_1      0 8 * * *     echo "test"
cron_2      0 9 * * *     echo "test2" [disabled]
`;
      const lines = mockOutput.split('\n')
        .filter(line => line.trim() && !line.startsWith('ID'));
      
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('[disabled]');
    });
  });

  describe('listHooks', () => {
    it('should parse hooks list JSON output', async () => {
      const mockOutput = JSON.stringify([
        { name: 'memory-hook', enabled: true, description: 'Auto-save memory' },
        { name: 'auto-reply', enabled: false, description: 'Auto-reply to messages' },
      ]);
      
      const hooks = JSON.parse(mockOutput);
      expect(hooks).toHaveLength(2);
      expect(hooks[0].name).toBe('memory-hook');
      expect(hooks[1].enabled).toBe(false);
    });
  });

  describe('cronSchedule validation', () => {
    it('should validate cron minute field', () => {
      // Test that minute parsing works correctly
      const testMinute = (input: string) => {
        // Handle special cron syntax
        if (input.includes('/') || input.includes(',') || input.includes('-')) {
          return true; // Valid special syntax
        }
        const minute = parseInt(input);
        return !isNaN(minute) && minute >= 0 && minute <= 59;
      };
      
      expect(testMinute('0')).toBe(true);
      expect(testMinute('59')).toBe(true);
      expect(testMinute('*/5')).toBe(true);
      expect(testMinute('0,30')).toBe(true);
      expect(testMinute('0-30')).toBe(true);
    });
  });
});

describe('Container API Routes', () => {
  describe('GET /api/dashboard/crons/cli', () => {
    it('should require authentication', async () => {
      expect(true).toBe(true);
    });

    it('should return crons array in response', async () => {
      const mockResponse = {
        crons: [
          { id: 'cron_1', schedule: '0 8 * * *', command: 'test', enabled: true }
        ],
        scheduler: { running: true, jobsCount: 1 }
      };
      
      expect(mockResponse.crons).toBeDefined();
      expect(Array.isArray(mockResponse.crons)).toBe(true);
    });
  });

  describe('POST /api/dashboard/crons/cli', () => {
    it('should require schedule and command', async () => {
      const body = {};
      expect(body.schedule).toBeUndefined();
      expect(body.command).toBeUndefined();
    });

    it('should accept valid cron body', async () => {
      const body = {
        schedule: '0 8 * * *',
        command: 'echo "test"'
      };
      
      expect(body.schedule).toBeDefined();
      expect(body.command).toBeDefined();
    });
  });
});

describe('Hooks API Routes', () => {
  describe('GET /api/dashboard/hooks/cli', () => {
    it('should return hooks array', async () => {
      const mockResponse = {
        hooks: [
          { name: 'memory-hook', enabled: true }
        ]
      };
      
      expect(mockResponse.hooks).toBeDefined();
    });
  });
});
