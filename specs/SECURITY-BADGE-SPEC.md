# Security Badge — "Clawer Verified" ✅

## Context
341+ malicious skills found on ClawHub marketplace (RedLine, Lumma infostealers targeting ~/.openclaw/). This is our differentiator — every skill/template on Clawer.ai is scanned and verified.

## What to Build

### 1. Verified Badge Component
`src/components/ui/VerifiedBadge.tsx`
- Small inline badge: ✅ shield icon + "Verified" text
- Tooltip on hover: "This template has been security-scanned by Clawer.ai"
- Variants: `size="sm" | "md"`, `showText={true|false}`
- Colors: green shield icon, gray text (subtle, not shouty)

### 2. Where to Display
- **Team template cards** on dashboard Settings (team switching UI)
- **Dashboard home** team member cards
- **Use cases page** — each template card
- **Pricing page** — in the feature list ("✅ Verified templates only")

### 3. Security Scan Info Section
Add to Settings page (below team switching):
```
🛡️ Security
All Clawer.ai templates are automatically scanned for:
✓ Malicious shell commands
✓ Data exfiltration attempts  
✓ Credential harvesting
✓ Unauthorized network access
✓ Prompt injection patterns

Your team template was last verified: [date]
```

### 4. Marketing Integration  
- Add "✅ Verified Skills Only" to pricing page feature lists
- Add security mention to landing page hero section or trust bar
- Update meta descriptions where relevant

## Technical Notes
- No backend needed — this is UI/branding only for now
- The actual skill security scanner already exists as a skill
- Future: API endpoint that returns scan results per template
- Keep it simple — badge + info section, not a full security dashboard

## Brand Guide
- Follow `docs/BRAND-GUIDE.md`
- Badge should be subtle (not a giant green banner)
- Green for verified, red for issues (future)
- Orange CTAs as always

## Files to Create/Modify
- CREATE: `src/components/ui/VerifiedBadge.tsx`
- MODIFY: `src/app/dashboard/settings/page.tsx` (security section)
- MODIFY: `src/components/dashboard/TeamStatusPanel.tsx` (badge on cards)
- MODIFY: `src/components/dashboard/DashboardHome.tsx` (badge on team grid)
- MODIFY: `src/app/use-cases/page.tsx` (badge on template cards)
- MODIFY: `src/app/pricing/page.tsx` (verified in feature list)
