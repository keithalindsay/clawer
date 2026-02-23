# Clawer.ai API Routes Documentation

> Complete reference for all API endpoints in Clawer.ai

**Last Updated:** 2026-02-23  
**Total Routes:** 103  
**Error Format:** All errors follow `{ error: string, details?: string }`

---

## Table of Contents

- [Authentication](#authentication)
- [Chat](#chat)
- [Tasks](#tasks)
- [Team Management](#team-management)
- [Container Management](#container-management)
- [Dashboard](#dashboard)
- [Files](#files)
- [Admin](#admin)
- [Billing](#billing)
- [User Settings](#user-settings)
- [Webhooks](#webhooks)
- [Maintenance](#maintenance)

---

## Authentication

All routes (except webhooks and `/api/health`) require authentication via Clerk.

**Auth Header:** Automatically handled by Clerk middleware  
**Unauthorized Response:** `401 Unauthorized`

---

## Chat

### POST `/api/chat`

Send a message to an AI agent.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "message": "string (required, max 10000 chars)",
  "agentId": "string (optional, agent identifier)",
  "context": "string (optional, session key override)",
  "settings": {
    "botName": "string (optional)",
    "personality": "string (optional)",
    "customInstructions": "string (optional)",
    "communicationStyle": "string (optional)",
    "responseLength": "string (optional)"
  }
}
```

**Response:**
```json
{
  "content": "string (agent response)",
  "createdTasks": ["string (optional, task IDs if auto-created)"],
  "routing": {
    "tier": "string (smart/orchestrator/worker)",
    "model": "string (model used)",
    "confidence": "number"
  }
}
```

**What it calls:**
- Database: `users` (fetch container info, rate limits)
- Database: `customAgents` (if custom agent selected)
- Container: `containerApi.chat()` → OpenClaw Gateway
- Database: `tasks` (if auto-creating tasks from response)

**Errors:**
- `400` - Invalid message format or length
- `401` - Not authenticated
- `403` - Free tier limit exceeded
- `404` - Agent not found
- `429` - Rate limit exceeded
- `503` - Container not running
- `500` - Server error

---

### GET `/api/chat/history`

Load message history for a session.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `session` - Session key (e.g., `agent:code:main`)
- `limit` - Number of messages (default: 50)

**Response:**
```json
{
  "messages": [
    {
      "role": "user | assistant",
      "content": "string",
      "timestamp": "ISO date"
    }
  ]
}
```

**What it calls:**
- Container: `containerApi.getHistory()`

---

### GET `/api/chat/sessions`

List all chat sessions for the user.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "sessions": [
    {
      "key": "string",
      "agentId": "string",
      "lastMessageAt": "ISO date",
      "messageCount": "number"
    }
  ]
}
```

**What it calls:**
- Container: `containerApi.getSessions()`

---

## Tasks

### GET `/api/tasks`

List tasks for the authenticated user.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `status` - Filter by status (backlog, queued, running, done, failed)

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "userId": "string",
      "title": "string",
      "description": "string | null",
      "status": "backlog | queued | running | done | failed",
      "priority": "low | medium | high | urgent",
      "assignedTo": "string | null",
      "result": "string | null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `tasks` table (SELECT)

**Errors:**
- `401` - Not authenticated
- `500` - Database error

---

### POST `/api/tasks`

Create a new task.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low | medium | high | urgent (optional, default: medium)",
  "assigned_to": "string (optional, agent ID)"
}
```

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "string",
    "status": "backlog",
    ...
  }
}
```

**What it calls:**
- Database: `tasks` (INSERT)

**Errors:**
- `400` - Title is required
- `401` - Not authenticated
- `500` - Database error

---

### PATCH `/api/tasks/:id`

Update a task.

**Auth Required:** Yes  
**Role:** Task owner only

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional)",
  "priority": "string (optional)",
  "assignedTo": "string (optional)",
  "result": "string (optional)"
}
```

**Response:**
```json
{
  "task": { "id": "uuid", ... }
}
```

**What it calls:**
- Database: `tasks` (UPDATE)

**Errors:**
- `401` - Not authenticated
- `404` - Task not found
- `500` - Database error

---

### DELETE `/api/tasks/:id`

Delete a task.

**Auth Required:** Yes  
**Role:** Task owner only

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: `tasks` (DELETE)

---

### POST `/api/tasks/execute`

Execute a task via AI agent.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "taskId": "uuid (required)",
  "agentId": "string (optional, defaults to best match)"
}
```

**Response:**
```json
{
  "result": "string (agent output)",
  "taskId": "uuid"
}
```

**What it calls:**
- Database: `tasks` (SELECT, UPDATE)
- Container: `containerApi.chat()` with task context
- Agent: Agent matcher if no agentId specified

---

### POST `/api/tasks/:id/run`

Run a specific task.

**Auth Required:** Yes  
**Role:** Task owner only

**Response:**
```json
{
  "success": true,
  "result": "string (execution result)"
}
```

**What it calls:**
- Database: `tasks` (SELECT, UPDATE)
- Container: Executes task via agent

---

## Team Management

### GET `/api/team`

Get current team configuration.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "teamTemplate": "string (lifeos, solopreneur, etc.)",
  "defaultAgentId": "string",
  "members": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "emoji": "string",
      "description": "string"
    }
  ]
}
```

**What it calls:**
- Database: `users` (teamTemplate, defaultAgentId)
- Library: `teams.ts` (team config lookup)

---

### PUT `/api/team`

Update team configuration.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Request Body:**
```json
{
  "teamTemplate": "string (required)",
  "defaultAgentId": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: `users` (UPDATE)

**Errors:**
- `400` - Invalid team template
- `403` - Requires paid subscription

---

### POST `/api/team/provision`

Provision a team (creates agent workspaces).

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Request Body:**
```json
{
  "templateName": "string (required)",
  "defaultAgentId": "string (optional)"
}
```

**Query Params:**
- `force=true` - Re-provision even if exists

**Response:**
```json
{
  "success": true,
  "teamTemplate": "string",
  "agents": ["string (agent IDs)"],
  "message": "string",
  "alreadyProvisioned": "boolean (optional)"
}
```

**What it calls:**
- Database: `users` (SELECT)
- Container: `provisionFullTeam()` → SSH to container
- Container: Creates agent workspaces, SOUL.md files
- OpenClaw: Registers agents

**Errors:**
- `400` - Invalid template name
- `401` - Not authenticated
- `403` - Requires paid subscription
- `500` - Provisioning failed
- `503` - Container not running

---

### GET `/api/team/provision`

Check if team is provisioned.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "provisioned": "boolean",
  "teamTemplate": "string",
  "defaultAgent": "string | null",
  "agents": ["string"]
}
```

**What it calls:**
- Database: `users` (SELECT)
- Container: `hasTeamProvisioned()` → SSH check

---

### GET `/api/team/agents`

List custom agents.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "userId": "string",
      "agentId": "string (unique identifier)",
      "name": "string",
      "role": "string",
      "emoji": "string",
      "personality": "string",
      "triggers": ["string"],
      "quickPrompts": ["string"]
    }
  ]
}
```

**What it calls:**
- Database: `customAgents` (SELECT)

---

### POST `/api/team/agents`

Create a custom agent.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Request Body:**
```json
{
  "name": "string (required)",
  "role": "string (required)",
  "emoji": "string (optional)",
  "personality": "string (optional)",
  "triggers": ["string (optional)"],
  "quickPrompts": ["string (optional)"]
}
```

**Response:**
```json
{
  "agent": { "id": "uuid", ... }
}
```

**What it calls:**
- Database: `customAgents` (INSERT)
- Container: `provisionCustomAgent()` → Creates workspace

**Errors:**
- `400` - Missing required fields
- `403` - Requires paid subscription
- `409` - Agent ID already exists
- `500` - Database or provisioning error

---

### PATCH `/api/team/agents`

Update a custom agent.

**Auth Required:** Yes  
**Role:** Agent owner only

**Request Body:**
```json
{
  "agentId": "string (required)",
  "name": "string (optional)",
  "role": "string (optional)",
  "emoji": "string (optional)",
  "personality": "string (optional)",
  "triggers": ["string (optional)"],
  "quickPrompts": ["string (optional)"]
}
```

**Response:**
```json
{
  "agent": { "id": "uuid", ... }
}
```

**What it calls:**
- Database: `customAgents` (UPDATE)

---

### DELETE `/api/team/agents`

Delete a custom agent.

**Auth Required:** Yes  
**Role:** Agent owner only

**Query Params:**
- `agentId` - Agent ID to delete

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: `customAgents` (DELETE)

**Errors:**
- `400` - Missing agentId
- `404` - Agent not found

---

### GET `/api/team/members`

Get team members (template + custom agents).

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "members": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "emoji": "string",
      "type": "template | custom"
    }
  ]
}
```

**What it calls:**
- Database: `users`, `customAgents`
- Library: `teams.ts`

---

### GET `/api/team/collaboration-status`

Get team collaboration activity.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "activeAgents": ["string"],
  "recentActivity": [
    {
      "agentId": "string",
      "action": "string",
      "timestamp": "ISO date"
    }
  ]
}
```

**What it calls:**
- Container: Queries agent activity logs

---

### GET `/api/team/agents/health`

Check health of all agents.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "agents": [
    {
      "id": "string",
      "status": "online | offline",
      "lastActive": "ISO date | null"
    }
  ]
}
```

**What it calls:**
- Container: Health check per agent

---

### GET `/api/team/activity`

Get team activity feed.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `limit` - Number of events (default: 50)
- `since` - ISO date (optional)

**Response:**
```json
{
  "activity": [
    {
      "id": "uuid",
      "agentId": "string",
      "eventType": "string",
      "summary": "string",
      "timestamp": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `agent_events` (SELECT)

---

### POST `/api/team/activity`

Record team activity event.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "agentId": "string (required)",
  "eventType": "string (required)",
  "summary": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "uuid"
}
```

**What it calls:**
- Database: `agent_events` (INSERT)

---

## Container Management

### GET `/api/container/status`

Get container health status.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "status": "running | stopped | provisioning | offline",
  "model": "string (AI model tier)",
  "uptime": "number (seconds)",
  "containerId": "string",
  "tier": "free | basic | pro | enterprise"
}
```

**What it calls:**
- Database: `users` (SELECT containerStatus, tier, containerCreatedAt)

**Errors:**
- `401` - Not authenticated
- `404` - User not found
- `500` - Database error

---

### POST `/api/container/restart`

Restart user's container.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Response:**
```json
{
  "success": true,
  "message": "Container restarting..."
}
```

**What it calls:**
- SSH: `docker restart clawer_user_{userId}`

**Errors:**
- `403` - Requires paid subscription
- `500` - SSH or Docker error

---

### GET `/api/container/skills`

List available skills in container.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "skills": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string"
    }
  ]
}
```

**What it calls:**
- Container: `containerApi.listSkills()`

---

### POST `/api/container/skills/:skillId/:action`

Manage a specific skill (enable/disable).

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Path Params:**
- `skillId` - Skill identifier
- `action` - `enable` or `disable`

**Response:**
```json
{
  "success": true,
  "skill": "string",
  "action": "string"
}
```

**What it calls:**
- Container: `containerApi.manageSkill()`

---

### GET `/api/container/tasks`

List container-level tasks (different from user tasks).

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "tasks": [
    {
      "id": "string",
      "name": "string",
      "status": "string",
      "lastRun": "ISO date | null"
    }
  ]
}
```

