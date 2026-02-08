/**
 * Tool Sandbox - Validates and executes tool calls safely
 */

import { ToolExecutionContext, ToolResult, ToolDefinition } from './types';
import { logBlocked } from './security';

/**
 * Tool execution timeout (ms)
 */
const TOOL_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Maximum tool calls per request
 */
const MAX_TOOL_CALLS_PER_REQUEST = 5;

/**
 * Available tools registry
 */
const TOOLS: Record<string, ToolDefinition> = {
  gmail_search: {
    name: 'gmail_search',
    description: 'Search emails in Gmail',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (Gmail search syntax)' },
        maxResults: { type: 'number', description: 'Maximum results to return' },
      },
      required: ['query'],
    },
  },
  
  gmail_read: {
    name: 'gmail_read',
    description: 'Read the content of a specific email',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'Gmail message ID' },
      },
      required: ['messageId'],
    },
  },
  
  gmail_send: {
    name: 'gmail_send',
    description: 'Send an email',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  
  calendar_list: {
    name: 'calendar_list',
    description: 'List upcoming calendar events',
    inputSchema: {
      type: 'object',
      properties: {
        timeMin: { type: 'string', description: 'Start time (ISO 8601)' },
        timeMax: { type: 'string', description: 'End time (ISO 8601)' },
      },
    },
  },
  
  calendar_create: {
    name: 'calendar_create',
    description: 'Create a new calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Event title' },
        start: { type: 'string', description: 'Start time (ISO 8601)' },
        end: { type: 'string', description: 'End time (ISO 8601)' },
      },
      required: ['summary', 'start', 'end'],
    },
  },
};

/**
 * Tool Sandbox - Validates and executes tools safely
 */
