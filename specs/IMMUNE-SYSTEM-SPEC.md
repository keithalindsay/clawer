# Immune System — Product Spec

**Product:** Clawer.ai Platform  
**Feature:** Immune System (Reliability & Trust Layer for AI Agents)  
**Status:** Spec for MVP Build  
**Target Ship:** 2-3 weeks  
**Author:** Lex (Sub-Agent)  
**Date:** 2026-02-11

---

## Problem Statement

### The Pain (Eric Siu's Thread)

Eric Siu spent weeks running OpenClaw agents and hit every reliability nightmare:

1. **Hallucinated outputs** — Agent says "I created the report and saved it to reports/daily.md" but the file doesn't exist
2. **Silent cron failures** — Morning digest supposed to run at 7am, but agent crashed at 6:58am and no one knows
3. **No feedback loops** — Agent keeps making the same mistakes because there's no approval/rejection mechanism
4. **Budget blowouts** — One rogue agent burned $47 in a single night on a task that should've cost $2
5. **No watchdog** — When agents stop working, you only find out when you manually check

**Eric's metrics after building manual fixes:**
- Deal of Day agent: 100% approval rate (working great)
- Oracle SEO agent: 67% approval rate (needs improvement)
- Morning Brief agent: Hasn't run in 3 days (dead, no alert)

### Why This Matters for Clawer.ai

**DIY OpenClaw users** like Eric have to build these fixes themselves. It takes weeks of painful debugging.

**Clawer.ai users** pay $49/mo expecting a **managed platform** — they shouldn't need to be devops engineers.

**Differentiation:** Built-in reliability that makes Clawer.ai feel like having a **manager for your AI team**, not just a container hosting service.

---

## Solution: The Immune System

A **platform-level reliability and trust layer** that:
- Verifies agent outputs (catches hallucinations)
- Self-heals cron failures (auto-retry with backoff)
- Learns from user feedback (approve/reject outputs)
- Enforces budget controls (prevents blowouts)
- Monitors agent health (watchdog for dead agents)

**Marketing angle:** "Your agents have a manager now."

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   CLAWER.AI WEB UI                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Agent Dash   │  │ Mission      │  │ Feedback     │  │
│  │ (chat view)  │  │ Control      │  │ Buttons      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ REST API
                            │
┌─────────────────────────────────────────────────────────┐
│                 IMMUNE SYSTEM (New Layer)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Output       │  │ Self-Healing │  │ Feedback     │  │
│  │ Verifier     │  │ Cron Monitor │  │ Loop Engine  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Budget       │  │ Watchdog /   │                    │
│  │ Controller   │  │ Health Check │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ Container API
                            │
┌─────────────────────────────────────────────────────────┐
│         OPENCLAW CONTAINER (Per User)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Agent 1      │  │ Agent 2      │  │ Agent N      │  │
│  │ (Max)        │  │ (Scout)      │  │ (Dash)       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ OpenClaw Gateway (runs in container)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ File System / DB
                            │
┌─────────────────────────────────────────────────────────┐
│                    PERSISTENT STORAGE                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ User Files   │  │ Agent Logs   │  │ Feedback DB  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key components:**
1. **Output Verifier** — Post-run checks (did files get created? does the API respond?)
2. **Self-Healing Cron Monitor** — Detects missed runs, auto-retries, weekly audits
3. **Feedback Loop Engine** — Thumbs up/down on outputs, persisted to agent memory
4. **Budget Controller** — Cost tracking, auto-downgrade, spending caps
5. **Watchdog / Mission Control** — Health dashboard, dead agent detection, alerts

---

## Subsystem 1: Output Verification Layer

### What It Does

**Catches hallucinated outputs** by verifying agent claims with actual system state.

**Example scenario:**
```
Agent: "I created the morning report and saved it to reports/2026-02-11.md"

Verifier checks:
✓ Does /home/user/clawd/reports/2026-02-11.md exist?
✓ Was it modified in the last 60 seconds?
✓ Is the file size > 0 bytes?

Result: VERIFIED ✅
```

**Another scenario:**
```
Agent: "I built the landing page and deployed it to http://localhost:3000"

Verifier checks:
✓ Is port 3000 listening?
✓ Does HTTP GET http://localhost:3000 return 200?
✓ Does the response body contain expected content?

Result: FAILED ❌ (port not listening)
→ Auto-retry (max 2 retries)
```

### How It Works

#### 1. Verification Triggers

**Automatic triggers:**
- Agent response contains file paths (e.g., "saved to reports/X.md")
- Agent response contains URLs (e.g., "deployed to http://...")
- Agent response contains claims ("I created...", "I sent...", "I built...")

**Manual triggers:**
- User clicks "Verify Output" button in dashboard
- Cron job completion (always verify scheduled tasks)

#### 2. Verification Types

##### A. Filesystem Verification
```typescript
interface FileVerification {
  type: 'filesystem';
  expectedPath: string;  // extracted from agent response
  checks: {
    exists: boolean;
    modifiedWithinSeconds: number;  // default 60
    minSizeBytes: number;  // default 1 (non-empty)
  };
}
```

**Implementation:**
```typescript
async function verifyFilesystem(
  containerPath: string,
  checks: FileVerification['checks']
): Promise<VerificationResult> {
  const stat = await fs.stat(containerPath).catch(() => null);
  
  if (!stat) {
    return { passed: false, reason: 'File does not exist' };
  }
  
  const age = Date.now() - stat.mtimeMs;
  if (age > checks.modifiedWithinSeconds * 1000) {
    return { passed: false, reason: `File not modified recently (${age}ms ago)` };
  }
  
  if (stat.size < checks.minSizeBytes) {
    return { passed: false, reason: `File too small (${stat.size} bytes)` };
  }
  
  return { passed: true, confidence: 0.95 };
}
```

##### B. HTTP Endpoint Verification
```typescript
interface EndpointVerification {
  type: 'http';
  url: string;  // extracted from agent response
  checks: {
    expectedStatus: number;  // default 200
    expectedBodyContains?: string[];
    timeoutMs: number;  // default 5000
  };
}
```

**Implementation:**
```typescript
async function verifyEndpoint(
  url: string,
  checks: EndpointVerification['checks']
): Promise<VerificationResult> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(checks.timeoutMs) 
    });
    
    if (response.status !== checks.expectedStatus) {
      return { 
        passed: false, 
        reason: `Got status ${response.status}, expected ${checks.expectedStatus}` 
      };
    }
    
    if (checks.expectedBodyContains) {
      const body = await response.text();
      for (const substring of checks.expectedBodyContains) {
        if (!body.includes(substring)) {
          return { passed: false, reason: `Body missing "${substring}"` };
        }
      }
    }
    
    return { passed: true, confidence: 0.90 };
  } catch (err) {
    return { passed: false, reason: `Request failed: ${err.message}` };
  }
}
```

##### C. Claim Extraction (NLP-lite)
```typescript
function extractClaims(agentResponse: string): VerificationCheck[] {
  const checks: VerificationCheck[] = [];
  
  // File path extraction: "saved to X", "created X", "wrote X"
  const filePatterns = [
    /saved (?:to|at) ([^\s]+\.(?:md|json|txt|csv))/gi,
    /created ([^\s]+\.(?:md|json|txt|csv))/gi,
    /wrote ([^\s]+\.(?:md|json|txt|csv))/gi,
  ];
  
  for (const pattern of filePatterns) {
    const matches = [...agentResponse.matchAll(pattern)];
    for (const match of matches) {
      checks.push({
        type: 'filesystem',
        expectedPath: match[1],
        checks: { exists: true, modifiedWithinSeconds: 60, minSizeBytes: 1 },
      });
    }
  }
  
  // URL extraction: "deployed to http://...", "running at http://..."
  const urlPattern = /(?:deployed to|running at|available at) (https?:\/\/[^\s]+)/gi;
  const urlMatches = [...agentResponse.matchAll(urlPattern)];
  for (const match of urlMatches) {
    checks.push({
      type: 'http',
      url: match[1],
      checks: { expectedStatus: 200, timeoutMs: 5000 },
    });
  }
  
  return checks;
}
```

#### 3. Confidence Scoring

```typescript
interface VerificationResult {
  passed: boolean;
  confidence: number;  // 0.0 - 1.0
  reason?: string;
  details?: Record<string, unknown>;
}

function aggregateConfidence(results: VerificationResult[]): number {
  if (results.length === 0) return 0.5;  // no checks = ambiguous
  
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const allPassed = results.every(r => r.passed);
  
  return allPassed ? avgConfidence : Math.min(avgConfidence, 0.3);
}
```

