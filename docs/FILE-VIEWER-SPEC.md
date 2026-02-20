# File Viewer — Architecture Spec

**Version:** 1.0  
**Status:** Ready for implementation  
**Author:** Architect subagent  
**Date:** 2026-02-20

---

## Executive Summary

Users need to see the files their agents create. Right now those files live in the container workspace and are invisible. This spec designs a `/dashboard/files` page that gives users a read-only (and optionally delete-able) view of their agent's output files, using the existing volume mount infrastructure — **no SSH or docker exec required**.

---

## 1. Container-Side Convention

### 1.1 Directory Structure

Agents write output files to a dedicated subdirectory:

```
/home/user/clawd/
├── files/                  ← OUTPUT FILES (this is what gets displayed)
│   ├── research/           ← Research reports, web scraping output
│   ├── reports/            ← Generated reports, summaries
│   ├── notes/              ← Working notes, brainstorming
│   ├── plans/              ← Task plans, project outlines
│   └── data/               ← Structured data: JSON, CSV
├── AGENTS.md               ← Config (existing)
├── SOUL.md                 ← Config (existing)
├── USER.md                 ← Config (existing)
├── WORKING.md              ← Runtime state (existing)
└── memory/                 ← Daily notes (existing)
```

**Why `files/` with sub-folders?**  
- Clean separation between config files and agent output
- Sub-folders give the UI a natural tree structure without complex path logic
- Agents already understand folder-based organization from their workspace setup
- Flat `files/` with no sub-folders becomes a disorganized dump immediately

**Sub-folder semantics** (agents decide which to use):
- `research/` — anything from web searches, URL fetches, competitor analysis
- `reports/` — final deliverables, summaries, analysis outputs
- `notes/` — working memory, brainstorming, in-progress thinking
- `plans/` — task breakdowns, project roadmaps
- `data/` — CSV/JSON structured outputs

### 1.2 AGENTS.md Addition

Add this section to the AGENTS.md template (the one at `/opt/defaults/AGENTS.md`):

```markdown
## 📁 Saving Files for the User to See

When you produce something the user would want to read — a report, research output,
plan, or data export — save it to `~/clawd/files/` so it appears in their dashboard.

**Directory guide:**
- Research / web scraping → `~/clawd/files/research/`
- Reports & summaries → `~/clawd/files/reports/`
- Working notes → `~/clawd/files/notes/`
- Project plans → `~/clawd/files/plans/`
- JSON / CSV data → `~/clawd/files/data/`

**Naming convention:**
- Use kebab-case, no spaces: `competitor-analysis-2026-02-20.md`
- Prefix with date when the file is time-sensitive: `YYYY-MM-DD-topic.md`
- Be descriptive: `openai-pricing-research.md` not `research1.md`

**Format rules:**
- Default to Markdown (`.md`) — it renders beautifully in the dashboard
- Use `.json` for structured data that will be parsed programmatically
- Use `.csv` for tabular data
- Use `.txt` only for plain text that doesn't need formatting

**DO NOT save to `~/clawd/files/`:**
- Temporary working files (use `/tmp/` instead)
- Config files (those live in `~/clawd/` root)
- Binary files, images, or executables
```

### 1.3 File Naming Conventions

| Pattern | Example | Use when |
|---------|---------|----------|
| `YYYY-MM-DD-topic.md` | `2026-02-20-market-research.md` | Time-sensitive outputs |
| `topic-name.md` | `competitor-analysis.md` | Evergreen content |
| `topic-name.json` | `pricing-data.json` | Structured data |
| `topic-name.csv` | `leads-export.csv` | Tabular data |

Rules enforced by convention (not code):
- Kebab-case only, no spaces or underscores
- Max 80 chars
- No `.` in stem (dots only before extension)

### 1.4 Supported File Types

| Extension | Render mode | Notes |
|-----------|-------------|-------|
| `.md` | Rich markdown | GFM tables, fenced code blocks, task lists |
| `.txt` | Plain text, monospace | No processing |
| `.json` | Syntax-highlighted code | Pretty-printed with collapse |
| `.csv` | HTML table | Max 500 rows shown, download for rest |

**Deliberately excluded:** `.py`, `.sh`, `.ts`, `.pdf`, `.png`, images, binaries. If an agent saves one of these, the API returns `"unsupported_type"` and the UI shows a "Download" button only (no preview).

