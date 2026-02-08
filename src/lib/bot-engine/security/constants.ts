/**
 * Security Constants - Patterns, limits, and configurations
 */

import { ResourceLimits } from './resource-limits';

/**
 * Blocked input patterns - potential prompt injection attempts
 */
export const BLOCKED_INPUT_PATTERNS = [
  // Direct instruction manipulation
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|commands?)/i,
  /disregard\s+(the\s+)?(system|previous|prior)\s+(prompt|instructions?)/i,
  /forget\s+(your|the|all)\s+(previous|prior|system)\s+(instructions?|prompt)/i,
  
  // Role manipulation
  /you\s+are\s+now\s+(a|an|the)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(a|an)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(a|an)/i,
  /simulate\s+(being\s+)?(a|an)/i,
  /your\s+new\s+(role|identity|persona)\s+is/i,
  
  // System prompt extraction
  /show\s+(me\s+)?(your|the)\s+(system|original)\s+(prompt|instructions?)/i,
  /what\s+(is|are)\s+your\s+(system|original)\s+(prompt|instructions?)/i,
  /repeat\s+(your|the)\s+(system|initial)\s+(prompt|instructions?)/i,
  /print\s+(your|the)\s+(system|original)\s+prompt/i,
  
  // Delimiter/encoding attacks
  /---\s*(END|STOP|HALT)\s+(SYSTEM|PROMPT|INSTRUCTIONS?)/i,
  /<\s*\/?\s*(system|admin|root|instruction)\s*>/i,
  /\[SYSTEM\s+(OVERRIDE|RESET|CLEAR)\]/i,
  
  // Developer mode / jailbreak attempts
  /(developer|debug|admin|god)\s+mode/i,
  /enable\s+(developer|debug|admin)\s+mode/i,
  /bypass\s+(security|safety|filters?)/i,
  /disable\s+(safety|security|moderation)/i,
];

/**
 * Blocked output patterns - sensitive data that should never be exposed
 */
export const BLOCKED_OUTPUT_PATTERNS = [
  // API Keys
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
  /sk-ant-[a-zA-Z0-9]{40,}/g, // Anthropic keys
  /xai-[a-zA-Z0-9]{48}/g, // xAI keys
  /AIza[0-9A-Za-z_-]{35}/g, // Google API keys
  
  // AWS credentials
  /AKIA[0-9A-Z]{16}/g, // AWS Access Key ID
  /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/g,
  
  // Private keys
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
  
  // Sensitive personal data
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN (US)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
  
  // Passwords in various formats
  /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /secret\s*[:=]\s*['"][^'"]+['"]/gi,
  /token\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  
  // Database connection strings
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /postgres(ql)?:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
];

/**
 * Suspicious character thresholds
 */
export const SUSPICIOUS_CHARS = {
  // Maximum percentage of special characters
  MAX_SPECIAL_CHAR_RATIO: 0.3,
  
  // Maximum consecutive special characters
  MAX_CONSECUTIVE_SPECIAL: 10,
  
  // Maximum repeated characters
  MAX_REPEATED_CHARS: 50,
};

/**
 * Resource limits by tier
 */
export const TIER_LIMITS: Record<string, ResourceLimits> = {
  free: {
    maxTokensPerRequest: 2000,
    maxRequestsPerMinute: 5,
    maxRequestsPerDay: 50,
    maxToolCallsPerRequest: 3,
    maxConversationLength: 10,
  },
  basic: {
    maxTokensPerRequest: 4000,
    maxRequestsPerMinute: 10,
    maxRequestsPerDay: 300,
    maxToolCallsPerRequest: 5,
    maxConversationLength: 20,
  },
  pro: {
    maxTokensPerRequest: 8000,
    maxRequestsPerMinute: 20,
    maxRequestsPerDay: 1000,
    maxToolCallsPerRequest: 10,
    maxConversationLength: 50,
  },
  enterprise: {
    maxTokensPerRequest: 16000,
    maxRequestsPerMinute: 60,
    maxRequestsPerDay: -1, // unlimited
    maxToolCallsPerRequest: 20,
    maxConversationLength: 100,
  },
};

/**
 * Tools that require user confirmation before execution
 */
export const CONFIRMATION_REQUIRED_TOOLS = [
  'gmail_send',
  'gmail_delete',
  'gmail_trash',
  'calendar_create',
  'calendar_update',
  'calendar_delete',
  'drive_delete',
  'drive_share',
  'sheets_delete',
  'docs_delete',
];

/**
 * Tool name patterns that require confirmation
 */
export const CONFIRMATION_REQUIRED_PATTERNS = [
  /delete/i,
  /remove/i,
  /trash/i,
  /send/i,
  /share/i,
  /publish/i,
];

/**
 * Maximum length for user input (10,000 characters)
 */
export const MAX_INPUT_LENGTH = 10000;

/**
 * Pending action expiration time (5 minutes)
 */
export const PENDING_ACTION_EXPIRATION_MS = 5 * 60 * 1000;