**Confidence tiers:**
- **0.9-1.0:** High confidence (all checks passed, strong signals)
- **0.7-0.9:** Medium confidence (most checks passed)
- **0.4-0.7:** Ambiguous (mixed results or no checks available)
- **0.0-0.4:** Low confidence (checks failed or strong negative signals)

#### 4. Auto-Retry on Failure

**Policy:**
- If verification fails (confidence < 0.4), retry the agent task
- Max 2 retries per task
- On 3rd failure, alert user and log to Mission Control

```typescript
async function verifyWithRetry(
  taskId: string,
  agentId: string,
  originalPrompt: string,
  maxRetries = 2
): Promise<TaskResult> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    // Run agent task
    const response = await runAgentTask(agentId, originalPrompt);
    
    // Verify output
    const checks = extractClaims(response);
    const results = await Promise.all(checks.map(runVerification));
    const confidence = aggregateConfidence(results);
    
    if (confidence >= 0.7) {
      // Success!
      await logVerification(taskId, { attempt, confidence, passed: true });
      return { success: true, response, confidence };
    }
    
    // Failed verification
    await logVerification(taskId, { attempt, confidence, passed: false });
    
    if (attempt === maxRetries) {
      // Final failure - alert user
      await alertUser(agentId, {
        title: 'Agent task failed verification',
        body: `${agentId} failed to produce verified output after ${maxRetries + 1} attempts`,
        taskId,
      });
      return { success: false, response, confidence };
    }
    
    attempt++;
    await sleep(2000 * attempt);  // exponential backoff
  }
}
```

### API Surface

#### New Endpoints

**POST `/api/immune/verify`**
```typescript
// Trigger manual verification
{
  agentId: string;
  taskId: string;
  response: string;  // agent's output to verify
}

// Response
{
  passed: boolean;
  confidence: number;
  checks: Array<{ type: string; passed: boolean; reason?: string }>;
}
```

**GET `/api/immune/verification-history?agentId=X&limit=20`**
```typescript
// Fetch verification history for an agent
{
  verifications: Array<{
    taskId: string;
    timestamp: string;
    confidence: number;
    passed: boolean;
    checks: VerificationCheck[];
  }>;
}
```

### Database Schema

#### New Table: `agent_verifications`
```sql
CREATE TABLE agent_verifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  task_id UUID NOT NULL,
  thread_id UUID REFERENCES agent_threads(id),
  
  -- Verification metadata
  attempt INT NOT NULL DEFAULT 1,
  passed BOOLEAN NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,  -- 0.00 - 1.00
  
  -- Checks performed
  checks JSONB NOT NULL,  -- array of VerificationCheck objects
  results JSONB NOT NULL,  -- array of VerificationResult objects
  
  -- Context
  agent_response TEXT NOT NULL,
  verification_trigger VARCHAR(50),  -- 'auto' | 'manual' | 'cron'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_agent_verifications_user_agent (user_id, agent_id),
  INDEX idx_agent_verifications_passed (user_id, passed)
);
```

### UI Components

#### 1. Verification Badge (in chat messages)
```tsx
<MessageBubble>
  <AgentResponse>{response.text}</AgentResponse>
  
  {response.verification && (
    <VerificationBadge 
      confidence={response.verification.confidence}
      passed={response.verification.passed}
    />
  )}
</MessageBubble>

// VerificationBadge component
function VerificationBadge({ confidence, passed }) {
  if (confidence >= 0.9 && passed) {
    return <Badge color="green">✓ Verified</Badge>;
  }
  if (confidence >= 0.7 && passed) {
    return <Badge color="yellow">⚠ Partially verified</Badge>;
  }
  if (!passed) {
    return <Badge color="red">✗ Verification failed</Badge>;
  }
  return <Badge color="gray">? Unverified</Badge>;
}
```

#### 2. Verification Details Modal
```tsx
// Click badge to see details
<Modal title="Verification Details">
  <div>
    <p>Confidence: {confidence * 100}%</p>
    <h4>Checks:</h4>
    <ul>
      {checks.map(check => (
        <li key={check.type}>
          {check.passed ? '✓' : '✗'} {check.type}: {check.reason || 'OK'}
        </li>
      ))}
    </ul>
  </div>
</Modal>
```

---

## Subsystem 2: Self-Healing Cron System

### What It Does

**Monitors scheduled jobs** and auto-heals when they fail or miss their expected window.

**Example scenario:**
```
Agent: "Morning Brief" (Max, Chief of Staff)
Expected: Every day at 7:00 AM
Tolerance: ±15 minutes

Timeline:
- Feb 11, 7:02 AM: Ran successfully ✓
- Feb 12, 7:05 AM: Ran successfully ✓
- Feb 13, [MISSED]: No output detected by 9:00 AM

Self-Healing Cron Monitor:
1. Detects missed run at 9:00 AM (2hr past expected window)
2. Triggers auto-retry with exponential backoff
3. Attempt 1: 9:05 AM → Success ✓
4. Logs incident to Mission Control
5. Alerts user: "Morning Brief missed scheduled run, auto-recovered"
```

### How It Works

#### 1. Cron Job Registry

**Data model:**
```typescript
interface CronJob {
  id: string;
  userId: string;
  agentId: string;
  name: string;  // e.g., "Morning Brief"
  
  // Schedule
  schedule: string;  // cron expression: "0 7 * * *"
  timezone: string;  // user's timezone
  
  // Monitoring config
  expectedWindowMinutes: number;  // how late is still OK? (default: 15)
  missedThresholdHours: number;  // when to trigger alert (default: 2)
  
  // Health tracking
  lastRun: Date | null;
  lastSuccess: Date | null;
  consecutiveFailures: number;
  
  // Auto-heal config
  autoRetry: boolean;  // default: true
  maxRetries: number;  // default: 3
  
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Cron Monitor Service (Background Worker)

**Runs every 5 minutes:**
```typescript
async function monitorCronJobs() {
  const now = new Date();
  const jobs = await db.cronJobs.findAll({ enabled: true });
  
  for (const job of jobs) {
    const nextExpected = cronParser.parseExpression(job.schedule, {
      currentDate: job.lastRun || new Date(0),
      tz: job.timezone,
    }).next().toDate();
    
    const missedBy = now.getTime() - nextExpected.getTime();
    const missedThresholdMs = job.missedThresholdHours * 60 * 60 * 1000;
    
    // Check if job is overdue
    if (missedBy > missedThresholdMs) {
      await handleMissedJob(job, missedBy);
    }
  }
}
```

#### 3. Auto-Retry with Exponential Backoff

```typescript
async function handleMissedJob(job: CronJob, missedByMs: number) {
  // Log incident
  await db.cronIncidents.create({
    jobId: job.id,
    userId: job.userId,
    type: 'missed_run',
    missedByMs,
    detectedAt: new Date(),
  });
  
  if (!job.autoRetry) {
    // Just alert, don't retry
    await alertUser(job.userId, {
      title: `${job.name} missed scheduled run`,
      body: `Expected at ${formatTime(nextExpected)}, detected at ${formatTime(now)}`,
    });
    return;
  }
  
  // Auto-retry with exponential backoff
  let attempt = 0;
  let success = false;
  
  while (attempt < job.maxRetries && !success) {
    const delay = Math.pow(2, attempt) * 60 * 1000;  // 1min, 2min, 4min
    await sleep(delay);
    
    try {
      await triggerAgentTask(job.agentId, job.userId, {
        type: 'cron',
        jobId: job.id,
        attempt: attempt + 1,
      });
      
      success = true;
      
      await db.cronJobs.update(job.id, {
        lastRun: new Date(),
        lastSuccess: new Date(),
        consecutiveFailures: 0,
      });
      
      await alertUser(job.userId, {
        title: `${job.name} auto-recovered`,
        body: `Missed scheduled run but succeeded on retry ${attempt + 1}`,
        priority: 'low',
      });
      
    } catch (err) {
      await db.cronIncidents.update({
        jobId: job.id,
        attempt: attempt + 1,
        error: err.message,
      });
    }
    
    attempt++;
  }
  
  // Final failure
  if (!success) {
    await db.cronJobs.update(job.id, {
      consecutiveFailures: job.consecutiveFailures + 1,
    });
    
    await alertUser(job.userId, {
      title: `${job.name} failed after ${job.maxRetries} retries`,
      body: 'Cron job requires manual intervention',
      priority: 'high',
    });
  }
}
```

#### 4. Weekly Audit Job (Sunday Nights)

**Runs every Sunday at 10:00 PM:**
```typescript
async function weeklyAuditJob() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const allJobs = await db.cronJobs.findAll({ enabled: true });
  
  for (const job of allJobs) {
    // Calculate expected runs in the last week
    const schedule = cronParser.parseExpression(job.schedule, { tz: job.timezone });
    const expectedRuns = [];
    
    let nextRun = schedule.next().toDate();
    while (nextRun < now && nextRun > weekAgo) {
      expectedRuns.push(nextRun);
      nextRun = schedule.next().toDate();
    }
    
    // Count actual runs
    const actualRuns = await db.taskLogs.count({
      where: { jobId: job.id, createdAt: { gte: weekAgo } },
    });
    
    const reliability = actualRuns / expectedRuns.length;
    
    // Store weekly stats
    await db.cronWeeklyStats.create({
      jobId: job.id,
      userId: job.userId,
      weekStart: weekAgo,
      expectedRuns: expectedRuns.length,
      actualRuns,
      reliability,
    });
    
    // Alert on low reliability
    if (reliability < 0.8) {
      await alertUser(job.userId, {
        title: `${job.name} reliability below 80%`,
        body: `Only ${actualRuns}/${expectedRuns.length} runs succeeded this week`,
        priority: 'medium',
      });
    }
  }
}
```

#### 5. Cron Reliability Score

**Per-job metric:**
```typescript
function calculateReliabilityScore(job: CronJob): number {
  const last30Days = await db.cronWeeklyStats.findAll({
    where: { jobId: job.id },
    limit: 4,  // ~30 days
    orderBy: { weekStart: 'desc' },
  });
  
  const avgReliability = last30Days.reduce((sum, stat) => sum + stat.reliability, 0) / last30Days.length;
  
  return Math.round(avgReliability * 100);  // 0-100%
}
```

**Platform-wide metric:**
```typescript
function calculatePlatformReliability(userId: string): number {
  const jobs = await db.cronJobs.findAll({ userId });
  const scores = await Promise.all(jobs.map(calculateReliabilityScore));
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}
```

### API Surface

#### New Endpoints

**GET `/api/immune/cron-jobs`**
```typescript
// List all user's cron jobs
{
  jobs: Array<{
    id: string;
    name: string;
    agentId: string;
    schedule: string;
    nextRun: string;
    lastRun: string | null;
    reliabilityScore: number;  // 0-100
    status: 'healthy' | 'degraded' | 'failed';
  }>;
  platformReliability: number;
}
```

**POST `/api/immune/cron-jobs/:id/trigger`**
```typescript
// Manually trigger a cron job
{
  jobId: string;
}

