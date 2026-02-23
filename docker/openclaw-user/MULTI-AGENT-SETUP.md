# Multi-Agent Team Setup Guide

This document explains how AI Teams Phase 3 (Inter-Agent Communication) is implemented in the container.

## Overview

Each container can provision a **team of agents** instead of a single agent. Agents have:
- Isolated workspaces (`/home/user/clawd-{agent-id}/`)
- Specialized SOUL.md files with delegation instructions
- Inter-agent communication via `sessions_send` and `sessions_spawn`
- Shared USER.md for user context

## Directory Structure

```
/home/user/
├── clawd/                          # Legacy main workspace (if exists)
├── clawd-chief-of-staff/          # Max's workspace
│   ├── SOUL.md                     # Max's identity + delegation patterns
│   ├── AGENTS.md                   # Operating instructions
│   ├── USER.md                     # Shared user context
│   ├── WORKING.md                  # Current task state
│   ├── memory/                     # Daily notes
│   └── files/                      # Saved outputs
├── clawd-researcher/               # Scout's workspace
│   ├── SOUL.md                     # Scout's identity + delegation patterns
│   ├── memory/
│   └── files/research/             # Research reports
├── clawd-executor/                 # Dash's workspace
│   ├── SOUL.md
│   ├── files/drafts/               # Email drafts, documents
│   └── files/overnight-work/       # Overnight task logs
├── clawd-goal-tracker/             # North's workspace
│   ├── SOUL.md
│   └── files/goals/                # Goal tracking data
├── clawd-wellness/                 # Zen's workspace
│   ├── SOUL.md
│   └── files/wellness/             # Energy logs, workout tracking
└── .openclaw/
    ├── openclaw.json               # Multi-agent config
    ├── agent-activity.jsonl        # Inter-agent activity log
    └── collaboration-status.json   # Real-time collab status
```

## Team Configuration

Each team template lives in `/opt/teams/{template-name}/`:

```
/opt/teams/lifeos/
├── team-config.json                # Team metadata
├── openclaw-config.json            # Agent allowlist + bindings
├── AGENTS.md                       # Shared operating instructions
└── agents/
    ├── max-soul.md                 # Chief of Staff SOUL.md
    ├── scout-soul.md               # Researcher SOUL.md
    ├── dash-soul.md                # Executor SOUL.md
    ├── north-soul.md               # Goal Tracker SOUL.md
    └── zen-soul.md                 # Wellness SOUL.md
```

## Agent Provisioning Flow

When container starts with `TEAM_TEMPLATE=lifeos`:

1. **Entrypoint reads team config** (`/opt/teams/lifeos/team-config.json`)
2. **For each agent in config:**
   - Creates workspace at `/home/user/clawd-{agent-id}/`
   - Copies SOUL.md from `/opt/teams/lifeos/agents/{agent-id}-soul.md`
   - Copies shared AGENTS.md and USER.md
   - Creates memory/ and files/ directories
   - Initializes WORKING.md
3. **Installs OpenClaw config** (`openclaw-config.json` → `/root/.openclaw/openclaw.json`)
4. **Starts OpenClaw Gateway** with multi-agent routing

## Inter-Agent Communication

### Agent Allowlist

Defined in `openclaw-config.json`:

```json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["chief-of-staff", "goal-tracker", "researcher", "executor", "wellness"],
      "maxPingPongTurns": 3
    }
  }
}
```

### Delegation Example

**Max delegates to Scout:**

```typescript
// In Max's session
sessions_send({
  sessionKey: "agent:researcher:main",
  message: "Research top 5 project management tools for solopreneurs. Focus on pricing and features.",
  timeoutSeconds: 60
})
```

**Scout receives and processes:**
- Runs web searches
- Synthesizes findings
- Replies back to Max's session

**Max receives response:**
- Incorporates Scout's research into his answer
- Delivers unified response to user

### Activity Logging

All inter-agent communication is logged to `/home/user/.openclaw/agent-activity.jsonl`:

```jsonl
{"id":"abc123","timestamp":"2026-02-23T12:00:00Z","fromAgent":"chief-of-staff","toAgent":"researcher","action":"delegate","summary":"Max asked Scout to research project tools"}
{"id":"def456","timestamp":"2026-02-23T12:01:30Z","fromAgent":"researcher","toAgent":"chief-of-staff","action":"complete","summary":"Scout completed research and delivered findings"}
```