**What it calls:**
- Container: Query internal task queue

---

### POST `/api/container/tasks`

Create a container task.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "name": "string (required)",
  "action": "string (required)",
  "params": "object (optional)"
}
```

**Response:**
```json
{
  "taskId": "string"
}
```

**What it calls:**
- Container: Schedule internal task

---

### GET `/api/container/tasks/:id`

Get container task details.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "result": "string | null"
}
```

**What it calls:**
- Container: Query task status

---

### PATCH `/api/container/tasks/:id`

Update container task.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "status": "string (optional)",
  "params": "object (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: Update task

---

### DELETE `/api/container/tasks/:id`

Delete container task.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: Remove task

---

### GET `/api/container/slack/status`
### GET `/api/container/telegram/status`
### GET `/api/container/whatsapp/status`

Check integration status.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "connected": "boolean",
  "accountInfo": "object | null"
}
```

**What it calls:**
- Container: Query integration plugin status

---

### POST `/api/container/slack/connect`
### POST `/api/container/telegram/connect`

Connect integration.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Request Body:**
```json
{
  "token": "string (required, API token)",
  "config": "object (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "connected": true
}
```

**What it calls:**
- Container: Initialize integration plugin

---

### POST `/api/container/slack/disconnect`
### POST `/api/container/telegram/disconnect`
### POST `/api/container/whatsapp/disconnect`

Disconnect integration.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: Stop integration plugin

---

### GET `/api/container/whatsapp/qr`

Get WhatsApp QR code for pairing.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Response:**
```json
{
  "qr": "string (base64 image or URL)",
  "expiresAt": "ISO date"
}
```

**What it calls:**
- Container: WhatsApp plugin QR generation

---

### POST `/api/container/export/:userId`
### GET `/api/container/export/:userId`

Export container data (admin only).

**Auth Required:** Yes  
**Role:** Admin only

**Response:**
```json
{
  "exportUrl": "string (download URL)",
  "size": "number (bytes)"
}
```

**What it calls:**
- SSH: Tar container volumes
- Storage: Upload to S3 or serve direct

---

### POST `/api/container/import/:userId`
### GET `/api/container/import/:userId`

Import container data (admin only).

**Auth Required:** Yes  
**Role:** Admin only

**Request Body:**
```json
{
  "importUrl": "string (source URL or file)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Import complete"
}
```

**What it calls:**
- Storage: Fetch import file
- SSH: Extract into container volumes

---

## Dashboard

### GET `/api/dashboard/stats`

Get dashboard statistics.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "totalTasks": "number",
  "completedTasks": "number",
  "activeAgents": "number",
  "messagesThisMonth": "number",
  "storageUsed": "number (MB)"
}
```