// Response
{
  taskId: string;
  status: 'running' | 'completed' | 'failed';
}
```

**GET `/api/immune/cron-incidents?agentId=X&limit=10`**
```typescript
// Fetch recent cron incidents
{
  incidents: Array<{
    jobId: string;
    type: 'missed_run' | 'failed_retry' | 'timeout';
    timestamp: string;
    missedByMs: number;
    recovered: boolean;
  }>;
}
```

### Database Schema

#### New Table: `cron_jobs`
```sql
CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  
  -- Schedule
  schedule VARCHAR(100) NOT NULL,  -- cron expression
  timezone VARCHAR(50) NOT NULL,
  
  -- Monitoring
  expected_window_minutes INT DEFAULT 15,
  missed_threshold_hours INT DEFAULT 2,
  
  -- Health
  last_run TIMESTAMP,
  last_success TIMESTAMP,
  consecutive_failures INT DEFAULT 0,
  
  -- Auto-heal
  auto_retry BOOLEAN DEFAULT TRUE,
  max_retries INT DEFAULT 3,
  
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_cron_jobs_user (user_id),
  INDEX idx_cron_jobs_next_run (enabled, last_run)
);
```

#### New Table: `cron_incidents`
```sql
CREATE TABLE cron_incidents (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES cron_jobs(id),
  user_id UUID NOT NULL,
  
  type VARCHAR(50) NOT NULL,  -- 'missed_run' | 'failed_retry' | 'timeout'
  missed_by_ms BIGINT,
  attempt INT DEFAULT 1,
  error TEXT,
  recovered BOOLEAN DEFAULT FALSE,
  
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  
  INDEX idx_cron_incidents_job (job_id),
  INDEX idx_cron_incidents_user (user_id, detected_at)
);
```

#### New Table: `cron_weekly_stats`
```sql
CREATE TABLE cron_weekly_stats (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES cron_jobs(id),
  user_id UUID NOT NULL,
  
  week_start TIMESTAMP NOT NULL,
  expected_runs INT NOT NULL,
  actual_runs INT NOT NULL,
  reliability DECIMAL(3,2) NOT NULL,  -- 0.00 - 1.00
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_cron_weekly_stats_job (job_id, week_start)
);
```

### UI Components

#### 1. Cron Reliability Widget (Mission Control)
```tsx
<Card title="Scheduled Jobs">
  <div className="reliability-score">
    <CircularProgress value={platformReliability} />
    <p>{platformReliability}% reliability</p>
  </div>
  
  <ul className="job-list">
    {jobs.map(job => (
      <li key={job.id}>
        <div className="job-header">
          <strong>{job.name}</strong>
          <Badge color={getStatusColor(job.status)}>{job.status}</Badge>
        </div>
        <div className="job-meta">
          <span>Next run: {formatTime(job.nextRun)}</span>
          <span>{job.reliabilityScore}% reliable</span>
        </div>
      </li>
    ))}
  </ul>
</Card>
```

#### 2. Incident Timeline
```tsx
<Card title="Recent Incidents">
  {incidents.map(incident => (
    <div key={incident.id} className="incident">
      <Icon type={incident.recovered ? 'checkCircle' : 'alertCircle'} />
      <div>
        <strong>{incident.type}</strong>
        <p>{formatIncident(incident)}</p>
        <time>{formatRelative(incident.timestamp)}</time>
      </div>
    </div>
  ))}
</Card>
```

---

## Subsystem 3: Feedback Loop Engine

### What It Does

**Captures user approval/rejection of agent outputs** and feeds it back into agent context for continuous improvement.

**Example scenario:**
```
User receives Morning Brief from Max (Chief of Staff):

Morning Brief - Feb 11, 2026
✓ Top priority: Finish Clawer.ai Immune System spec
✓ Meetings: None today
✓ Reminders: Call dentist by 5pm

[👍 Approve] [👎 Reject]

User clicks 👍

→ Feedback stored: { agentId: 'chief-of-staff', taskType: 'morning_brief', approved: true }
→ Max's approval rate: 95% (19/20 approved)
```

**Next day, Max reads feedback history before generating new brief:**
```
System: Your recent feedback:
- 19/20 morning briefs approved
- User feedback: "Love the format, keep it concise"
- 1 rejection: "Too many reminders, focus on top 3 priorities"