This log is read by the UI's `AgentActivityFeed` component.

## SOUL.md Delegation Patterns

Each agent's SOUL.md includes:

### When to Delegate
- Specific triggers that indicate another agent should handle the task
- Examples: "research question" → delegate to Scout

### How to Delegate
- Code examples using `sessions_send`
- Format for providing context to the receiving agent
- How to synthesize responses back to the user

### Response Formats
- Structured formats for delivering results (e.g., Scout's research reports)
- Handoff protocols between agents

## UI Integration

### Agent Activity Feed

Shows real-time collaboration:
- "Max asked Scout to research X..."
- "Scout completed research, reporting back to Max..."

API: `GET /api/team/activity`

### Collaboration Indicators

Shows when agents are working together:
- Blue indicator: "Scout is working..."
- Appears in chat during active delegation

API: `GET /api/team/collaboration-status`

### Agent Selector

User can switch between agents in the UI to:
- See each agent's conversation history
- Message specific agents directly
- View per-agent workspaces

## Environment Variables

Container provisioning:

```bash
docker run \
  -e USER_ID=user_abc123 \
  -e TEAM_TEMPLATE=lifeos \
  -e GATEWAY_TOKEN=xxx \
  -e OPENAI_API_KEY=xxx \
  clawer-openclaw:latest
```

- `TEAM_TEMPLATE`: Which team to provision (lifeos, solopreneur, etc.)
- `USER_ID`: Clerk user ID for this container
- `GATEWAY_TOKEN`: Auth token for gateway API
- `OPENAI_API_KEY`, `MINIMAX_API_KEY`, etc.: LLM API keys

## Adding New Agents

To add a new agent to a team:

1. **Update team-config.json:**
   ```json
   {
     "members": [
       {
         "id": "new-agent",
         "name": "NewAgent",
         "role": "Specialist",
         "emoji": "🔧"
       }
     ]
   }
   ```

2. **Create SOUL.md template:**
   `/opt/teams/lifeos/agents/new-agent-soul.md`

3. **Update openclaw-config.json:**
   Add to agents list and allowlist

4. **Rebuild container image:**
   ```bash
   docker build -t clawer-openclaw:latest .
   ```

5. **Provision new containers:**
   New users get the updated team automatically

## Debugging

### Check which agents are provisioned:

```bash
docker exec <container> ls -la /home/user/
```

### View agent's SOUL.md:

```bash
docker exec <container> cat /home/user/clawd-researcher/SOUL.md
```

### Check inter-agent activity log:

```bash
docker exec <container> tail -n 20 /home/user/.openclaw/agent-activity.jsonl
```

### View OpenClaw config:

```bash
docker exec <container> cat /root/.openclaw/openclaw.json
```

### Test inter-agent communication:

```bash
# Start a session as Max
docker exec -it <container> openclaw chat --agent chief-of-staff

# In Max's session, delegate to Scout
> sessions_send({sessionKey: "agent:researcher:main", message: "Test delegation"})
```

## Migration from Single-Agent

Existing containers (pre-Phase 3):
- Continue to work in single-agent mode
- `/home/user/clawd/` is their workspace
- No team configuration detected

New containers (Phase 3+):
- Multi-agent mode by default
- Each agent has isolated workspace
- Collaboration enabled

## Security

### Workspace Isolation
- Agents cannot read each other's files directly
- Sandboxing enforced at filesystem level
- Communication only via `sessions_send`/`sessions_spawn`

### Tool Restrictions
- Scout: No `exec` or `browser` (research-only)
- Dash: No `browser` (execution-only)
- All agents: Controlled via `allowlist` in openclaw-config.json

### Rate Limiting
- Inter-agent communication rate-limited
- Max 3 ping-pong turns to prevent loops
- Timeouts on sessions_send to prevent hangs

## Performance

### Resource Usage
- Each agent: ~50-100 MB disk space
- 5 agents: +250-500 MB total
- Memory: Minimal (agents share same Gateway process)
- Sessions are lightweight (SQLite)

### Optimization
- Lazy workspace creation (only used agents)
- Shared skills directory
- Periodic cleanup of old session data

## Support

For issues or questions:
- Check container logs: `docker logs <container>`
- Review OpenClaw Gateway logs: `docker exec <container> openclaw gateway logs`
- Test agent provisioning: `docker exec <container> /opt/scripts/provision-agent-workspace.sh test-agent TestAgent 🧪 lifeos`
