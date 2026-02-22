# Visual Config Editor — Settings Enhancement

## Context
`openclaw.json` complexity is the #1 barrier to self-hosting. Our Settings page IS the visual config editor — we just need to surface more of the config in a friendly way. This is literally why people pay $49/mo.

## What to Build

### Enhance `/dashboard/settings` Page

#### Section 1: Team & Template (exists)
Already have team switching. Keep as-is.

#### Section 2: AI Model Configuration (NEW)
Show current model setup in friendly cards:
```
🧠 AI Model
├── Primary: MiniMax M2.5
├── Fallback: GPT-4o Mini  
├── Heartbeat: Qwen 2.5 3B (free)
└── Embeddings: Nomic Embed Text (local)
```
Pro users: dropdown to select primary model (future — when BYOK returns).
Free users: "Included with your plan" (no changes).

#### Section 3: Connected Channels (exists partially)
Show status of WhatsApp, Telegram, Slack connections.
Already have WhatsApp/Telegram pages. Add status indicators here.

#### Section 4: Memory & Context (NEW)
```
💾 Memory
├── Memory Search: ✅ Enabled
├── Session Reset: Daily at 4 AM
├── Compaction: Auto (10% history retained)
└── Embedding Model: Nomic Embed Text
```
Read-only for now. Shows users their agent has persistent memory.

#### Section 5: Security (NEW — from Security Badge spec)
```
🛡️ Security
├── Container Isolation: ✅ Dedicated
├── DM Scope: Per-channel peer (isolated)
├── Template: ✅ Clawer Verified
└── Last Security Scan: [date]
```

#### Section 6: Account (exists)
Plan info, usage, contact support for deletion.

### API
- `GET /api/dashboard/config` — Returns sanitized container config
  - Proxies to container: reads openclaw.json
  - Strips sensitive fields (tokens, API keys)
  - Returns: model names, channel status, memory settings, security settings
  - Cache for 5 min (config rarely changes)

## Design
- Card-based layout (not a form — mostly read-only)
- Each section is a collapsible card
- Green checkmarks for enabled features
- Gray for disabled/not configured
- Orange CTA: "Upgrade to customize" for gated features
- Follow `docs/BRAND-GUIDE.md`

## Phase 2 (future)
- Editable fields for Pro users (model selection, session reset time)
- BYOK key management (when it returns, with real encryption)
- Custom AGENTS.md editing (already have Agent Editor page)
