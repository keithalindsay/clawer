---
name: clawer-platform
description: "Interact with the Clawer.ai dashboard — manage tasks on the kanban board visible to your user"
homepage: https://clawer.ai
metadata: {"clawdbot":{"emoji":"📋","requires":{"bins":["clawer-tasks"]}}}
---

# Clawer Platform Skill

**This is the authoritative source for task management CLI commands.**

When you create or update tasks, they appear on the user's kanban board in real-time. See `PLATFORM.md` for other dashboard features (crons, files, memory).

## Task Management

The kanban board has 5 status columns: `backlog` → `queued` → `running` → `done` | `failed`

### Commands

```bash
# List all tasks
clawer-tasks list

# Filter by status
clawer-tasks list --status queued
clawer-tasks list --status running

# Filter by priority
clawer-tasks list --priority high
clawer-tasks list --priority urgent

# Get a specific task
clawer-tasks get <task-id>

# Create a new task
clawer-tasks create "Task title"
clawer-tasks create "Task title" --priority high
clawer-tasks create "Task title" --description "More details here"
clawer-tasks create "Task title" --status queued  # Skip backlog

# Update a task
clawer-tasks update <task-id> --status done
clawer-tasks update <task-id> --status running
clawer-tasks update <task-id> --priority urgent
clawer-tasks update <task-id> --description "Updated description"

# Delete a task
clawer-tasks delete <task-id>
```

## Status Values
- `backlog` — Created but not ready to work on
- `queued` — Ready to execute, waiting in line
- `running` — Currently being worked on
- `done` — Completed successfully  
- `failed` — Execution failed

## Priority Values
- `low` — Can wait
- `medium` — Normal priority (default)
- `high` — Should be done soon
- `urgent` — Do this now

## Examples

### When the user asks you to do something
```bash
# Create a task to track the work
clawer-tasks create "Research competitors" --priority high --status running

# Do the work...

# Mark it complete
clawer-tasks update <task-id> --status done
```

### Check what's on the board
```bash
# See all tasks
clawer-tasks list

# See what's ready to work on
clawer-tasks list --status queued
```

### Report progress
```bash
# Starting a task
clawer-tasks update abc123 --status running

# Task failed
clawer-tasks update abc123 --status failed
```

## Tips
- The user sees tasks in their dashboard at clawer.ai
- Create tasks for significant work (not every small step)
- Update status as you progress so the user can follow along
- Use `description` for detailed instructions or context