**What it calls:**
- Database: `tasks`, `agent_events` (aggregates)
- Container: Storage usage query

---

### GET `/api/dashboard/activity`

Get activity feed.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `limit` - Number of events (default: 20)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "eventType": "string",
      "agentName": "string",
      "summary": "string",
      "timestamp": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `agent_events` (SELECT)

---

### GET `/api/dashboard/crons`

List cron jobs.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "crons": [
    {
      "id": "uuid",
      "jobName": "string",
      "schedule": "string (cron expression)",
      "status": "active | paused | failed",
      "lastRunAt": "ISO date | null",
      "nextRunAt": "ISO date | null"
    }
  ]
}
```

**What it calls:**
- Database: `cron_job_status` (SELECT)
- Container: `containerApi.listCrons()`

---

### GET `/api/dashboard/crons/cli`

List crons for CLI display.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "crons": [
    {
      "name": "string",
      "schedule": "string",
      "enabled": "boolean",
      "lastRun": "ISO date | null"
    }
  ]
}
```

**What it calls:**
- Container: `containerApi.listCrons()` with CLI formatting

---

### POST `/api/dashboard/crons/cli`

Manage cron via CLI.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "action": "add | remove | enable | disable | run",
  "name": "string (required)",
  "schedule": "string (required for add)",
  "command": "string (required for add)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "string"
}
```

**What it calls:**
- Container: `containerApi.manageCron()`

---

### POST `/api/dashboard/crons/cli/:action/:cronId`

Execute cron action.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Path Params:**
- `action` - `run`, `enable`, `disable`, `delete`
- `cronId` - Cron job ID

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: Execute cron action

---

### GET `/api/dashboard/hooks/cli`
### POST `/api/dashboard/hooks/cli`
### POST `/api/dashboard/hooks/cli/:action/:hookId`

Webhook management (similar to crons).

**Auth Required:** Yes  
**Role:** Any authenticated user

Same patterns as cron routes but for webhooks.

**What it calls:**
- Container: Webhook management API

---

### POST `/api/dashboard/memory/search`

Search agent memory.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "query": "string (required)",
  "agentId": "string (optional)",
  "limit": "number (optional, default: 10)"
}
```

