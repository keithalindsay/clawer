/**
 * Core TypeScript interfaces for CLAWER.AI
 * Based on DATA-MODELS.md specification
 */

// ============================================================================
// API Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request succeeded */
  success: boolean;
  
  /** Response data (on success) */
  data?: T;
  
  /** Error details (on failure) */
  error?: ApiError;
  
  /** Request metadata */
  meta?: ApiMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  /** Machine-readable error code */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * API metadata
 */
export interface ApiMeta {
  /** Request ID for tracing */
  requestId: string;
  
  /** Request timestamp */
  timestamp: string;
  
  /** Pagination info (if applicable) */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Chat Types
// ============================================================================

/**
 * Chat message input
 */
export interface ChatInput {
  /** Bot ID to send message to */
  botId: string;
  
  /** Conversation ID (optional, creates new if not provided) */
  conversationId?: string;
  
  /** User message content */
  message: string;
  
  /** Attached files (optional) */
  attachments?: Attachment[];
}

/**
 * File attachment
 */
export interface Attachment {
  /** File name */
  name: string;
  
  /** MIME type */
  mimeType: string;
  
  /** Base64-encoded content or URL */
  content: string;
}

/**
 * Chat response (streamed)
 */
export interface ChatStreamEvent {
  /** Event type */
  type: 'start' | 'delta' | 'tool_call' | 'tool_result' | 'end' | 'error';
  
  /** Message ID */
  messageId?: string;
  
  /** Content delta (for 'delta' events) */
  content?: string;
  
  /** Tool call info (for 'tool_call' events) */
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  
  /** Tool result (for 'tool_result' events) */
  toolResult?: {
    id: string;
    result: unknown;
  };
  
  /** Usage info (for 'end' events) */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  
  /** Error info (for 'error' events) */
  error?: ApiError;
}

/**
 * Conversation summary
 */
export interface ConversationSummary {
  /** Conversation ID */
  id: string;
  
  /** Bot ID */
  botId: string;
  
  /** Bot name */
  botName: string;
  
  /** Bot type */
  botType: string;
  
  /** Conversation title */
  title: string | null;
  
  /** Message count */
  messageCount: number;
  
  /** Last message preview */
  lastMessage?: string;
  
  /** Last activity timestamp */
  lastMessageAt: string;
  
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Full conversation with messages
 */
export interface Conversation extends ConversationSummary {
  /** Messages in conversation */
  messages: Message[];
}

/**
 * Chat message
 */
export interface Message {
  /** Message ID */
  id: string;
  
  /** Role */
  role: 'user' | 'assistant' | 'system' | 'tool';
  
  /** Content */
  content: string;
  
  /** Tool calls (for assistant messages) */
  toolCalls?: ToolCall[];
  
  /** Tool call ID (for tool messages) */
  toolCallId?: string;
  
  /** Model used */
  model?: string;
  
  /** Token count */
  tokenCount?: number;
  
  /** Timestamp */
  createdAt: string;
}

/**
 * Tool call structure
 */
export interface ToolCall {
  /** Unique tool call ID */
  id: string;
  
  /** Tool name */
  name: string;
  
  /** Tool arguments (JSON) */
  arguments: Record<string, unknown>;
}

// ============================================================================
// Bot Types
// ============================================================================

/**
 * Bot configuration type
 */
export interface BotConfig {
  /** Preferred model override */
  preferredModel?: string;
  
  /** Max tokens per response */
  maxTokens?: number;
  
  /** Temperature setting */
  temperature?: number;
  
  /** Custom tool restrictions */
  allowedTools?: string[];
  
  /** Custom response format */
  responseFormat?: 'text' | 'markdown' | 'json';
}

/**
 * Bot definition (from bot registry)
 */
export interface BotDefinition {
  /** Bot type identifier */
  type: string;
  
  /** Display name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Icon (emoji or URL) */
  icon: string;
  
  /** Required integrations */
  requiredIntegrations: string[];
  
  /** Available tools */
  tools: ToolDefinition[];
  
  /** System prompt template */
  systemPrompt: string;
  
  /** Default configuration */
  defaultConfig: BotConfig;
  
  /** Minimum tier required */
  minTier: 'free' | 'basic' | 'pro' | 'enterprise';
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  /** Tool name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Input schema (JSON Schema) */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  
  /** Whether tool requires integration */
  requiresIntegration?: string;
}

/**
 * Bot instance (user's configured bot)
 */
export interface BotInstance {
  /** Bot instance ID */
  id: string;
  
