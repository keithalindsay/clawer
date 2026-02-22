# Cleanup Plan — Clawer.ai Codebase

**Based on:** `docs/CODEBASE-AUDIT.md` (verified by manual review)
**Branch:** `staging`
**Philosophy:** Fix in safe batches. Each batch is a single commit that can be tested independently. No batch should break existing functionality.

---

## Batch 1: Security Fixes (CRITICAL — Do First)
**Estimated effort:** 1 agent, ~30 min
**Risk:** Low (these are isolated changes)

### 1A. Remove hardcoded fallback token
- **File:** `src/lib/constants.ts:2`
- **Change:** Remove `|| 'free_tier_shared_2026_clawer'` fallback. Throw at startup if env var missing.
- **Why safe:** Production always has the env var set. This only catches misconfigured deploys.

### 1B. Kill the Slack/Moonshot route
- **File:** `src/app/api/slack/events/route.ts` (entire file)
- **Change:** Delete this file entirely. It routes user messages to `api.moonshot.cn` (Chinese LLM) using a platform key. Nobody is using Slack integration yet — no users have `slackTeamId` set.
- **Verify first:** `SELECT count(*) FROM users WHERE slack_team_id IS NOT NULL;` — expect 0.
- **Why safe:** No active Slack users. The container-proxy Slack route (`/api/container/slack/*`) is the intended architecture.

### 1C. Honest API key column name
- **File:** `src/lib/db/schema/api-keys.ts`
- **Change:** Rename comment from "Encrypted API key" to "API key (plaintext — encryption TODO)". Don't rename the DB column (would need migration), just fix the misleading JSDoc.
- **Note:** Actual encryption (AES-256-GCM) is a larger task. Since API Keys are hidden from the dashboard nav and no users are storing keys yet, this is documentation-only for now.
- **Why safe:** Comment-only change, no runtime impact.

**Commit:** `security: remove hardcoded token fallback, kill moonshot route, fix misleading encryption comment`

---

## Batch 2: Dead Code Removal (~1,500 lines)
**Estimated effort:** 1 agent, ~20 min
**Risk:** Very low (nothing imports these files)

### Delete these 10 unused components:
```
src/components/ContainerStatus.tsx
src/components/ContainerStatusWidget.tsx
src/components/DiagnoseButton.tsx
src/components/FreeTrialBanner.tsx
src/components/TelegramCard.tsx
src/components/TelegramConnectModal.tsx
src/components/UsageWidget.tsx
src/components/WelcomeToast.tsx
src/components/QuickActions.tsx          (root — shadowed by dashboard version)
src/components/dashboard/DashboardShell.tsx
```

### Delete dead test:
```
src/components/__tests__/FreeTrialBanner.test.tsx
```

### Delete deprecated lib:
```
src/lib/orchestrator.local.ts.deprecated
```

### Delete superseded routes:
```
src/app/api/telegram/connect/route.ts
src/app/api/telegram/disconnect/route.ts
src/app/api/telegram/status/route.ts
src/app/api/slack/connect/route.ts
src/app/api/message/              (empty directory)
```

### Delete stub routes (return fake data, misleading):
```
src/app/api/bots/[botId]/route.ts
src/app/api/bots/[botId]/activate/route.ts
src/app/api/user/usage/route.ts
```

### Verification before deleting each:
Run `grep -rn "FILENAME" src/ --include="*.ts" --include="*.tsx"` to confirm 0 imports outside of the file itself and its test.

**Commit:** `chore: remove 1500+ lines of dead code, unused components, superseded routes`

---

## Batch 3: Shared Dashboard Nav
**Estimated effort:** 1 agent, ~45 min
**Risk:** Medium (touches multiple files, but UI-only)

### Create `src/components/dashboard/DashboardNav.tsx`
- Extract the nav that's duplicated in 4+ files
- Props: `activeSection: 'dashboard' | 'chat' | 'tasks' | 'files' | 'agent' | 'memory' | 'settings'`
- Consistent items: Dashboard, Chat, Tasks, Files, Agent, Memory, Settings
- Active state: orange text + underline (per brand guide)
- Include user email + sign out button