**Response:**
```json
{
  "results": [
    {
      "content": "string",
      "source": "string (file path)",
      "score": "number (relevance 0-1)",
      "timestamp": "ISO date"
    }
  ]
}
```

**What it calls:**
- Container: `containerApi.searchMemory()`

---

### GET `/api/dashboard/config`

Get dashboard configuration.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "teamTemplate": "string",
  "defaultAgent": "string",
  "widgets": ["string"],
  "theme": "string"
}
```

**What it calls:**
- Database: `users` (preferences)

---

### GET `/api/dashboard/briefing`

Get morning briefing.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "summary": "string",
  "sections": [
    {
      "title": "string",
      "content": "string",
      "priority": "high | medium | low"
    }
  ],
  "generatedAt": "ISO date"
}
```

**What it calls:**
- Container: Morning briefing agent session
- Database: Tasks, events, notifications

---

### POST `/api/dashboard/sync`

Sync dashboard data.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "syncedAt": "ISO date"
}
```

**What it calls:**
- Container: Fetch latest data
- Database: Update cached values

---

### GET `/api/dashboard/team-status`

Get team status overview.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "status": "online | offline",
      "activeTask": "string | null"
    }
  ]
}
```

**What it calls:**
- Container: Agent health checks
- Database: Active tasks per agent

---

### GET `/api/dashboard/health`

Dashboard health check.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "status": "healthy | degraded | offline",
  "components": {
    "database": "healthy | offline",
    "container": "healthy | offline",
    "storage": "healthy | offline"
  }
}
```

**What it calls:**
- Database: Connection check
- Container: Ping
- Storage: API health check

---

### GET `/api/dashboard/agents/cli`

List agents for CLI.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "status": "online | offline"
    }
  ]
}
```

**What it calls:**
- Database: `users`, `customAgents`
- Library: Team config

---

### GET `/api/dashboard/alerts`

List alerts.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "type": "warning | error | info",
      "message": "string",
      "source": "string",
      "createdAt": "ISO date",
      "read": "boolean"
    }
  ]
}
```

**What it calls:**
- Database: Alerts table (if exists) or container logs

---

### GET `/api/dashboard/alerts/history`

Alert history.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `days` - Number of days (default: 7)

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "type": "string",
      "message": "string",
      "timestamp": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: Historical alerts

---

### POST `/api/dashboard/alerts/:alertId/toggle`

Toggle alert read status.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "read": "boolean"
}
```

**What it calls:**
- Database: Update alert

---

### GET `/api/dashboard/alerts/setup`

