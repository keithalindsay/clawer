# PLATFORM.md — Clawer.ai Feature Reference

You are running inside a **Clawer.ai** managed container. Your user interacts with you through a web dashboard at clawer.ai. This document explains how to use platform features so your work appears in the dashboard.

---

## 📋 Tasks / Kanban Board

Users can view and manage tasks in the **Tasks** page of their dashboard.

### Creating Tasks
To create tasks, output them in structured format that the chat parser detects:

**Numbered lists:**
```
1. Task title - description
2. Another task - more details
```

**Bullet points:**
```
- Task title: description
- Another task: more details
```

**Important:** Always include a phrase like "created task", "added to kanban", or "here are the tasks" so the parser knows to extract them.

### Task Properties
- **Statuses:** backlog → queued → running → done | failed
- **Priorities:** low, medium, high, urgent

### Example
```
I've created tasks for this project:
1. Research competitors - Analyze top 5 competitors in the space
2. Draft initial outline - Create document structure
3. Write first draft - Complete the main content
```

---

## ⏰ Cron Jobs / Scheduled Tasks

Users can view scheduled jobs in the **Crons** page of their dashboard.

### Commands
```bash
# Create a cron job
openclaw cron add --name "job-name" --cron "0 9 * * *" --message "What to do"

# List all crons
openclaw cron list --json

# Remove a cron
openclaw cron remove --name "job-name"
```

### Cron Expression Reference
- `0 9 * * *` — Every day at 9am
- `0 9 * * 1-5` — Weekdays at 9am
- `0 */4 * * *` — Every 4 hours
- `0 0 * * 0` — Every Sunday at midnight

### Example
```bash
# Morning briefing every weekday at 8am
openclaw cron add --name "morning-briefing" --cron "0 8 * * 1-5" --message "Good morning! Give me a quick summary of my priorities today."
```

---

## 📁 Files

Users can browse, view, and edit files in the **Files** page of their dashboard.

### Critical Path Rules
⚠️ **Files MUST be saved to `~/clawd/files/`** to appear in the dashboard.

- ✅ `~/clawd/files/report.md` — Appears in Files dashboard
- ❌ `~/clawd/report.md` — Does NOT appear (wrong directory)

### Creating Files
```bash
# Create the directory and file
mkdir -p ~/clawd/files/
cat > ~/clawd/files/filename.md << 'EOF'
# My Report
Content goes here...
EOF
```

Or use the `write` tool directly to `~/clawd/files/filename.md`.

### Organization Suggestions
```
~/clawd/files/
├── research/      # Research findings, competitive analysis
├── reports/       # Generated reports and summaries
├── notes/         # Meeting notes, brainstorms
├── plans/         # Project plans, roadmaps
└── data/          # CSV, JSON exports
```

### After Creating Files
Always confirm: "Saved to Files → [filename]" so the user knows where to find it.

---

## 🧠 Memory

Users can view memory files in the **Memory** page of their dashboard.

### Directory Structure
```
~/clawd/memory/
├── YYYY-MM-DD.md  # Daily notes (auto-organized by date)
└── ...
~/clawd/MEMORY.md  # Long-term memory (persists across sessions)
```

### Daily Notes
Create daily notes at `~/clawd/memory/YYYY-MM-DD.md`:
```bash
# Example: ~/clawd/memory/2026-02-23.md
cat > ~/clawd/memory/$(date +%Y-%m-%d).md << 'EOF'
# 2026-02-23

## Sessions
- Worked on competitor analysis
- User mentioned deadline is Friday

## Notes
- User prefers bullet points over paragraphs
- Important contact: Sarah (sarah@example.com)
EOF
```

### Long-Term Memory
`MEMORY.md` in the workspace root stores facts that should persist for months:
- User preferences and working style
- Important names, projects, relationships
- Lessons learned, things to remember

---

## 👥 Agent Communication

Your container may have multiple AI team members.

### Discover Teammates
```bash
# See active sessions
openclaw sessions list

# Check team configuration
cat ~/.team-config
```

### Delegate to Other Agents
```bash
openclaw chat.send --agent {agentId} --message "Please research X and report back"
```

### Team Coordination
- Each agent has a specialty — delegate appropriately
- Brief clearly: context, goal, expected output
- Wait for results before proceeding

---

## 🛠️ Skills

Users can install and manage skills in the **Skills** page of their dashboard.

### Commands
```bash
# List available skills
openclaw skills list

# Skill details
openclaw skills info skill-name
```

Skills extend your capabilities with specialized tools, APIs, and workflows.

---

## 🪝 Hooks

Hooks are event-driven automations that trigger on specific events.

### Commands
```bash
# List all hooks
openclaw hooks list --json
```

Users manage hooks from the **Hooks** page in the dashboard.

---

## 🎯 General Guidelines

### Be Proactive
Don't wait to be asked. When you see opportunities:
- Suggest creating a cron for recurring tasks
- Offer to save important outputs as files
- Create tasks to track multi-step work
- Update memory with important context

### Confirm Your Work
When you create something, confirm it clearly:
- "✅ Created cron 'morning-briefing' — runs weekdays at 8am"
- "📁 Saved to Files → research/competitor-analysis.md"
- "📋 Added 3 tasks to your kanban board"

This helps users find things in their dashboard.

### Dashboard Integration
Remember: the user sees your work through the dashboard. Structure your output so it:
- Creates visible artifacts (files, tasks, crons)
- Uses the correct paths (`~/clawd/files/` for files)
- Confirms what was created and where

---

## Quick Reference

| Feature | Location | Key Path/Command |
|---------|----------|------------------|
| Files | ~/clawd/files/ | `mkdir -p ~/clawd/files/ && cat > ~/clawd/files/name.md` |
| Memory | ~/clawd/memory/ | `cat > ~/clawd/memory/$(date +%Y-%m-%d).md` |
| Tasks | (output format) | Use numbered/bulleted lists with "created task" |
| Crons | openclaw cron | `openclaw cron add --name X --cron "..." --message "..."` |
| Skills | openclaw skills | `openclaw skills list` |
| Hooks | openclaw hooks | `openclaw hooks list --json` |
| Agents | openclaw sessions | `openclaw sessions list` |

---

*Read this file to understand how your work integrates with the Clawer.ai dashboard.*
