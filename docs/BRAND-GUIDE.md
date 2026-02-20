# Clawer.ai Brand Guide & Design System
**Version 1.0 — The Definitive Standard**  
**Last Updated:** February 19, 2026  
**Status:** Authoritative — This is the single source of truth

---

## Purpose

This guide ensures **anyone** — designer, developer, or AI agent — can make brand-consistent decisions without asking permission. If it's not here, it shouldn't exist in the product.

**Core principle:** Consistency builds trust. Trust drives conversion. One brand, one voice, one look.

---

## 1. Brand Identity

### Brand Name
**Official name:** `Clawer.ai`

**NEVER:**
- ❌ CLAWER.AI (all caps)
- ❌ CLAWER (caps, no dot)
- ❌ Clawer AI (space instead of dot)
- ❌ Clawer (missing .ai)
- ❌ clawer.ai (lowercase in copy)

**ALWAYS:**
- ✅ Clawer.ai (proper case, with dot)

**Exceptions:**
- URLs and email addresses: `clawer.ai` (lowercase is acceptable)
- Legal entity name: "Aigen Inc, doing business as Clawer.ai"

**Pronunciation:** "Clawer dot A-I" (emphasize the .ai)

---

### Brand Icon
🦞 **Lobster emoji**

**Usage:**
- Marketing pages: Emoji in logo area (current implementation)
- Dashboard: Emoji next to brand name
- Social media: Profile picture uses lobster illustration
- Favicon: Lobster icon

**Why a lobster?**  
OpenClaw → Claw → Lobster. It's distinctive, memorable, and signals the technical foundation (OpenClaw) while being approachable.

**Future consideration:** Commission custom lobster SVG for brand consistency across platforms (emoji renders differently on iOS/Android/Windows).

---

### Tagline
**Current:** "Your Hosted OpenClaw AI Team, Always On Duty"

**Analysis:**
- ✅ Clear (hosted, AI, team, 24/7)
- ❌ Assumes people know "OpenClaw"
- ❌ Doesn't address pain point

**Alternative (RECOMMENDED):**  
**"Your AI Team, Always Working — Even When You're Not"**

**Why it's better:**
- Addresses pain point (things not getting done)
- Simpler language (no "OpenClaw" jargon)
- Benefit-focused ("always working" > "always on duty")

**For use cases pages:**  
"These aren't chatbots. They monitor, research, follow up, and execute — overnight, on schedule, without being asked. You wake up to results, not tasks."

---

### Brand Voice

**Personality:** Straight-shooting builder, no BS, helpful but never hand-holdy.

**Think:** Keith (the founder) — technical depth, zero fluff, gets straight to the point.

**Characteristics:**
- **Direct:** Say what it does, not what it "enables you to do"
- **Specific:** "500 messages/day" not "lots of messages"
- **Honest:** "Built on OpenClaw" not "proprietary AI platform"
- **No jargon:** "AI team" not "agentic workflow orchestration layer"
- **Action-oriented:** "Deploy" not "Get started on your journey"

**Examples:**

| ❌ Corporate BS | ✅ Clawer Voice |
|----------------|----------------|
| "Empower your workflow with cutting-edge AI" | "Deploy AI agents that actually do the work" |
| "Leverage synergies across platforms" | "Works with WhatsApp, Telegram, and Slack" |
| "Revolutionary agentic paradigm" | "Agents that execute tasks, not just answer questions" |
| "Join us on this journey" | "Start free. No credit card." |

---

### Brand Personality

**If Clawer.ai were a person:**

- **Occupation:** Senior DevOps engineer who built their own tools because existing ones sucked
- **Age:** 32
- **Style:** Black hoodie, mechanical keyboard, terminal always open
- **Speaks like:** "Here's what it does. Here's what it costs. Here's the GitHub repo. Questions?"
- **Never says:** "Wow!" "Amazing!" "Game-changing!" "Next-level!"
- **Values:** Time, honesty, shipping over perfection

**Competitors' personalities for contrast:**
- Linear: Minimalist designer (obsessed with 60fps animations)
- Vercel: Hypebeast (everything is "the future")
- Zapier: Friendly neighbor (holds your hand through everything)
- **Clawer:** Efficient builder (gives you the tools, trusts you to use them)

---

### Positioning Statement

**One-sentence essence:**

> **"Managed OpenClaw hosting for people who want AI agents without DevOps."**

**Expanded (for pitch decks):**

> Clawer.ai removes the infrastructure burden from running OpenClaw agents. You get pre-configured AI teams that work across WhatsApp, Telegram, and Slack — deployed in 60 seconds, running 24/7, no server management required. We're the Vercel of AI agents: the hard part (hosting) is handled, so you can focus on what your agents should do, not how to keep them alive.

**Target audience:**
1. **Primary:** Non-technical solopreneurs, creators, small business owners who want AI help but can't spin up Docker containers
2. **Secondary:** Developers who run OpenClaw locally but want a production-ready hosted version
3. **Tertiary:** Teams (5-20 people) who need shared AI infrastructure

