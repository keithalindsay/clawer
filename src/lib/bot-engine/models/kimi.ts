/**
 * Kimi API Client - For basic tier (stubbed for MVP)
 */

import { ModelRequest, ModelResponse } from '../types';

export class KimiClient {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.KIMI_API_KEY;
    this.baseUrl = 'https://api.moonshot.cn/v1';
  }

  /**
   * Generate a completion using Kimi API
   */
  async complete(modelId: string, request: ModelRequest): Promise<ModelResponse> {
    console.log(`[Kimi] Would call ${modelId} (stubbed for MVP)`);

    // Check if API key is configured
    if (!this.apiKey) {
      console.warn('[Kimi] API key not configured, using mock response');
      return this.getMockResponse(request);
    }

    try {
      // Convert messages to OpenAI-compatible format
      const messages = [
        { role: 'system', content: request.systemPrompt },
        ...request.messages.map(m => ({
          role: m.role === 'tool' ? 'assistant' : m.role,
          content: m.content,
        })),
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kimi API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.choices?.[0]?.message?.content || '',
        toolCalls: [], // Tool calls not implemented in MVP
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      console.error('[Kimi] Error:', error);
      console.warn('[Kimi] Falling back to mock response');
      return this.getMockResponse(request);
    }
  }

  /**
   * Mock response for development
   */
  private getMockResponse(request: ModelRequest): ModelResponse {
    const lastMessage = request.messages[request.messages.length - 1];
    const userQuery = lastMessage?.content || '';

    let mockContent = '[KIMI MOCK] ';

    // Generate contextual responses
    if (userQuery.toLowerCase().includes('email')) {
      mockContent += 'I\'ll help you manage your emails. What would you like to do?';
    } else if (userQuery.toLowerCase().includes('calendar')) {
      mockContent += 'I can help with your calendar. Would you like to see upcoming events or create a new one?';
    } else if (userQuery.toLowerCase().includes('search')) {
      mockContent += 'I can search through your emails or calendar events. What are you looking for?';
    } else {
      mockContent += `You asked: "${userQuery}". I'm a Kimi model (currently using mock data since API is not configured).`;
    }

    return {
      content: mockContent,
      toolCalls: [],
      usage: {
        inputTokens: Math.floor(userQuery.length / 4),
        outputTokens: Math.floor(mockContent.length / 4),
      },
    };
  }
}
