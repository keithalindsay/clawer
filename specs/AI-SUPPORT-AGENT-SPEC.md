# AI Support Agent Specification

## Overview

An intelligent on-demand diagnostic agent that users can invoke when experiencing issues. The agent analyzes container state, logs, and configuration to diagnose problems and optionally auto-remediate.

**Value Proposition:** Instant AI-powered support vs. email-and-wait competitors.

## User Experience

### Trigger Points

1. **Dashboard Help Button** — Persistent "🔧 Get Help" in header
2. **Error State CTA** — When container shows error/unhealthy status
3. **Chat Failure** — After 2+ consecutive failed messages
4. **Proactive Prompt** — If container unhealthy for >5 minutes

### User Flow

```
User clicks "Get Help"
    ↓
"Diagnosing your assistant..." (2-5 seconds)
    ↓
Results panel shows:
  - Issue identified (or "Everything looks good!")
  - Root cause explanation (plain English)
  - Auto-fix button (if fixable)
  - Manual steps (if user action needed)
  - "Still having issues?" → Contact support
```

### UI Components

```tsx
// DiagnoseButton.tsx - Floating help button
<button onClick={runDiagnosis}>
  🔧 Get Help
</button>

// DiagnosisPanel.tsx - Results display
<DiagnosisPanel
  status="success|warning|error"
  issue="Container API unresponsive"
  cause="The AI model provider is rate limiting requests"
  autoFixAvailable={true}
  onAutoFix={handleAutoFix}
  manualSteps={["Wait 5 minutes", "Try again"]}
/>
```

---

## Technical Architecture

### API Endpoint

```
POST /api/diagnose
Authorization: Bearer <clerk_token>

Response:
{
  "status": "healthy|degraded|unhealthy|error",
  "issues": [
    {
      "id": "rate_limit",
      "severity": "warning|error|critical",
      "title": "Model Rate Limited",
      "description": "OpenAI is temporarily limiting requests",
      "cause": "Too many requests in short period",
      "autoFixable": false,
      "autoFixAction": null,
      "manualSteps": ["Wait 2-3 minutes", "Try sending a shorter message"],
      "learnMoreUrl": "/docs/rate-limits"
    }
  ],
  "containerHealth": {
    "status": "running|stopped|restarting|error",
    "uptime": "2h 34m",
    "lastHealthCheck": "2026-02-07T21:30:00Z",
    "apiResponsive": true,
    "memoryUsage": "456MB / 1GB",
    "cpuUsage": "12%"
  },
  "recommendation": "Your assistant is healthy. The rate limit will clear in ~2 minutes.",
  "diagnosisId": "diag_abc123",
  "timestamp": "2026-02-07T21:35:00Z"
}
```

### Data Collection (Input to AI)

The diagnostic agent collects:

```typescript
interface DiagnosticContext {
  // Container State
  containerStatus: 'running' | 'stopped' | 'restarting' | 'error' | 'not_found';
  containerUptime: string;
  restartCount: number;
  
  // Health Metrics
  healthEndpointResponse: {
    status: number;
    latencyMs: number;
    body: any;
  } | null;
  
  // Resource Usage
  memoryUsage: { used: number; limit: number };
  cpuPercent: number;
  
  // Recent Logs (last 100 lines, sanitized)
  logs: string[];
  
  // Error Patterns
  recentErrors: {
    timestamp: string;
    message: string;
    count: number;
  }[];
  
  // Config Validation
  configValid: boolean;
  configErrors: string[];
  
  // API Key Status
  apiKeyValid: boolean;
  apiKeyError: string | null;
  
  // User Context
  lastSuccessfulChat: string | null;
  failedChatCount: number;
  userReportedIssue: string | null; // Optional user description
}
```

### AI Analysis Prompt

```typescript
const DIAGNOSTIC_PROMPT = `You are a container diagnostic agent for Clawer.ai.

Analyze the following diagnostic data and identify any issues.

## Diagnostic Data
${JSON.stringify(context, null, 2)}

## Your Task
1. Identify all issues (even minor ones)
2. Determine root cause for each
3. Classify severity (warning/error/critical)
4. Determine if auto-fixable
5. Provide clear remediation steps

## Response Format (JSON)
{
  "issues": [
    {
      "id": "snake_case_id",
      "severity": "warning|error|critical",
      "title": "Short title",
      "description": "User-friendly explanation",
      "cause": "Technical root cause",
      "autoFixable": boolean,
      "autoFixAction": "restart|clear_cache|rotate_key|null",
      "manualSteps": ["Step 1", "Step 2"],
      "confidence": 0.0-1.0
    }
  ],
  "overallStatus": "healthy|degraded|unhealthy",
  "recommendation": "One sentence summary for user"
}