---

## 2. Color System

### Primary Palette

**Primary (Orange/Coral):**
```css
--accent-primary: #f97316         /* Base orange */
--accent-primary-hover: #ea580c   /* Darker on hover */
--accent-primary-light: #fff7ed   /* Tint for backgrounds */
--accent-primary-glow: rgba(249, 115, 22, 0.2) /* Shadow glow */
```

**Usage:**
- ALL call-to-action buttons ("Start Free", "Get Pro", "Deploy Agent")
- Links in body copy
- Active states in navigation
- Status indicators (online agents)
- Focus rings

**Why orange?**
- Warmer and more approachable than blue (which every SaaS uses)
- High contrast on white (better accessibility)
- Stands out in screenshots/social shares
- Complements the lobster icon

---

**Secondary (Indigo/Blue):**
```css
--accent-secondary: #6366f1       /* Base indigo */
--accent-secondary-hover: #4f46e5 /* Darker on hover */
--accent-secondary-light: #eef2ff /* Tint for backgrounds */
```

**Usage:**
- **NEVER for primary CTAs** (reserve orange for "the thing we want you to do")
- Secondary actions ("Learn more", "View docs")
- Informational badges ("Pro Plan", "Most Popular")
- Dashboard UI accents (NOT buttons)

**CRITICAL RULE:** One primary color (orange) for ALL main CTAs across the entire site. If you're tempted to use blue for a CTA, you're probably wrong.

---

### Background Colors

**Light theme only** (dark theme not planned):

```css
--bg-base: #ffffff          /* Page background */
--bg-subtle: #f9fafb        /* Alternate sections */
--bg-muted: #f3f4f6         /* Cards, elevated surfaces */
--bg-elevated: #ffffff      /* Modals, dropdowns */
```

**Usage:**
- `bg-base`: Main page background, hero sections
- `bg-subtle`: Alternating sections (every other section on landing page)
- `bg-muted`: Card backgrounds, code blocks, input fields
- `bg-elevated`: Modals, popovers, dropdown menus

---

### Text Colors

```css
--text-primary: #111827     /* Headings, body text */
--text-secondary: #4b5563   /* Subheadings, labels */
--text-tertiary: #9ca3af    /* Captions, help text */
--text-muted: #d1d5db       /* Disabled text, placeholders */
```

**Contrast ratios (WCAG AA minimum):**
- Primary on white: 15.4:1 ✅
- Secondary on white: 6.8:1 ✅
- Tertiary on white: 3.2:1 ⚠️ (use only for non-essential text)

**Typography hierarchy by color:**
- H1, H2: `text-primary` (always)
- H3, H4: `text-primary` (always)
- Body text: `text-primary`
- Labels, small headings: `text-secondary`
- Captions, metadata: `text-tertiary`
- Disabled states: `text-muted`

---

### Border Colors

```css
--border-subtle: #e5e7eb    /* Default borders */
--border-default: #d1d5db   /* Emphasized borders */
--border-strong: #9ca3af    /* Strong dividers */
```

**Usage:**
- Cards: `border-subtle`
- Input fields (default): `border-default`
- Input fields (focus): `accent-primary` (2px)
- Dividers: `border-subtle`
- Table borders: `border-default`

---

### Status Colors

```css
/* Success/Active */
--status-active: #22c55e
--status-active-light: #f0fdf4

/* Warning */
--status-warning: #f59e0b
--status-warning-light: #fffbeb

/* Error/Destructive */
--status-error: #ef4444
--status-error-light: #fef2f2
```

**Usage:**
- Green: Online agents, successful actions, confirmation messages
- Yellow: Warnings, pending states, usage limits approaching
- Red: Errors, destructive actions, critical alerts

**Status indicators (agents):**
- 🟢 Online (green dot + "Online" text)
- 🟡 Idle (yellow dot + "Idle 5m ago")
- 🔴 Offline (red dot + "Offline")

---

### Shadow System

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04)
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)
--shadow-glow: 0 0 20px var(--accent-primary-glow)
```

**Usage:**
- `xs`: Input fields, subtle elevation
- `sm`: Cards (default state)
- `md`: Cards (hover state), dropdowns
- `lg`: Modals, popovers
- `xl`: Large modals, overlays
- `glow`: Primary CTA hover state (orange glow)

**Rule:** Shadows should be subtle. If you can clearly see the shadow, it's probably too strong.

---

### Color Usage Rules

**DO:**
- ✅ Use orange for ALL primary CTAs
- ✅ Use consistent text colors for hierarchy
- ✅ Use status colors only for their intended purpose (green = success, not decoration)
- ✅ Ensure 4.5:1 contrast minimum for body text

**DON'T:**
- ❌ Mix orange and blue CTAs on the same page
- ❌ Use gradients (keep it flat and clean)
- ❌ Use more than 3 colors on a single component
- ❌ Use decorative colors (every color has a purpose)

---

## 3. Typography

### Font Family

**Sans-serif (UI & body text):**  
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Why Inter?**
- Modern, clean, highly legible
- Excellent at small sizes (12px-16px)
- Variable font available (smooth scaling)
- Industry standard (used by Linear, Vercel, GitHub)

**Monospace (code blocks):**  
```css
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Loading:** Self-hosted via Next.js font optimization (no external requests, fastest load).

