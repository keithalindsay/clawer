/**
 * Ollama Client - For local Qwen3 model (free tier)
 */

import { ModelRequest, ModelResponse, Message } from '../types';

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
  }

  /**
   * Generate a completion using Ollama
   */
  async complete(modelId: string, request: ModelRequest): Promise<ModelResponse> {
    console.log(`[Ollama] Calling ${modelId} at ${this.baseUrl}`);

    // Convert messages to Ollama format
    const ollamaMessages = this.convertMessages(request);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract token counts
      const inputTokens = data.prompt_eval_count || 0;
      const outputTokens = data.eval_count || 0;

      return {
        content: data.message?.content || '',
        toolCalls: [], // Ollama doesn't support tool calls in this simple version
        usage: {
          inputTokens,
          outputTokens,
        },
      };
    } catch (error) {
      console.error('[Ollama] Error:', error);
      
      // Return mock response for development
      console.warn('[Ollama] Using mock response');
      return this.getMockResponse(request);
    }
  }

  /**
   * Convert our message format to Ollama format
   */
  private convertMessages(request: ModelRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: request.systemPrompt },
    ];

    for (const msg of request.messages) {
      if (msg.role === 'tool') {
        // Represent tool results as assistant messages
        messages.push({
          role: 'assistant',
          content: `Tool result: ${msg.content}`,
        });
      } else {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return messages;
  }

  /**
   * Mock response for development when Ollama is not available
   */
  private getMockResponse(request: ModelRequest): ModelResponse {
    const lastMessage = request.messages[request.messages.length - 1];
    const userQuery = lastMessage?.content || '';

    let mockContent = 'I am a mock Ollama response. ';

    // Generate contextual mock responses
    if (userQuery.toLowerCase().includes('email')) {
      mockContent += 'I can help you with emails. Try searching for specific messages or drafting new ones.';
    } else if (userQuery.toLowerCase().includes('calendar')) {
      mockContent += 'I can help you manage your calendar. Try asking about upcoming events or creating new ones.';
    } else {
      mockContent += `You said: "${userQuery}". This is a mock response since Ollama is not running.`;
    }

    return {
      content: mockContent,
      toolCalls: [],
      usage: {
        inputTokens: userQuery.length / 4, // Rough estimate
        outputTokens: mockContent.length / 4,
      },
    };
  }
}
