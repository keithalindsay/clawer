import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolSandbox } from '../tool-sandbox';
import { ToolExecutionContext } from '../types';

describe('ToolSandbox', () => {
  let sandbox: ToolSandbox;
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    sandbox = new ToolSandbox();
    mockContext = {
      userId: 'test-user-123',
      botId: 'bot-assistant',
      tier: 'free',
      integrations: new Map([
        ['gmail', 'gmail-integration-123'],
        ['calendar', 'calendar-integration-456'],
      ]),
    };
  });

  describe('Argument Validation', () => {
    it('should validate required arguments', async () => {
      // Missing required 'query' argument
      const result = await sandbox.execute(
        'gmail_search',
        {},
        mockContext,
        ['gmail_search']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: query');
    });

    it('should accept valid arguments', async () => {
      const result = await sandbox.execute(
        'gmail_search',
        { query: 'meeting' },
        mockContext,
        ['gmail_search']
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate argument types', async () => {
      // maxResults should be number, not string
      const result = await sandbox.execute(
        'gmail_search',
        { query: 'test', maxResults: 'invalid' },
        mockContext,
        ['gmail_search']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a number');
    });
  });

  describe('Tool Registry', () => {
    it('should reject unknown tools', async () => {
      const result = await sandbox.execute(
        'nonexistent_tool',
        {},
        mockContext,
        ['nonexistent_tool']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool: nonexistent_tool');
    });

    it('should list available tools', () => {
      const tools = sandbox.getAvailableTools();

      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some(t => t.name === 'gmail_search')).toBe(true);
      expect(tools.some(t => t.name === 'calendar_list')).toBe(true);
    });

    it('should get tool by name', () => {
      const tool = sandbox.getTool('gmail_send');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('gmail_send');
      expect(tool?.inputSchema.required).toContain('to');
      expect(tool?.inputSchema.required).toContain('subject');
      expect(tool?.inputSchema.required).toContain('body');
    });
  });

  describe('Tool Permissions', () => {
    it('should reject disallowed tools', async () => {
      const result = await sandbox.execute(
        'gmail_send',
        { to: 'test@example.com', subject: 'Test', body: 'Body' },
        mockContext,
        ['gmail_search'] // Only gmail_search allowed
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not allowed: gmail_send');
    });

    it('should allow tools in allowlist', async () => {
      const result = await sandbox.execute(
        'calendar_list',
        {},
        mockContext,
        ['calendar_list', 'calendar_create']
      );

      expect(result.success).toBe(true);
    });

    it('should allow all tools when allowlist is empty', async () => {
      const result = await sandbox.execute(
        'gmail_read',
        { messageId: 'msg_123' },
        mockContext,
        [] // Empty allowlist = all tools allowed
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after 30 seconds', async () => {
      // Mock a slow tool execution
      const slowSandbox = new ToolSandbox();
      
      // Override the executeTool method to simulate slow execution
      const originalExecute = (slowSandbox as any).executeTool;
      (slowSandbox as any).executeTool = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 31000)); // 31 seconds
        return { result: 'This should never return' };
      });

      const result = await slowSandbox.execute(
        'gmail_search',
        { query: 'test' },
        mockContext,
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }, 35000); // Set test timeout higher than tool timeout
  });

  describe('Error Handling', () => {
    it('should handle tool errors gracefully', async () => {
      const errorSandbox = new ToolSandbox();
      
      // Mock executeTool to throw error
      (errorSandbox as any).executeTool = vi.fn().mockRejectedValue(
        new Error('Simulated tool error')
      );

      const result = await errorSandbox.execute(
        'gmail_search',
        { query: 'test' },
        mockContext,
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Simulated tool error');
    });

    it('should handle non-Error exceptions', async () => {
      const errorSandbox = new ToolSandbox();
      
      (errorSandbox as any).executeTool = vi.fn().mockRejectedValue('String error');

      const result = await errorSandbox.execute(
        'gmail_search',
        { query: 'test' },
        mockContext,
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Tool Execution', () => {
    it('should execute gmail_search with mock data', async () => {
      const result = await sandbox.execute(
        'gmail_search',
        { query: 'meeting', maxResults: 5 },
        mockContext,
        []
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('messages');
      expect(result.data).toHaveProperty('count');
      expect((result.data as any).messages).toBeInstanceOf(Array);
    });

    it('should execute gmail_read with message ID', async () => {
      const result = await sandbox.execute(
        'gmail_read',
        { messageId: 'msg_001' },
        mockContext,
        []
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('subject');
      expect(result.data).toHaveProperty('body');
    });

    it('should execute calendar_list', async () => {
      const result = await sandbox.execute(
        'calendar_list',
        {
          timeMin: new Date().toISOString(),
          timeMax: new Date(Date.now() + 86400000).toISOString(),
        },
        mockContext,
        []
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('events');
      expect((result.data as any).events).toBeInstanceOf(Array);
    });
  });
});