  /** Bot type */
  type: string;
  
  /** User-defined name */
  name: string;
  
  /** Description */
  description: string | null;
  
  /** Status */
  status: 'active' | 'paused' | 'deleted';
  
  /** Configuration */
  config: BotConfig;
  
  /** Required integrations */
  requiredIntegrations: string[];
  
  /** Integration statuses */
  integrationStatuses: Record<string, 'connected' | 'missing' | 'expired'>;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Create bot request
 */
export interface CreateBotRequest {
  /** Bot type */
  type: string;
  
  /** User-defined name */
  name: string;
  
  /** Description (optional) */
  description?: string;
  
  /** Configuration overrides (optional) */
  config?: Partial<BotConfig>;
}

/**
 * Update bot request
 */
export interface UpdateBotRequest {
  /** User-defined name */
  name?: string;
  
  /** Description */
  description?: string;
  
  /** Status */
  status?: 'active' | 'paused';
  
  /** Configuration updates */
  config?: Partial<BotConfig>;
}

// ============================================================================
// Integration Types
// ============================================================================

/**
 * Integration provider info
 */
export interface IntegrationProvider {
  /** Provider ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Icon URL */
  iconUrl: string;
  
  /** Description */
  description: string;
  
  /** Required scopes */
  scopes: string[];
  
  /** Whether it's available */
  available: boolean;
}

/**
 * User's integration connection
 */
export interface IntegrationConnection {
  /** Integration ID */
  id: string;
  
  /** Provider ID */
  provider: string;
  
  /** Status */
  status: 'active' | 'expired' | 'revoked' | 'error';
  
  /** Connected account email */
  providerEmail: string | null;
  
  /** Granted scopes */
  scopes: string[];
  
  /** Last sync timestamp */
  lastSyncAt: string | null;
  
  /** Error message (if status is 'error') */
  lastError: string | null;
  
  /** Connection timestamp */
  createdAt: string;
}

/**
 * OAuth start response
 */
export interface OAuthStartResponse {
  /** Authorization URL to redirect to */
  authUrl: string;
  
  /** State token for CSRF protection */
  state: string;
}

/**
 * OAuth callback request
 */
export interface OAuthCallbackRequest {
  /** Authorization code from provider */
  code: string;
  
  /** State token for verification */
  state: string;
}

// ============================================================================
// User and Billing Types
// ============================================================================

/**
 * User profile
 */
export interface UserProfile {
  /** User ID */
  id: string;
  
  /** Email */
  email: string;
  
  /** Display name */
  name: string | null;
  
  /** Current tier */
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  
  /** Tier limits */
  limits: TierLimits;
  
  /** Current usage */
  usage: UsageSummary;
  
  /** Connected integrations count */
  integrationCount: number;
  
  /** Active bots count */
  botCount: number;
  
  /** Account creation date */
  createdAt: string;
}

/**
 * Tier limits
 */
export interface TierLimits {
  /** Max messages per day */
  messagesPerDay: number;
  
  /** Max bots */
  maxBots: number;
  
  /** Max integrations */
  maxIntegrations: number;
  
  /** Available models */
  availableModels: string[];
  
  /** Max tokens per message */
  maxTokensPerMessage: number;
  
  /** Custom bots allowed */
  customBotsAllowed: boolean;
}

/**
 * Usage summary
 */
export interface UsageSummary {
  /** Messages used today */
  messagesToday: number;
  
  /** Messages remaining today */
  messagesRemaining: number;
  
  /** Total tokens used this month */
  tokensThisMonth: number;
  
  /** Estimated cost this month (USD) */
  costThisMonth: number;
  
  /** Usage reset time (ISO 8601) */
  resetsAt: string;
}

/**
 * Billing info
 */
export interface BillingInfo {
  /** Current tier */
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  
  /** Whether subscription is active */
  subscriptionActive: boolean;
  
  /** Subscription period end */
  periodEnd: string | null;
  
  /** Payment method on file */
  hasPaymentMethod: boolean;
  
  /** Billing portal URL */
  billingPortalUrl: string;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * File upload metadata
 */
export interface FileUpload {
  /** Upload ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Original filename */
  filename: string;
  
  /** MIME type */
  mimeType: string;
  
  /** File size in bytes */
  size: number;
  
  /** Storage path */
  path: string;
  
  /** Upload timestamp */
  createdAt: string;
  
  /** Expiration (for temp uploads) */
  expiresAt?: string;
}