export class ToolSandbox {
  /**
   * Execute a tool with validation and timeout
   */
  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext,
    allowedTools: string[]
  ): Promise<ToolResult> {
    try {
      // 1. Check if tool exists
      const tool = TOOLS[toolName];
      if (!tool) {
        logBlocked(
          context.userId,
          context.botId,
          'Unknown tool requested',
          { toolName }
        );
        return { success: false, error: `Unknown tool: ${toolName}` };
      }

      // 2. Check if tool is allowed
      if (allowedTools.length > 0 && !allowedTools.includes(toolName)) {
        logBlocked(
          context.userId,
          context.botId,
          'Tool not allowed',
          { toolName, allowedTools }
        );
        return { success: false, error: `Tool not allowed: ${toolName}` };
      }

      // 3. Check if user has required OAuth connection
      const requiredIntegration = this.getRequiredIntegration(toolName);
      if (requiredIntegration && !context.integrations.has(requiredIntegration)) {
        logBlocked(
          context.userId,
          context.botId,
          'Missing OAuth connection',
          { toolName, requiredIntegration }
        );
        return {
          success: false,
          error: `Missing required ${requiredIntegration} connection. Please connect your account first.`,
        };
      }

      // 4. Validate arguments (basic validation)
      const validationError = this.validateArgs(tool, args);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 5. Validate output schema after execution
      const result = await this.executeWithTimeout(
        () => this.executeTool(toolName, args, context),
        TOOL_TIMEOUT_MS
      );
      
      // 6. Validate result matches expected schema
      const schemaError = this.validateResult(toolName, result);
      if (schemaError) {
        console.error(`[ToolSandbox] Schema validation failed for ${toolName}:`, schemaError);
        return {
          success: false,
          error: 'Tool returned unexpected data format',
        };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`[ToolSandbox] Error executing ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }

  /**
   * Validate tool arguments against schema
   */
  private validateArgs(tool: ToolDefinition, args: Record<string, unknown>): string | null {
    const { properties, required } = tool.inputSchema;

    // Check required fields
    if (required) {
      for (const field of required) {
        if (!(field in args)) {
          return `Missing required field: ${field}`;
        }
      }
    }

    // Basic type validation
    for (const [key, value] of Object.entries(args)) {
      const schema = properties[key];
      if (!schema) continue; // Allow extra fields

      if (schema.type === 'string' && typeof value !== 'string') {
        return `Field ${key} must be a string`;
      }
      if (schema.type === 'number' && typeof value !== 'number') {
        return `Field ${key} must be a number`;
      }
    }

    return null;
  }

  /**
   * Execute tool with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Execute the actual tool logic (stubbed for MVP)
   */
  private async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<unknown> {
    // Simulated execution - in production, this would call real APIs
    console.log(`[ToolSandbox] Executing ${toolName} with args:`, args);
    console.log(`[ToolSandbox] Context:`, {
      userId: context.userId,
      botId: context.botId,
      tier: context.tier,
    });

    // Mock responses for different tools
    switch (toolName) {
      case 'gmail_search':
        return {
          messages: [
            {
              id: 'msg_001',
              subject: 'Meeting Tomorrow',
              from: 'boss@example.com',
              snippet: 'Don\'t forget our meeting at 2pm...',
              date: new Date().toISOString(),
            },
            {
              id: 'msg_002',
              subject: 'Project Update',
              from: 'team@example.com',
              snippet: 'The latest progress report is attached...',
              date: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
          count: 2,
        };

      case 'gmail_read':
        return {
          id: args.messageId,
          subject: 'Meeting Tomorrow',
          from: 'boss@example.com',
          to: 'you@example.com',
          body: 'Hi,\n\nJust a reminder about our meeting tomorrow at 2pm.\n\nBest,\nBoss',
          date: new Date().toISOString(),
        };

      case 'gmail_send':
        return {
          id: 'msg_' + Date.now(),
          status: 'sent',
          to: args.to,
          subject: args.subject,
        };

      case 'calendar_list':
        return {
          events: [
            {
              id: 'evt_001',
              summary: 'Team Meeting',
              start: new Date(Date.now() + 3600000).toISOString(),
              end: new Date(Date.now() + 7200000).toISOString(),
              location: 'Conference Room A',
            },
            {
              id: 'evt_002',
              summary: 'Lunch with Client',
              start: new Date(Date.now() + 86400000).toISOString(),
              end: new Date(Date.now() + 90000000).toISOString(),
              location: 'Restaurant XYZ',
            },
          ],
        };

      case 'calendar_create':
        return {
          id: 'evt_' + Date.now(),
          status: 'confirmed',
          summary: args.summary,
          start: args.start,
          end: args.end,
          htmlLink: 'https://calendar.google.com/event?id=evt_' + Date.now(),
        };

      default:
        throw new Error(`No executor for tool: ${toolName}`);
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(): ToolDefinition[] {
    return Object.values(TOOLS);
  }

  /**
   * Get tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return TOOLS[name];
  }
  
  /**
   * Get required integration for a tool
   */
  private getRequiredIntegration(toolName: string): string | null {
    // Map tool names to required integrations
    if (toolName.startsWith('gmail_')) return 'google';
    if (toolName.startsWith('calendar_')) return 'google';
    if (toolName.startsWith('drive_')) return 'google';
    if (toolName.startsWith('sheets_')) return 'google';
    if (toolName.startsWith('docs_')) return 'google';
    
    // Add more integrations as needed
    return null;
  }
  
  /**
   * Validate tool result matches expected schema
   */
  private validateResult(toolName: string, result: unknown): string | null {
    // Basic type checking - in production, use a proper schema validator
    if (result === null || result === undefined) {
      return 'Tool returned null or undefined';
    }
    
    // Tool-specific validation
    switch (toolName) {
      case 'gmail_search':
        if (typeof result === 'object' && result !== null) {
          const r = result as Record<string, unknown>;
          if (!Array.isArray(r.messages)) {
            return 'gmail_search must return messages array';
          }
        }
        break;
        
      case 'gmail_read':
        if (typeof result === 'object' && result !== null) {
          const r = result as Record<string, unknown>;
          if (!r.id || !r.subject || !r.body) {
            return 'gmail_read must return id, subject, and body';
          }
        }
        break;
        
      case 'calendar_list':
        if (typeof result === 'object' && result !== null) {
          const r = result as Record<string, unknown>;
          if (!Array.isArray(r.events)) {
            return 'calendar_list must return events array';
          }
        }
        break;
    }
    
    return null;
  }
}

// Singleton instance
export const toolSandbox = new ToolSandbox();
