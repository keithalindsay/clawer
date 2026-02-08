/**
 * Core types for the CLAWER Bot Engine
 */

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface BotConstraints {
  maxTokensPerRequest: number;
  maxRequestsPerDay: number;
  allowedIntegrations: string[];
  requiresConfirmation: string[]; // actions needing user OK
}

export interface BotDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  constraints: BotConstraints;
}

export type UserTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface ExecutionContext {
  userId: string;
  botId: string;
  tier: UserTier;
  conversationHistory: Message[];
}

export interface ExecutionResult {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    model: string;
  };
}

export interface ModelConfig {
  provider: 'ollama' | 'kimi' | 'anthropic';
  modelId: string;
  displayName: string;
  tier: UserTier;
  inputCostPer1k: number;
  outputCostPer1k: number;
  maxTokens: number;
  contextWindow: number;
}

export interface ModelRequest {
  tier: UserTier;
  preferredModel?: string;
  systemPrompt: string;
  messages: Message[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ToolExecutionContext {
  userId: string;
  botId: string;
  tier: UserTier;
  integrations: Map<string, string>; // provider -> integration ID
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