Max (generating new brief): [adjusts to be more concise, limits to top 3 priorities]
```

### How It Works

#### 1. Feedback Capture

**Implicit feedback mechanisms:**
- Thumbs up/down buttons on every agent message
- User edits agent output (treated as implicit rejection)
- User ignores agent output for >24hr (weak negative signal)

**Explicit feedback mechanisms:**
- User comments on agent output ("This is great!" → positive)
- User flags output as incorrect/harmful → strong negative

#### 2. Feedback Storage

**Per-agent feedback.json:**
```json
{
  "agentId": "chief-of-staff",
  "userId": "user-uuid",
  "totalOutputs": 45,
  "approvedOutputs": 42,
  "rejectedOutputs": 3,
  "approvalRate": 0.93,
  "feedback": [
    {
      "id": "feedback-uuid",
      "taskId": "task-uuid",
      "taskType": "morning_brief",
      "timestamp": "2026-02-11T07:05:00Z",
      "approved": true,
      "comment": "Perfect, keep it up!",
      "outputSnippet": "Morning Brief - Feb 11..."
    },
    {
      "id": "feedback-uuid",
      "taskId": "task-uuid",
      "taskType": "weekly_review",
      "timestamp": "2026-02-09T10:00:00Z",
      "approved": false,
      "comment": "Too long, I need a summary at the top",
      "outputSnippet": "Weekly Review - Week of Feb 3..."
    }
  ]
}
```

#### 3. Feedback Injection (Pre-Generation)

**Before agent generates output, inject feedback context:**
```typescript
async function buildAgentPrompt(
  agentId: string,
  userId: string,
  userPrompt: string
): Promise<string> {
  const feedback = await loadAgentFeedback(agentId, userId);
  
  let systemPrompt = buildAgentSystemPrompt(agentId);  // from teams.ts
  
  if (feedback && feedback.totalOutputs > 0) {
    systemPrompt += `\n\n## Your Recent Performance\n`;
    systemPrompt += `- Approval rate: ${Math.round(feedback.approvalRate * 100)}% (${feedback.approvedOutputs}/${feedback.totalOutputs})\n`;
    
    // Include recent feedback (last 5 items)
    const recentFeedback = feedback.feedback.slice(-5).reverse();
    
    if (recentFeedback.length > 0) {
      systemPrompt += `\n### Recent User Feedback:\n`;
      for (const item of recentFeedback) {
        const verdict = item.approved ? '✓ Approved' : '✗ Rejected';
        systemPrompt += `- ${verdict}: "${item.comment || 'No comment'}"\n`;
        if (!item.approved && item.outputSnippet) {
          systemPrompt += `  What you said: "${truncate(item.outputSnippet, 100)}"\n`;
        }
      }
    }
    
    systemPrompt += `\nAdjust your approach based on this feedback. Prioritize patterns the user approves.\n`;
  }
  
  return systemPrompt;
}
```

#### 4. Approval Rate Tracking

**Per-agent metrics:**
```typescript
interface AgentPerformanceMetrics {
  agentId: string;
  approvalRate: number;  // 0.0 - 1.0
  totalFeedback: number;
  last7Days: {
    approvalRate: number;
    totalFeedback: number;
  };
  byTaskType: Record<string, {
    approvalRate: number;
    totalFeedback: number;
  }>;
}
```

**Platform-wide leaderboard:**
```typescript
async function getAgentLeaderboard(userId: string): Promise<AgentRanking[]> {
  const agents = await db.agentThreads.findAll({ userId });
  
  const rankings = await Promise.all(
    agents.map(async (agent) => {
      const feedback = await loadAgentFeedback(agent.agentId, userId);
      return {
        agentId: agent.agentId,
        name: getAgentName(agent.agentId),
        approvalRate: feedback.approvalRate,
        totalFeedback: feedback.totalOutputs,
      };
    })
  );
  
  return rankings.sort((a, b) => b.approvalRate - a.approvalRate);
}
```

#### 5. Low-Performing Agent Alerts

**Weekly review (Sunday nights):**
```typescript
async function reviewAgentPerformance(userId: string) {
  const agents = await getAgentLeaderboard(userId);
  
  const lowPerformers = agents.filter(
    a => a.approvalRate < 0.7 && a.totalFeedback >= 5
  );
  
  if (lowPerformers.length > 0) {
    await alertUser(userId, {
      title: 'Some agents need attention',
      body: `${lowPerformers.map(a => a.name).join(', ')} have <70% approval rates. Consider reviewing their outputs.`,
      priority: 'low',
    });
  }
}
```

### API Surface

#### New Endpoints

**POST `/api/immune/feedback`**
```typescript
// Submit feedback on agent output
{
  agentId: string;
  taskId: string;
  approved: boolean;
  comment?: string;
}

// Response
{
  success: true;
  newApprovalRate: number;
}
```

**GET `/api/immune/feedback/agent/:agentId`**
```typescript
// Get feedback history for an agent
{
  agentId: string;
  approvalRate: number;
  totalOutputs: number;
  feedback: Array<{
    taskId: string;
    timestamp: string;
    approved: boolean;
    comment: string;
  }>;
}
```

**GET `/api/immune/feedback/leaderboard`**
```typescript
// Get agent performance leaderboard
{
  agents: Array<{
    agentId: string;
    name: string;
    approvalRate: number;
    totalFeedback: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
}
```

### Database Schema

#### New Table: `agent_feedback`
```sql
CREATE TABLE agent_feedback (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  task_id UUID NOT NULL,
  thread_id UUID REFERENCES agent_threads(id),
  
  approved BOOLEAN NOT NULL,
  comment TEXT,
  output_snippet TEXT,  -- first 500 chars of agent output
  
  task_type VARCHAR(50),  -- e.g., 'morning_brief', 'research', 'draft_email'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_agent_feedback_user_agent (user_id, agent_id),
  INDEX idx_agent_feedback_approval (user_id, approved)
);
```

#### New Table: `agent_performance_snapshots`
```sql
CREATE TABLE agent_performance_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id VARCHAR(50) NOT NULL,
  
  snapshot_date DATE NOT NULL,
  approval_rate DECIMAL(3,2) NOT NULL,
  total_feedback INT NOT NULL,
  approved_count INT NOT NULL,
  rejected_count INT NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_agent_performance_user_agent (user_id, agent_id, snapshot_date)
);
```

### UI Components

#### 1. Feedback Buttons (on agent messages)
```tsx
<MessageBubble agent={agent}>
  <AgentResponse>{response.text}</AgentResponse>
  
  <FeedbackActions>
    <Button 
      onClick={() => submitFeedback(agent.id, task.id, true)}
      variant="ghost"
    >
      👍 Approve
    </Button>
    <Button 
      onClick={() => submitFeedback(agent.id, task.id, false)}
      variant="ghost"
    >
      👎 Reject
    </Button>
  </FeedbackActions>