---

## 2. API Design

### 2.1 Access Method: Direct Volume Mount

**Decision: Read files directly via Node.js `fs`, not via SSH or `docker exec`.**

Rationale:
- The Next.js app runs on the same host as the containers
- Volume is already mounted at `/opt/clawer/userdata/clawer_user_{userId}/clawd/`
- The existing `agent/files` route already does this for SOUL.md, AGENTS.md, etc.
- `docker exec` adds ~200ms latency per call and a process fork
- SSH adds a full TCP round-trip plus auth overhead
- Direct `fs` access is synchronous to the filesystem, instant

### 2.2 Endpoints

#### `GET /api/files` — List files

Returns the tree of files under `~/clawd/files/`.

**Request:** No body, Clerk auth cookie.

**Response:**
```json
{
  "success": true,
  "data": {
    "containerReady": true,
    "totalFiles": 12,
    "totalSizeBytes": 48210,
    "folders": [
      {
        "name": "research",
        "path": "research",
        "files": [
          {
            "name": "competitor-analysis.md",
            "path": "research/competitor-analysis.md",
            "sizeBytes": 4820,
            "modifiedAt": "2026-02-20T14:30:00.000Z",
            "type": "md"
          }
        ]
      }
    ],
    "rootFiles": []
  }
}
```

Notes:
- Only walks one level deep (folder → files, no nested folders)
- Root-level files in `files/` are listed under `rootFiles`
- Max 200 files total; if exceeded, returns `truncated: true`

#### `GET /api/files/content?path=research/competitor-analysis.md` — Read file

Returns file content.

**Request:** Query param `path` (relative to `clawd/files/`)

**Response (success):**
```json
{
  "success": true,
  "data": {
    "path": "research/competitor-analysis.md",
    "name": "competitor-analysis.md",
    "type": "md",
    "content": "# Competitor Analysis\n\n...",
    "sizeBytes": 4820,
    "modifiedAt": "2026-02-20T14:30:00.000Z",
    "truncated": false
  }
}
```

**Response (file too large — over 512KB):**
```json
{
  "success": true,
  "data": {
    "path": "...",
    "type": "md",
    "content": "... first 512KB ...",
    "sizeBytes": 2097152,
    "truncated": true,
    "truncatedAt": 524288
  }
}
```

#### `DELETE /api/files/content?path=research/competitor-analysis.md` — Delete file

Permanently deletes the file. No trash/undo.

**Response:**
```json
{
  "success": true,
  "data": { "deleted": "research/competitor-analysis.md" }
}
```

### 2.3 Auth & Security

Every endpoint:
1. Calls `auth()` from `@clerk/nextjs/server` — returns 401 if no session
2. Looks up user in DB to get their userId (which determines container path)
3. Resolves the requested path and verifies it's within the user's files directory

```typescript
// Security: resolve and verify path stays within bounds
function resolveFilePath(userId: string, relativePath: string): string {
  const containerName = `clawer_user_${userId}`;
  const baseDir = path.resolve(
    `/opt/clawer/userdata/${containerName}/clawd/files`
  );
  // path.resolve with two args: resolves relativePath relative to baseDir
  const resolved = path.resolve(baseDir, relativePath);
  
  // CRITICAL: must start with baseDir + path.sep to prevent traversal
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw new SecurityError('Path traversal attempt detected');
  }
  return resolved;
}
```