---

### Type Scale

**Desktop sizes:**

```css
/* Headings */
H1: 48px / 1.1 (line-height) / 700 (font-weight)
H2: 36px / 1.2 / 600
H3: 24px / 1.3 / 600
H4: 20px / 1.4 / 600

/* Body */
Body (base): 16px / 1.6 / 400
Body (large): 18px / 1.6 / 400
Body (small): 14px / 1.5 / 400

/* UI elements */
Button text: 16px / 1.5 / 600
Label: 14px / 1.5 / 500
Caption: 12px / 1.4 / 400
```

**Mobile sizes (≤640px):**

```css
H1: 32px / 1.2 / 700  /* Smaller but still prominent */
H2: 28px / 1.2 / 600
H3: 22px / 1.3 / 600
H4: 18px / 1.4 / 600

Body: 16px / 1.6 / 400  /* NEVER smaller than 16px */
Button text: 16px / 1.5 / 600  /* Same as desktop */
Label: 14px / 1.5 / 500
Caption: 12px / 1.4 / 400
```

---

### Font Weights

**Inter has 9 weights (100-900), but we use only 3:**

- **400 (Regular):** All body text, captions, most UI
- **500 (Medium):** Labels, emphasized text, input placeholders
- **600 (Semibold):** Buttons, H3/H4, strong emphasis
- **700 (Bold):** H1, H2 only

**Rule:** No more than 2 font weights on a single page (usually 400 + 600).

---

### Line Heights

```css
/* Headings: Tight (improves hierarchy) */
H1, H2: 1.1-1.2
H3, H4: 1.3-1.4

/* Body: Comfortable (readability) */
Body text: 1.6
UI elements: 1.5
Captions: 1.4
```

**Why 1.6 for body?**  
Optimal for readability, especially for older users. 1.5 is the WCAG minimum; 1.6 gives breathing room.

---

### Mobile Typography Rules

**Critical for accessibility (75+ demographic):**

1. **Minimum 16px body text** — iOS won't zoom if text is 16px+
2. **Minimum 18px for critical text** (pricing, CTAs, error messages)
3. **Maximum 50-60 characters per line** (use `max-w-prose`)
4. **1.6 line-height minimum** for body text
5. **No light font weights (300 or below)** — reduces legibility

---

### Typography Examples

**Hero (Landing page):**
```html
<h1 class="text-5xl md:text-6xl font-bold leading-tight text-primary">
  Your AI Team, Always Working — <span class="text-gradient">Even When You're Not</span>
</h1>
<p class="text-lg md:text-xl text-secondary mt-4 max-w-2xl">
  Deploy specialized AI agents across WhatsApp, Telegram, and Slack. No setup, no maintenance — they just work.
</p>
```

**Section heading:**
```html
<h2 class="text-3xl md:text-4xl font-semibold text-primary">
  How It Works
</h2>
<p class="text-secondary mt-2 max-w-xl">
  From idea to deployed agents in under 60 seconds
</p>
```

**Card title:**
```html
<h3 class="text-xl font-semibold text-primary">
  Life OS
</h3>
<p class="text-secondary text-sm mt-1">
  Personal productivity assistant. Email summaries, calendar management, task tracking.
</p>
```

---

## 4. Spacing System

### Base Unit: 4px

Tailwind uses a 4px base (`1 = 4px`). We follow this religiously.

**Scale:**
```css
0.5  → 2px   (hairline spacing)
1    → 4px   (tight)
2    → 8px   (compact)
3    → 12px  (comfortable)
4    → 16px  (default)
6    → 24px  (spacious)
8    → 32px  (section spacing)
12   → 48px  (major sections)
16   → 64px  (hero padding)
20   → 80px  (large sections)
24   → 96px  (page sections)
```

---

### Component Padding

**Buttons:**
```css
Small:  px-4 py-2   (16px x 8px)
Medium: px-6 py-3   (24px x 12px) ← Default
Large:  px-8 py-4   (32px x 16px)
```

**Cards:**
```css
Compact: p-4   (16px all sides)
Default: p-6   (24px all sides) ← Most cards
Spacious: p-8  (32px all sides)
```

**Sections (page-level):**
```css
Desktop: py-16 px-4  (64px vertical, 16px horizontal)
Mobile:  py-12 px-4  (48px vertical, 16px horizontal)
```

---

### Page Margins & Max Width

**Marketing pages:**
```html
<div class="max-w-7xl mx-auto px-4">
  <!-- Content (max 1280px wide) -->
</div>
```

**Dashboard:**
```html
<div class="max-w-6xl mx-auto px-4">
  <!-- Content (max 1152px wide, tighter than marketing) -->
</div>
```