Get alert setup configuration.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "email": "boolean",
  "push": "boolean",
  "slack": "boolean",
  "thresholds": {
    "errorRate": "number",
    "taskFailures": "number"
  }
}
```

**What it calls:**
- Database: User alert preferences

---

### POST `/api/dashboard/alerts/setup`

Update alert configuration.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "email": "boolean (optional)",
  "push": "boolean (optional)",
  "slack": "boolean (optional)",
  "thresholds": "object (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Update user preferences

---

### GET `/api/dashboard/permissions`

List permission requests.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "agentId": "string",
      "action": "string",
      "reason": "string",
      "status": "pending | approved | denied",
      "createdAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Container: Permission queue

---

### POST `/api/dashboard/permissions/:requestId/respond`

Respond to permission request.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "approved": "boolean (required)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: Approve/deny permission

---

## Files

### GET `/api/files`

List files in agent workspace.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `path` - Directory path (default: `/home/user/workspace`)
- `agentId` - Agent workspace (optional)

**Response:**
```json
{
  "files": [
    {
      "name": "string",
      "type": "file | directory",
      "size": "number (bytes)",
      "modifiedAt": "ISO date"
    }
  ],
  "path": "string (current path)"
}
```

**What it calls:**
- Container: `containerApi.listFiles()`

---

### GET `/api/files/content`

Read file content.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `path` - File path (required)
- `agentId` - Agent workspace (optional)

**Response:**
```json
{
  "content": "string",
  "path": "string",
  "size": "number"
}
```

**What it calls:**
- Container: `containerApi.readFile()`

**Errors:**
- `400` - Missing path
- `404` - File not found
- `500` - Read error

---

### DELETE `/api/files/content`

Delete a file.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `path` - File path (required)

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: `containerApi.deleteFile()`

---

### GET `/api/agent/files`

List files in main agent workspace.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `path` - Directory path (optional)

**Response:**
```json
{
  "files": ["..."]
}
```

**What it calls:**
- Container: List files in `/home/user/workspace-main`

---

### PUT `/api/agent/files`

Write file in agent workspace.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "path": "string (required)",
  "content": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "path": "string"
}
```

**What it calls:**
- Container: `containerApi.writeFile()`

---

### POST `/api/agent/files/reset`

Reset agent workspace to defaults.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "message": "Workspace reset"
}
```

**What it calls:**
- Container: Delete custom files, restore defaults

---

## Admin

**All admin routes require admin role** (email in `ADMIN_EMAILS` env var)

### GET `/api/admin/users`

List all users.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "tier": "string",
      "containerStatus": "string",
      "createdAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `users` (SELECT all)

---

### GET `/api/admin/stats`

Admin statistics.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "totalUsers": "number",
  "activeContainers": "number",
  "totalTasks": "number",
  "revenue": "number",
  "systemLoad": "number"
}
```

**What it calls:**
- Database: Aggregate queries
- SSH: System metrics

---

### GET `/api/admin/containers`

List all containers.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "containers": [
    {
      "userId": "string",
      "containerId": "string",
      "status": "string",
      "port": "number",
      "createdAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `users` (container info)
- SSH: `docker ps`

---

### GET `/api/admin/container/logs`

Get container logs.

**Auth Required:** Yes  
**Role:** Admin

**Query Params:**
- `userId` - User ID (required)
- `lines` - Number of lines (default: 100)

**Response:**
```json
{
  "logs": "string (multiline)"
}
```

**What it calls:**
- SSH: `docker logs clawer_user_{userId}`

---

### POST `/api/admin/container/restart`

Restart a user's container.

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "userId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Container restarted"
}
```

**What it calls:**
- SSH: `docker restart clawer_user_{userId}`

---

### POST `/api/admin/container/:id/restart`
### POST `/api/admin/container/:id/stop`

Restart or stop container by ID.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- SSH: Docker commands

---

### GET `/api/admin/health/fleet`

Fleet-wide health metrics.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "totalContainers": "number",
  "healthy": "number",
  "degraded": "number",
  "offline": "number",
  "cpuUsage": "number (0-100)",
  "memoryUsage": "number (0-100)"
}
```

**What it calls:**
- SSH: System metrics, Docker stats

---

### GET `/api/admin/orchestrator/fleet/metrics`

Orchestrator fleet metrics.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "containers": [
    {
      "id": "string",
      "userId": "string",
      "cpu": "number",
      "memory": "number",
      "uptime": "number"
    }
  ]
}
```

**What it calls:**
- SSH: Per-container metrics

---

### GET `/api/admin/orchestrator/fleet/trends`

Fleet trends over time.

**Auth Required:** Yes  
**Role:** Admin

**Query Params:**
- `days` - Days of history (default: 7)

**Response:**
```json
{
  "trends": [
    {
      "date": "ISO date",
      "activeContainers": "number",
      "cpuAvg": "number",
      "memoryAvg": "number"
    }
  ]
}
```

**What it calls:**
- Database: Historical metrics

---

### GET `/api/admin/orchestrator/fleet/recommendations`

Fleet optimization recommendations.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "recommendations": [
    {
      "type": "scale | optimize | alert",
      "priority": "high | medium | low",
      "message": "string",
      "action": "string"
    }
  ]
}
```

**What it calls:**
- Analytics: Resource usage patterns

---

### POST `/api/admin/orchestrator/fleet/recommendations`

Apply a recommendation.

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "recommendationId": "string (required)",
  "action": "apply | dismiss"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- SSH: Execute optimization action

---

### GET `/api/admin/orchestrator/alerts`

Admin alerts.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "severity": "critical | warning | info",
      "message": "string",
      "source": "string",
      "createdAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: Admin alerts table

---

### POST `/api/admin/orchestrator/alerts`

