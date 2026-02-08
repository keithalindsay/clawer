# Bot Engine Security Module

Comprehensive security guardrails for the CLAWER bot engine.

## Overview

This security module provides multiple layers of protection against:
- Prompt injection attacks
- Sensitive data leakage
- Resource abuse
- Unauthorized actions
- Malicious inputs

## Modules

### 1. Input Sanitizer (`input-sanitizer.ts`)

Prevents prompt injection and malicious inputs.

**Key Features:**
- Detects common prompt injection patterns
- Length limits (max 10,000 characters)
- Special character ratio checks
- Control character filtering
- Homoglyph detection

**Usage:**
```typescript
import { sanitizeUserInput } from './security';

const result = sanitizeUserInput(userMessage);
if (!result.safe) {
  // Block the request
  return { error: 'Unsafe input detected' };
}
// Use result.sanitized for processing
```

**Blocked Patterns:**
- "ignore all previous instructions"
- "you are now a..."
- "show me your system prompt"
- Excessive special characters
- Control characters and null bytes

### 2. Output Filter (`output-filter.ts`)

Prevents leakage of sensitive data.

**Key Features:**
- Blocks API keys (OpenAI, Anthropic, Google, AWS)
- Blocks SSNs, credit cards, passwords
- Blocks system prompt disclosure attempts
- Blocks other users' data
- Blocks JWT tokens and connection strings

**Usage:**
```typescript
import { filterBotOutput } from './security';

const result = filterBotOutput(botResponse, context);
// Use result.filtered - sensitive data is replaced with [YOUR_SECRET]
if (result.blockedContent.length > 0) {
  logAudit({ action: 'output_filtered', details: result.blockedContent });
}
```

### 3. Resource Limits (`resource-limits.ts`)

Enforces rate limits and resource constraints per tier.

**Tier Limits:**

| Tier | Tokens/Request | Requests/Min | Requests/Day | Tool Calls | Conv. Length |
|------|----------------|--------------|--------------|------------|--------------|
| Free | 2,000 | 5 | 50 | 3 | 10 |
| Basic | 4,000 | 10 | 300 | 5 | 20 |
| Pro | 8,000 | 20 | 1,000 | 10 | 50 |
| Enterprise | 16,000 | 60 | Unlimited | 20 | 100 |

**Usage:**
```typescript
import { enforceResourceLimits, TIER_LIMITS } from './security';

const limits = TIER_LIMITS[context.tier];
const result = enforceResourceLimits(context, limits);
if (!result.allowed) {
  return { error: result.reason };
}
```

### 4. Confirmation Flow (`confirmation.ts`)

Requires user confirmation for destructive actions.

**Actions Requiring Confirmation:**
- `gmail_send` - Sending emails
- `calendar_create` - Creating calendar events
- Any tool with `delete`, `remove`, `trash` in name
- Any tool with `delete: true` parameter

**Usage:**
```typescript
import { requiresConfirmation, storePendingAction, confirmAction } from './security';

if (requiresConfirmation(toolName, args)) {
  const actionId = storePendingAction({
    id: '',
    userId: context.userId,
    action: toolName,
    params: args,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  });
  
  return {
    response: `⚠️ Confirmation required. Reply with: /confirm ${actionId}`,
  };
}

// Later, when user confirms:
const result = confirmAction(actionId, userId);
if (result.confirmed) {
  // Execute the action
}
```

### 5. Audit Logger (`audit-log.ts`)

Comprehensive logging of all bot actions.

**Event Types:**
- `message` - User messages
- `tool_call` - Tool invocations
- `tool_result` - Tool execution results
- `error` - Errors
- `rate_limit` - Rate limit hits
- `blocked` - Blocked requests
- `confirmation_required` - Actions awaiting confirmation
- `input_sanitized` - Input sanitization events
- `output_filtered` - Output filtering events