**Blog posts:**
```html
<article class="max-w-3xl mx-auto px-4">
  <!-- Content (max 768px wide for readability) -->
</article>
```

---

### Section Spacing

**Between major page sections:**
- Desktop: `space-y-24` (96px)
- Mobile: `space-y-16` (64px)

**Within sections (between subsections):**
- Desktop: `space-y-12` (48px)
- Mobile: `space-y-8` (32px)

**Between components (cards, paragraphs):**
- Default: `space-y-4` (16px)

---

### Mobile Breakpoints

Tailwind defaults (we use these):

```css
sm:  640px   (Large phones, landscape)
md:  768px   (Tablets)
lg:  1024px  (Small laptops)
xl:  1280px  (Desktops)
2xl: 1536px  (Large screens)
```

**Design for mobile first, then scale up:**

```html
<!-- Stack on mobile, side-by-side on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Cards -->
</div>
```

---

## 5. Component Standards

### Buttons

**Primary button (orange):**
```html
<button class="btn-primary">
  Start Free
</button>

<!-- CSS -->
.btn-primary {
  background: var(--accent-primary);
  color: white;
  padding: 0.75rem 1.5rem;  /* 12px x 24px */
  border-radius: 9999px;    /* Fully rounded */
  font-weight: 600;
  font-size: 16px;
  min-height: 44px;         /* Touch target */
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
```

**Secondary button (gray):**
```html
<button class="btn-secondary">
  Learn More
</button>

<!-- CSS -->
.btn-secondary {
  background: var(--bg-subtle);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 16px;
  min-height: 44px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-muted);
  border-color: var(--border-default);
}
```

**Ghost button (transparent):**
```html
<button class="btn-ghost">
  Cancel
</button>

<!-- CSS -->
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 16px;
  min-height: 44px;
  border: none;
  cursor: pointer;
}

.btn-ghost:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}
```

**Destructive button (red):**
```html
<button class="btn-destructive">
  Delete Agent
</button>

<!-- CSS -->
.btn-destructive {
  background: var(--status-error);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 16px;
  min-height: 44px;
  border: none;
  cursor: pointer;
}

.btn-destructive:hover {
  background: #dc2626;  /* Darker red */
}
```

**Button sizing:**
- Small: 36px min-height (use sparingly)
- Medium: 44px min-height (default, meets WCAG tap target)
- Large: 52px min-height (hero CTAs, high-value actions)

**Rule:** Primary button is ALWAYS orange. If you're using blue/indigo for a CTA, you're breaking the brand.

---

### Cards

**Default card:**
```html
<div class="card">
  <!-- Content -->
</div>

<!-- CSS (already in globals.css) -->
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);  /* 12px */
  box-shadow: var(--shadow-sm);
  padding: 24px;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-default);
  transform: translateY(-2px);
}
```

**Clickable card (use case cards, team member cards):**
```html
<div class="card cursor-pointer">
  <!-- Content -->
</div>
```

Adds `:hover` lift effect already defined in CSS.

**Card variants:**
- Default: White bg, subtle border, light shadow
- Elevated: Same but with `shadow-md` by default
- Outlined: No shadow, just border (use for secondary content)

---

### Forms

**Input field:**
```html
<div class="space-y-2">
  <label for="email" class="block text-sm font-medium text-secondary">
    Email address
  </label>
  <input
    type="email"
    id="email"
    class="w-full px-4 py-3 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
    placeholder="you@example.com"
  />
</div>
```

**Input requirements:**
- Height: 44px minimum (48px preferred for mobile)
- Padding: 16px horizontal, 12px vertical
- Border: 1px solid `border-default`
- Focus: 2px orange ring (`accent-primary`)
- Border radius: 8px (`radius-md`)

**Error state:**
```html
<input class="border-error focus:ring-error" />
<p class="text-sm text-error mt-1">Please enter a valid email address</p>
```

**Success state:**
```html
<input class="border-active focus:ring-active" />
<p class="text-sm text-active mt-1">✓ Email verified</p>
```

---

### Navigation

**Public site header:**
```html
<nav class="sticky top-0 bg-base border-b border-subtle z-50">
  <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 text-lg font-semibold">
      🦞 <span>Clawer.ai</span>
    </a>
    <div class="hidden md:flex gap-6">
      <a href="#features">Features</a>
      <a href="/pricing">Pricing</a>
      <a href="/blog">Blog</a>
    </div>
    <div class="flex gap-3">
      <a href="/sign-in" class="btn-secondary">Sign In</a>
      <a href="/sign-up" class="btn-primary">Start Free</a>
    </div>
  </div>
</nav>
```

**Dashboard header:**
```html
<header class="bg-base border-b border-subtle">
  <div class="flex items-center justify-between px-4 h-14">
    <div class="flex items-center gap-4">
      <a href="/dashboard" class="text-lg font-semibold">
        🦞 Clawer.ai
      </a>
      <nav class="hidden md:flex gap-4 text-sm">
        <a href="/dashboard">Dashboard</a>
        <a href="/dashboard/chat">Chat</a>
        <a href="/dashboard/tasks">Tasks</a>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm text-secondary">{user.email}</span>
      <a href="/dashboard/settings">Settings</a>
    </div>
  </div>
</header>
```

