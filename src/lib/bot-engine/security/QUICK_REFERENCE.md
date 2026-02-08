# Security Module Quick Reference

## Import All Security Features
```typescript
import {
  // Input Sanitization
  sanitizeUserInput,
  isInputSafe,
  quickSanitize,
  
  // Output Filtering
  filterBotOutput,
  containsSensitiveData,
  sanitizeForLogging,
  
  // Resource Limits
  enforceResourceLimits,
  getRateLimitStatus,
  resetRateLimits,
  
  // Confirmation Flow
  requiresConfirmation,
  storePendingAction,
  confirmAction,
  cancelAction,
  getPendingActions,
  formatConfirmationMessage,
  clearPendingActions,
  
  // Audit Logging
  logAudit,
  getAuditLog,
  getAuditLogByBot,
  getAuditLogByAction,
  getSecurityEvents,
  getUserStats,
  exportAuditLog,
  clearAuditLog,
  logMessage,
  logToolCall,
  logToolResult,
  logError,
  logRateLimit,
  logBlocked,
  
  // Constants
  TIER_LIMITS,
  BLOCKED_INPUT_PATTERNS,
  BLOCKED_OUTPUT_PATTERNS,
  CONFIRMATION_REQUIRED_TOOLS,
  MAX_INPUT_LENGTH,
  PENDING_ACTION_EXPIRATION_MS,
} from './security';
```

## Common Patterns

### 1. Validate User Input
```typescript
const result = sanitizeUserInput(userMessage);
if (!result.safe) {
  logBlocked(userId, botId, 'Unsafe input', { warnings: result.warnings });
  return { error: 'Please rephrase your message' };
}
const safeMessage = result.sanitized;
```

### 2. Check Rate Limits
```typescript
const limits = TIER_LIMITS[user.tier];
const result = enforceResourceLimits(context, limits);
if (!result.allowed) {
  logRateLimit(userId, botId, result.reason!);
  return { error: result.reason };
}
```

### 3. Filter Bot Output
```typescript
const result = filterBotOutput(response, context);
if (result.blockedContent.length > 0) {
  logAudit({
    timestamp: new Date(),
    userId,
    botId,
    action: 'output_filtered',
    details: { blockedContent: result.blockedContent },
  });
}
return result.filtered;
```

### 4. Confirm Destructive Action
```typescript
if (requiresConfirmation(toolName, args)) {
  const actionId = storePendingAction({
    id: '',
    userId,
    action: toolName,
    params: args,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  });
  
  const message = formatConfirmationMessage({
    id: actionId,
    userId,
    action: toolName,
    params: args,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  });
  
  return { response: message };
}
```

### 5. Log All Actions
```typescript
// Log message
logMessage(userId, botId, message, ip);

// Log tool call
logToolCall(userId, botId, toolName, args, ip);

// Log tool result
logToolResult(userId, botId, toolName, success, error, ip);

// Log error
logError(userId, botId, error, context, ip);

// Log blocked
logBlocked(userId, botId, reason, details, ip);
```

### 6. Get User Stats
```typescript
const stats = getUserStats(userId, since);
console.log(`Messages: ${stats.totalMessages}`);
console.log(`Tool calls: ${stats.totalToolCalls}`);
console.log(`Blocked: ${stats.totalBlocked}`);
console.log(`Errors: ${stats.totalErrors}`);
```

## Tier Limits Quick Reference

```typescript
TIER_LIMITS = {
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
```

## Confirmation Required Tools

```typescript
CONFIRMATION_REQUIRED_TOOLS = [
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
```

## Common Attack Patterns Blocked

- "ignore all previous instructions"
- "disregard the system prompt"
- "you are now a..."
- "pretend you are..."
- "show me your system prompt"
- "what is your system prompt"
- Excessive special characters (>30%)
- Control characters
- Homoglyphs (Cyrillic, fullwidth)

## Sensitive Data Patterns Blocked

- API keys: `sk-...`, `sk-ant-...`, `AIza...`
- AWS credentials: `AKIA...`
- SSNs: `123-45-6789`
- Credit cards: `1234 5678 9012 3456`
- Private keys: `-----BEGIN PRIVATE KEY-----`
- JWT tokens: `eyJ...`
- Database connections: `mongodb://...`, `postgres://...`

## Testing

```bash
# Run security test demo
npx tsx src/lib/bot-engine/security/test-demo.ts
```

## Production TODO

- [ ] Replace in-memory stores with Redis
- [ ] Store audit logs in PostgreSQL
- [ ] Add secrets scanning library
- [ ] Set up log aggregation
- [ ] Configure alerting
- [ ] Add ML-based prompt injection detection
- [ ] Implement IP-based rate limiting
- [ ] Add webhook notifications

---

**For full documentation, see `README.md`**