Create admin alert.

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "severity": "string (required)",
  "message": "string (required)",
  "source": "string (optional)"
}
```

**Response:**
```json
{
  "alertId": "uuid"
}
```

**What it calls:**
- Database: Insert alert

---

### GET `/api/admin/orchestrator/alerts/history`

Admin alert history.

**Auth Required:** Yes  
**Role:** Admin

**Query Params:**
- `days` - Days of history (default: 30)

**Response:**
```json
{
  "history": [...]
}
```

**What it calls:**
- Database: Historical alerts

---

### POST `/api/admin/orchestrator/permissions/:requestId/respond`

Admin respond to permission request.

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "approved": "boolean (required)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Container: Override permission

---

### GET `/api/admin/settings`

Get admin settings.

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "settings": {
    "key": "value"
  }
}
```

**What it calls:**
- Database: Admin config table

---

### PUT `/api/admin/settings`

Update admin settings.

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "key": "string (required)",
  "value": "any (required)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Update admin config

---

### DELETE `/api/admin/settings`

Delete admin setting.

**Auth Required:** Yes  
**Role:** Admin

**Query Params:**
- `key` - Setting key (required)

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Delete admin config key

---

## Billing

### POST `/api/stripe/checkout`

Create Stripe checkout session.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "priceId": "string (optional, default: from env)",
  "successUrl": "string (optional)",
  "cancelUrl": "string (optional)"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "url": "string (redirect URL)"
}
```

**What it calls:**
- Stripe: `stripe.checkout.sessions.create()`

**Errors:**
- `401` - Not authenticated
- `500` - Stripe API error

---

### GET `/api/stripe/checkout`

Get checkout session status.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `sessionId` - Stripe session ID

**Response:**
```json
{
  "status": "complete | open | expired",
  "subscriptionId": "string | null"
}
```

**What it calls:**
- Stripe: `stripe.checkout.sessions.retrieve()`

---

### POST `/api/stripe/portal`

Create customer portal session.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Response:**
```json
{
  "url": "string (portal URL)"
}
```

**What it calls:**
- Database: `users` (fetch stripeCustomerId)
- Stripe: `stripe.billingPortal.sessions.create()`

**Errors:**
- `401` - Not authenticated
- `403` - No active subscription
- `500` - Stripe API error

---

## User Settings

### GET `/api/user`

Get current user profile.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tier": "free | basic | pro | enterprise",
  "teamTemplate": "string",
  "defaultAgentId": "string | null",
  "createdAt": "ISO date"
}
```

**What it calls:**
- Database: `users` (SELECT)

---

### GET `/api/user/settings`

Get user settings.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "notifications": "boolean",
  "emailDigest": "boolean",
  "theme": "light | dark | auto",
  "timezone": "string"
}
```

**What it calls:**
- Database: `users` or `user_settings` table

---

### POST `/api/user/settings`

Update user settings.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "notifications": "boolean (optional)",
  "emailDigest": "boolean (optional)",
  "theme": "string (optional)",
  "timezone": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Update user preferences

---

### GET `/api/user/notifications`

Get user notifications.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "info | warning | error",
      "message": "string",
      "read": "boolean",
      "createdAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: User notifications table

---

### POST `/api/user/notifications`

Mark notification as read.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "notificationId": "uuid (required)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Update notification

---

## Bots & Customization

### GET `/api/bot/settings`

Get bot customization settings.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "botName": "string",
  "personality": "string",
  "avatar": "string (URL)",
  "communicationStyle": "string",
  "responseLength": "string"
}
```

**What it calls:**
- Database: `bot_settings` table

---

### PUT `/api/bot/settings`

Update bot settings.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "botName": "string (optional)",
  "personality": "string (optional)",
  "avatar": "string (optional)",
  "communicationStyle": "string (optional)",
  "responseLength": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Upsert `bot_settings`

---

### GET `/api/bots`

List available bot templates.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "bots": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string"
    }
  ]
}
```

**What it calls:**
- Library: Bot templates config

---

### GET `/api/briefing/settings`

Get briefing settings.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "enabled": "boolean",
  "time": "string (HH:MM)",
  "sections": ["string"]
}
```

**What it calls:**
- Database: User briefing preferences

---

### PUT `/api/briefing/settings`

Update briefing settings.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "enabled": "boolean (optional)",
  "time": "string (optional)",
  "sections": ["string (optional)"]
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Update preferences

---

## Webhooks

### POST `/api/webhooks/clerk`

Clerk auth webhook.

**Auth Required:** No (verified via webhook signature)  
**Role:** System

**Events Handled:**
- `user.created` - Create user record in database
- `user.updated` - Update user record
- `user.deleted` - Delete user record

**Response:**
```json
{
  "received": true
}
```

**What it calls:**
- Database: `users` table (INSERT, UPDATE, DELETE)

**Errors:**
- `400` - Invalid signature or payload
- `500` - Database error

---

### POST `/api/webhooks/stripe`

Stripe payment webhook.