**Active state:**
```css
a.active {
  color: var(--accent-primary);
  font-weight: 600;
}
```

**Mobile hamburger menu:**
- Appears on screens <768px
- Animated hamburger icon (3 lines → X)
- Slides in from right
- Full-screen overlay (80vh)

---

### Badges & Tags

**Status badge (Pro, Free, etc.):**
```html
<span class="badge badge-primary">Pro</span>
<span class="badge badge-secondary">Free</span>

<!-- CSS -->
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;  /* 4px x 12px */
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-primary {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
}

.badge-secondary {
  background: var(--accent-secondary-light);
  color: var(--accent-secondary);
}
```

**Tag (blog post tags):**
```html
<span class="tag">Security</span>

<!-- CSS -->
.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.tag:hover {
  background: var(--bg-muted);
}
```

---

### Links

**Body text link:**
```html
<a href="/pricing" class="text-accent-primary hover:text-accent-primary-hover underline">
  See pricing
</a>
```

**Navigation link (no underline):**
```html
<a href="/blog" class="text-secondary hover:text-primary transition-colors">
  Blog
</a>
```

**CTA link (looks like a button):**
```html
<a href="/sign-up" class="btn-primary">
  Start Free →
</a>
```

---

### Icons

**Decision: Emoji vs SVG**

**Current state:** Using emojis (🦞, 💬, ✈️, 🎮, 💼, etc.)

**Problem:** Emojis render differently across platforms:
- iOS: 3D, colorful
- Android: Flat, different colors
- Windows: Microsoft style
- Web fallback: Black and white

**RECOMMENDATION:** Migrate to SVG icons over time.

**Priority:**
1. **Keep for now:** Lobster emoji in logo (brand identity, distinctive)
2. **Replace first:** Platform icons (WhatsApp, Telegram, Slack, Discord) → use official brand SVGs
3. **Replace next:** Feature icons (UI elements that need consistency)
4. **Keep forever:** Decorative emoji in copy (adds personality)