**Usage:**
```typescript
import { logMessage, logToolCall, logBlocked, getUserStats } from './security';

// Log a message
logMessage(userId, botId, message, ip);

// Log a tool call
logToolCall(userId, botId, toolName, args, ip);

// Log a blocked event
logBlocked(userId, botId, 'Prompt injection detected', { pattern: '...' }, ip);

// Get user statistics
const stats = getUserStats(userId, since);
console.log(`User sent ${stats.totalMessages} messages`);
```

### 6. Constants (`constants.ts`)

Centralized configuration for all security settings.

**Configurable Values:**
- Blocked input patterns
- Blocked output patterns
- Suspicious character thresholds
- Tier limits
- Confirmation requirements
- Expiration times

## Integration

### Executor Integration

The `executor.ts` file integrates all security modules:

1. **Input Sanitization** - Before processing user input
2. **Resource Limits** - Before allowing request
3. **Confirmation Flow** - For destructive tool calls
4. **Output Filtering** - Before returning response
5. **Audit Logging** - For all actions

### Tool Sandbox Integration

The `tool-sandbox.ts` file adds:

1. **OAuth Validation** - Ensures user has required connections
2. **Tool Call Limits** - Max 5 tool calls per request
3. **Output Validation** - Ensures tools return expected schema
4. **Audit Logging** - Logs all tool executions

## Testing

Run the test demo:
```bash
npx tsx src/lib/bot-engine/security/test-demo.ts
```

This will test:
- Input sanitization with malicious inputs
- Output filtering with sensitive data
- Resource limits for all tiers
- Confirmation flow for destructive actions
- Audit logging and statistics

## Production Recommendations

### Current State (MVP)
- In-memory stores (rate limits, pending actions, audit log)
- Basic pattern matching
- Console logging

### Production Upgrades
1. **Redis** for rate limits and pending actions
2. **PostgreSQL** for audit log
3. **Advanced ML-based** prompt injection detection
4. **Secrets scanning** with dedicated libraries
5. **Log aggregation** (Datadog, Splunk, etc.)
6. **Alerting** for security events
7. **Schema validation** with Zod
8. **IP-based rate limiting**
9. **Webhook notifications** for critical actions

## Security Best Practices

1. **Defense in Depth** - Multiple layers of protection
2. **Fail Secure** - Block on uncertainty
3. **Log Everything** - Comprehensive audit trail
4. **Least Privilege** - Only allow necessary tools per bot
5. **User Consent** - Confirm destructive actions
6. **Rate Limiting** - Prevent abuse
7. **Input Validation** - Never trust user input
8. **Output Sanitization** - Never leak sensitive data

## Monitoring

Key metrics to monitor:
- Rate limit hits per user/tier
- Blocked requests (by reason)
- Input sanitization warnings
- Output filtering events
- Failed confirmations
- Tool execution errors

Set up alerts for:
- High rate of blocked requests (potential attack)
- Repeated prompt injection attempts
- Sensitive data leakage attempts
- Unusual tool usage patterns

## Maintenance

### Regular Tasks
1. **Review blocked patterns** - Update based on new attacks
2. **Analyze audit logs** - Look for abuse patterns
3. **Update tier limits** - Based on usage and costs
4. **Test edge cases** - Continuously improve detection
5. **Rotate secrets** - If any are accidentally logged

### Quarterly Review
- Review all security constants
- Update blocked patterns
- Analyze false positives/negatives
- Update documentation
- Train team on new threats

## Incident Response

If a security breach occurs:

1. **Contain** - Block affected users/bots
2. **Investigate** - Review audit logs
3. **Notify** - Inform affected users if needed
4. **Remediate** - Fix the vulnerability
5. **Post-Mortem** - Document and learn
6. **Update** - Improve detection for future

## Support

For questions or issues:
- Review audit logs first
- Check blocked patterns
- Test with test-demo.ts
- Review this README
- Contact security team

---

**Security is not a feature, it's a requirement.**

All security measures in this module are mandatory for production deployment.
