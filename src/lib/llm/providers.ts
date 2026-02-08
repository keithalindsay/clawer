/**
 * LLM Provider Implementations
 * 
 * Each provider implements the same interface but calls different APIs
 */

import { LLMRequest, LLMResponse, LLMProvider } from './types';

/**
 * OpenAI Provider
 */
export const openaiProvider: LLMProvider = {
  name: 'openai',
  models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  
  async call(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const startTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      provider: 'openai',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: data.choices[0]?.finish_reason || 'unknown',
      latencyMs,
    };
  },
};

/**
 * Anthropic Provider
 */
export const anthropicProvider: LLMProvider = {
  name: 'anthropic',
  models: ['claude-opus-4', 'claude-opus-4-5', 'claude-sonnet-4', 'claude-sonnet-4-5', 'claude-haiku-4', 'claude-haiku-4-5'],
  
  async call(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Convert messages to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Anthropic error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.content[0]?.text || '',
      model: data.model,
      provider: 'anthropic',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      finishReason: data.stop_reason || 'unknown',
      latencyMs,
    };
  },
};

/**
 * Google (Gemini) Provider
 */
export const googleProvider: LLMProvider = {
  name: 'google',
  models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-3-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
  
  async call(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Map model names to Google API model names
    const modelMap: Record<string, string> = {
      'gemini-2.0-flash': 'gemini-2.0-flash',
      'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
      'gemini-3-flash': 'gemini-2.0-flash',  // Use 2.0 for now
      'gemini-2.5-pro': 'gemini-1.5-pro',    // Use 1.5 for now
      'gemini-1.5-pro': 'gemini-1.5-pro',
    };
    
    const googleModel = modelMap[request.model] || 'gemini-2.0-flash';
    
    // Convert to Gemini format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    
    const systemInstruction = request.messages.find(m => m.role === 'system');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Google error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: googleModel,
      provider: 'google',
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: data.candidates?.[0]?.finishReason || 'unknown',
      latencyMs,
    };
  },
};

/**
 * xAI (Grok) Provider - OpenAI-compatible API
 */
export const xaiProvider: LLMProvider = {
  name: 'xai',
  models: ['grok-4.1-fast', 'grok-3', 'grok-2'],
  
  async call(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const startTime = Date.now();
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`xAI error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      provider: 'xai',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: data.choices[0]?.finish_reason || 'unknown',
      latencyMs,
    };
  },
};

/**
 * DeepSeek Provider - OpenAI-compatible API
 */
export const deepseekProvider: LLMProvider = {
  name: 'deepseek',
  models: ['deepseek-chat', 'deepseek-reasoner'],
  
  async call(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const startTime = Date.now();
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      provider: 'deepseek',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: data.choices[0]?.finish_reason || 'unknown',
      latencyMs,
    };
  },
};

/**
 * Provider registry
 */
export const providers: Record<string, LLMProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  xai: xaiProvider,
  deepseek: deepseekProvider,
};
