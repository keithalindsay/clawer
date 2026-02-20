# Clawer.ai UX Fix Plan
**Priority-Ordered Implementation Roadmap**  
**Total Estimated Effort:** 42 hours (critical + high priority)  
**Target:** Ship-ready in 1 week with 1 developer

---

## Overview

This plan is based on:
1. Visual UX Audit (Feb 19, 2026)
2. Content/Structure Audit (Feb 19, 2026)
3. Live site inspection with screenshots
4. BRAND-GUIDE.md (the new standard)

**Philosophy:** Fix the most visible, trust-damaging issues first. Then accessibility. Then polish.

---

## Phase 1: Brand Consistency (Day 1) — ~4 hours

**Impact:** CRITICAL — Multiple audits flagged brand inconsistency as #1 trust killer  
**Goal:** One brand name everywhere, one primary CTA color everywhere

### Fix 1.1: Brand Name — "Clawer.ai" Everywhere

**Current state:** 7 variations (CLAWER.AI, CLAWER, Clawer AI, Clawer, etc.)  
**Target:** "Clawer.ai" in all marketing/product copy

**Files to update:**

1. **Header component (public site)**
   - File: `src/components/Header.tsx` (or similar)
   - Line: Logo/brand name
   - **Before:** `🦞 CLAWER.AI` or `🦞 CLAWER`
   - **After:** `🦞 Clawer.ai`
   - **Code:**
     ```tsx
     // Before:
     <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
       🦞 <span className="uppercase">CLAWER.AI</span>
     </Link>
     
     // After:
     <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
       🦞 <span>Clawer.ai</span>
     </Link>
     ```
   - **Remove:** Any `text-transform: uppercase` or `.uppercase` class on brand name

2. **Dashboard header**
   - File: `src/components/DashboardHeader.tsx` or `src/app/dashboard/layout.tsx`
   - Line: Logo/brand name
   - **Before:** `🦞 CLAWER` or `🦞 CLAWER AI`
   - **After:** `🦞 Clawer.ai`
   - **Note:** Screenshot shows "CLAWER AI" (with space) in chat header — this must be fixed

3. **Footer component**
   - File: `src/components/Footer.tsx`
   - Line: Logo, copyright text
   - **Before:** `🦞 CLAWER.AI` in logo, "Clawer.ai" in copyright
   - **After:** Both should be "Clawer.ai"
   - **Copyright text:**
     ```tsx
     © 2026 Clawer.ai. Built on <a href="...">OpenClaw</a>.
     ```

4. **Global find/replace**
   - **Command:**
     ```bash
     cd /home/keith/projects/clawer
     
     # Find all instances (review before replacing):
     rg -i "clawer\.ai|clawer ai|clawer(?!\.ai)" --type tsx --type ts
     
     # Safe replacements:
     # CLAWER.AI → Clawer.ai
     # CLAWER AI → Clawer.ai
     # CLAWER → Clawer.ai (but NOT in domain/email contexts)
     ```
   - **Exceptions (do NOT change):**
     - URLs: `clawer.ai` (lowercase OK)
     - Emails: `support@clawer.ai` (lowercase OK)
     - Legal docs: Requires separate legal review

5. **Page titles (meta tags)**
   - File: Check all page components for `<title>` or Next.js metadata
   - **Format:** "Clawer.ai — [Page Purpose]"
   - **Examples:**
     - Landing: `Clawer.ai — Hosted OpenClaw, Personal AI Assistant`
     - Pricing: `Clawer.ai Pricing — Free & Pro Plans`
     - Use Cases: `Clawer.ai Use Cases — AI Teams for Solopreneurs`

**Testing checklist:**
- [ ] Visit all 8 pages (landing, pricing, use-cases, blog, sign-in, dashboard, chat, settings)
- [ ] Verify brand name is "Clawer.ai" in header on every page
- [ ] Verify footer shows "Clawer.ai"
- [ ] Check browser tab titles
- [ ] Test on mobile (header brand name often different component)

**Estimated time:** 2 hours (find/replace, test, verify)

---

### Fix 1.2: CTA Button Color — Orange Everywhere

**Current state:**
- Landing page: Orange CTAs ✅
- Pricing page: Blue "Get Pro" button ❌
- Dashboard: Mix of blue buttons

**Target:** All primary CTAs use orange (`btn-primary` class)

**Files to update:**

1. **Pricing page**
   - File: `src/app/pricing/page.tsx` (or similar)
   - Line: "Get Pro" button in Pro plan card
   - **Before:**
     ```tsx
     <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full">
       Get Pro
     </button>
     ```
   - **After:**
     ```tsx
     <button className="btn-primary">
       Get Pro
     </button>
     ```
   - **Also update:** "Start Free" button (should already be orange, verify)