### Update these files to use DashboardNav:
- `src/components/dashboard/DashboardHome.tsx` — remove inline nav
- `src/components/dashboard/DashboardWorkspace.tsx` — remove inline nav  
- `src/components/files/FilesPage.tsx` — remove inline nav
- `src/components/dashboard/TaskBoard.tsx` — remove inline nav
- `src/app/dashboard/agent/page.tsx` — remove inline nav
- `src/app/dashboard/memory/page.tsx` — remove inline nav

### Alternative: Use `src/app/dashboard/layout.tsx`
Check if there's already a layout.tsx that wraps all dashboard routes. If so, put the nav THERE instead of a component — then individual pages don't need to import it at all. This is the Next.js-blessed approach.

**Commit:** `refactor: extract shared DashboardNav, remove 4 duplicate navs`

---

## Batch 4: Stub Cleanup & TypeScript Fixes
**Estimated effort:** 1 agent, ~30 min
**Risk:** Low

### 4A. Fix `as any` casts on dashboard page
- **File:** `src/app/dashboard/page.tsx`
- Add `teamTemplate`, `whatsappConnected`, `telegramConnected` to the DB query select
- Remove the `as any` casts (lines 47, 132, 133)

### 4B. Fix hardcoded `isFreeTier` in chat page
- **File:** `src/app/chat/[botId]/page.tsx:194`
- Fetch the user's actual plan status instead of `useState(true)`

### 4C. Fix account deletion button
- **File:** `src/app/dashboard/settings/page.tsx:963`
- Either implement it (delete user + container + data) or remove the button entirely
- Recommendation: Remove the button for now with a comment "Contact support to delete account" — proper deletion is a feature unto itself

### 4D. Update middleware protected routes list
- **File:** `src/middleware.ts`
- Add missing routes: `/api/tasks`, `/api/files`, `/api/dashboard`, `/api/team`, `/api/agent`, `/api/memory`, `/api/briefing`

**Commit:** `fix: typescript any casts, middleware route list, stub cleanups`

---

## Batch 5: API Response Standardization (Gradual)
**Estimated effort:** Multiple sessions, ongoing
**Risk:** Low per-route, but tedious

### NOT a big-bang migration.
Instead, establish the rule:
- Any route touched for ANY reason gets migrated to `apiSuccess/apiErrors` pattern
- New routes MUST use the helpers
- Add an ESLint comment or CONTRIBUTING note

### Start with high-traffic routes:
1. `/api/chat/route.ts` (most important)
2. `/api/messages/route.ts`
3. `/api/dashboard/stats/route.ts`
4. `/api/dashboard/activity/route.ts`
5. `/api/container/status/route.ts`

**Commit:** Per-route, bundled with other changes

---

## Execution Order

| Batch | What | Agent? | Safe to merge independently? |
|-------|------|--------|------------------------------|
| 1 | Security fixes | Yes | ✅ Yes — isolated changes |
| 2 | Dead code removal | Yes | ✅ Yes — only deletions |
| 3 | Shared nav | Yes | ✅ Yes — UI refactor |
| 4 | Stubs + TypeScript | Yes | ✅ Yes — targeted fixes |
| 5 | API standardization | Gradual | ✅ Yes — per-route |

Each batch gets its own commit, deployed to staging, verified, then promoted to prod. No batch depends on another.

---

## What NOT to Change (Leave Alone)

- **Landing page `'use client'`** — Framer Motion needs it. Could optimize later but not worth the risk now.
- **Two chat UIs (`/dashboard/chat` vs `/chat/[botId]`)** — Different entry points, different UX. Consolidation is a future project.
- **Drizzle schema column names** — Renaming `encrypted_key` in DB requires a migration + downtime risk. Not worth it for a name.
- **SWR/React Query adoption** — Current fetch+useEffect works. Adding a data layer is a feature decision, not cleanup.
- **Error handling standardization** — Comes naturally with Batch 5 (API response migration). Don't do a separate pass.

---

## Success Criteria

After all batches:
- [ ] Zero `grep` hits for deleted component names
- [ ] `pnpm tsc --noEmit` clean
- [ ] All existing tests pass
- [ ] No hardcoded tokens in source
- [ ] No routes returning fake data
- [ ] Single nav component used everywhere
- [ ] Middleware route list matches reality
- [ ] Zero `as any` on dashboard page
