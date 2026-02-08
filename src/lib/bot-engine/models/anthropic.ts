/**
 * Anthropic Client - For pro and enterprise tiers (Claude Sonnet/Opus)
 */

import { ModelRequest, ModelResponse, ToolCall } from '../types';

export class AnthropicClient {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  /**
   * Generate a completion using Anthropic API
   */
  async complete(modelId: string, request: ModelRequest): Promise<ModelResponse> {
    console.log(`[Anthropic] Calling ${modelId}`);

    if (!this.apiKey) {
      console.warn('[Anthropic] API key not configured, using mock response');
      return this.getMockResponse(request);
    }

    try {
      // Convert our messages to Anthropic format
      const messages = request.messages.map(m => {
        if (m.role === 'tool') {
          // Tool results need special handling
          return {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: m.toolCallId || 'unknown',
                content: m.content,
              },
            ],
          };
        }

        return {
          role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.content,
        };
      });

      // Convert tools to Anthropic format
      const tools = request.tools?.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          system: request.systemPrompt,
          messages,
          max_tokens: request.maxTokens ?? 4096,
          temperature: request.temperature ?? 0.7,
          tools,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();

      // Extract content and tool calls
      let content = '';
      const toolCalls: ToolCall[] = [];

      for (const block of data.content || []) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input,
          });
        }
      }

      return {
        content,
        toolCalls,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        },
      };
    } catch (error) {
      console.error('[Anthropic] Error:', error);
      console.warn('[Anthropic] Falling back to mock response');
      return this.getMockResponse(request);
    }
  }

  /**
   * Mock response for development
   */
  private getMockResponse(request: ModelRequest): ModelResponse {
    const lastMessage = request.messages[request.messages.length - 1];
    const userQuery = lastMessage?.content || '';

    let mockContent = '[CLAUDE MOCK] ';

    // Generate contextual responses based on query
    if (userQuery.toLowerCase().includes('email')) {
      mockContent += 'I can help you manage your emails. I have access to your Gmail inbox. Would you like me to search for specific messages, read an email, or help you compose one?';
    } else if (userQuery.toLowerCase().includes('calendar')) {
      mockContent += 'I can help you with your calendar. I can check your upcoming events, create new meetings, or help you find available time slots. What would you like to do?';
    } else if (userQuery.toLowerCase().includes('search')) {
      mockContent += 'I can search through your emails or calendar events. What are you looking for?';
    } else if (userQuery.toLowerCase().includes('hello') || userQuery.toLowerCase().includes('hi')) {
      mockContent += 'Hello! I\'m your AI assistant. I can help you with emails, calendar management, and more. What can I do for you today?';
    } else {
      mockContent += `I understand you said: "${userQuery}". I'm running in mock mode since the Anthropic API is not configured. In production, I would provide a more helpful response based on your request.`;
    }

    // Simulate tool calls for testing
    const toolCalls: ToolCall[] = [];
    if (userQuery.toLowerCase().includes('search') && request.tools?.some(t => t.name === 'gmail_search')) {
      toolCalls.push({
        id: 'mock_tool_' + Date.now(),
        name: 'gmail_search',
        arguments: {
          query: 'from:boss@example.com',
          maxResults: 5,
        },
      });
    }

    return {
      content: mockContent,
      toolCalls,
      usage: {
        inputTokens: Math.floor(userQuery.length / 4),
        outputTokens: Math.floor(mockContent.length / 4),
      },
    };
  }
}