**Auth Required:** No (verified via webhook signature)  
**Role:** System

**Events Handled:**
- `checkout.session.completed` - Activate subscription, provision container
- `customer.subscription.deleted` - Cancel subscription, stop container
- `customer.subscription.updated` - Handle subscription changes
- `invoice.payment_failed` - Alert admin

**Response:**
```json
{
  "received": true
}
```

**What it calls:**
- Database: `users` table (UPDATE subscription status)
- Provisioner: `provisionContainer()` or `stopContainer()`
- Email: `sendWelcomeEmail()`
- Alerts: `alertPaymentFailure()`

**Errors:**
- `400` - Invalid signature or missing header
- `500` - Webhook handler error

---

## Models & Configuration

### GET `/api/models`

List available AI models.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "provider": "string",
      "tier": "free | basic | pro | enterprise",
      "capabilities": ["string"]
    }
  ]
}
```

**What it calls:**
- Library: Model configuration

---

### GET `/api/models/preview`

Preview model capabilities.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `modelId` - Model ID (required)

**Response:**
```json
{
  "model": {
    "id": "string",
    "name": "string",
    "description": "string",
    "pricing": "string"
  }
}
```

**What it calls:**
- Library: Model details

---

### POST `/api/models/configure`

Configure user's model preferences.

**Auth Required:** Yes  
**Role:** Paid subscribers only

**Request Body:**
```json
{
  "orchestratorModel": "string (optional)",
  "workerModel": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: `model_configs` table (if exists) or `users` preferences

---

## Onboarding

### POST `/api/onboarding`

Submit onboarding form.

**Auth Required:** Yes  
**Role:** Any authenticated user (first-time only)

**Request Body:**
```json
{
  "name": "string (required)",
  "useCase": "string (required)",
  "teamTemplate": "string (optional)",
  "goals": ["string (optional)"]
}
```

**Response:**
```json
{
  "success": true,
  "userId": "string"
}
```

**What it calls:**
- Database: `users` (UPDATE name, teamTemplate, onboarded flag)

---

### POST `/api/onboarding/context`

Submit onboarding context.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "industry": "string (optional)",
  "teamSize": "string (optional)",
  "tools": ["string (optional)"]
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: User metadata

---

### POST `/api/onboarding/first-deliverable`

Request first deliverable during onboarding.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "deliverableType": "string (required)",
  "prompt": "string (optional)"
}
```

**Response:**
```json
{
  "taskId": "uuid",
  "message": "string"
}
```

**What it calls:**
- Database: `tasks` (INSERT)
- Container: Trigger agent to start task

---

## Maintenance

### POST `/api/maintenance/purge-messages`

Purge old messages (admin only).

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "olderThanDays": "number (required)"
}
```

**Response:**
```json
{
  "success": true,
  "deletedCount": "number"
}
```

**What it calls:**
- Database: `messages` table (DELETE old records)

---

### POST `/api/maintenance/summarize-messages`

Summarize old messages (admin only).

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "userId": "string (optional, all if not provided)",
  "sessionId": "string (optional)"
}
```

**Response:**
```json
{
  "success**: true,
  "summarizedSessions": "number"
}
```

**What it calls:**
- Database: `messages`, `conversations` (SELECT, UPDATE)
- AI: Summarization model

---

## Memory & Usage

### GET `/api/memory/stats`

Get memory usage statistics.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "totalFiles": "number",
  "totalSizeMB": "number",
  "filesByType": {
    "markdown": "number",
    "code": "number",
    "other": "number"
  }
}
```

**What it calls:**
- Container: File system stats

---

### GET `/api/usage`

Get usage statistics.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "currentPeriod": {
    "messages": "number",
    "tasks": "number",
    "storageGB": "number"
  },
  "limits": {
    "messages": "number",
    "tasks": "number",
    "storageGB": "number"
  }
}
```

**What it calls:**
- Database: Usage tables
- Container: Storage usage

---

### GET `/api/usage/details`

Detailed usage breakdown.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Query Params:**
- `startDate` - ISO date (optional)
- `endDate` - ISO date (optional)

**Response:**
```json
{
  "daily": [
    {
      "date": "ISO date",
      "messages": "number",
      "tasks": "number"
    }
  ]
}
```

**What it calls:**
- Database: Daily usage aggregates

---

### GET `/api/usage/analytics`

Usage analytics (admin or paid users).

**Auth Required:** Yes  
**Role:** Paid users or admin

**Response:**
```json
{
  "trends": {
    "messagesPerDay": "number",
    "tasksPerDay": "number",
    "peakHours": ["number"]
  }
}
```

**What it calls:**
- Database: Analytics queries

---

## Conversations (Deprecated)

### GET `/api/conversations`

List conversations (deprecated, kept for legacy support).

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "string",
      "lastMessageAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `conversations` table

**Note:** New chat system uses OpenClaw sessions directly. This is for migrating old data.

---

### DELETE `/api/conversations/:id`
### PATCH `/api/conversations/:id`

Manage individual conversations (deprecated).

---

## Messages (Deprecated)

### GET `/api/messages`
### POST `/api/messages`
### DELETE `/api/messages`

Manage messages (deprecated, use `/api/chat` instead).

**Note:** Old message storage. New system stores in OpenClaw sessions.

---

## Agents

### GET `/api/agents/:agentId/thread`

Get agent thread/session.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "agentId": "string",
  "sessionKey": "string",
  "messages": [...]
}
```