## Common Issues to Check
- Container not running / restart loop
- API key invalid or rate limited
- Model provider errors (429, 500, timeout)
- Config validation failures
- Memory/CPU exhaustion
- Health endpoint unresponsive
- Gateway websocket disconnected
- Missing .next build
- Network connectivity issues

Be concise. Users want quick answers, not essays.`;
```

---

## Auto-Remediation Actions

### Safe Actions (No Confirmation)

| Action | Trigger | Implementation |
|--------|---------|----------------|
| `clear_cache` | Stale responses, memory pressure | `docker exec $CONTAINER rm -rf /tmp/openclaw/cache/*` |
| `restart_gateway` | Gateway unresponsive | `docker exec $CONTAINER pkill -HUP openclaw` |

### Confirmed Actions (User Clicks "Fix")

| Action | Trigger | Implementation |
|--------|---------|----------------|
| `restart_container` | Unhealthy state, crash loop | `docker restart $CONTAINER` |
| `rebuild_config` | Config validation errors | Re-run entrypoint config generation |
| `rotate_session` | Session corruption | Clear session files, restart |

### Escalation Actions (Contact Support)

- API key invalid (user needs to update billing)
- Persistent crash loop (>5 restarts in 10 min)
- Data corruption detected
- Unknown errors

---

## Known Issue Patterns

### Pattern Library

```typescript
const ISSUE_PATTERNS = {
  // Log pattern matching
  'rate_limit': {
    logPatterns: [/429/, /rate.?limit/i, /too many requests/i],
    severity: 'warning',
    autoFixable: false,
    recommendation: 'Wait 2-3 minutes before retrying'
  },
  
  'api_key_invalid': {
    logPatterns: [/401/, /invalid.*key/i, /authentication.*failed/i],
    severity: 'critical',
    autoFixable: false,
    recommendation: 'Check your API key in account settings'
  },
  
  'model_overloaded': {
    logPatterns: [/503/, /overloaded/i, /capacity/i],
    severity: 'warning',
    autoFixable: false,
    recommendation: 'The AI provider is busy. Try again in a minute.'
  },
  
  'config_invalid': {
    logPatterns: [/config.*invalid/i, /validation.*failed/i],
    severity: 'error',
    autoFixable: true,
    autoFixAction: 'rebuild_config',
    recommendation: 'Configuration issue detected. Click Fix to repair.'
  },
  
  'memory_exhausted': {
    logPatterns: [/out of memory/i, /OOM/i, /killed/i],
    severity: 'critical',
    autoFixable: true,
    autoFixAction: 'restart_container',
    recommendation: 'Memory limit reached. Restarting container.'
  },
  
  'gateway_disconnected': {
    logPatterns: [/gateway.*disconnect/i, /websocket.*error/i],
    severity: 'error',
    autoFixable: true,
    autoFixAction: 'restart_gateway',
    recommendation: 'Connection lost. Reconnecting...'
  }
};
```

---

## Cost Analysis

### Per-Diagnosis Cost (GPT-4o-mini)

| Component | Tokens | Cost |
|-----------|--------|------|
| System prompt | ~500 | $0.000075 |
| Diagnostic context | ~2,000-4,000 | $0.0003-0.0006 |
| Response | ~300-500 | $0.0002-0.0003 |
| **Total** | ~3,000-5,000 | **$0.002-0.004** |

### Monthly Projections

| Scenario | Diagnoses/User/Month | Cost/User |
|----------|---------------------|-----------|
| Low usage | 1-2 | $0.004 |
| Normal usage | 3-5 | $0.015 |
| High usage (issues) | 10+ | $0.040 |

**At 1,000 users:** $4-40/month for AI diagnostics

### Rate Limiting

- Max 10 diagnoses per user per hour
- Max 30 diagnoses per user per day
- Cooldown: 30 seconds between requests

---

## Implementation Plan

### Phase 1: Core Diagnostic (2-3 hours)

1. **API Endpoint** (`/api/diagnose/route.ts`)
   - Auth check
   - Collect diagnostic context
   - Call GPT-4o-mini
   - Return structured response

2. **Data Collection** (`/lib/diagnostics/collector.ts`)
   - Container status via Docker API
   - Log fetching with sanitization
   - Health check execution
   - Config validation

3. **UI Components**
   - DiagnoseButton (header + error states)
   - DiagnosisPanel (results display)
   - AutoFixButton (remediation trigger)

### Phase 2: Auto-Remediation (1-2 hours)

1. **Remediation Engine** (`/lib/diagnostics/remediation.ts`)
   - Safe action execution
   - Confirmed action flow
   - Escalation handling

2. **Action Endpoint** (`/api/diagnose/fix/route.ts`)
   - Execute remediation
   - Return success/failure
   - Log all actions

### Phase 3: Intelligence Improvements (ongoing)

