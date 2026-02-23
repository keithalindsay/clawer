# PLATFORM.md — Clawer.ai Feature Reference

You are running inside a **Clawer.ai** container. Your user interacts with you through a web dashboard at clawer.ai.

---

## 📋 Tasks / Kanban Board

The user sees tasks on their **Tasks** dashboard page.

**Use the `clawer-platform` skill** for CLI commands (`clawer-tasks create`, `clawer-tasks list`, etc.)

| Status | Meaning |
|--------|---------|
| backlog | Created, not ready |
| queued | Ready to execute |
| running | In progress |
| done | Completed |
| failed | Execution failed |

**Priorities:** low, medium, high, urgent

**Workflow:** Create a task when starting significant work, update status as you progress, mark done when complete.

---

## ⏰ Cron Jobs

Users see scheduled jobs on the **Crons** dashboard page.

```bash
openclaw cron add --name "job-name" --cron "0 9 * * *" --message "What to do"
openclaw cron list --json
openclaw cron remove --name "job-name"
```

**Common schedules:**
- `0 9 * * *` — Daily at 9am
- `0 9 * * 1-5` — Weekdays at 9am
- `0 */4 * * *` — Every 4 hours

---

## 📁 Files

Users browse files on the **Files** dashboard page.

⚠️ **Files MUST be in `~/clawd/files/` to appear in the dashboard.**

```
~/clawd/files/
├── research/    # Research, analysis
├── reports/     # Generated reports
├── notes/       # Meeting notes
├── plans/       # Project plans
└── data/        # CSV, JSON exports
```

- ✅ `~/clawd/files/report.md` — Appears in dashboard
- ❌ `~/clawd/report.md` — Does NOT appear

After saving, confirm: "Saved to Files → [filename]"

---

## 🧠 Memory

Users view memory on the **Memory** dashboard page.

| Path | Purpose |
|------|---------|
| `~/clawd/memory/YYYY-MM-DD.md` | Daily notes |
| `~/clawd/MEMORY.md` | Long-term memory |

---

## 👥 Agent Communication

Your container may have multiple AI team members.

```bash
openclaw sessions list              # See active sessions
cat ~/.team-config                  # Team roster
openclaw chat.send --agent {id} --message "..."  # Delegate
```

---

## 🛠️ Skills

```bash
openclaw skills list       # Available skills
openclaw skills info NAME  # Skill details
```

---

## 🎯 Best Practices

**Be proactive:**
- Create tasks for significant work
- Suggest crons for recurring tasks
- Save important outputs as files

**Confirm your work:**
- "✅ Created cron 'morning-briefing' — runs weekdays at 8am"
- "📁 Saved to Files → research/analysis.md"
- "📋 Added task to your board"

**Remember:** The user sees your work through the dashboard. Make it visible.

---

## Quick Reference

| Feature | Path/Command |
|---------|--------------|
| Files | `~/clawd/files/` |
| Memory | `~/clawd/memory/` |
| Tasks | `clawer-tasks` (see skill) |
| Crons | `openclaw cron` |
| Skills | `openclaw skills` |
| Agents | `openclaw sessions` |
