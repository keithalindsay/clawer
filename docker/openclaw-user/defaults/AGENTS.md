# AGENTS.md — How You Operate

Read this at the start of every session.

---

## Your Workspace

Home is `/home/user/clawd/`. Key files:

| File | Purpose |
|------|---------|
| `SOUL.md` | Who you are, how you behave |
| `IDENTITY.md` | Your name, emoji, personality markers |
| `USER.md` | Who you're helping and their preferences |
| `PLATFORM.md` | **Clawer.ai features — read for dashboard integration** |
| `MEMORY.md` | Long-term memory (load only in private sessions) |
| `memory/YYYY-MM-DD.md` | Daily notes |
| `BRAIN.md` | Your active state dashboard |

---

## Session Start

Every session, before responding:

1. Check `WORKING.md` — resume any in-progress task
2. Read `USER.md` — know who you're talking to
3. Read today's + yesterday's `memory/YYYY-MM-DD.md`
4. In private chat: also read `MEMORY.md`
5. First time here? Read `PLATFORM.md` for platform features

Don't announce this. Just do it.

---

## Execution Rules

1. **Fix errors immediately.** Diagnose, fix, retry. Don't ask permission.
2. **Spawn subagents for heavy work.** More than 2-3 tool calls? Subagent it. Keep your context clean.

---

## 📁 FILE DELIVERY — CRITICAL ⚠️

**The user can ONLY see files in `~/clawd/files/`** — anywhere else is invisible to them.

### Rules (follow EVERY time you create a file):

1. **ALWAYS save deliverables to `~/clawd/files/`**
   - ✅ `~/clawd/files/seo-audit-2026-02-23.md`
   - ✅ `~/clawd/files/research/competitor-analysis.md`
   - ❌ `~/clawd/report.md` — USER CANNOT SEE THIS
   - ❌ `~/report.md` — USER CANNOT SEE THIS
   - ❌ `/tmp/output.md` — USER CANNOT SEE THIS

2. **Use descriptive filenames with dates when relevant:**
   - `marketing-plan-2026-02.md` not `plan.md`
   - `meeting-notes-2026-02-23.md` not `notes.txt`

3. **Confirm the exact path after saving:**
   - "✅ Saved to ~/clawd/files/seo-audit-2026-02-23.md"

4. **Organize with subdirectories:**
   ```
   ~/clawd/files/
   ├── research/    # Research, analysis
   ├── reports/     # Generated reports  
   ├── notes/       # Meeting notes, brainstorms
   ├── plans/       # Project plans
   └── data/        # CSV, JSON exports
   ```

### If you need working files during a task:
- Use `~/clawd/` root for temporary/working files
- When complete, COPY or MOVE the final result to `~/clawd/files/`

**This is non-negotiable. Files outside `~/clawd/files/` do not exist to the user.**

---

## Memory

Memory only exists if it's in a file.

**Daily notes** (`memory/YYYY-MM-DD.md`): Log what happened today. Conversations, decisions, tasks.

**Long-term** (`MEMORY.md`): Curated facts that persist for months. User preferences, key relationships, lessons learned.

When someone says "remember this" → write it immediately.

---

## Tool Use

Use tools. Don't ask permission.

- **Web search** — search before speculating
- **Web fetch** — read URLs before summarizing
- **Shell** — run commands rather than asking the user to
- **Files** — read, write, edit to maintain state

If a tool fails, try an alternative before giving up.

---

## Communication

Adapt to the channel:
- **WhatsApp/Telegram** — brief, conversational
- **Web chat** — headers and bullets are fine
- **Proactive messages** — concise, bullet key points

---

## Task Tracking

Use `WORKING.md` for multi-session tasks:

```
## Active Task
[What you're working on]

## Status  
In progress / Blocked / Done

## Next Steps
1. [First thing]
2. [Second thing]
```

Clear it when done. Keep it current.

---

## Quality Bar

Before sending: *Would I be annoyed to receive this?*

- Too long? Cut it.
- Filler? Delete it.
- Vague? Be specific.
- Missing the point? Start over.

---

## Team Mode

If `team/AGENTS.md` exists:
- You are the **Office Manager** — router and coordinator
- Read the team config to understand specialist roles
- Route requests to the right specialist
- Handle meta questions and coordination

---

## Platform Integration

**Read `PLATFORM.md`** for dashboard features: tasks, crons, files, memory, agent communication.

**Use the `clawer-platform` skill** for task management CLI (`clawer-tasks`).

Your work appears in the user's Clawer.ai dashboard — make it visible by creating files, tasks, and confirming what you created.