</MessageBubble>
```

#### 2. Agent Performance Card (Mission Control)
```tsx
<Card title="Agent Performance">
  <table>
    <thead>
      <tr>
        <th>Agent</th>
        <th>Approval Rate</th>
        <th>Total Feedback</th>
        <th>Trend</th>
      </tr>
    </thead>
    <tbody>
      {leaderboard.map(agent => (
        <tr key={agent.agentId}>
          <td>{agent.name}</td>
          <td>
            <ProgressBar value={agent.approvalRate * 100} />
            {Math.round(agent.approvalRate * 100)}%
          </td>
          <td>{agent.totalFeedback}</td>
          <td>
            <TrendIndicator trend={agent.trend} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</Card>
```

#### 3. Feedback Detail Modal
```tsx
<Modal title={`${agent.name} Feedback History`}>
  <div className="approval-summary">
    <CircularProgress value={agent.approvalRate * 100} />
    <p>{agent.approvedCount} approved, {agent.rejectedCount} rejected</p>
  </div>
  
  <h4>Recent Feedback</h4>
  <ul>
    {feedback.map(item => (
      <li key={item.id}>
        <div className="feedback-verdict">
          {item.approved ? '✓ Approved' : '✗ Rejected'}
          <time>{formatRelative(item.timestamp)}</time>
        </div>
        {item.comment && <p className="comment">{item.comment}</p>}
        <details>
          <summary>Show output</summary>
          <pre>{item.outputSnippet}</pre>
        </details>
      </li>
    ))}
  </ul>
</Modal>
```

---

## Subsystem 4: Budget Controls & Smart Routing

### What It Does

**Prevents budget blowouts** by tracking costs per task, auto-downgrading models when limits are hit, and enforcing spending caps.

**Example scenario:**
```
User's monthly budget: $50
Current spend: $42

Agent "Scout" (Researcher) starts a task:
- Estimated cost (using gpt-4o-mini): $0.15
- Safe to proceed ✓

Agent "Max" (Chief of Staff) tries to run a complex analysis:
- Estimated cost (using gpt-4o-mini): $2.50
- Total would be $44.50, still under $50 ✓
- Proceeds with gpt-4o-mini

Next task from "Dash" (Task Runner):
- Estimated cost: $1.80
- Total would be $46.30, getting close to limit
- Budget Controller: Auto-downgrade to gemini-2.0-flash-lite ($0.45)
- User alerted: "Budget nearing limit, using cheaper model"

After hitting $50:
- All agents downgraded to gemini-2.0-flash-lite
- User alerted: "Monthly budget reached, switched to economy mode"
```

### How It Works

#### 1. Cost Tracking (Per Task)

**Integration with Smart Router:**
```typescript
async function runAgentTask(
  agentId: string,
  userId: string,
  prompt: string
): Promise<TaskResult> {
  // Get user's budget config
  const budgetConfig = await db.userBudgets.findOne({ userId });
  const currentSpend = await calculateMonthlySpend(userId);
  
  // Route to optimal model (using existing Smart Router)
  const routing = routeRequest({
    prompt,
    userOrchestratorModel: budgetConfig.orchestratorModel,
    userWorkerModel: budgetConfig.workerModel,
  });
  
  // Check if this task would exceed budget
  const wouldExceed = (currentSpend + routing.costEstimate) > budgetConfig.monthlyLimit;
  
  if (wouldExceed && !budgetConfig.allowOverage) {
    // Downgrade to cheapest available model
    const cheapestModel = await getCheapestModel();
    routing.model = cheapestModel;
    routing.costEstimate = estimateCost(prompt, cheapestModel);
    
    await alertUser(userId, {
      title: 'Budget limit reached',
      body: `Switched to ${cheapestModel} to stay within budget`,
      priority: 'medium',
    });
  }
  
  // Run task
  const result = await executeTask(agentId, prompt, routing.model);
  
  // Track actual cost
  await db.taskCosts.create({
    userId,
    agentId,
    taskId: result.taskId,
    model: routing.model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedCost: routing.costEstimate,
    actualCost: calculateActualCost(result.usage, routing.model),
  });
  
  return result;
}
```

#### 2. Per-Agent Cost Caps

**User can set spending limits per agent:**
```typescript
interface AgentBudgetCap {
  agentId: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
}

async function checkAgentBudget(
  agentId: string,
  userId: string,
  estimatedCost: number
): Promise<{ allowed: boolean; reason?: string }> {
  const cap = await db.agentBudgetCaps.findOne({ userId, agentId });
  
  if (!cap) return { allowed: true };
  
  const now = new Date();
  const todaySpend = await calculateAgentSpend(agentId, userId, 'today');
  const weekSpend = await calculateAgentSpend(agentId, userId, 'week');
  const monthSpend = await calculateAgentSpend(agentId, userId, 'month');
  
  if (cap.dailyLimit && (todaySpend + estimatedCost) > cap.dailyLimit) {
    return { allowed: false, reason: `Daily limit ($${cap.dailyLimit}) reached` };
  }
  
  if (cap.weeklyLimit && (weekSpend + estimatedCost) > cap.weeklyLimit) {
    return { allowed: false, reason: `Weekly limit ($${cap.weeklyLimit}) reached` };
  }
  
  if (cap.monthlyLimit && (monthSpend + estimatedCost) > cap.monthlyLimit) {
    return { allowed: false, reason: `Monthly limit ($${cap.monthlyLimit}) reached` };
  }
  
  return { allowed: true };
}
```

#### 3. Auto-Downgrade Cascade

**Model tiers (by cost):**
1. **Tier 1 (Premium):** `claude-opus-4-5` ($15/M input, $75/M output)
2. **Tier 2 (Standard):** `gpt-4o-mini` ($0.15/M input, $0.60/M output)
3. **Tier 3 (Economy):** `gemini-2.0-flash-lite` ($0.075/M input, $0.30/M output)

**Downgrade policy:**
```typescript
function selectModelByBudget(
  estimatedCost: number,
  remainingBudget: number,
  userPreferredModel: string
): string {
  const models = [
    { id: 'claude-opus-4-5', tier: 'premium', costMultiplier: 1.0 },
    { id: 'gpt-4o-mini', tier: 'standard', costMultiplier: 0.1 },
    { id: 'gemini-2.0-flash-lite', tier: 'economy', costMultiplier: 0.05 },
  ];
  
  // If remaining budget is low (<20%), force economy
  if (remainingBudget < 10) {
    return models.find(m => m.tier === 'economy')!.id;
  }
  
  // If task cost is >$1, downgrade to standard
  if (estimatedCost > 1.0 && userPreferredModel !== 'claude-opus-4-5') {
    return models.find(m => m.tier === 'standard')!.id;
  }
  
  return userPreferredModel;
}
```

#### 4. Cost Alerts

**Trigger alerts at spending thresholds:**
```typescript
async function checkBudgetThresholds(userId: string, newSpend: number) {
  const budget = await db.userBudgets.findOne({ userId });
  const totalSpend = await calculateMonthlySpend(userId);
  
  const percentUsed = (totalSpend / budget.monthlyLimit) * 100;
  
  // Alert at 50%, 80%, 90%, 100%
  const thresholds = [
    { percent: 50, priority: 'low', alerted: budget.alerted50 },
    { percent: 80, priority: 'medium', alerted: budget.alerted80 },
    { percent: 90, priority: 'high', alerted: budget.alerted90 },
    { percent: 100, priority: 'high', alerted: budget.alerted100 },
  ];
  
  for (const threshold of thresholds) {
    if (percentUsed >= threshold.percent && !threshold.alerted) {
      await alertUser(userId, {
        title: `${threshold.percent}% of monthly budget used`,
        body: `You've spent $${totalSpend.toFixed(2)} of $${budget.monthlyLimit}`,
        priority: threshold.priority,
      });
      
      await db.userBudgets.update(userId, {
        [`alerted${threshold.percent}`]: true,
      });
    }
  }
}
```

#### 5. Cost Dashboard

**Per-agent spending breakdown:**
```typescript
async function getSpendingBreakdown(userId: string): Promise<SpendingReport> {
  const agents = await db.agentThreads.findAll({ userId });
  
  const breakdown = await Promise.all(
    agents.map(async (agent) => {
      const tasks = await db.taskCosts.findAll({
        where: { userId, agentId: agent.agentId },
      });
      
      return {
        agentId: agent.agentId,
        name: getAgentName(agent.agentId),
        totalCost: tasks.reduce((sum, t) => sum + t.actualCost, 0),
        taskCount: tasks.length,
        avgCostPerTask: tasks.reduce((sum, t) => sum + t.actualCost, 0) / tasks.length,
        mostExpensiveTask: tasks.sort((a, b) => b.actualCost - a.actualCost)[0],
      };
    })
  );
  
  return {
    totalSpend: breakdown.reduce((sum, a) => sum + a.totalCost, 0),
    byAgent: breakdown.sort((a, b) => b.totalCost - a.totalCost),
  };
}
```

### API Surface

#### New Endpoints

**GET `/api/immune/budget/status`**
```typescript
// Get current budget status
{
  monthlyLimit: number;
  currentSpend: number;
  remainingBudget: number;
  percentUsed: number;
  topSpendingAgents: Array<{ agentId: string; name: string; cost: number }>;
  recentAlerts: Array<{ message: string; timestamp: string }>;
}
```

**POST `/api/immune/budget/caps`**
```typescript
// Set agent-specific budget caps
{
  agentId: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
}
```

**GET `/api/immune/budget/breakdown?period=month`**
```typescript
// Get spending breakdown by agent/task
{
  period: 'day' | 'week' | 'month';
  totalSpend: number;
  byAgent: Array<{
    agentId: string;
    name: string;
    totalCost: number;
    taskCount: number;
    avgCostPerTask: number;
  }>;
  byTaskType: Array<{
    taskType: string;
    totalCost: number;
    count: number;
  }>;
}
```

**GET `/api/immune/budget/expensive-tasks?limit=10`**
```typescript
// Get most expensive tasks (for review)
{
  tasks: Array<{
    taskId: string;
    agentId: string;
    timestamp: string;
    model: string;
    actualCost: number;
    inputTokens: number;
    outputTokens: number;
    prompt: string;  // truncated
  }>;
}
```

### Database Schema

#### New Table: `user_budgets`
```sql
CREATE TABLE user_budgets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  
  monthly_limit DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  allow_overage BOOLEAN DEFAULT FALSE,
  
  -- Model preferences
  orchestrator_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  worker_model VARCHAR(50) DEFAULT 'gemini-2.0-flash-lite',
  
  -- Alert tracking (reset monthly)
  alerted_50 BOOLEAN DEFAULT FALSE,
  alerted_80 BOOLEAN DEFAULT FALSE,
  alerted_90 BOOLEAN DEFAULT FALSE,
  alerted_100 BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### New Table: `agent_budget_caps`
```sql
CREATE TABLE agent_budget_caps (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  
  daily_limit DECIMAL(10,2),
  weekly_limit DECIMAL(10,2),
  monthly_limit DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, agent_id)
);
```

#### New Table: `task_costs`
```sql
CREATE TABLE task_costs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  task_id UUID NOT NULL,
  thread_id UUID REFERENCES agent_threads(id),
  
  model VARCHAR(50) NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  
  estimated_cost DECIMAL(10,6) NOT NULL,
  actual_cost DECIMAL(10,6) NOT NULL,
  
  task_type VARCHAR(50),  -- e.g., 'morning_brief', 'research'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_task_costs_user (user_id, created_at),
  INDEX idx_task_costs_agent (agent_id, created_at)
);
```

#### New Table: `budget_alerts`
```sql
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  
  alert_type VARCHAR(50) NOT NULL,  -- '50_percent' | '80_percent' | 'limit_hit' | 'agent_cap'
  message TEXT NOT NULL,
  threshold_amount DECIMAL(10,2),
  current_spend DECIMAL(10,2),
  
  acknowledged BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_budget_alerts_user (user_id, acknowledged)
);
```

### UI Components

#### 1. Budget Status Widget (Mission Control)
```tsx
<Card title="Budget">
  <div className="budget-overview">
    <CircularProgress 
      value={(currentSpend / monthlyLimit) * 100}
      color={getStatusColor(percentUsed)}
    />
    <div className="budget-numbers">
      <p className="spent">${currentSpend.toFixed(2)}</p>
      <p className="limit">of ${monthlyLimit}</p>
      <p className="remaining">${remainingBudget.toFixed(2)} remaining</p>
    </div>
  </div>
  
  <h4>Top Spenders</h4>
  <ul>
    {topSpendingAgents.map(agent => (
      <li key={agent.agentId}>
        <span>{agent.name}</span>
        <span>${agent.cost.toFixed(2)}</span>
      </li>
    ))}
  </ul>
</Card>
```

#### 2. Spending Breakdown Chart
```tsx
<Card title="Spending Breakdown">
  <BarChart
    data={byAgent.map(a => ({ label: a.name, value: a.totalCost }))}
    xAxisLabel="Agent"
    yAxisLabel="Cost ($)"
  />
  
  <table className="spending-details">
    <thead>
      <tr>
        <th>Agent</th>
        <th>Tasks</th>
        <th>Total Cost</th>
        <th>Avg/Task</th>
      </tr>
    </thead>
    <tbody>
      {byAgent.map(agent => (
        <tr key={agent.agentId}>
          <td>{agent.name}</td>
          <td>{agent.taskCount}</td>
          <td>${agent.totalCost.toFixed(2)}</td>
          <td>${agent.avgCostPerTask.toFixed(4)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</Card>
```

#### 3. Expensive Task Alert
```tsx
{expensiveTasks.length > 0 && (
  <Alert severity="warning">
    <AlertTitle>High-cost tasks detected</AlertTitle>
    <p>{expensiveTasks.length} tasks cost more than $1.00 each:</p>
    <ul>
      {expensiveTasks.map(task => (
        <li key={task.taskId}>
          {task.agentId}: ${task.actualCost.toFixed(2)} ({task.model})
          <Button variant="link" onClick={() => viewTaskDetails(task.taskId)}>
            Review
          </Button>
        </li>
      ))}
    </ul>
  </Alert>
)}
```

---

## Subsystem 5: Watchdog / Mission Control

### What It Does

**Independent monitoring layer** that watches all agents, detects anomalies, and provides a unified "Mission Control" dashboard.

**Example scenario:**
```
Mission Control Dashboard (User: keith@clawer.ai)

┌─────────────────────────────────────────────────────────┐
│ Platform Health: ● Healthy (95%)                        │
├─────────────────────────────────────────────────────────┤
│ Agent Status                Last Run    Success Rate    │
├─────────────────────────────────────────────────────────┤
│ ✓ Max (Chief of Staff)      2 min ago   98% (49/50)    │
│ ✓ Scout (Researcher)         1 hr ago    92% (23/25)    │
│ ⚠ Dash (Task Runner)         6 hr ago    85% (17/20)    │
│ ✗ North (Goal Tracker)       3 days ago  DEAD           │
├─────────────────────────────────────────────────────────┤
│ Recent Activity                                          │
├─────────────────────────────────────────────────────────┤
│ • Max completed morning_brief (2 min ago)               │
│ • Scout completed research task (1 hr ago)              │
│ ⚠ Dash missed scheduled task (6 hr ago)                │
│ 🚨 North hasn't run in 3x expected interval             │
└─────────────────────────────────────────────────────────┘
```

### How It Works

#### 1. Agent Health Tracking

**Health metrics per agent:**
```typescript
interface AgentHealthMetrics {
  agentId: string;
  userId: string;
  
  // Run stats
  lastRun: Date | null;
  lastSuccess: Date | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;  // 0.0 - 1.0
  
  // Cost stats
  totalCost: number;
  avgCostPerRun: number;
  
  // Expected cadence (learned from history)
  expectedIntervalHours: number;  // null if no pattern detected
  
  // Health status
  status: 'healthy' | 'degraded' | 'dead';
  statusReason: string;
  
  updatedAt: Date;
}
```

**Health status determination:**
```typescript
function calculateAgentHealth(metrics: AgentHealthMetrics): {
  status: 'healthy' | 'degraded' | 'dead';
  reason: string;
} {
  // Dead: Hasn't run in 3x expected interval
  if (metrics.expectedIntervalHours) {
    const hoursSinceLastRun = (Date.now() - metrics.lastRun.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastRun > metrics.expectedIntervalHours * 3) {
      return {
        status: 'dead',
        reason: `No activity in ${Math.round(hoursSinceLastRun)}h (expected every ${metrics.expectedIntervalHours}h)`,
      };
    }
  }
  
  // Degraded: Success rate <80% in last 10 runs
  if (metrics.totalRuns >= 10 && metrics.successRate < 0.8) {
    return {
      status: 'degraded',
      reason: `Low success rate (${Math.round(metrics.successRate * 100)}%)`,
    };
  }
  
  // Healthy
  return { status: 'healthy', reason: 'All systems nominal' };
}
```

#### 2. Expected Output Schedule Detection

**Learn agent cadence from history:**
```typescript
async function detectExpectedInterval(
  agentId: string,
  userId: string
): Promise<number | null> {
  const recentRuns = await db.taskLogs.findAll({
    where: { agentId, userId },
    orderBy: { createdAt: 'desc' },
    limit: 20,
  });
  
  if (recentRuns.length < 5) return null;  // Not enough data
  
  // Calculate intervals between runs
  const intervals: number[] = [];
  for (let i = 1; i < recentRuns.length; i++) {
    const interval = (recentRuns[i-1].createdAt.getTime() - recentRuns[i].createdAt.getTime()) / (1000 * 60 * 60);
    intervals.push(interval);
  }
  
  // Median interval (more robust than mean)
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  
  // Only return if pattern is consistent (std dev < 30% of median)
  const mean = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev / median < 0.3) {
    return median;
  }
  
  return null;  // Too inconsistent
}
```

#### 3. Dead Agent Detection & Alerts

**Background job (runs every hour):**
```typescript
async function monitorDeadAgents() {
  const allUsers = await db.users.findAll();
  
  for (const user of allUsers) {
    const agents = await db.agentThreads.findAll({ userId: user.id });
    
    for (const agent of agents) {
      const health = await getAgentHealth(agent.agentId, user.id);
      
      if (health.status === 'dead' && !health.alertSent) {
        await alertUser(user.id, {
          title: `${getAgentName(agent.agentId)} appears to be dead`,
          body: health.statusReason,
          priority: 'high',
          actions: [
            { label: 'View Mission Control', url: '/mission-control' },
            { label: 'Restart Agent', action: 'restart_agent', agentId: agent.agentId },
          ],
        });
        
        await db.agentHealthMetrics.update({
          where: { agentId: agent.agentId, userId: user.id },
          data: { alertSent: true },
        });
      }
    }
  }
}
```

#### 4. Mission Control Dashboard

**Unified view of all agents:**
```typescript
async function getMissionControlData(userId: string): Promise<MissionControlDashboard> {
  const agents = await db.agentThreads.findAll({ userId });
  
  const agentStatuses = await Promise.all(
    agents.map(async (agent) => {
      const health = await getAgentHealth(agent.agentId, userId);
      const recentActivity = await db.taskLogs.findAll({
        where: { agentId: agent.agentId, userId },
        orderBy: { createdAt: 'desc' },
        limit: 3,
      });
      
      return {
        agentId: agent.agentId,
        name: getAgentName(agent.agentId),
        emoji: getAgentEmoji(agent.agentId),
        status: health.status,
        statusReason: health.statusReason,
        lastRun: health.lastRun,
        successRate: health.successRate,
        totalRuns: health.totalRuns,
        avgCost: health.avgCostPerRun,
        recentActivity,
      };
    })
  );
  
  // Overall platform health
  const healthyCount = agentStatuses.filter(a => a.status === 'healthy').length;
  const platformHealth = (healthyCount / agentStatuses.length) * 100;
  
  return {
    platformHealth,
    agents: agentStatuses.sort((a, b) => {
      // Sort by status (dead first, then degraded, then healthy)
      const statusPriority = { dead: 0, degraded: 1, healthy: 2 };
      return statusPriority[a.status] - statusPriority[b.status];
    }),
  };
}
```

#### 5. Real-Time Activity Feed

**WebSocket stream of agent activity:**
```typescript
// Subscribe to activity feed
const activityFeed = new EventSource('/api/immune/activity-stream');

activityFeed.onmessage = (event) => {
  const activity = JSON.parse(event.data);
  
  // activity = { agentId, type, message, timestamp, metadata }
  appendActivityToFeed(activity);
};

// Example activities:
// { agentId: 'chief-of-staff', type: 'task_completed', message: 'Completed morning_brief', ... }
// { agentId: 'researcher', type: 'task_started', message: 'Started research on email tools', ... }
// { agentId: 'executor', type: 'task_failed', message: 'Failed to send email (SMTP error)', ... }
```

### API Surface

#### New Endpoints

**GET `/api/immune/mission-control`**
```typescript
// Get Mission Control dashboard data
{
  platformHealth: number;  // 0-100
  agents: Array<{
    agentId: string;
    name: string;
    status: 'healthy' | 'degraded' | 'dead';
    statusReason: string;
    lastRun: string | null;
    successRate: number;
    totalRuns: number;
    avgCost: number;
    recentActivity: Array<{ type: string; message: string; timestamp: string }>;
  }>;
}
```

**GET `/api/immune/activity-stream` (SSE)**
```typescript
// Server-Sent Events stream of real-time activity
// Returns events like:
{
  agentId: string;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'verification_failed' | 'budget_alert';
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
```

**POST `/api/immune/agents/:agentId/restart`**
```typescript
// Manually restart a dead agent
{
  agentId: string;
}

// Response
{
  success: boolean;
  newStatus: 'healthy' | 'degraded' | 'dead';
}
```

**GET `/api/immune/health/:agentId`**
```typescript
// Get detailed health metrics for a specific agent
{
  agentId: string;
  status: string;
  statusReason: string;
  metrics: {
    lastRun: string;
    lastSuccess: string;
    totalRuns: number;
    successRate: number;
    avgCostPerRun: number;
    expectedIntervalHours: number | null;
  };
  history: Array<{
    timestamp: string;
    status: string;
    successRate: number;
  }>;
}
```

### Database Schema

#### New Table: `agent_health_metrics`
```sql
CREATE TABLE agent_health_metrics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  
  -- Run stats
  last_run TIMESTAMP,
  last_success TIMESTAMP,
  total_runs INT DEFAULT 0,
  successful_runs INT DEFAULT 0,
  failed_runs INT DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.00,
  
  -- Cost stats
  total_cost DECIMAL(10,2) DEFAULT 0.00,
  avg_cost_per_run DECIMAL(10,6) DEFAULT 0.00,
  
  -- Expected cadence
  expected_interval_hours DECIMAL(5,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'healthy',  -- 'healthy' | 'degraded' | 'dead'
  status_reason TEXT,
  alert_sent BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, agent_id),
  INDEX idx_agent_health_status (user_id, status)
);
```

#### New Table: `agent_activity_log`
```sql
CREATE TABLE agent_activity_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL,
  
  activity_type VARCHAR(50) NOT NULL,  -- 'task_started' | 'task_completed' | 'task_failed'
  message TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_agent_activity_user (user_id, created_at),
  INDEX idx_agent_activity_agent (agent_id, created_at)
);
```

#### New Table: `agent_health_snapshots`
```sql
CREATE TABLE agent_health_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id VARCHAR(50) NOT NULL,
  
  snapshot_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  success_rate DECIMAL(3,2) NOT NULL,
  total_runs INT NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_agent_health_snapshots (user_id, agent_id, snapshot_date)
);
```

### UI Components

#### 1. Mission Control Dashboard (Main View)
```tsx
<Page title="Mission Control">
  <div className="platform-health">
    <CircularProgress value={platformHealth} size="large" />
    <h2>{platformHealth}% Healthy</h2>
    <p>{healthyCount}/{totalAgents} agents operational</p>
  </div>
  
  <Card title="Agent Status">
    <table className="agent-status-table">
      <thead>
        <tr>
          <th>Agent</th>
          <th>Status</th>
          <th>Last Run</th>
          <th>Success Rate</th>
          <th>Avg Cost</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {agents.map(agent => (
          <tr key={agent.agentId} className={agent.status}>
            <td>
              <span className="agent-emoji">{agent.emoji}</span>
              {agent.name}
            </td>
            <td>
              <StatusBadge status={agent.status} />
              <Tooltip>{agent.statusReason}</Tooltip>
            </td>
            <td>{formatRelative(agent.lastRun)}</td>
            <td>
              <ProgressBar value={agent.successRate * 100} />
              {Math.round(agent.successRate * 100)}%
            </td>
            <td>${agent.avgCost.toFixed(4)}</td>
            <td>
              <Button size="sm" onClick={() => viewAgentDetails(agent.agentId)}>
                Details
              </Button>
              {agent.status === 'dead' && (
                <Button size="sm" variant="primary" onClick={() => restartAgent(agent.agentId)}>
                  Restart
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
  
  <Card title="Recent Activity">
    <ActivityFeed />
  </Card>
</Page>
```

#### 2. Real-Time Activity Feed
```tsx
function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    const feed = new EventSource('/api/immune/activity-stream');
    
    feed.onmessage = (event) => {
      const activity = JSON.parse(event.data);
      setActivities(prev => [activity, ...prev].slice(0, 20));
    };
    
    return () => feed.close();
  }, []);
  
  return (
    <div className="activity-feed">
      {activities.map(activity => (
        <div key={activity.id} className={`activity-item ${activity.type}`}>
          <Icon type={getActivityIcon(activity.type)} />
          <div>
            <strong>{getAgentName(activity.agentId)}</strong>
            <p>{activity.message}</p>
            <time>{formatRelative(activity.timestamp)}</time>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 3. Agent Health Detail Modal
```tsx
<Modal title={`${agent.name} Health Details`}>
  <div className="health-summary">
    <StatusBadge status={agent.status} />
    <p>{agent.statusReason}</p>
  </div>
  
  <div className="metrics-grid">
    <Metric label="Total Runs" value={agent.totalRuns} />
    <Metric label="Success Rate" value={`${Math.round(agent.successRate * 100)}%`} />
    <Metric label="Last Run" value={formatRelative(agent.lastRun)} />
    <Metric label="Avg Cost" value={`$${agent.avgCost.toFixed(4)}`} />
  </div>
  
  <h4>30-Day Health Trend</h4>
  <LineChart
    data={healthHistory.map(h => ({
      date: h.date,
      successRate: h.successRate * 100,
    }))}
  />
  
  <h4>Recent Activity</h4>
  <ul>
    {recentActivity.map(activity => (
      <li key={activity.id}>
        {activity.type === 'task_completed' ? '✓' : '✗'} {activity.message}
        <time>{formatRelative(activity.timestamp)}</time>
      </li>
    ))}
  </ul>
</Modal>
```

---

## Implementation Phases

### Phase 1: Launch (Weeks 1-2)

**Goal:** Ship core reliability features that solve 80% of Eric Siu's pain points

**Scope:**
- ✅ Output Verification Layer (filesystem + HTTP checks)
- ✅ Self-Healing Cron System (missed run detection + auto-retry)
- ✅ Feedback Loop Engine (thumbs up/down, basic approval tracking)
- ✅ Budget Controls (cost tracking, spending caps, alerts at 50%/80%/100%)
- ✅ Mission Control (basic dashboard showing agent status + recent activity)

**DB Schema:**
- `agent_verifications`
- `cron_jobs`
- `cron_incidents`
- `agent_feedback`
- `user_budgets`
- `task_costs`
- `agent_health_metrics`
- `agent_activity_log`

**API Endpoints:**
- `/api/immune/verify` (POST)
- `/api/immune/cron-jobs` (GET)
- `/api/immune/feedback` (POST, GET)
- `/api/immune/budget/status` (GET)
- `/api/immune/mission-control` (GET)

**UI Components:**
- Verification badges on chat messages
- Feedback buttons (👍/👎)
- Budget status widget
- Mission Control dashboard page

**Estimated Effort:** 80-100 hours (~2 weeks for 2 devs)

---

### Phase 2: Post-Launch Enhancements (Weeks 3-4)

**Goal:** Polish + advanced features based on user feedback

**Scope:**
- Weekly cron audit job (Sunday nights)
- Agent performance leaderboard (approval rate rankings)
- Per-agent budget caps (daily/weekly/monthly limits)
- Auto-downgrade model cascade (when budget gets low)
- Real-time activity feed (WebSocket stream)
- Dead agent auto-restart (optional setting)
- Expensive task flagging (>$1.00 tasks require review)

**DB Schema:**
- `cron_weekly_stats`
- `agent_performance_snapshots`
- `agent_budget_caps`
- `budget_alerts`
- `agent_health_snapshots`

**API Endpoints:**
- `/api/immune/cron-incidents` (GET)
- `/api/immune/feedback/leaderboard` (GET)
- `/api/immune/budget/caps` (POST)
- `/api/immune/budget/breakdown` (GET)
- `/api/immune/budget/expensive-tasks` (GET)
- `/api/immune/activity-stream` (SSE)
- `/api/immune/agents/:id/restart` (POST)

**UI Components:**
- Cron reliability score widget
- Agent performance leaderboard
- Spending breakdown charts
- Real-time activity feed
- Incident timeline

**Estimated Effort:** 60-80 hours (~1.5-2 weeks)

---

### Phase 3: Intelligence Layer (Month 2)

**Goal:** Make the Immune System smarter (learn from patterns, predict failures)

**Scope:**
- Predictive failure detection (ML-lite: "Scout likely to fail based on recent pattern")
- Anomaly detection (task took 10x longer than usual → flag for review)
- Smart feedback synthesis ("Users approve outputs that are concise and bulleted")
- Auto-tuning (adjust agent prompts based on approval rates)
- Cost optimization recommendations ("Switch Scout to cheaper model, no quality loss detected")

**Not in initial spec** — this is a future roadmap item.

---

## Differentiation from DIY OpenClaw

### DIY OpenClaw Setup (Eric Siu's Experience)

**Pain points:**
1. No output verification → hallucinations go undetected
2. Silent cron failures → missed reports, no alerts
3. No feedback loops → agents repeat mistakes
4. Manual cost tracking → budget blowouts
5. No health monitoring → dead agents go unnoticed for days

**Solution:** Spend weeks building custom scripts, cron monitors, logging, dashboards

**Time investment:** ~40-60 hours to replicate basic Immune System features

---

### Clawer.ai with Immune System

**Out-of-the-box:**
1. ✅ Output verification (automatic, no config needed)
2. ✅ Self-healing cron (missed runs auto-retry, weekly audits)
3. ✅ Feedback loops (thumbs up/down, agent learns from approval rates)
4. ✅ Budget controls (spending caps, auto-downgrade, real-time alerts)
5. ✅ Mission Control (health dashboard, dead agent detection, activity feed)

**Time investment:** 0 hours (it just works)

**Value prop:** "We built the reliability layer Eric Siu spent weeks building, so you don't have to."

---

## Marketing Angle

### Headline
**"Your agents have a manager now."**

### Pitch
Running AI agents is hard. They hallucinate outputs. They miss scheduled tasks. They blow your budget overnight. And when they stop working, you only find out when it's too late.

**Clawer.ai's Immune System** is like having a **DevOps engineer watching your agents 24/7**:
- ✅ Verifies outputs (catches hallucinations before you see them)
- ✅ Self-heals cron failures (missed tasks auto-retry)
- ✅ Learns from your feedback (agents improve over time)
- ✅ Enforces budgets (no $47 overnight disasters)
- ✅ Monitors health (dead agents get flagged instantly)

**DIY OpenClaw users** spend weeks building this themselves.  
**Clawer.ai users** get it out of the box for $49/mo.

### Social Proof (Eric Siu Thread)
> "I spent 3 weeks debugging OpenClaw agents. Hallucinated outputs. Silent cron failures. No feedback loops. Budget blowouts. I had to build custom monitors, retry logic, approval tracking... it was painful."
>
> — @ericcodes

**Clawer.ai response:**
> "We built what Eric spent 3 weeks building. Now it's a platform feature. Your agents have a manager." 🚀

---

## Success Metrics

### Product Health (Internal)
- **Verification accuracy:** >90% of verified outputs are correct (low false positive rate)
- **Cron reliability:** >95% of scheduled jobs run on time or auto-recover
- **Budget alerts:** 0 users exceed budget without warning
- **Dead agent detection:** <2hr average time to detect + alert

### User Engagement (External)
- **Feedback adoption:** >60% of users submit feedback (thumbs up/down) on agent outputs
- **Mission Control usage:** >40% of users visit Mission Control dashboard weekly
- **Retention lift:** Users with Immune System features have +15% higher 30-day retention

### Cost Efficiency
- **Auto-downgrade saves:** Avg. $5-10/user/month via smart model routing
- **False alarm rate:** <5% of "dead agent" alerts are false positives

---

## Open Questions / Decisions Needed

1. **Verification false positives:** What if agent creates file but at unexpected path?
   - **Rec:** Use fuzzy matching (e.g., "reports/feb-11.md" matches "reports/2026-02-11.md")

2. **Cron retry limits:** Should users be able to configure max retries?
   - **Rec:** Yes, add to agent settings (default: 3, max: 10)

3. **Feedback required for approval rate:** Min feedback count before showing score?
   - **Rec:** 5 feedback items minimum (avoid "1/1 = 100%" misleading stat)

4. **Budget overage policy:** Should we allow overage (with alert) or hard-stop?
   - **Rec:** Default to hard-stop, add opt-in "allow overage" setting

5. **Mission Control access:** Should users be able to share Mission Control with team members?
   - **Rec:** Phase 2 feature (multi-user access control)

6. **Dead agent auto-restart:** Safe to auto-restart or require manual approval?
   - **Rec:** Manual approval for MVP (prevent infinite restart loops)

---

## Risk Mitigation

### Risk: Verification over-triggers (too many false alarms)
**Mitigation:**
- Tune confidence thresholds (default: 0.7, not 0.9)
- Allow users to disable verification per agent
- Track false positive rate, adjust scoring over time

### Risk: Cron monitor misses edge cases (timezone bugs, DST)
**Mitigation:**
- Use robust cron parser library (`cron-parser`)
- Test with multiple timezones + DST transitions
- Add manual "mark as healthy" override

### Risk: Budget tracking lags behind actual spend (async billing)
**Mitigation:**
- Real-time cost estimation (don't wait for OpenAI invoice)
- Add 10% buffer to estimates (err on side of caution)
- Weekly reconciliation job (compare estimates to actual usage)

### Risk: Feedback fatigue (users stop giving feedback after initial enthusiasm)
**Mitigation:**
- Gamify feedback (badges, streaks)
- Only ask for feedback on important tasks (not every message)
- Show impact ("Your feedback improved this agent's approval rate by 15%")

### Risk: Mission Control overwhelms new users
**Mitigation:**
- Guided onboarding tour ("Here's how to read Mission Control")
- Start with collapsed view (expand to see details)
- Add "Beginner Mode" toggle (hides advanced metrics)

---

## Appendix: Example User Flows

### Flow 1: User Receives Verified Output

1. User asks Scout (Researcher): "Find the best email marketing tools"
2. Scout responds: "I found 5 options and saved the report to `reports/email-tools.md`"
3. **Immune System triggers verification:**
   - Check: Does `reports/email-tools.md` exist? ✅
   - Check: Was it modified in last 60 sec? ✅
   - Check: File size > 0 bytes? ✅
   - **Result:** Confidence 0.95 → ✅ Verified
4. User sees response with green "✓ Verified" badge
5. User clicks badge → sees verification details (3 checks passed)
6. User clicks 👍 Approve → feedback stored, Scout's approval rate increases

---

### Flow 2: Cron Job Fails and Auto-Recovers

1. **6:58 AM:** Max (Chief of Staff) tries to run morning brief cron job
2. **6:58 AM:** Task fails (network timeout)
3. **9:00 AM:** Cron Monitor detects missed run (2hr past expected window)
4. **9:05 AM:** Auto-retry attempt 1 → Success ✅
5. **9:06 AM:** User receives alert: "Morning Brief missed scheduled run at 7am but auto-recovered"
6. **9:06 AM:** Mission Control logs incident (recovered after 1 retry)
7. **Sunday 10pm:** Weekly audit shows 6/7 successful runs this week (85% reliability)

---

### Flow 3: Budget Limit Triggers Model Downgrade

1. **Current spend:** $48 of $50 monthly limit
2. User asks Scout to research a complex topic (estimated cost: $3.50 with gpt-4o-mini)
3. **Budget Controller detects:** $48 + $3.50 = $51.50 (exceeds limit)
4. **Auto-downgrade:** Switch to gemini-2.0-flash-lite (estimated cost: $1.75)
5. **New total:** $48 + $1.75 = $49.75 (under limit ✅)
6. Task proceeds with cheaper model
7. User receives alert: "Budget nearing limit, switched Scout to economy model for this task"
8. Mission Control shows spending breakdown (Scout: $12, Max: $18, Dash: $15, total: $49.75)

---

### Flow 4: Dead Agent Detected and Flagged

1. **Agent:** North (Goal Tracker)
2. **Expected interval:** Every 7 days (learned from history)
3. **Last run:** Feb 5 (6 days ago)
4. **Feb 12 (3x expected interval):** Watchdog detects dead agent
5. **Alert sent to user:** "North (Goal Tracker) hasn't run in 18 days (expected every 7 days)"
6. **Mission Control dashboard:** Shows North with 🚨 Dead status
7. User clicks "View Details" → sees last run was Feb 5, no errors logged
8. User clicks "Restart Agent" → triggers manual run → Success ✅
9. North's status changes to ✅ Healthy

---

**End of Spec**

**Next Steps:**
1. Review with team (validate scope, timelines, prioritization)
2. Create GitHub issues for Phase 1 tasks
3. Assign backend + frontend devs
4. Set up DB migrations (schema changes)
5. Build MVP in 2-3 week sprint
6. Beta test with 10-20 users
7. Ship + announce 🚀

---

**Estimated Total Effort:**
- **Phase 1 (Launch):** 80-100 hours (2 weeks, 2 devs)
- **Phase 2 (Enhancements):** 60-80 hours (1.5-2 weeks, 2 devs)
- **Total MVP to Polish:** ~140-180 hours (~3-4 weeks)

**Buildable by a dev team in 2-3 weeks.** ✅