**Icon library:** [Lucide](https://lucide.dev) (clean, consistent with brand)

**Icon sizing:**
```css
--icon-xs: 16px
--icon-sm: 20px
--icon-md: 24px  /* Default */
--icon-lg: 32px
--icon-xl: 48px
```

---

### Empty States

**No data / blank slate:**
```html
<div class="flex flex-col items-center justify-center py-12 text-center">
  <div class="text-6xl mb-4">📋</div>
  <h3 class="text-xl font-semibold text-primary mb-2">
    No tasks yet
  </h3>
  <p class="text-secondary max-w-sm mb-6">
    Create your first task to get started. Your AI team will handle it from here.
  </p>
  <button class="btn-primary">Create Task</button>
</div>
```

**Requirements:**
- Large icon/emoji (48-64px)
- Clear heading explaining what's missing
- Short description (1-2 sentences)
- Primary CTA to fix the empty state
- Center-aligned

---

### Loading States

**Skeleton loader (preferred):**
```html
<div class="animate-pulse space-y-4">
  <div class="h-8 bg-muted rounded w-1/3"></div>
  <div class="h-4 bg-muted rounded w-2/3"></div>
  <div class="h-4 bg-muted rounded w-1/2"></div>
</div>
```

**Spinner (use sparingly):**
```html
<div class="flex items-center justify-center py-12">
  <div class="animate-spin rounded-full h-8 w-8 border-2 border-accent-primary border-t-transparent"></div>
</div>
```

**Rule:** Use skeletons for content that takes >200ms to load. Use spinners only for actions (form submissions, not page loads).

---

## 6. Layout

### Max Content Width

**Marketing pages:**
- Container: `max-w-7xl` (1280px)
- Hero text: `max-w-3xl` (768px)
- Section text: `max-w-2xl` (672px)

**Dashboard:**
- Container: `max-w-6xl` (1152px)
- Content areas: `max-w-4xl` (896px)

**Blog:**
- Article: `max-w-3xl` (768px)
- Wide images: `max-w-4xl` (896px)

**Why these widths?**
- Optimal reading: 60-75 characters per line
- Visual comfort: Content doesn't span full screen on ultrawide
- Mobile-first: 100% width on mobile, constrained on desktop

---

### Grid System

**12-column grid (Tailwind default):**

```html
<!-- 2 columns on desktop, 1 on mobile -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- 3 columns on desktop, 1 on mobile -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- 4 columns on large screens, 2 on tablet, 1 on mobile -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Cards -->
</div>
```

**Gap sizes:**
- Tight: `gap-4` (16px)
- Default: `gap-6` (24px)
- Spacious: `gap-8` (32px)

---

### Dashboard Layout

**Current:** Top nav (horizontal)

**Structure:**
```
┌─────────────────────────────────────────┐
│ Header (logo, nav, user menu)           │
├─────────────────────────────────────────┤
│                                         │
│  Content area (max-w-6xl, centered)     │
│                                         │
└─────────────────────────────────────────┘
```

**Alternative considered:** Left sidebar  
**Decision:** Stick with top nav for now (simpler, works on mobile)

---

## 7. Page Templates

### Marketing Page Template

**Structure:**
1. **Header** (sticky, logo + nav + CTA)
2. **Hero** (H1 + subheading + primary CTA + trust signal)
3. **Sections** (alternating `bg-base` and `bg-subtle`)
4. **Social proof** (testimonials, stats, logos)
5. **Final CTA** (repeat primary CTA with different framing)
6. **Footer** (links, legal, copyright)

**Example (Landing page):**
```html
<Header />

<Hero>
  <h1>Your AI Team, Always Working</h1>
  <p>Deploy agents in 60 seconds...</p>
  <CTA>Start Free</CTA>
  <TrustBadge>Built on OpenClaw — trusted by 300K+ users</TrustBadge>
</Hero>

<Section bg="subtle">
  <h2>How It Works</h2>
  <Steps>Create → Connect → Deploy</Steps>
</Section>

<Section bg="base">
  <h2>Pre-Built AI Teams</h2>
  <CardGrid>...</CardGrid>
</Section>

<Section bg="subtle">
  <h2>Trusted by Teams Worldwide</h2>
  <Testimonials />
  <Stats />
</Section>

<FinalCTA>
  <h2>Ready to build your AI team?</h2>
  <CTA>Start Free</CTA>
</FinalCTA>

<Footer />
```

---

### Dashboard Page Template

**Structure:**
1. **Header** (logo, nav, user menu)
2. **Page title** (H1 + optional breadcrumb)
3. **Content area** (cards, tables, forms)
4. **Action buttons** (top-right of content area)

**Example (Tasks page):**
```html
<DashboardHeader />

<main class="max-w-6xl mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-3xl font-bold">Tasks</h1>
    <button class="btn-primary">+ Add Task</button>
  </div>
  
  <KanbanBoard>...</KanbanBoard>
</main>
```

---

### Blog Post Template

**Structure:**
1. **Header** (public site header)
2. **Article header** (title, date, tags, read time)
3. **Content** (markdown-rendered)
4. **CTA** (try Clawer.ai free)
5. **Related posts**
6. **Footer**

**Example:**
```html
<Header />

<article class="max-w-3xl mx-auto px-4 py-12">
  <header class="mb-8">
    <div class="flex gap-2 mb-4">
      <Tag>Security</Tag>
      <Tag>OpenClaw</Tag>
    </div>
    <h1 class="text-4xl font-bold mb-4">Best OpenClaw Hosting</h1>
    <div class="text-sm text-secondary">
      February 16, 2026 • 12 min read
    </div>
  </header>
  
  <div class="prose prose-lg">
    {content}
  </div>
  
  <aside class="bg-subtle p-6 rounded-lg mt-12">
    <h3>Try Clawer.ai free</h3>
    <p>200 messages to try everything. No credit card required.</p>
    <CTA>Start Free →</CTA>
  </aside>
</article>

<RelatedPosts />
<Footer />
```

---

## 8. Copy Guidelines

### Tone

**Characteristics:**
- Direct and honest
- Technical but not jargon-heavy
- Confident without being arrogant
- Helpful without being patronizing

**Examples:**

| Situation | ❌ Bad | ✅ Good |
|-----------|-------|---------|
| Hero headline | "Revolutionize your workflow with AI" | "Your AI Team, Always Working" |
| Feature description | "Leverage our cutting-edge platform" | "Deploy agents in 60 seconds" |
| Pricing | "Flexible plans to meet your needs" | "$49/month. Everything included." |
| Error message | "An error occurred. Please try again." | "Couldn't connect to WhatsApp. Check your QR code and try again." |
| Empty state | "No items to display" | "No tasks yet. Create your first task to get started." |

---

### Banned Phrases

**Never use these:**
- "Leverage" (use "use" or be specific)
- "Empower" (use "lets you" or "gives you")
- "Synergy" (too corporate)
- "Cutting-edge" (overused, vague)
- "Revolutionary" (overpromise)
- "Game-changing" (cliché)
- "Next-level" (meaningless)
- "Best-in-class" (every product claims this)
- "Seamless" (overused)
- "Robust" (vague, technical-sounding without meaning)

**Alternative phrasing:**
- Instead of "leverage AI": "Use AI" or "AI agents that..."
- Instead of "empower your team": "Give your team..." or "Your team can..."
- Instead of "cutting-edge": "Modern" or just describe what it does
- Instead of "seamless integration": "Connects to WhatsApp in one click"

---

### CTAs (Call-to-Action)

**Primary CTA (free trial):**
- ✅ "Start Free"
- ✅ "Try Free"
- ✅ "Start Free — No Card Required"
- ❌ "Get Started" (vague, what are we starting?)
- ❌ "Learn More" (not action-oriented)
- ❌ "Sign Up" (sounds like commitment)

**Upgrade CTA:**
- ✅ "Upgrade to Pro"
- ✅ "Get Pro"
- ✅ "Go Pro →"
- ❌ "Buy Now" (too transactional)
- ❌ "Subscribe" (sounds like a burden)

**Secondary CTA:**
- ✅ "View Docs"
- ✅ "See Examples"
- ✅ "Read Guide"
- ❌ "Learn More" (too generic)

---

### Feature Descriptions

**Rule:** Benefits over features. What it DOES for the user, not what it IS.

**Examples:**

| Feature | ❌ Feature-focused | ✅ Benefit-focused |
|---------|-------------------|-------------------|
| Multi-channel | "Multi-channel support" | "One agent, every platform — WhatsApp, Telegram, Slack" |
| Scheduling | "Advanced cron scheduling" | "Run tasks overnight while you sleep" |
| Memory | "Long-term memory persistence" | "Your agent remembers past conversations and learns your preferences" |
| File access | "Full filesystem access via VNC" | "See exactly what your agent sees. Upload files, download results." |

---

### Error Messages

**Requirements:**
1. **Human language** (not error codes)
2. **Specific about what went wrong**
3. **Actionable** (tell them what to do next)
4. **Reassuring** (it's fixable)

**Examples:**

| ❌ Bad | ✅ Good |
|-------|---------|
| "Error 401" | "Session expired. Please sign in again." |
| "Invalid input" | "Email address should look like: you@example.com" |
| "Connection failed" | "Couldn't connect to Telegram. Check your bot token and try again." |
| "An error occurred" | "Couldn't save your changes. Check your internet and try again." |

---

## 9. Accessibility Minimums (WCAG AA)

### Contrast Ratios

**Requirements:**
- Body text (16px): 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Our compliance:**
- `text-primary` on white: 15.4:1 ✅
- `text-secondary` on white: 6.8:1 ✅
- `text-tertiary` on white: 3.2:1 ⚠️ (use for non-essential text only)
- `accent-primary` on white: 3.7:1 ✅ (large text only)

**Test all new colors:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

### Focus States

**Requirement:** All interactive elements must have visible focus indicator.

**Implementation:**
```css
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

**Test:** Tab through entire page, verify all buttons/links/inputs have orange outline.

---

### Alt Text

**Requirements:**
- All `<img>` tags MUST have `alt` attribute
- Decorative images: `alt=""` (screen reader skips)
- Informational images: Descriptive alt text

**Examples:**
```html
<!-- Logo -->
<img src="/logo.png" alt="Clawer.ai" />

<!-- Feature icon (decorative, adjacent text explains) -->
<img src="/icon.svg" alt="" />

<!-- Screenshot -->
<img src="/dashboard.png" alt="Dashboard showing AI team members Claire, Leo, and Harper with online status indicators" />

<!-- Platform icon -->
<img src="/whatsapp.svg" alt="WhatsApp" />
```

---

### Tap Targets (Mobile)

**Requirement:** Minimum 44x44px for all interactive elements.

**Our standard:**
- Buttons: 44px min-height (default), 48px preferred
- Links in nav: 44px height
- Form inputs: 44px height
- Icon buttons: 44x44px minimum

**Spacing:** Minimum 8px between adjacent tap targets.

---

### Semantic HTML

**Requirements:**
- One `<h1>` per page
- Heading hierarchy (no skipping levels)
- `<nav>` for navigation
- `<main>` for main content
- `<article>` for blog posts
- `<button>` for actions, `<a>` for navigation

**Example:**
```html
<header>
  <nav>...</nav>
</header>

<main>
  <h1>Page Title</h1>
  <section>
    <h2>Section Title</h2>
    <h3>Subsection</h3>
  </section>
</main>

<footer>...</footer>
```

---

### Screen Reader Considerations

**Requirements:**
- Skip to main content link
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content
- Form labels associated with inputs

**Examples:**
```html
<!-- Skip link (hidden until focused) -->
<a href="#main" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<!-- Icon button -->
<button aria-label="Close menu">
  <XIcon />
</button>

<!-- Form label -->
<label for="email">Email address</label>
<input id="email" type="email" />

<!-- Dynamic content (loading states) -->
<div role="status" aria-live="polite">
  Loading...
</div>
```

---

## 10. Anti-Patterns (What NOT to Do)

### Visual Anti-Patterns

❌ **Gradients** — Keep it flat. Gradients look dated and complicate color consistency.

❌ **More than 2 font weights per page** — Reduces hierarchy clarity. Stick to 400 + 600 (or 400 + 700 for heavy headlines).

❌ **Inconsistent button colors** — Orange for all primary CTAs. No exceptions.

❌ **Text smaller than 14px** — Hard to read, especially on mobile. Exception: Fine print (12px minimum).

❌ **Text smaller than 16px on mobile** — Triggers iOS zoom, poor UX.

❌ **Placeholder-only inputs** — Placeholders disappear on focus. Always include a label.

❌ **Walls of text without visual breaks** — Use headings, bullets, white space. Max 3-4 lines per paragraph.

❌ **Centered text blocks** — Hard to read. Center headings, left-align body text.

❌ **All caps in body text** — Reduces readability. Use for badges/labels only (short text).

---

### Copy Anti-Patterns

❌ **Vague CTAs** — "Learn More", "Click Here", "Get Started"  
✅ **Specific CTAs** — "Start Free", "View Pricing", "Deploy Agent"

❌ **Feature lists without benefits** — "Multi-channel support"  
✅ **Benefits** — "Works with WhatsApp, Telegram, and Slack"

❌ **Passive voice** — "Your workflow will be empowered"  
✅ **Active voice** — "You can automate workflows"

❌ **Jargon** — "Agentic orchestration platform"  
✅ **Plain language** — "AI agents that work together"

❌ **Corporate speak** — "Leverage synergies to optimize..."  
✅ **Human language** — "Agents work together to..."

---

### UX Anti-Patterns

❌ **No empty states** — Blank pages confuse users. Always explain what's missing and how to add it.

❌ **Generic error messages** — "Error occurred"  
✅ **Specific, actionable errors** — "Couldn't save. Check your connection."

❌ **No loading states** — White screen while content loads.  
✅ **Skeleton loaders or spinners**

❌ **Disabled buttons without explanation** — Why can't I click this?  
✅ **Tooltip or helper text explaining why**

❌ **Confirmation dialogs for reversible actions** — Don't ask "Are you sure?" for things you can undo.

---

## 11. Quick Reference Checklist

**Before shipping ANY design:**

### Brand Consistency
- [ ] Brand name is "Clawer.ai" (not CLAWER, not Clawer AI)
- [ ] Primary CTAs are orange, not blue
- [ ] Logo includes 🦞 emoji
- [ ] Colors match design system (no random colors)

### Typography
- [ ] Body text is 16px minimum (18px on critical content)
- [ ] Line-height is 1.5+ on all text
- [ ] Only 1-2 font weights used
- [ ] Heading hierarchy is semantic (H1 → H2 → H3, no skipping)

### Spacing
- [ ] Spacing uses 4px increments
- [ ] Buttons are 44px min-height
- [ ] Cards have 24px padding
- [ ] Sections have 64px+ vertical spacing

### Components
- [ ] All buttons use standard button classes
- [ ] All cards use `.card` class
- [ ] All forms have labels (not just placeholders)
- [ ] All icons are consistent size

### Accessibility
- [ ] All images have alt text
- [ ] Contrast ratios pass WCAG AA
- [ ] Focus states are visible
- [ ] Tap targets are 44x44px minimum

### Copy
- [ ] No banned phrases (leverage, empower, synergy)
- [ ] CTAs are action-oriented
- [ ] Error messages are specific and actionable
- [ ] Features described as benefits

### Mobile
- [ ] Tested on actual mobile device (not just browser resize)
- [ ] Text is readable at arm's length
- [ ] Buttons are easy to tap
- [ ] No horizontal scrolling

---

## 12. Maintenance & Updates

**This guide is a living document.**

**When to update:**
- New component types added
- Color palette changes
- Typography scale changes
- New brand assets (logo variants, icons)
- Accessibility requirements change

**How to update:**
1. Update this document first
2. Update `globals.css` to match
3. Update existing components to comply
4. Announce changes to team
5. Set 30-day transition period for old patterns

**Version history:**
- v1.0 (Feb 2026): Initial brand guide based on existing design system

---

## Appendix: Migration from Current State

### Critical Fixes (Ship-blocking)

**1. Brand name inconsistency**

Find and replace:
```bash
# In all TSX/JSX files:
CLAWER.AI → Clawer.ai
CLAWER AI → Clawer.ai
CLAWER → Clawer.ai

# Exceptions:
# - Don't change lowercase "clawer.ai" in URLs/emails
# - Don't change legal docs (requires legal approval)
```

**2. CTA button color inconsistency**

Current state:
- Landing page: Orange CTAs ✅
- Pricing page: Blue "Get Pro" button ❌

Fix:
```tsx
// Before (pricing page):
<button className="bg-blue-600 hover:bg-blue-700">Get Pro</button>

// After:
<button className="btn-primary">Get Pro</button>
```

All primary CTAs should use `.btn-primary` class (orange).

---

### High-Priority Fixes

**3. Mobile font sizes**

Test all pages on real mobile device. If text is <16px, update:

```css
/* globals.css - add mobile override */
@media (max-width: 640px) {
  body {
    font-size: 16px;
    line-height: 1.6;
  }
  
  h1 { font-size: 32px; }
  h2 { font-size: 28px; }
  h3 { font-size: 22px; }
}
```

**4. Replace placeholder testimonial**

Landing page has "Marcus Chen, Founder, StartupXYZ" — clearly fake.

Either:
- Get real testimonial
- Use "Anonymous, Startup Founder"
- Remove third testimonial

---

**End of Brand Guide**

*This guide is authoritative. When in doubt, refer here. If it's not documented, ask before implementing.*