2. **Use cases page**
   - File: `src/app/use-cases/page.tsx`
   - Line: All "Get Started Free" buttons
   - **Verify:** All use `btn-primary` class (should already be orange based on screenshot)

3. **Dashboard "Add Task" button**
   - File: `src/app/dashboard/tasks/page.tsx`
   - Line: "+ Add Task" button
   - **Before:** `bg-blue-600` or `bg-indigo-600`
   - **After:** `btn-primary`
   - **Note:** This is a primary action, should be orange

4. **Chat "Send" button**
   - File: `src/app/dashboard/chat/page.tsx` (or chat component)
   - Line: Message send button
   - **Before:** Blue button
   - **After:** `btn-primary`

**CSS verification:**

Check that `btn-primary` is defined in `globals.css`:

```css
/* Should already exist: */
.btn-primary {
  background: var(--accent-primary);    /* #f97316 */
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  transition: all 0.2s ease;
  min-height: 44px;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);  /* #ea580c */
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
```

**When to use blue (`accent-secondary`) buttons:**
- NEVER for primary CTAs
- OK for: Informational badges, secondary actions (rare)

**Testing checklist:**
- [ ] Pricing page: Both CTAs are orange
- [ ] Landing page: All CTAs are orange (should already be true)
- [ ] Dashboard: Primary action buttons are orange
- [ ] Blog: "Try Clawer.ai Free" CTA is orange
- [ ] No blue buttons that look like primary CTAs

**Estimated time:** 1 hour (find buttons, update classes, test)

---

### Fix 1.3: CTA Text Standardization

**Current state:** 5+ different CTA variations  
**Target:** 2 standard CTAs

**Standard CTAs:**
- **Free trial:** "Start Free"
- **Upgrade:** "Upgrade to Pro" or "Get Pro"

**Files to update:**

1. **Landing page**
   - File: `src/app/page.tsx`
   - **Hero CTA:** "Deploy Your First Agent" → **"Start Free"**
     - *Reasoning:* Simpler, more common, lower friction
   - **Pricing section CTA:** "Get Started Free" → **"Start Free"**
   - **Final CTA:** "Start Free — 200 Messages" → **"Start Free"**
     - Subtitle can mention "200 free messages" separately

2. **Use cases page**
   - File: `src/app/use-cases/page.tsx`
   - **All CTAs:** "Get Started Free →" → **"Start Free"**
   - Remove arrows (→) from button text — keep buttons clean

3. **Pricing page**
   - File: `src/app/pricing/page.tsx`
   - **Free tier CTA:** "Start Free" ✅ (already correct)
   - **Pro tier CTA:** "Get Pro →" → **"Get Pro"** (remove arrow)

**Before/After examples:**

| Page | Current | After |
|------|---------|-------|
| Landing hero | "Deploy Your First Agent" | "Start Free" |
| Landing pricing | "Get Started Free" | "Start Free" |
| Landing final CTA | "Start Free — 200 Messages" | "Start Free" |
| Use cases (4x) | "Get Started Free →" | "Start Free" |
| Pricing Free | "Start Free" | ✅ No change |
| Pricing Pro | "Get Pro →" | "Get Pro" |

**Testing checklist:**
- [ ] No more "Get Started" (too generic)
- [ ] No more "Deploy Your First Agent" (too long)
- [ ] No arrows in button text (visual clutter)
- [ ] Consistent "Start Free" across all free trial CTAs

**Estimated time:** 30 minutes

---

### Fix 1.4: Remove Fake Testimonial

**Current state:** "Marcus Chen, Founder, StartupXYZ" — clearly a placeholder

**Options:**
1. **Remove entirely** (go from 3 testimonials to 2)
2. **Replace with real testimonial** (if available)
3. **Make anonymous** ("Anonymous, Startup Founder")

**Recommended:** Option 1 (remove)

**File to update:**
- File: `src/app/page.tsx`
- Line: Testimonials section
- **Before:**
  ```tsx
  <Testimonial
    quote="Set it up in 5 minutes..."
    author="Marcus Chen"
    role="Founder, StartupXYZ"
  />
  ```
- **After:** Delete this testimonial block

**Alternative (if you have a real testimonial):**
```tsx
<Testimonial
  quote="[Real quote from real customer]"
  author="[Real name]"
  role="[Real company]"
/>
```

**Testing:**
- [ ] Landing page testimonials section shows only authentic testimonials
- [ ] No "StartupXYZ" or other placeholder names

**Estimated time:** 15 minutes

---

**Phase 1 Total Time:** ~4 hours  
**Ship-blocking:** Yes — These issues damage trust immediately

---

## Phase 2: Mobile & Accessibility (Day 2) — ~4 hours

**Impact:** CRITICAL for 75+ demographic, legal compliance (WCAG AA)  
**Goal:** Readable text, tappable buttons, accessible for all users

