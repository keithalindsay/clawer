/**
 * Input Sanitizer - Prevent prompt injection and malicious inputs
 */

import {
  BLOCKED_INPUT_PATTERNS,
  SUSPICIOUS_CHARS,
  MAX_INPUT_LENGTH,
} from './constants';

export interface SanitizationResult {
  safe: boolean;
  sanitized: string;
  warnings: string[];
}

/**
 * Sanitize user input to prevent prompt injection and other attacks
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = input;
  let safe = true;
  
  // 1. Length check
  if (input.length > MAX_INPUT_LENGTH) {
    warnings.push(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`);
    sanitized = input.substring(0, MAX_INPUT_LENGTH);
    safe = false;
  }
  
  // 2. Check for blocked patterns (prompt injection attempts)
  for (const pattern of BLOCKED_INPUT_PATTERNS) {
    if (pattern.test(input)) {
      warnings.push(`Detected potential prompt injection pattern: ${pattern.source}`);
      safe = false;
      // Redact the matched text
      sanitized = sanitized.replace(pattern, '[YOUR_SECRET]');
    }
  }
  
  // 3. Check for suspicious character ratios
  const specialCharRatio = calculateSpecialCharRatio(input);
  if (specialCharRatio > SUSPICIOUS_CHARS.MAX_SPECIAL_CHAR_RATIO) {
    warnings.push(
      `High ratio of special characters (${(specialCharRatio * 100).toFixed(1)}%). May indicate obfuscation attempt.`
    );
    // Don't block, just warn
  }
  
  // 4. Check for excessive consecutive special characters
  const maxConsecutive = findMaxConsecutiveSpecialChars(input);
  if (maxConsecutive > SUSPICIOUS_CHARS.MAX_CONSECUTIVE_SPECIAL) {
    warnings.push(
      `Detected ${maxConsecutive} consecutive special characters. May indicate encoding attack.`
    );
    // Strip excessive consecutive special chars
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s]{10,}/g, '[...]');
  }
  
  // 5. Check for excessive repeated characters
  const maxRepeated = findMaxRepeatedChar(input);
  if (maxRepeated > SUSPICIOUS_CHARS.MAX_REPEATED_CHARS) {
    warnings.push(
      `Detected ${maxRepeated} repeated characters. May indicate buffer overflow attempt.`
    );
    // Reduce repeated chars to reasonable limit
    sanitized = sanitized.replace(/(.)\1{50,}/g, '$1$1$1$1$1');
  }
  
  // 6. Check for null bytes and control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
    warnings.push('Detected control characters or null bytes');
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    safe = false;
  }
  
  // 7. Check for homoglyph attacks (Unicode lookalikes)
  if (containsHomoglyphs(input)) {
    warnings.push('Detected potential homoglyph characters');
    // Don't auto-sanitize, just warn
  }
  
  // 8. Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return {
    safe,
    sanitized,
    warnings,
  };
}

/**
 * Calculate ratio of special characters to total characters
 */
function calculateSpecialCharRatio(input: string): number {
  if (input.length === 0) return 0;
  
  const specialChars = input.match(/[^a-zA-Z0-9\s]/g);
  return specialChars ? specialChars.length / input.length : 0;
}

/**
 * Find maximum consecutive special characters
 */
function findMaxConsecutiveSpecialChars(input: string): number {
  const matches = input.match(/[^a-zA-Z0-9\s]+/g);
  if (!matches) return 0;
  
  return Math.max(...matches.map(m => m.length));
}

/**
 * Find maximum repeated character count
 */
function findMaxRepeatedChar(input: string): number {
  const matches = input.match(/(.)\1+/g);
  if (!matches) return 0;
  
  return Math.max(...matches.map(m => m.length));
}

/**
 * Check for homoglyph characters (basic detection)
 */
function containsHomoglyphs(input: string): boolean {
  // Common homoglyphs that might be used for obfuscation
  const homoglyphs = [
    /[а-яА-Я]/,  // Cyrillic (looks like Latin)
    /[ａ-ｚＡ-Ｚ]/,  // Fullwidth Latin
    // Mathematical Alphanumeric Symbols - commented out due to regex range error
    // TODO: Replace with Unicode property escape: /\p{Script=Mathematical_Alphanumeric}/u
  ];
  
  return homoglyphs.some(pattern => pattern.test(input));
}

/**
 * Quick check if input is safe (for fast path)
 */
export function isInputSafe(input: string): boolean {
  if (input.length > MAX_INPUT_LENGTH) return false;
  
  // Quick pattern check
  for (const pattern of BLOCKED_INPUT_PATTERNS) {
    if (pattern.test(input)) return false;
  }
  
  return true;
}

/**
 * Strip dangerous patterns without detailed analysis (faster)
 */
export function quickSanitize(input: string): string {
  let sanitized = input.substring(0, MAX_INPUT_LENGTH);
  
  // Strip blocked patterns
  for (const pattern of BLOCKED_INPUT_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[YOUR_SECRET]');
  }
  
  // Strip control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}