1. Pattern library expansion
2. Success rate tracking
3. Common issue detection (skip AI for known patterns)
4. Proactive alerts

---

## Security Considerations

### Log Sanitization

Before sending to AI, scrub:
- API keys / tokens
- Email addresses
- Phone numbers
- IP addresses (internal)
- Session IDs

```typescript
function sanitizeLogs(logs: string[]): string[] {
  return logs.map(line => line
    .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***YOUR_SECRET***')
    .replace(/Bearer [a-zA-Z0-9._-]+/g, 'Bearer ***YOUR_SECRET***')
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '***EMAIL***')
    .replace(/\+?[0-9]{10,}/g, '***PHONE***')
  );
}
```

### Action Authorization

- All auto-fix actions require valid user session
- Actions logged with user ID, timestamp, action type
- Rate limit remediation attempts (max 5/hour)
- Escalate if same fix attempted 3+ times

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Diagnosis accuracy | >90% correct identification |
| Auto-fix success rate | >80% resolve issue |
| Time to diagnosis | <5 seconds |
| User satisfaction | Reduce support tickets by 50% |
| Cost per resolution | <$0.01 |

---

## File Structure

```
src/
├── app/api/diagnose/
│   ├── route.ts              # Main diagnostic endpoint
│   └── fix/route.ts          # Auto-fix execution
├── lib/diagnostics/
│   ├── index.ts              # Main exports
│   ├── collector.ts          # Data collection
│   ├── analyzer.ts           # AI analysis
│   ├── remediation.ts        # Auto-fix actions
│   ├── patterns.ts           # Known issue patterns
│   ├── sanitizer.ts          # Log sanitization
│   └── types.ts              # TypeScript types
├── components/
│   ├── DiagnoseButton.tsx    # Trigger button
│   ├── DiagnosisPanel.tsx    # Results display
│   └── AutoFixButton.tsx     # Remediation trigger
```

---

## Example Scenarios

### Scenario 1: Rate Limited

**User sees:** "fetch failed" errors

**Diagnostic finds:**
- Container: running, healthy
- Logs: `429 Too Many Requests` from OpenAI
- Recent: 50 messages in 2 minutes

**Response:**
```json
{
  "status": "degraded",
  "issues": [{
    "id": "rate_limit",
    "severity": "warning",
    "title": "Temporarily Rate Limited",
    "description": "You've sent a lot of messages quickly. The AI provider needs a short break.",
    "autoFixable": false,
    "manualSteps": ["Wait 2-3 minutes", "Send shorter messages"]
  }],
  "recommendation": "Take a quick break — you'll be back online in a couple minutes."
}
```

### Scenario 2: Container Crash Loop

**User sees:** "Setting up..." never completes

**Diagnostic finds:**
- Container: restarting (5 times in 10 min)
- Logs: `Config invalid - models.providers.openai.apiKey undefined`
- Config: Missing API key

**Response:**
```json
{
  "status": "unhealthy",
  "issues": [{
    "id": "config_missing_key",
    "severity": "critical",
    "title": "Configuration Error",
    "description": "Your AI assistant couldn't start due to a configuration issue.",
    "autoFixable": true,
    "autoFixAction": "rebuild_config"
  }],
  "recommendation": "We found the issue! Click 'Fix' to repair your assistant."
}
```

### Scenario 3: Everything Fine

**User clicks help but nothing's wrong**

**Diagnostic finds:**
- Container: running, healthy
- Logs: Normal operation
- Last chat: 30 seconds ago, successful

**Response:**
```json
{
  "status": "healthy",
  "issues": [],
  "recommendation": "Your assistant is working normally! If you're experiencing issues, try refreshing the page or describing what's happening."
}
```

---

## Appendix: Diagnostic Prompt (Full)

```
You are a diagnostic AI for Clawer.ai, a managed AI assistant platform.

Users click "Get Help" when their AI assistant isn't working. Your job is to:
1. Analyze the diagnostic data
2. Identify what's wrong (if anything)
3. Explain it simply (users aren't technical)
4. Suggest fixes

## Rules
- Be concise — users want quick answers
- Use plain English — no jargon
- Be reassuring — most issues are temporary
- If uncertain, say so — don't guess
- Prioritize by severity — critical first

## Severity Levels
- warning: Minor issue, assistant still works
- error: Significant issue, some features broken
- critical: Assistant not working at all

## Auto-Fixable Means
The system can automatically fix it without user action. Only mark as autoFixable if you're confident the fix will work.

## Response Format
Always respond with valid JSON matching this schema:
{
  "issues": [...],
  "overallStatus": "healthy|degraded|unhealthy",
  "recommendation": "One friendly sentence for the user"
}

If no issues found, return empty issues array and status "healthy".
```