**Path traversal prevention:**
- `path.resolve()` collapses all `..` segments before the prefix check
- Check happens server-side before any `fs` call
- If check fails → 400 with generic "invalid path" message (don't leak info)

**Additional guards:**
- No symlink following: check with `fs.lstat()` → if `isSymbolicLink()` → reject
- No file extensions outside the allowed set → 415 Unsupported Media Type
- Container path derived only from DB-stored userId, never from user input

### 2.4 File Size Limits

| Limit | Value | Action |
|-------|-------|--------|
| Single file read | 512 KB | Serve first 512KB, set `truncated: true` |
| File list max | 200 files | Return list + `truncated: true` flag |
| Delete | Any size | Always allowed |

Files larger than 512KB in a text editor are basically unusable. Serve a truncated preview with a download link for the rest.

### 2.5 Container Stopped Behavior

If the container is stopped, the volume mount still exists on the host — **files are still readable**. The files directory persists independently of container state.

The `GET /api/files` response includes `containerReady: boolean` (derived from `user.containerStatus === 'running'`). The UI shows a subtle banner: "Your agent is offline — files shown are from last active session" but still renders them.

---

## 3. Dashboard UI

### 3.1 Page Location

`/dashboard/files` — new route under the existing dashboard.

### 3.2 Layout: Two-Panel

**Decision: Two-panel (sidebar tree + content viewer), NOT card grid.**

Card grids work for 5-10 files. Agents will create 50+. A tree sidebar:
- Lets users navigate quickly without losing context of what else is there
- Maps perfectly to the `research/`, `reports/`, `notes/`, `plans/` folder structure
- Is the established pattern for file browsers (VS Code, Notion, Finder)
- Works better for long filenames

**Desktop layout:**
```
┌─────────────────────────────────────────────────────────┐
│  🦞 Clawer.ai  Dashboard  Tasks  Chat  Files  Agent  Settings │  ← nav
├────────────────┬────────────────────────────────────────┤
│ Files          │ competitor-analysis.md          🗑 Delete│
│                │ ─────────────────────────────────────── │
│ 📁 research  ▼ │                                         │
│   competitor.. │  # Competitor Analysis                  │
│   openai-pri.. │                                         │
│ 📁 reports   ▶ │  This report covers...                  │
│ 📁 notes     ▶ │                                         │
│ 📁 plans     ▶ │  ## Key Players                        │
│ 📁 data      ▶ │  ...                                    │
│                │                                         │
│ 12 files, 47KB │ Last modified: Feb 20, 2026 2:30 PM     │
└────────────────┴────────────────────────────────────────┘
```

**Mobile layout:**
- Sidebar = full-width file list (default view)
- Tap a file → slides to full-screen content view
- "← Back" button returns to file list
- No split-panel on mobile (too cramped)

### 3.3 Markdown Rendering

**Decision: `react-markdown` + `remark-gfm` + `rehype-highlight`**

`react-markdown` is already in `package.json`. Add:
- `remark-gfm` — tables, strikethrough, task lists, autolinks (GitHub-flavored Markdown)
- `rehype-highlight` — syntax highlighting for code blocks via highlight.js

Do NOT use: `@uiw/react-md-editor` (too heavy, editing focus), `marked` (XSS risks without sanitizer), or `MDX` (overkill, compile step).

Styling: use Tailwind `prose` class from `@tailwindcss/typography` plugin (add if not present — check) with custom max-width. This gives beautiful default markdown styles.

### 3.4 File List Sidebar

```tsx
// Folder item (collapsed/expanded)
<FolderItem name="research" files={[...]} onSelect={setSelectedFile} />

// File item
<FileItem
  name="competitor-analysis.md"
  path="research/competitor-analysis.md"
  isSelected={selectedFile?.path === 'research/competitor-analysis.md'}
  modifiedAt={...}
  onClick={() => setSelectedFile(file)}
/>
```

Selected file: `bg-blue-50 text-blue-700 font-medium`
Hover: `bg-gray-50`
Folder: caret icon rotates on expand

### 3.5 Content Viewer

Renders based on file type:
- `.md` → `<ReactMarkdown>` with GFM + code highlight
- `.txt` → `<pre className="font-mono text-sm">` 
- `.json` → JSON.parse → pretty print → `<pre>` with syntax highlight
- `.csv` → parse to array → `<table>` with Tailwind table styles
- `unsupported` → icon + "Preview unavailable" + download link

Truncation banner (when `truncated: true`):
```
⚠️ This file is large (2.1 MB). Showing first 512 KB.
```

### 3.6 Empty State

When no files exist:
```
📂

Your agent hasn't created any files yet.

Ask your agent to research a topic, write a report,
or save notes — they'll appear here automatically.

[Chat with your agent →]
```

Subtle, informative, gives the user a clear next action (go to Chat).

### 3.7 Navigation Integration

Add "Files" to the nav in `DashboardHome.tsx` and to every other page that renders the nav:

```tsx
<Link href="/dashboard/files" className="text-gray-500 hover:text-gray-900">Files</Link>
```

Position: between "Chat" and "Agent".

Final nav order: **Dashboard · Tasks · Chat · Files · Agent · Settings**

### 3.8 Loading States

- Sidebar: skeleton lines (3-4 folders with 2-3 file skeletons each)
- Content: single shimmer block (full-width skeleton)
- Use existing `Skeleton` component from `src/components/ui/Skeleton.tsx`

---

## 4. Implementation Plan

### 4.1 Files to Create

```
src/app/api/files/route.ts                  ← GET (list), new endpoint
src/app/api/files/content/route.ts          ← GET (read), DELETE
src/app/dashboard/files/page.tsx            ← Server component, auth + data fetch
src/app/dashboard/files/loading.tsx         ← Suspense skeleton
src/components/files/FilesPage.tsx          ← Client component (interactive)
src/components/files/FolderTree.tsx         ← Sidebar tree (client)
src/components/files/FileItem.tsx           ← Individual file row (client)
src/components/files/ContentViewer.tsx      ← Right panel renderer (client)
src/components/files/MarkdownViewer.tsx     ← react-markdown wrapper
src/components/files/CsvViewer.tsx          ← CSV → table renderer
src/lib/files.ts                            ← Shared logic: path validation, fs reads
```

### 4.2 Files to Modify

```
src/components/dashboard/DashboardHome.tsx  ← Add "Files" to nav (2-line change)
src/app/api/agent/files/route.ts            ← Update getContainerPath (shared util)
```

**Do NOT modify** existing agent/files routes — they serve a different purpose (editing config files). The new `/api/files` routes are for agent output files.

### 4.3 Dependencies to Add

```bash
npm install remark-gfm rehype-highlight
```

Check if `@tailwindcss/typography` is already present:
```bash
grep typography package.json
```
If not: `npm install @tailwindcss/typography` and add to `tailwind.config.ts`:
```ts
plugins: [require('@tailwindcss/typography')]
```

### 4.4 Complexity Estimates

| Component | Complexity | Hours |
|-----------|------------|-------|
| `src/lib/files.ts` (path validation + fs reads) | Low | 1h |
| `GET /api/files` route | Low | 1h |
| `GET /api/files/content` route | Low | 0.5h |
| `DELETE /api/files/content` route | Low | 0.5h |
| `FilesPage` + server component | Low | 1h |
| `FolderTree` + `FileItem` (sidebar) | Medium | 2h |
| `ContentViewer` dispatch logic | Low | 1h |
| `MarkdownViewer` | Low | 1h |
| `CsvViewer` | Medium | 1.5h |
| Mobile responsive layout | Medium | 2h |
| Loading/empty states | Low | 0.5h |
| Nav update across pages | Low | 0.5h |
| **Total** | | **~12h** |

### 4.5 What Can Be Parallelized

Two tracks that can run simultaneously:

**Track A (Backend):** `src/lib/files.ts` → API routes → unit tests  
**Track B (Frontend):** `FilesPage` → `FolderTree` → `ContentViewer` → sub-renderers

Track B can start with mock data immediately; connect to API when Track A is done.

### 4.6 Recommended Implementation Order

1. `src/lib/files.ts` — foundation, all security logic here
2. Both API routes — validate with curl before touching UI
3. `FilesPage` (server component) — stub it working first
4. `FolderTree` + `FileItem` — sidebar nav
5. `ContentViewer` + `MarkdownViewer` — markdown first (most common type)
6. `CsvViewer` + JSON view — secondary types
7. Mobile layout — last, after desktop is solid
8. Nav update + loading states

---

## 5. Edge Cases

### 5.1 Container Stopped

**Behavior:** Show files anyway.

The volume mount at `/opt/clawer/userdata/{containerName}/clawd/` persists on the host regardless of container state. Files are still readable. The API will successfully return them.

Show a subtle non-blocking banner at the top of the files page:
```
💤 Your agent is currently offline. Files shown are from your last session.
   [Restart agent →]
```

Never block file access because the container is down — that would be the worst time to deny users access (they might need those files urgently).

### 5.2 Very Large Files

Files over **512 KB** are truncated server-side before being sent. The API response includes `truncated: true` and `sizeBytes` (actual total size).

The UI shows:
```
⚠️ Large file (2.1 MB) — showing first 512 KB
   [Download full file]  ← links to a future /api/files/download endpoint
```

Files over **50 MB**: return metadata only, no content, with a `tooLarge: true` flag. The UI shows only the download button.

**Note:** A `/api/files/download` endpoint (streaming response) is out of scope for v1 but should be added in v2. Stub the "Download full file" button as disabled with "Coming soon" tooltip for now.

### 5.3 Symlink Attacks / Path Traversal

Three layers of protection:

**Layer 1 — Input sanitization:**
```typescript
// Reject any path with null bytes (classic exploit)
if (relativePath.includes('\0')) throw new SecurityError();
// Reject absolute paths
if (path.isAbsolute(relativePath)) throw new SecurityError();
```

**Layer 2 — Path resolution check:**
```typescript
const resolved = path.resolve(baseDir, relativePath);
if (!resolved.startsWith(baseDir + path.sep)) throw new SecurityError();
```

**Layer 3 — Symlink check:**
```typescript
const stat = await fs.lstat(resolved); // lstat does NOT follow symlinks
if (stat.isSymbolicLink()) {
  throw new SecurityError('Symlinks not permitted');
}
```

All three checks happen in `src/lib/files.ts` before any file content is read or returned. Security errors return HTTP 400 with `{ error: 'INVALID_PATH', message: 'Invalid file path' }` — no leaking of internal paths.

### 5.4 Binary Files Accidentally Saved

When the file extension is not in the allowed list, the content endpoint returns:

```json
{
  "success": true,
  "data": {
    "path": "data/export.xlsx",
    "type": "unsupported",
    "content": null,
    "sizeBytes": 48210
  }
}
```

The UI renders:
```
📄 export.xlsx (47 KB)

Preview not available for this file type.
Binary or unknown format.
```

No content is served for unsupported types — avoids attempting to UTF-8 decode binary files and sending garbage to the client. The delete button still works.

### 5.5 Empty `files/` Directory

The volume mount exists but `files/` subdirectory may not exist yet (agent hasn't created it). 

`GET /api/files` handles this gracefully:
```typescript
try {
  await fs.access(filesDir);
} catch {
  // files/ doesn't exist yet — that's fine, return empty list
  return apiSuccess({ containerReady: true, totalFiles: 0, folders: [], rootFiles: [] });
}
```

Renders the empty state UI as designed in §3.6.

### 5.6 Race Condition: File Deleted Mid-View

If a user is viewing a file and their agent deletes it, the next API poll will return 404. The UI should:
- Show: "This file was removed by your agent."
- Clear the content panel
- Refresh the file list

### 5.7 Concurrent Users Viewing Same Data

Not a concern — each user's files are in a separate volume path derived from their userId. No shared state.

---

## 6. Security Summary

| Threat | Mitigation |
|--------|------------|
| Access another user's files | userId from Clerk auth (not user input), path built server-side |
| Path traversal (`../../../etc/passwd`) | `path.resolve()` + prefix check before any `fs` call |
| Symlink to escape directory | `lstat()` check rejects all symlinks |
| Null byte injection | Explicit null byte check |
| Reading files outside `clawd/files/` | Base directory scoped to `clawd/files/`, not `clawd/` root |
| Serving binary data as text | Extension allowlist; unsupported types return `null` content |
| Unauthenticated access | `auth()` check at every endpoint, 401 before any DB query |

---

## 7. Future Work (Not in Scope v1)

- **File download** (`GET /api/files/download?path=...`) — streaming response for full files
- **Search** — full-text search across all agent files
- **File sharing** — generate a shareable link for a file
- **Write from dashboard** — let users create/edit files (probably not desirable, agents should own this)
- **File watching** — WebSocket or SSE for live updates when agent creates new files
- **Pagination** — for users with 200+ files

---

## 8. AGENTS.md Instruction for Existing Users

For users whose containers are already running with the old AGENTS.md (no `files/` instructions), the File Viewer will show an empty state until the agent is instructed to save files there. This is acceptable — it self-resolves once the user chats with their agent about it.

Optionally, the onboarding flow could add a one-time prompt: "Your agent can now save files to your dashboard. Just ask it to save its work!"

---

*End of spec. Ready for implementation. Start with `src/lib/files.ts`.*