### Fix 2.1: Mobile Font Size Audit & Fixes

**Current state:** Unknown (browser audit couldn't verify actual rendered sizes)  
**Risk:** Likely <16px on mobile (Tailwind default is `text-base` = 16px, but many components use `text-sm` = 14px)

**Step 1: Audit actual sizes**

Open each page on real mobile device (or browser DevTools mobile mode):

```bash
# Test pages:
- Landing: https://clawer.ai
- Pricing: https://clawer.ai/pricing
- Use Cases: https://clawer.ai/use-cases
- Dashboard: https://clawer.ai/dashboard
- Chat: https://clawer.ai/dashboard/chat
```

For each page:
1. Open DevTools → Device toolbar → iPhone 12 Pro (390x844)
2. Inspect body text → Check computed `font-size`
3. If <16px → needs fixing

**Step 2: Fix undersized text**

**File:** `src/app/globals.css`

Add mobile-specific font size overrides:

```css
/* Add to globals.css (after existing styles) */

/* ============================================================
   Mobile Typography Overrides (WCAG AA Compliance)
   ============================================================ */

@media (max-width: 640px) {
  /* Ensure body text is never smaller than 16px on mobile */
  body {
    font-size: 16px;
    line-height: 1.6;
  }
  
  /* Paragraph text */
  p {
    font-size: 16px;
    line-height: 1.6;
  }
  
  /* Headings */
  h1 {
    font-size: 32px;
    line-height: 1.2;
  }
  
  h2 {
    font-size: 28px;
    line-height: 1.2;
  }
  
  h3 {
    font-size: 22px;
    line-height: 1.3;
  }
  
  h4 {
    font-size: 18px;
    line-height: 1.4;
  }
  
  /* Buttons (critical: pricing, CTAs, auth) */
  button,
  .btn-primary,
  .btn-secondary {
    font-size: 16px;
    line-height: 1.5;
    min-height: 44px;
    padding: 0.75rem 1.5rem;
  }
  
  /* Form inputs */
  input,
  textarea,
  select {
    font-size: 16px;  /* Prevents iOS zoom on focus */
    min-height: 44px;
  }
  
  /* Small text (captions, labels) - minimum 14px */
  small,
  .text-sm {
    font-size: 14px;
    line-height: 1.5;
  }
  
  /* Tiny text (fine print) - absolute minimum 12px */
  .text-xs {
    font-size: 12px;
    line-height: 1.4;
  }
}
```

**Component-specific fixes:**

If specific components are still too small, update their classes:

```tsx
// Before:
<p className="text-sm text-secondary">
  Deploy specialized AI agents...
</p>

// After:
<p className="text-base text-secondary">  {/* text-base = 16px */}
  Deploy specialized AI agents...
</p>
```

**Pricing page specific fix:**

Feature lists in pricing cards are often `text-sm` — bump to `text-base` on mobile:

```tsx
// Before:
<ul className="text-sm space-y-2">
  <li>Up to 3 AI agents</li>
  ...
</ul>

// After:
<ul className="text-sm sm:text-sm md:text-base space-y-2">
  <li>Up to 3 AI agents</li>
  ...
</ul>
```

**Testing checklist:**
- [ ] All body text is 16px+ on mobile (use DevTools to verify)
- [ ] All button text is 16px+
- [ ] All form inputs are 16px+ (prevents zoom)
- [ ] Headings have clear hierarchy (H1 much larger than H2, etc.)
- [ ] No text smaller than 14px (except fine print at 12px minimum)

**Estimated time:** 2 hours (audit + fixes + testing)

---

### Fix 2.2: Tap Target Sizes

**Current state:** Unknown button/link sizes on mobile  
**Requirement:** 44x44px minimum for all interactive elements

**Files to update:**

1. **Button classes** (in `globals.css`)

Verify all button classes have `min-height: 44px`:

```css
/* Already in globals.css - verify these values: */

.btn-primary {
  min-height: 44px;  /* ✓ Already correct */
  padding: 0.75rem 1.5rem;  /* 12px x 24px */
  /* ... */
}

.btn-secondary {
  min-height: 44px;  /* ✓ Add if missing */
  /* ... */
}

.btn-ghost {
  min-height: 44px;  /* ✓ Add if missing */
  /* ... */
}
```

2. **Navigation links**

Update header navigation to have larger tap targets on mobile:

**File:** `src/components/Header.tsx`

```tsx
// Before:
<nav className="flex gap-6">
  <a href="/pricing" className="text-secondary hover:text-primary">
    Pricing
  </a>
  ...
</nav>

// After (mobile-specific padding):
<nav className="flex gap-6">
  <a href="/pricing" className="text-secondary hover:text-primary py-2 md:py-0">
    Pricing
  </a>
  ...
</nav>
```

This adds 8px vertical padding on mobile → 16px total → increases tap target from ~20px to ~36px.

3. **Dashboard sidebar links**

**File:** `src/app/dashboard/layout.tsx` (or chat sidebar component)

Agent list items should have minimum 44px height:

```tsx
// Before:
<div className="flex items-center gap-2 p-2 cursor-pointer">
  <img src={agent.avatar} />
  <span>{agent.name}</span>
</div>

// After:
<div className="flex items-center gap-2 p-3 cursor-pointer min-h-[44px]">
  <img src={agent.avatar} />
  <span>{agent.name}</span>
</div>
```

4. **Form inputs**

Ensure all inputs are 44px+ tall:

```css
/* globals.css - add if not present */
input,
textarea,
select {
  min-height: 44px;
  padding: 0.75rem 1rem;  /* 12px x 16px */
  font-size: 16px;  /* Prevents iOS zoom */
}
```

**Testing checklist:**
- [ ] All buttons are 44px+ tall on mobile (measure in DevTools)
- [ ] All nav links have 44px+ tap area (height + padding)
- [ ] All form inputs are 44px+ tall
- [ ] All dashboard sidebar items are 44px+ tall
- [ ] Adjacent tap targets have 8px+ spacing (use DevTools ruler)

**Testing tools:**
- Chrome DevTools → Toggle device toolbar → iPhone 12 Pro
- Ruler tool (DevTools → More tools → Rendering → Highlight tap targets)
- Real device testing (iPhone or Android)

**Estimated time:** 1.5 hours

---

### Fix 2.3: Focus States

**Current state:** Partially implemented (defined in `globals.css`)  
**Requirement:** All interactive elements must have visible focus indicator

**Verify existing CSS:**

`globals.css` already has:

```css
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

**Test and fix exceptions:**

Some components may override this with `outline: none` — remove those:

**Files to check:**
- Button components
- Link components
- Custom input components

**Bad pattern (remove if found):**
```css
.some-button:focus {
  outline: none;  /* ❌ Remove this */
}
```

**Good pattern (keep or add):**
```css
.some-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

**Testing checklist:**
- [ ] Tab through entire landing page → all interactive elements show orange outline
- [ ] Tab through pricing page → all buttons, links show focus
- [ ] Tab through dashboard → all nav, buttons show focus
- [ ] Tab through forms → all inputs show focus
- [ ] No elements have `outline: none` without custom focus style

**Estimated time:** 30 minutes

---

**Phase 2 Total Time:** ~4 hours  
**Ship-blocking:** Yes — Accessibility failures block enterprise sales, legal compliance

---

## Phase 3: Design Cohesion (Days 3-4) — ~8 hours

**Impact:** MAJOR — Affects perceived quality and professionalism  
**Goal:** Consistent components, spacing, visual hierarchy

### Fix 3.1: Replace Emoji Icons with SVG

**Current state:** Mix of emoji (🦞, 💬, ✈️, 🎮, 💼, etc.) and SVG  
**Problem:** Emojis render differently on iOS/Android/Windows

**Priority replacement:**

1. **Platform icons** (WhatsApp, Telegram, Discord, Slack) ← Highest priority
2. **Feature icons** (🖥️ Desktop, 📁 Files, ⚡ Automation, etc.)
3. **Team member avatars** (🧠, 🛍️, 👩‍👧‍👦, 💻) in use cases
4. **Keep:** Lobster emoji in logo (brand identity)

**Icon library:** [Lucide React](https://lucide.dev) (install if not already)

```bash
npm install lucide-react
```

**File:** `src/app/page.tsx` (Landing page)

**Before:**
```tsx
<div className="flex gap-2">
  <span>💬</span>
  <span>WhatsApp</span>
</div>
```

**After:**
```tsx
import { MessageCircle, Send, Gamepad2, Briefcase } from 'lucide-react';

<div className="flex gap-2 items-center">
  <MessageCircle className="w-5 h-5 text-accent-primary" />
  <span>WhatsApp</span>
</div>
```

**Icon mapping:**

| Emoji | Lucide Icon | Import |
|-------|-------------|--------|
| 💬 | `MessageCircle` | `import { MessageCircle } from 'lucide-react'` |
| ✈️ | `Send` | `import { Send } from 'lucide-react'` |
| 🎮 | `Gamepad2` | `import { Gamepad2 } from 'lucide-react'` |
| 💼 | `Briefcase` | `import { Briefcase } from 'lucide-react'` |
| 🖥️ | `Monitor` | `import { Monitor } from 'lucide-react'` |
| 📁 | `FolderOpen` | `import { FolderOpen } from 'lucide-react'` |
| ⚡ | `Zap` | `import { Zap } from 'lucide-react'` |
| 🛍️ | `ShoppingBag` | `import { ShoppingBag } from 'lucide-react'` |
| 🌐 | `Globe` | `import { Globe } from 'lucide-react'` |
| 🔐 | `Lock` | `import { Lock } from 'lucide-react'` |

**Platform icons (use official brand assets):**

For WhatsApp, Telegram, Slack, Discord, use their official brand SVGs (not emoji):

- **WhatsApp:** Download from [WhatsApp Brand Kit](https://www.whatsapp.com/brand)
- **Telegram:** Use paper plane icon
- **Slack:** Download from [Slack Brand Kit](https://slack.com/brand-guidelines)
- **Discord:** Download from [Discord Branding](https://discord.com/branding)

Store in: `public/icons/platforms/`

**Usage:**
```tsx
<Image
  src="/icons/platforms/whatsapp.svg"
  alt="WhatsApp"
  width={20}
  height={20}
  className="inline-block"
/>
```

**Files to update:**
- Landing page: Platform icons, feature icons
- Use cases page: All emoji icons in use case cards
- Pricing page: Check marks (replace emoji ✓ with Lucide `Check` icon)

**Testing checklist:**
- [ ] No emoji in UI elements (except lobster logo)
- [ ] All icons are consistent SVG
- [ ] Icons are 20px (small) or 24px (default)
- [ ] Icons have accessible colors (match text or accent color)

**Estimated time:** 4 hours (find all emoji, replace with SVG, test)

---

### Fix 3.2: Heading Hierarchy

**Current state:** Inconsistent heading levels across pages  
**Requirement:** One H1 per page, proper H2 → H3 → H4 nesting

**Files to audit:**

1. **Landing page**
   - **Current:** No H1 detected in audit
   - **Fix:** Hero heading should be H1
   
   **Before:**
   ```tsx
   <h2 className="text-5xl font-bold">
     Your Hosted OpenClaw AI Team, Always On Duty
   </h2>
   ```
   
   **After:**
   ```tsx
   <h1 className="text-5xl font-bold">
     Your AI Team, Always Working — Even When You're Not
   </h1>
   ```

2. **Pricing page**
   - **Current:** "Simple, transparent pricing" is H2
   - **Fix:** Should be H1
   
   **Before:**
   ```tsx
   <h2>Simple, transparent pricing</h2>
   ```
   
   **After:**
   ```tsx
   <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
   ```

3. **Use Cases page**
   - **Add H1:** "Built for the way you work"
   - **Current use case titles (H3):** Correct

**Hierarchy rules:**

```html
<h1>Page Title</h1>              <!-- One per page -->
  <h2>Major Section</h2>          <!-- "How It Works", "Pricing" -->
    <h3>Subsection</h3>           <!-- "Free Plan", "Pro Plan" -->
      <h4>Detail</h4>             <!-- Rarely needed -->
```

**Testing checklist:**
- [ ] Each page has exactly one H1
- [ ] H1 is the hero/page title (largest, most important)
- [ ] No skipped heading levels (H1 → H3 without H2)
- [ ] Semantic order makes sense (outline view in DevTools)

**Testing tool:**
- Chrome DevTools → Elements → Ctrl+F → search for `<h1>`, `<h2>`, etc.
- Or use [HeadingsMap extension](https://chrome.google.com/webstore/detail/headingsmap/)

**Estimated time:** 1 hour

---

### Fix 3.3: Spacing Consistency

**Current state:** Mix of spacing values  
**Target:** All spacing uses 4px increments (Tailwind default)

**Audit approach:**

Use DevTools to measure spacing between major sections:

**Landing page sections:**
- Hero → "How It Works" → should be `py-16` or `py-20` (64px or 80px)
- "How It Works" → "Pre-Built Teams" → same
- Between cards in grid → should be `gap-6` (24px)

**Common spacing mistakes:**

```tsx
// ❌ Random spacing values:
<div className="mt-17 mb-13">...</div>  /* 17 and 13 don't follow 4px scale */

// ✅ Correct (4px increments):
<div className="mt-16 mb-12">...</div>  /* 64px and 48px */
```

**Standard spacing scale (reference):**

```
space-2  = 8px   (tight, within components)
space-4  = 16px  (default, between related elements)
space-6  = 24px  (between cards)
space-8  = 32px  (between subsections)
space-12 = 48px  (between sections)
space-16 = 64px  (major sections)
space-20 = 80px  (hero spacing)
space-24 = 96px  (page sections)
```

**Files to check:**
- All page components (`page.tsx` files)
- Card components
- Section wrappers

**Quick wins:**

```tsx
// Standardize section spacing:
<section className="py-16 md:py-20">  {/* 64px mobile, 80px desktop */}
  <div className="max-w-7xl mx-auto px-4">
    <div className="space-y-12">  {/* 48px between major elements */}
      ...
    </div>
  </div>
</section>
```

**Testing checklist:**
- [ ] All spacing values are multiples of 4px
- [ ] Section spacing is consistent across pages
- [ ] Cards in grids have consistent gap (typically `gap-6`)
- [ ] No arbitrary values like `mt-17` or `mb-13`

**Estimated time:** 2 hours

---

### Fix 3.4: Card Shadow Consistency

**Current state:** Mix of shadow styles  
**Target:** All cards use `.card` class with standard shadows

**Standard shadows (from globals.css):**

```css
.card {
  box-shadow: var(--shadow-sm);  /* Default */
}

.card:hover {
  box-shadow: var(--shadow-md);  /* On hover */
}
```

**Files to update:**

Find all card-like components and ensure they use `.card` class:

```tsx
// ❌ Before (custom shadow):
<div className="bg-white rounded-lg shadow-lg border p-6">
  ...
</div>

// ✅ After (standard card class):
<div className="card">
  ...
</div>
```

**Variants:**

If you need different shadow intensity:

```tsx
// Subtle card (barely visible shadow):
<div className="card" style={{ boxShadow: 'var(--shadow-xs)' }}>
  ...
</div>

// Elevated card (stronger shadow by default):
<div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
  ...
</div>
```

**Files to check:**
- Use cases page: 4 use case cards
- Pricing page: 2 pricing cards (Free, Pro)
- Landing page: Feature cards, testimonial cards
- Dashboard: Agent cards, quick action cards

**Testing checklist:**
- [ ] All cards have consistent shadow strength
- [ ] Hover effect works (shadow increases)
- [ ] No random `shadow-2xl` or custom shadow values

**Estimated time:** 1 hour

---

**Phase 3 Total Time:** ~8 hours  
**Ship-blocking:** No, but significantly impacts perceived quality

---

## Phase 4: Conversion Optimization (Day 5) — ~4 hours

**Impact:** MAJOR — Directly affects trial signups and upgrades  
**Goal:** Reduce friction, add trust signals, improve empty states

### Fix 4.1: Pricing Page Clarity

**Current state:** Two conflicting pricing descriptions  
**Problem:** Landing page says "Up to 3 AI agents", Pricing page says "Full team — all members unlocked"

**Decision required:** Which is true?

**Option A: 3-agent limit**
- Update pricing page to match landing page
- **Change:** "Full team — all members unlocked" → "Up to 3 AI agents"

**Option B: Unlimited agents**
- Update landing page to match pricing page
- **Change:** "Up to 3 AI agents" → "Full AI team (5 agents included)"

**RECOMMENDED: Option B** (unlimited is better value prop)

**Files to update:**

1. **Landing page** (if Option B)
   - File: `src/app/page.tsx`
   - Line: Pricing section (near bottom of page)
   - **Before:** "Up to 3 AI agents"
   - **After:** "Full AI team — all 5 members unlocked"

2. **Pricing page**
   - File: `src/app/pricing/page.tsx`
   - Line: Pro plan features
   - **Before:** "Full team — all members unlocked" (vague)
   - **After:** "Full AI team (5 agents: Claire, Leo, Harper, Hunter, Shield)"
   - **Explain:** List the agents by name for clarity

**Feature list update:**

```tsx
// Before:
<ul>
  <li>Full team — all members unlocked</li>
  ...
</ul>

// After:
<ul>
  <li>Full AI team (5 agents included)</li>
  <li>Claire • Leo • Harper • Hunter • Shield</li>
  ...
</ul>
```

**Message limit clarification:**

Landing page says "200 free messages included", Pricing page says "100 total messages" for Free tier.

**Fix:**
- **Free tier:** 100 total messages (one-time)
- **Pro tier:** 500 messages per day

**Pricing page update:**

```tsx
// Free plan:
<div>
  <h3>Free</h3>
  <p className="text-3xl font-bold">$0<span className="text-sm text-secondary">/forever</span></p>
  <ul className="mt-4 space-y-2 text-sm">
    <li>✓ 100 total messages</li>
    <li>✓ 1 AI team member</li>
    <li>✓ Basic model</li>
    <li>✓ Web-only access</li>
  </ul>
</div>

// Pro plan:
<div>
  <h3>Pro</h3>
  <p className="text-3xl font-bold">$49<span className="text-sm text-secondary">/month</span></p>
  <ul className="mt-4 space-y-2">
    <li>✓ 500 messages per day</li>
    <li>✓ Full AI team (5 agents)</li>
    <li>✓ Premium model (Claude 4.5)</li>
    <li>✓ WhatsApp + Telegram + Slack</li>
    <li>✓ Smart model routing</li>
    <li>✓ Priority email support</li>
  </ul>
</div>
```

**Testing checklist:**
- [ ] Landing page and pricing page have matching feature lists
- [ ] Message limits are clearly explained (100 total vs 500/day)
- [ ] Agent count is specific (not vague "full team")

**Estimated time:** 1 hour

---

### Fix 4.2: Empty State Improvements

**Current state:** Generic empty states ("No tasks here")  
**Target:** Helpful, actionable empty states

**Files to update:**

1. **Tasks page** (when no tasks exist)
   - File: `src/app/dashboard/tasks/page.tsx`
   - **Before:**
     ```tsx
     <div>No tasks here</div>
     ```
   - **After:**
     ```tsx
     <div className="flex flex-col items-center justify-center py-12 text-center">
       <div className="text-6xl mb-4">📋</div>
       <h3 className="text-xl font-semibold text-primary mb-2">
         No tasks yet
       </h3>
       <p className="text-secondary max-w-sm mb-6">
         Create your first task and let your AI team handle it. They'll work overnight while you sleep.
       </p>
       <button className="btn-primary">+ Create Task</button>
     </div>
     ```

2. **Chat page** (when no messages)
   - File: `src/app/dashboard/chat/page.tsx` or chat component
   - **Before:**
     ```tsx
     <div>Loading history...</div>
     ```
   - **After (when no history exists):**
     ```tsx
     <div className="flex flex-col items-center justify-center h-full py-12 text-center">
       <div className="text-6xl mb-4">💬</div>
       <h3 className="text-xl font-semibold mb-2">
         Start chatting with {agentName}
       </h3>
       <p className="text-secondary max-w-md mb-6">
         Ask {agentName} to help with tasks, research, or automation. Your conversation history will appear here.
       </p>
       <div className="space-y-2 text-sm w-full max-w-md">
         <p className="text-tertiary text-left">💡 Try asking:</p>
         <button className="w-full text-left px-4 py-3 bg-subtle rounded-lg hover:bg-muted transition-colors">
           "What's on my calendar today?"
         </button>
         <button className="w-full text-left px-4 py-3 bg-subtle rounded-lg hover:bg-muted transition-colors">
           "Draft an email to my team about the new launch"
         </button>
         <button className="w-full text-left px-4 py-3 bg-subtle rounded-lg hover:bg-muted transition-colors">
           "Find and summarize competitor updates from this week"
         </button>
       </div>
     </div>
     ```

3. **Settings page** (white boxes issue)
   - File: `src/app/dashboard/settings/page.tsx`
   - **Problem:** Content loading slowly, showing blank white sections
   - **Fix:** Add skeleton loaders
   
   **Before:**
   ```tsx
   {isLoading ? null : <SettingsContent />}
   ```
   
   **After:**
   ```tsx
   {isLoading ? (
     <div className="space-y-6">
       <div className="animate-pulse">
         <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
         <div className="h-20 bg-muted rounded mb-2"></div>
         <div className="h-20 bg-muted rounded"></div>
       </div>
     </div>
   ) : (
     <SettingsContent />
   )}
   ```

**Testing checklist:**
- [ ] Tasks page: Empty state shows helpful message + CTA
- [ ] Chat page: Empty state shows suggested prompts
- [ ] Settings page: Shows skeleton loader, not blank white boxes
- [ ] All empty states have large icon, title, description, and CTA

**Estimated time:** 2 hours

---

### Fix 4.3: Sign-In Page Enhancement

**Current state:** Minimal content ("Welcome to Clawer / Sign in to access your AI assistants")  
**Problem:** No trust signals, no help text, looks unfinished

**File:** `src/app/sign-in/page.tsx`

**Before:**
```tsx
<div>
  <h1>Welcome to Clawer</h1>
  <p>Sign in to access your AI assistants</p>
  {/* Clerk auth component */}
</div>
```

**After:**
```tsx
<div className="min-h-screen flex items-center justify-center px-4">
  <div className="max-w-md w-full space-y-8">
    <div className="text-center">
      <div className="text-5xl mb-4">🦞</div>
      <h1 className="text-3xl font-bold">Welcome to Clawer.ai</h1>
      <p className="text-secondary mt-2">
        Sign in to access your AI team, view conversation history, and manage your account
      </p>
    </div>
    
    {/* Clerk auth component */}
    <SignIn />
    
    <div className="text-center">
      <p className="text-sm text-tertiary mb-4">
        🔒 Your data is secure and encrypted
      </p>
      <div className="flex justify-center gap-4 text-xs text-tertiary">
        <a href="/privacy" className="hover:text-primary">Privacy Policy</a>
        <span>•</span>
        <a href="/terms" className="hover:text-primary">Terms of Service</a>
        <span>•</span>
        <a href="mailto:support@clawer.ai" className="hover:text-primary">Need help?</a>
      </div>
    </div>
    
    <div className="text-center pt-4 border-t border-subtle">
      <p className="text-sm text-secondary mb-2">New here?</p>
      <a href="/sign-up" className="btn-primary inline-block">
        Start Free — No Card Required
      </a>
    </div>
  </div>
</div>
```

**Testing checklist:**
- [ ] Sign-in page has clear heading
- [ ] Explains what you get access to when you sign in
- [ ] Shows trust signals (secure, privacy link)
- [ ] Has help link for users who are stuck
- [ ] Has clear path to sign-up for new users

**Estimated time:** 1 hour

---

**Phase 4 Total Time:** ~4 hours  
**Ship-blocking:** No, but directly impacts conversion rate

---

## Phase 5: Tailwind Config Recommendations (Optional)

**Current state:** Using CSS custom properties in `globals.css` ✅  
**Assessment:** This is actually fine. No urgency to migrate to Tailwind config.

**If you want to use Tailwind config for design tokens:**

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Orange)
        primary: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          light: '#fff7ed',
        },
        // Secondary (Indigo)
        secondary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#eef2ff',
        },
        // Status
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        // Backgrounds
        'bg-base': '#ffffff',
        'bg-subtle': '#f9fafb',
        'bg-muted': '#f3f4f6',
        // Text
        'text-primary': '#111827',
        'text-secondary': '#4b5563',
        'text-tertiary': '#9ca3af',
        'text-muted': '#d1d5db',
        // Borders
        'border-subtle': '#e5e7eb',
        'border-default': '#d1d5db',
        'border-strong': '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgba(249, 115, 22, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config
```

**Usage after migration:**

```tsx
// Before (CSS custom properties):
<button className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]">
  Button
</button>

// After (Tailwind config):
<button className="bg-primary hover:bg-primary-hover">
  Button
</button>
```

**Benefit:** Autocomplete in VSCode, shorter class names  
**Downside:** Lose CSS variable flexibility (can't change at runtime)

**RECOMMENDATION:** Keep current CSS custom property approach. It's more flexible and already working well.

---

## Summary & Timeline

### Day 1: Brand Consistency (~4 hours)
- ✅ Fix brand name to "Clawer.ai" everywhere
- ✅ Standardize CTA colors (orange only)
- ✅ Standardize CTA text ("Start Free")
- ✅ Remove fake testimonial

**Deliverable:** Professional, consistent brand presentation

---

### Day 2: Mobile & Accessibility (~4 hours)
- ✅ Audit and fix font sizes (16px minimum on mobile)
- ✅ Fix tap target sizes (44px minimum)
- ✅ Verify focus states on all interactive elements

**Deliverable:** WCAG AA compliant, mobile-friendly, accessible to 75+ demographic

---

### Days 3-4: Design Cohesion (~8 hours)
- ✅ Replace emoji icons with SVG
- ✅ Fix heading hierarchy (H1 on every page)
- ✅ Standardize spacing (4px increments)
- ✅ Standardize card shadows

**Deliverable:** Polished, professional design quality

---

### Day 5: Conversion Optimization (~4 hours)
- ✅ Clarify pricing (resolve conflicts)
- ✅ Improve empty states
- ✅ Enhance sign-in page with trust signals

**Deliverable:** Reduced friction, higher conversion rate

---

## Total Effort: 20 hours (1 week, 1 developer)

**Critical path (must-ship):** Phase 1 + Phase 2 = 8 hours  
**High quality (pre-launch):** Phase 1-4 = 20 hours  
**Polish (nice-to-have):** Icon migration can happen over time

---

## Validation Checklist

**Before marking each phase complete:**

### Phase 1 Validation
- [ ] Visit all 8 pages, verify "Clawer.ai" in header
- [ ] Check all primary CTAs are orange
- [ ] No "StartupXYZ" testimonial
- [ ] No more than 2 CTA text variations

### Phase 2 Validation
- [ ] Open on real iPhone, check text is readable
- [ ] Tab through all pages, verify focus states visible
- [ ] Use DevTools ruler to verify 44px tap targets
- [ ] Run Lighthouse accessibility audit → 95+ score

### Phase 3 Validation
- [ ] No emoji in UI (except logo)
- [ ] HeadingsMap shows proper hierarchy
- [ ] All spacing is multiples of 4px
- [ ] All cards have consistent shadows

### Phase 4 Validation
- [ ] Pricing is consistent across landing + pricing pages
- [ ] Empty states have helpful copy + CTAs
- [ ] Sign-in page has trust signals
- [ ] Try to sign up as new user → smooth flow

---

**End of UX Fix Plan**

*Estimated effort: 20 hours for high-quality ship-ready state. Critical fixes: 8 hours.*