**What it calls:**
- Container: Get session for agent

---

## Teams

### GET `/api/teams/current`

Get current team (alias for `/api/team`).

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "teamTemplate": "string",
  "members": [...]
}
```

**What it calls:**
- Database: `users`
- Library: Team config

---

## Engagement

### GET `/api/engagement/pending`

Get pending engagement tasks (admin).

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "userId": "string",
      "type": "string",
      "scheduledFor": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: Engagement queue

---

### POST `/api/engagement/schedule`

Schedule engagement task (admin).

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "userId": "string (required)",
  "type": "string (required)",
  "scheduledFor": "ISO date (required)"
}
```

**Response:**
```json
{
  "taskId": "uuid"
}
```

**What it calls:**
- Database: Insert engagement task

---

### POST `/api/engagement/send/:id`

Send engagement (admin).

**Auth Required:** Yes  
**Role:** Admin

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Email: Send engagement email
- Database: Mark as sent

---

## Diagnostics

### POST `/api/diagnose`

Run system diagnostics.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Response:**
```json
{
  "checks": [
    {
      "name": "string",
      "status": "pass | fail",
      "message": "string"
    }
  ]
}
```

**What it calls:**
- Database: Connection test
- Container: Ping
- Storage: Health check

---

### GET `/api/health`

Public health check (no auth required).

**Auth Required:** No  
**Role:** Public

**Response:**
```json
{
  "status": "healthy | degraded | offline",
  "timestamp": "ISO date"
}
```

**What it calls:**
- Database: Ping
- Basic system check

---

## Feedback

### POST `/api/feedback`

Submit user feedback.

**Auth Required:** Yes  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "rating": "number (1-5, required)",
  "feedback": "string (optional)",
  "page": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: `feedback` table (INSERT)

---

### GET `/api/feedback`

Get user's feedback (admin: all feedback).

**Auth Required:** Yes  
**Role:** Any authenticated user (own), admin (all)

**Response:**
```json
{
  "feedback": [
    {
      "id": "uuid",
      "rating": "number",
      "feedback": "string",
      "createdAt": "ISO date"
    }
  ]
}
```

**What it calls:**
- Database: `feedback` table

---

### PATCH `/api/feedback`

Update feedback (admin only).

**Auth Required:** Yes  
**Role:** Admin

**Request Body:**
```json
{
  "feedbackId": "uuid (required)",
  "status": "string (optional)",
  "adminNotes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**What it calls:**
- Database: Update feedback record

---

## Error Response Format

All API routes use standardized error responses via `src/lib/api-errors.ts`:

```typescript
{
  error: string,      // Human-readable error message
  details?: string    // Optional technical details
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but lacks permission)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate or state conflict)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (container/service down)

---

## Rate Limiting

**Free Tier:**
- 10 messages per minute
- 50 messages per day
- 500 messages lifetime

**Paid Tiers:**
- Basic: 60 messages per minute
- Pro: 120 messages per minute
- Enterprise: 300 messages per minute

Rate limit info returned in headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
Retry-After: 30  (on 429 error)
```

---

## Authentication Details

**Method:** Clerk JWT via middleware  
**Protected Routes:** All `/api/*` except:
- `/api/webhooks/*` (webhook signature auth)
- `/api/health` (public)

**Admin Routes:** Require email in `ADMIN_EMAILS` env var

**Container Token:** Automatically looked up from database for paid users, uses `FREE_TIER_TOKEN` for free users

---

## Container Communication

All container communication goes through `src/lib/container-client.ts`:

```typescript
containerApi.chat(port, message, sessionKey, settings, token?)
containerApi.listCrons(port, token?)
containerApi.listFiles(port, path, token?)
containerApi.readFile(port, path, token?)
containerApi.writeFile(port, path, content, token?)
containerApi.searchMemory(userId, query)
```

**Default Ports:**
- Free tier: Port 4000 (shared)
- Paid tier: Port 4010-5000 (dedicated per user)

---

## Database Tables Used

**Primary:**
- `users` - User accounts, container info, subscription
- `tasks` - Task management
- `customAgents` - User-created agents
- `bot_settings` - Bot customization
- `agent_events` - Activity feed
- `cron_job_status` - Cron tracking
- `feedback` - User feedback

**Deprecated (Analytics Only):**
- `conversations` - Old chat threads
- `messages` - Old chat messages

---

**End of API Documentation**

For architecture details, see `ARCHITECTURE.md`.  
For error handling implementation, see `src/lib/api-errors.ts`.
