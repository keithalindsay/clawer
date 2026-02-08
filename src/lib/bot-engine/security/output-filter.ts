/**
 * Output Filter - Prevent leakage of sensitive data
 */

import { ExecutionContext } from '../types';
import { BLOCKED_OUTPUT_PATTERNS } from './constants';

export interface FilterResult {
  filtered: string;
  blockedContent: string[];
}

/**
 * Filter bot output to prevent sensitive data leakage
 */
export function filterBotOutput(
  output: string,
  context: ExecutionContext
): FilterResult {
  let filtered = output;
  const blockedContent: string[] = [];
  
  // 1. Block sensitive data patterns (API keys, passwords, etc.)
  for (const pattern of BLOCKED_OUTPUT_PATTERNS) {
    const matches = output.match(pattern);
    if (matches) {
      for (const match of matches) {
        blockedContent.push(`Sensitive data pattern: ${pattern.source.substring(0, 50)}...`);
        filtered = filtered.replace(match, '[YOUR_SENSITIVE_DATA]');
      }
    }
  }
  
  // 2. Block system prompt leakage attempts
  const systemPromptIndicators = [
    /system\s+(prompt|message|instruction):\s*["\[]?/gi,
    /the\s+system\s+says?:\s*/gi,
    /my\s+(instructions?|directives?)\s+(are|is|say):\s*/gi,
    /i\s+(was|am)\s+(told|instructed|programmed)\s+to:\s*/gi,
  ];
  
  for (const pattern of systemPromptIndicators) {
    if (pattern.test(filtered)) {
      blockedContent.push('Attempted system prompt disclosure');
      // Redact the entire sentence containing the pattern
      filtered = filtered.replace(
        new RegExp(`[^.!?]*${pattern.source}[^.!?]*[.!?]`, 'gi'),
        '[YOUR_SYSTEM_INFO] '
      );
    }
  }
  
  // 3. Block attempts to reveal other users' data
  // Check if output mentions user IDs that aren't the current user
  const userIdPattern = /user[_-]?id[:\s]+([a-zA-Z0-9_-]+)/gi;
  const matches = filtered.matchAll(userIdPattern);
  
  for (const match of matches) {
    const mentionedUserId = match[1];
    if (mentionedUserId !== context.userId) {
      blockedContent.push(`Attempted to expose other user's ID: ${mentionedUserId}`);
      filtered = filtered.replace(match[0], '[YOUR_USER_INFO]');
    }
  }
  
  // 4. Block email addresses that aren't related to the current user
  // (This is conservative - in production, check against user's known emails)
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = filtered.match(emailPattern);
  
  if (emails && emails.length > 5) {
    // If more than 5 emails, likely a data dump
    blockedContent.push('Potential bulk email disclosure');
    filtered = filtered.replace(emailPattern, '[EMAIL_YOUR_SECRET]');
  }
  
  // 5. Block internal file paths and system information
  const filePathPatterns = [
    /\/etc\/[^\s]+/g,
    /\/var\/[^\s]+/g,
    /\/home\/[^\s]+/g,
    /C:\\Windows\\[^\s]+/g,
    /C:\\Users\\[^\s]+/g,
  ];
  
  for (const pattern of filePathPatterns) {
    if (pattern.test(filtered)) {
      blockedContent.push('System file path detected');
      filtered = filtered.replace(pattern, '[PATH_YOUR_SECRET]');
    }
  }
  
  // 6. Block database connection strings and credentials
  const dbPatterns = [
    /mongodb(\+srv)?:\/\/[^\s]+/gi,
    /postgres(ql)?:\/\/[^\s]+/gi,
    /mysql:\/\/[^\s]+/gi,
    /redis:\/\/[^\s]+/gi,
  ];
  
  for (const pattern of dbPatterns) {
    if (pattern.test(filtered)) {
      blockedContent.push('Database connection string detected');
      filtered = filtered.replace(pattern, '[DB_CONNECTION_YOUR_SECRET]');
    }
  }
  
  // 7. Block environment variable dumps
  if (/([A-Z_]+=[^\s]+\s*){5,}/.test(filtered)) {
    blockedContent.push('Environment variable dump detected');
    filtered = filtered.replace(/([A-Z_]+=[^\s]+\s*){5,}/, '[ENV_VARS_YOUR_SECRET]');
  }
  
  // 8. Block JWT tokens
  const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
  if (jwtPattern.test(filtered)) {
    blockedContent.push('JWT token detected');
    filtered = filtered.replace(jwtPattern, '[JWT_YOUR_SECRET]');
  }
  
  return {
    filtered,
    blockedContent,
  };
}

/**
 * Quick check if output contains sensitive data (fast path)
 */
export function containsSensitiveData(output: string): boolean {
  // Quick check for most common sensitive patterns
  const quickPatterns = [
    /sk-[a-zA-Z0-9]{48}/,
    /sk-ant-[a-zA-Z0-9]{40,}/,
    /-----BEGIN\s+PRIVATE\s+KEY-----/,
    /\b\d{3}-\d{2}-\d{4}\b/,
  ];
  
  return quickPatterns.some(pattern => pattern.test(output));
}

/**
 * Sanitize output for logging (more aggressive redaction)
 */
export function sanitizeForLogging(output: string, maxLength: number = 1000): string {
  let sanitized = output;
  
  // Redact all patterns
  for (const pattern of BLOCKED_OUTPUT_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[YOUR_SECRET]');
  }
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
  }
  
  return sanitized;
}
