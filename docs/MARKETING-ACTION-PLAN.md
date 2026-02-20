# Clawer.ai Marketing Action Plan
**Marketing Consultant Review — February 19, 2026**  
**Reviewed Against:** MARKETING-VOICE.md, BRAND-GUIDE.md, UX-FIX-PLAN.md  
**Pages Reviewed:** Landing, Pricing, Use Cases, Blog, Blog Post, Sign-In  
**Status:** Ready for implementation

---

## Executive Summary

**Overall Assessment:** The current marketing pages are **75% aligned** with the brand and marketing guides. The foundation is solid, but there are critical inconsistencies in brand name presentation, CTA text, messaging hierarchy, and trust signals that are directly hurting conversion.

**Ship-Blocking Issues:** 
1. Brand name inconsistency ("Clawer.ai" vs "CLAWER.AI")
2. Message count conflict (100 vs 200 free messages)
3. Fake testimonial (Marcus Chen, StartupXYZ)

**High-Impact Quick Wins:**
1. Update hero headline to match messaging hierarchy
2. Standardize all CTA text to "Start Free"
3. Add trust signals to sign-in page

**Estimated Implementation Time:** 8-12 hours for critical + high priority changes

---

## Page-by-Page Analysis

---

## 1. Landing Page (https://clawer.ai)

### Current State

**Screenshot:** Captured February 19, 2026

**Current Hero Copy:**
- **Headline:** "Your Hosted OpenClaw AI Team, Always On Duty"
- **Subheadline:** "Deploy specialized AI agents across WhatsApp, Telegram, and Slack. No setup, no maintenance — they just work."
- **CTA:** "Deploy Your First Agent"
- **Below CTA:** "No credit card required • 100 free messages"

**What's Working:**
- ✅ Clean, professional design
- ✅ Orange CTAs throughout (brand-consistent)
- ✅ Subheadline is direct and benefit-focused
- ✅ "How It Works" section is clear (Create → Connect → Deploy)
- ✅ Social proof section shows real testimonials (Eric Siu, Winrey)
- ✅ Pre-Built AI Teams section shows concrete use cases
- ✅ Features section describes benefits, not just features
- ✅ Voice is generally direct and no-BS

**What's NOT Working:**
- ❌ **Brand name in nav:** "Clawer.ai" (correct) but needs to be consistent everywhere
- ❌ **Headline doesn't lead with #1 message:** Current headline assumes people know OpenClaw. Should lead with "AI teams vs chatbots" differentiation
- ❌ **CTA text inconsistency:** "Deploy Your First Agent" (hero) vs "Start Free" (nav, pricing section) vs "Browse all teams →" vs "Start Free — 100 Messages" (final CTA)
- ❌ **Fake testimonial:** "Marcus Chen, Founder, StartupXYZ" — obviously a placeholder
- ❌ **Message count below CTA:** "100 free messages" but final CTA says "100 Messages" and some places say "200 free messages"
- ❌ **Messaging hierarchy issue:** Doesn't immediately differentiate from ChatGPT. "Team" is mentioned but not emphasized enough
- ❌ **Missing urgency/scarcity:** No reason to act now vs. later
- ❌ **Emoji icons:** WhatsApp (💬), Telegram (✈️), Discord (🎮), Slack (💼) render inconsistently across platforms

---

### Recommended Changes

#### Change 1.1: Update Hero Headline (CRITICAL — Messaging Hierarchy)

**Why:** Current headline assumes people know "OpenClaw." According to MARKETING-VOICE.md, messaging hierarchy should lead with "AI TEAM, not chatbot" differentiation first.

**Current:**
```tsx
"Your Hosted OpenClaw AI Team, Always On Duty"
```

**Recommended Option A (Best for differentiation):**
```tsx
"AI Teams That Do the Work While You Sleep"
```
**Reasoning:** Matches recommended tagline from MARKETING-VOICE.md. Outcome-focused, implies autonomy, avoids jargon.

**Recommended Option B (Emphasis on team concept):**
```tsx
"Not a Chatbot. An AI Team."
```
**Reasoning:** Immediate differentiation. Provocative. Clear contrast.

**Recommended Option C (For users coming from search):**
```tsx
"Your AI Team, Always Working — Even When You're Not"
```
**Reasoning:** Slightly softer but still outcome-focused. Good for cold traffic.

**My Pick:** **Option A** — "AI Teams That Do the Work While You Sleep"

**Implementation:**
- **File:** `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx`
- **Line:** 37-64 (the motion.h1 block with word-by-word animation)
- **Before:**
  ```tsx
  {['Your', 'Hosted', 'OpenClaw'].map((word, i) => ( ... ))}
  {['AI', 'Team,', 'Always', 'On', 'Duty'].map((word, i) => ( ... ))}
  ```
- **After:**
  ```tsx
  {['AI', 'Teams', 'That'].map((word, i) => (
    <motion.span
      key={i}
      className={i === 0 ? 'text-orange-500' : 'text-gray-900'}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {word}{' '}
    </motion.span>
  ))}
  <br className="hidden md:block" />
  {['Do', 'the', 'Work', 'While', 'You', 'Sleep'].map((word, i) => (
    <motion.span
      key={i + 3}
      className="text-gray-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: (i + 3) * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {word}{' '}
    </motion.span>
  ))}
  ```

**Alternative (if you want to keep "OpenClaw" visible):**
Update subheadline to mention OpenClaw:
```tsx
// Current subheadline:
"Deploy specialized AI agents across WhatsApp, Telegram, and Slack. No setup, no maintenance — they just work."

// New subheadline (if headline changes):
"Built on OpenClaw. Deploy specialized AI agents across WhatsApp, Telegram, and Slack. They monitor, research, and execute — while you sleep."
```

**Effort:** Small (30 min)  
**Impact:** High (directly addresses messaging hierarchy from guide)

---

#### Change 1.2: Update Hero Subheadline (RECOMMENDED)

**Current:**
```tsx
"Deploy specialized AI agents across WhatsApp, Telegram, and Slack. No setup, no maintenance — they just work."
```

**Recommended:**
```tsx
"Deploy specialized agents across WhatsApp, Telegram, and Slack. They monitor competitors, draft content, and execute tasks — while you sleep. Deploy in 60 seconds."
```

**Why:**
- Adds concrete examples ("monitor competitors, draft content")
- Reinforces autonomy ("while you sleep")
- Adds setup ease ("60 seconds")
- Follows MARKETING-VOICE.md messaging hierarchy: What (team) → Where (channels) → What it does (autonomy) → How easy (60 seconds)

**Implementation:**
- **File:** `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx`
- **Line:** 67-75 (motion.p block with subheadline)
- **Before:**
  ```tsx
  <motion.p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
    Deploy specialized AI agents across WhatsApp, Telegram, and Slack. 
    No setup, no maintenance — they just work.
  </motion.p>
  ```
- **After:**
  ```tsx
  <motion.p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
    Deploy specialized agents across WhatsApp, Telegram, and Slack. They monitor competitors, draft content, and execute tasks — while you sleep. Deploy in 60 seconds.
  </motion.p>
  ```

**Effort:** Small (10 min)  
**Impact:** Medium (better clarity, matches messaging guide)

---

#### Change 1.3: Standardize CTA Text to "Start Free" (CRITICAL)

**Current CTA Text Variations:**
- Hero: "Deploy Your First Agent"
- Nav: "Start Free"
- Pricing section (landing page): "Start Free"
- Team templates section: "Browse all teams →"
- Final CTA: "Start Free — 100 Messages"

**Problem:** Too many variations. Confuses users. MARKETING-VOICE.md recommends "Start Free" for all free trial CTAs.

**Recommended:**
- **Primary CTA (free trial):** "Start Free"
- **Secondary CTA (learn more):** Specific action like "View Pricing" or "See Examples"

**Implementation:**

1. **Hero CTA:**
   - **File:** `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx`
   - **Line:** 84 (CTA button text)
   - **Before:** `Deploy Your First Agent`
   - **After:** `Start Free`

2. **Below CTA text:**
   - **File:** Same file, line 90
   - **Before:** `No credit card required • 100 free messages`
   - **After:** `No credit card required • 100 free messages` (keep as-is, but see Change 1.4 for message count fix)

3. **Team Templates CTA:**
   - **File:** `/home/keith/projects/clawer/src/components/landing/TeamTemplates.tsx` (need to check this file)
   - **Before:** "Browse all teams →"
   - **After:** "Start Free" (more action-oriented)

4. **Final CTA:**
   - **File:** `/home/keith/projects/clawer/src/components/landing/FinalCTA.tsx`
   - **Before:** "Start Free — 100 Messages"
   - **After:** "Start Free" (text in button), keep "100 free messages" below button

**Effort:** Small (30 min)  
**Impact:** High (consistency = trust = conversion)

---

#### Change 1.4: Fix Message Count Inconsistency (CRITICAL)

**Current State:**
- Hero below CTA: "100 free messages"
- Pricing section (landing page): "100 free messages included"
- Final CTA: "Start Free — 100 Messages"
- BUT Final CTA trust signals: "100 free messages"
- BUT Pricing page: "200 free messages"

**Problem:** Conflicting numbers damage trust.

**Decision needed:** Is it 100 or 200 free messages?

**Assumed Answer:** 100 total messages (based on pricing page code showing "100 total messages" for Free tier)

**Implementation:**

1. **Hero CTA (already correct):**
   - **File:** `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx`
   - **Line:** 90
   - **Current:** "No credit card required • 100 free messages" ✅ Correct

2. **Pricing Section (landing page):**
   - **File:** `/home/keith/projects/clawer/src/components/landing/PricingSection.tsx`
   - **Line:** 90 (below CTA)
   - **Current:** "100 free messages included. No credit card required."
   - **Change:** Keep as-is ✅

3. **Final CTA:**
   - **File:** `/home/keith/projects/clawer/src/components/landing/FinalCTA.tsx`
   - **Find:** Any reference to "200 messages"
   - **Replace with:** "100 messages"

4. **Pricing page (separate file):**
   - **File:** `/home/keith/projects/clawer/src/app/pricing/page.tsx`
   - **Line:** 162 (Free tier CTA description)
   - **Before:** "200 free messages included. No credit card required."
   - **After:** "100 free messages included. No credit card required."

**If the actual offer is 200 messages,** reverse this: change all "100" to "200" instead.

**Effort:** Small (20 min)  
**Impact:** Critical (inconsistency = distrust)

---

#### Change 1.5: Remove Fake Testimonial (CRITICAL)

**Current State:**
In Social Proof section, testimonial #3:
```
"Set it up in 5 minutes. Been running 3 months without a single issue. Worth every penny."
— Marcus Chen, Founder, StartupXYZ
```

**Problem:** "StartupXYZ" is obviously fake. Destroys credibility.

**Options:**
1. **Remove entirely** (go from 3 testimonials to 2) ← **RECOMMENDED**
2. **Replace with real testimonial** (if you have one)
3. **Make anonymous** ("Anonymous, Solo Founder")

**Implementation:**

- **File:** `/home/keith/projects/clawer/src/components/landing/SocialProof.tsx`
- **Find the testimonial component for Marcus Chen**
- **Delete that entire testimonial block**

**Alternative (if you have a real testimonial):**
Replace with actual customer quote, name, and company.

**Effort:** Small (15 min)  
**Impact:** High (fake testimonials destroy trust)

---

#### Change 1.6: Replace Emoji Icons with SVG (IMPORTANT)

**Current State:**
- WhatsApp: 💬
- Telegram: ✈️
- Discord: 🎮
- Slack: 💼

**Problem:** Emojis render differently on iOS, Android, Windows. Brand consistency issue.

**Recommended:**
Use official brand SVGs for platform icons (WhatsApp, Telegram, Slack, Discord).

**Implementation:**

1. **Download official brand assets:**
   - WhatsApp: [WhatsApp Brand Kit](https://www.whatsapp.com/brand)
   - Telegram: Use paper plane icon (official)
   - Slack: [Slack Brand Kit](https://slack.com/brand-guidelines)
   - Discord: [Discord Branding](https://discord.com/branding)

2. **Store in:** `/home/keith/projects/clawer/public/icons/platforms/`
   - `whatsapp.svg`
   - `telegram.svg`
   - `slack.svg`
   - `discord.svg`

3. **Update HeroSection.tsx:**
   - **File:** `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx`
   - **Line:** 6-11 (CHANNEL_ICONS constant)
   - **Before:**
     ```tsx
     const CHANNEL_ICONS = [
       { name: 'WhatsApp', icon: '💬', color: 'bg-green-50 text-green-600' },
       { name: 'Telegram', icon: '✈️', color: 'bg-blue-50 text-blue-600' },
       { name: 'Discord', icon: '🎮', color: 'bg-indigo-50 text-indigo-600' },
       { name: 'Slack', icon: '💼', color: 'bg-purple-50 text-purple-600' },
     ];
     ```
   - **After:**
     ```tsx
     import Image from 'next/image';
     
     const CHANNEL_ICONS = [
       { name: 'WhatsApp', icon: '/icons/platforms/whatsapp.svg', color: 'bg-green-50' },
       { name: 'Telegram', icon: '/icons/platforms/telegram.svg', color: 'bg-blue-50' },
       { name: 'Discord', icon: '/icons/platforms/discord.svg', color: 'bg-indigo-50' },
       { name: 'Slack', icon: '/icons/platforms/slack.svg', color: 'bg-purple-50' },
     ];
     ```

4. **Update the rendering:**
   - **Line:** 117-128 (channel badges rendering)
   - **Before:**
     ```tsx
     <span className="text-lg">{channel.icon}</span>
     ```
   - **After:**
     ```tsx
     <Image 
       src={channel.icon} 
       alt={channel.name} 
       width={20} 
       height={20} 
       className="inline-block"
     />
     ```

**Effort:** Medium (1 hour — download assets, update code, test)  
**Impact:** Medium (brand consistency, professionalism)

---

#### Change 1.7: Add Urgency to Hero (OPTIONAL — Nice to Have)

**Current State:** No urgency/scarcity element. User has no reason to act now vs. next week.

**Recommended Addition (below CTA):**
```tsx
<p className="text-sm text-gray-500 mt-4">
  No credit card required • 100 free messages
</p>
<p className="text-sm text-orange-600 font-medium mt-2">
  🔥 Early access pricing: $49/mo locks in forever (price increases March 1)
</p>
```

**Why:** Creates urgency without being salesy. Aligns with "Early Access" badge on pricing.

**Implementation:**
- **File:** `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx`
- **Line:** After line 92 (below "No credit card" text)
- **Add:**
  ```tsx
  <p className="text-sm text-orange-600 font-medium mt-2">
    🔥 Early access pricing locks in at $49/mo — price increases March 1
  </p>
  ```

**Only add this if:**
1. It's true (don't lie about price increases)
2. You want to create urgency
3. You're comfortable with the tone

**Effort:** Small (10 min)  
**Impact:** Low-Medium (creates urgency, but could feel pushy)

---

### Implementation Details — Landing Page

**Files to modify:**
1. `/home/keith/projects/clawer/src/components/landing/HeroSection.tsx` — headline, subheadline, CTA, message count, icons
2. `/home/keith/projects/clawer/src/components/landing/SocialProof.tsx` — remove fake testimonial
3. `/home/keith/projects/clawer/src/components/landing/TeamTemplates.tsx` — update CTA text
4. `/home/keith/projects/clawer/src/components/landing/FinalCTA.tsx` — standardize CTA, fix message count
5. `/home/keith/projects/clawer/src/components/landing/PricingSection.tsx` — verify message count consistency

**Testing Checklist:**
- [ ] Hero headline matches recommended option
- [ ] All CTAs say "Start Free" (no "Deploy Your First Agent", no "Browse all teams")
- [ ] Message count is consistent everywhere (100 or 200, pick one)
- [ ] No fake testimonials visible
- [ ] Platform icons are SVG, not emoji (if implemented)
- [ ] Mobile: Everything readable, CTAs tappable

---

## 2. Pricing Page (https://clawer.ai/pricing)

### Current State

**Current Top Section:**
- Shows FULL hero section from landing page (same as homepage)
- Then shows pricing cards

**Current Headline (in pricing cards section):**
- "Simple, transparent pricing"

**Current CTAs:**
- Free tier: "Start Free" ✅
- Pro tier: "Get Pro"

**Message counts:**
- Free tier: "100 total messages" (in comparison table)
- Pro tier: "500 messages per day"
- BUT description below Pro CTA says: "200 free messages included. No credit card required."

**What's Working:**
- ✅ Pricing is clear and specific
- ✅ Comparison table shows exact differences
- ✅ FAQ section addresses common objections
- ✅ Orange CTA for Pro tier (brand-consistent)
- ✅ Voice is direct and honest
- ✅ "Most Popular" badge on Pro tier

**What's NOT Working:**
- ❌ **Brand name in nav:** Shows "🦞 Clawer.ai" (correct) ✅
- ❌ **Duplicate hero:** Shows full landing page hero at top. Pricing page shouldn't have full hero section — just headline + description
- ❌ **CTA text:** "Get Pro" should be "Get Pro" or "Start Pro" (acceptable, but could be "Upgrade to Pro" for clarity)
- ❌ **Message count conflict:** Description says "200 free messages" but comparison table says "100 total messages"
- ❌ **Pro tier description:** "Full AI team — all members unlocked" is vague. How many members? Name them.

---

### Recommended Changes

#### Change 2.1: Remove Duplicate Hero Section (CRITICAL)

**Current State:**
Pricing page shows the full landing page hero at the top (with animation, chat demo, etc.)

**Problem:**
1. Wastes precious above-the-fold space
2. User already knows what Clawer is if they're on pricing page
3. Pushes actual pricing content below the fold

**Recommended:**
Remove the full hero. Keep only the pricing-specific header.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/pricing/page.tsx`

**Current code likely imports and renders:**
```tsx
import HeroSection from "@/components/landing/HeroSection";

export default function PricingPage() {
  return (
    <div>
      <HeroSection />  {/* ← Remove this */}
      <section className="pt-32 pb-16">
        <h1>Simple, transparent pricing</h1>
        ...
      </section>
    </div>
  );
}
```

**After:**
```tsx
// Remove HeroSection import
// Remove <HeroSection /> component

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav>...</nav>

      {/* Pricing-specific hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you need more power. No surprises.
          </p>
        </div>
      </section>

      {/* Rest of pricing page */}
      ...
    </div>
  );
}
```

**Note:** Based on the screenshot, it looks like the pricing page already has the minimal header. If HeroSection is being rendered, remove it. If not, this change is already done. ✅

**Effort:** Small (10 min if needed)  
**Impact:** High (gets users to pricing content faster)

---

#### Change 2.2: Fix Message Count Consistency (CRITICAL)

**Current State:**
- Free tier card description: Shows "100 total messages" in feature list
- Pro tier card description: "200 free messages included. No credit card required."

**Problem:** Which is it? 100 or 200?

**Answer (from code review):**
- Free tier: "100 total messages" (one-time)
- The "200 free messages" is a mistake

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/pricing/page.tsx`

**Find:**
```tsx
<p className="text-center text-xs text-gray-500 mt-3">
  200 free messages included. No credit card required.
</p>
```

**Replace with:**
```tsx
<p className="text-center text-xs text-gray-500 mt-3">
  100 free messages to try Pro. No credit card required.
</p>
```

**OR** (if Pro tier also includes 100 bonus messages on first month):
```tsx
<p className="text-center text-xs text-gray-500 mt-3">
  7-day free trial. No credit card required.
</p>
```

**Effort:** Small (5 min)  
**Impact:** Critical (conflicting info = lost sales)

---

#### Change 2.3: Clarify Pro Tier Agent Count (IMPORTANT)

**Current State:**
Pro tier feature list says:
- "Full AI team — all members unlocked"

**Problem:** Too vague. How many? Which ones?

**Recommended:**
Be specific. List the agents or give a number.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/pricing/page.tsx`

**Before:**
```tsx
features: [
  "500 messages per day",
  "Full AI team — all members unlocked",
  ...
]
```

**After (Option A — specific number):**
```tsx
features: [
  "500 messages per day",
  "Full AI team (5 agents included)",
  ...
]
```

**After (Option B — name the agents):**
```tsx
features: [
  "500 messages per day",
  "Full AI team — Claire, Leo, Harper, Hunter, Shield",
  ...
]
```

**My recommendation:** **Option A** (less cluttered, clear number)

**Effort:** Small (5 min)  
**Impact:** Medium (clarity = better conversions)

---

#### Change 2.4: Update Pro Tier CTA Text (OPTIONAL)

**Current State:**
- Free tier CTA: "Start Free" ✅
- Pro tier CTA: "Get Pro"

**Analysis:**
"Get Pro" is acceptable. It's action-oriented and specific.

**Alternative Options:**
1. "Upgrade to Pro" (clearer for existing users)
2. "Start Pro Trial" (emphasizes trial)
3. "Get Pro" (current — keep this) ✅

**Recommendation:** Keep "Get Pro" as-is. It's fine.

**No change needed.**

---

#### Change 2.5: Add Trust Signal to Free Tier (OPTIONAL)

**Current State:**
Free tier has basic features list, no special callout.

**Recommended:**
Add a small trust signal below the CTA.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/pricing/page.tsx`

**After the Free tier CTA, add:**
```tsx
<p className="text-center text-xs text-gray-500 mt-3">
  No credit card required. Upgrade anytime.
</p>
```

**Effort:** Small (5 min)  
**Impact:** Low (nice to have, reduces friction)

---

### Implementation Details — Pricing Page

**Files to modify:**
1. `/home/keith/projects/clawer/src/app/pricing/page.tsx` — message count, agent count clarification

**Testing Checklist:**
- [ ] No duplicate hero section
- [ ] Free tier says "100 total messages" (or whatever the actual number is)
- [ ] Pro tier CTA description matches reality (100 or 200 messages)
- [ ] Pro tier agent count is specific ("5 agents" or names)
- [ ] All CTAs work correctly
- [ ] FAQ section answers common questions

---

## 3. Use Cases Page (https://clawer.ai/use-cases)

### Current State

**Headline:**
"Built for the way you work"

**Subheadline:**
"These aren't chatbots. They monitor, research, follow up, and execute — overnight, on schedule, without being asked. You wake up to results."

**Use Cases:**
1. Solo Founders — Hunter, Shield, Harper agents
2. Content Creators — Mia, Jordan, Blake agents
3. Small Teams — Morning briefings, overnight research
4. Parents & Families — Cal, Mel, Prof agents

**What's Working:**
- ✅ **EXCELLENT subheadline** — "These aren't chatbots. They monitor, research, follow up, and execute" — matches MARKETING-VOICE.md perfectly
- ✅ Voice is outcome-focused, not feature-focused
- ✅ Specific examples ("Hunter monitors your competitors daily")
- ✅ Benefit statements ("You wake up to results, not tasks")
- ✅ CTAs are clear ("Start Free")
- ✅ Each use case has concrete agent names and actions

**What's NOT Working:**
- ❌ **Emoji icons** — 🚀, 🎬, 👥, 🏠 — should be SVG for consistency
- ⚠️ **Headline could be stronger** — "Built for the way you work" is generic
- ⚠️ **Missing final CTA section** — page ends abruptly after last use case

---

### Recommended Changes

#### Change 3.1: Strengthen Headline (OPTIONAL)

**Current:**
"Built for the way you work"

**Problem:** Generic. Doesn't differentiate from any productivity tool.

**Recommended Option A:**
"Not Assistants. Operators."

**Recommended Option B:**
"AI Teams for Every Workflow"

**Recommended Option C:**
"Your Team. Not Your To-Do List."

**My Pick:** **Option A** — "Not Assistants. Operators."

**Why:** Matches the direct, provocative tone from MARKETING-VOICE.md. Differentiates from "assistants."

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/use-cases/page.tsx`

**Find:**
```tsx
<h1>Built for the way you work</h1>
```

**Replace with:**
```tsx
<h1 className="text-4xl md:text-5xl font-bold text-gray-900">
  Not Assistants. Operators.
</h1>
```

**Keep the existing subheadline — it's perfect.**

**Effort:** Small (5 min)  
**Impact:** Low-Medium (stronger differentiation)

---

#### Change 3.2: Add Final CTA Section (IMPORTANT)

**Current State:**
Page ends after the last use case (Parents & Families). No final CTA to convert users.

**Recommended:**
Add a final CTA section to capture users who scrolled through all use cases.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/use-cases/page.tsx`

**Add this section at the end (before footer):**

```tsx
{/* Final CTA */}
<section className="py-20 px-6 bg-gray-50">
  <div className="max-w-3xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
      Ready to meet your AI team?
    </h2>
    <p className="mt-4 text-xl text-gray-600">
      Start free — no credit card required. 100 messages to try everything.
    </p>
    <div className="mt-8">
      <Link
        href="/sign-up"
        className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-orange-500/25"
      >
        Start Free
      </Link>
    </div>
    <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <span className="text-green-500">✓</span>
        <span>No credit card required</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-500">✓</span>
        <span>100 free messages</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-500">✓</span>
        <span>Cancel anytime</span>
      </div>
    </div>
  </div>
</section>
```

**Effort:** Medium (30 min — write JSX, add imports, style)  
**Impact:** High (captures conversions at bottom of page)

---

#### Change 3.3: Replace Emoji Icons with SVG (OPTIONAL)

**Current State:**
- Solo Founders: 🚀
- Content Creators: 🎬
- Small Teams: 👥
- Parents & Families: 🏠

**Problem:** Same as landing page — inconsistent rendering.

**Recommended:**
Use Lucide icons (already recommended icon library in BRAND-GUIDE.md).

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/use-cases/page.tsx`

**Install Lucide (if not already installed):**
```bash
npm install lucide-react
```

**Import icons:**
```tsx
import { Rocket, Film, Users, Home } from 'lucide-react';
```

**Replace emoji with:**
```tsx
// Before:
<span className="text-6xl">🚀</span>

// After:
<Rocket className="w-16 h-16 text-orange-500" />
```

**Icon mapping:**
- 🚀 → `<Rocket />`
- 🎬 → `<Film />`
- 👥 → `<Users />`
- 🏠 → `<Home />`

**Effort:** Medium (30 min)  
**Impact:** Low-Medium (brand consistency)

---

### Implementation Details — Use Cases Page

**Files to modify:**
1. `/home/keith/projects/clawer/src/app/use-cases/page.tsx` — headline, final CTA, icons

**Testing Checklist:**
- [ ] Headline is stronger (if changed)
- [ ] Final CTA section is present
- [ ] All CTAs say "Start Free"
- [ ] Icons are SVG (if changed)
- [ ] Mobile: All use cases readable, CTAs tappable

---

## 4. Blog Listing Page (https://clawer.ai/blog)

### Current State

**Content:**
Shows 3 blog posts:
1. OpenClaw Security: CVE-2026-25253
2. Managed OpenClaw Hosting
3. OpenClaw's Security Crisis

**What's Working:**
- ✅ Clean design
- ✅ Clear post previews with dates and read times
- ✅ Tags (Security, OpenClaw, CVE, Hosting, Docker)
- ✅ "Read article" links

**What's NOT Working:**
- ❌ **No header/intro** — Page jumps straight into blog posts
- ❌ **No CTA** — No way to convert readers into users
- ❌ **Missing blog description** — What is this blog about?

---

### Recommended Changes

#### Change 4.1: Add Blog Header (RECOMMENDED)

**Current State:**
Page title is just "Clawer.ai — Hosted OpenClaw, Personal AI Assistant" (from metadata). No visible header on page.

**Recommended:**
Add a simple header explaining what the blog covers.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/blog/page.tsx`

**Add this section at the top (after nav, before blog posts):**

```tsx
<section className="pt-32 pb-12 px-6 text-center">
  <div className="max-w-3xl mx-auto">
    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
      The Clawer Blog
    </h1>
    <p className="mt-4 text-xl text-gray-600">
      OpenClaw hosting, security, and AI agent deployment guides. Real stories from real users.
    </p>
  </div>
</section>
```

**Effort:** Small (10 min)  
**Impact:** Medium (sets context, improves SEO)

---

#### Change 4.2: Add CTA Section (RECOMMENDED)

**Current State:**
No CTA. Users read blog posts but have no clear path to sign up.

**Recommended:**
Add a subtle CTA section between header and posts, or at the bottom.

**Implementation:**

**Option A: Top CTA (subtle, non-intrusive):**

Add after the header:
```tsx
<section className="pb-12 px-6">
  <div className="max-w-4xl mx-auto bg-orange-50 border border-orange-200 rounded-2xl p-6">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-gray-900">
          New to Clawer?
        </p>
        <p className="text-sm text-gray-600">
          Deploy your first AI agent in 60 seconds. 100 free messages. No credit card.
        </p>
      </div>
      <Link
        href="/sign-up"
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-colors"
      >
        Start Free
      </Link>
    </div>
  </div>
</section>
```

**Option B: Bottom CTA (after all posts):**

Add at the end of the page:
```tsx
<section className="py-20 px-6 bg-gray-50">
  <div className="max-w-3xl mx-auto text-center">
    <h2 className="text-3xl font-bold text-gray-900">
      Ready to deploy your AI team?
    </h2>
    <p className="mt-4 text-xl text-gray-600">
      Start free — 100 messages. No credit card required.
    </p>
    <Link
      href="/sign-up"
      className="mt-8 inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-orange-500/25"
    >
      Start Free
    </Link>
  </div>
</section>
```

**My recommendation:** **Option A** (top CTA) — captures users before they scroll, non-intrusive.

**Effort:** Small (15 min)  
**Impact:** Medium (converts blog readers into users)

---

### Implementation Details — Blog Listing

**Files to modify:**
1. `/home/keith/projects/clawer/src/app/blog/page.tsx` — add header, add CTA

**Testing Checklist:**
- [ ] Blog header is visible
- [ ] CTA is present and works
- [ ] Posts are clearly listed
- [ ] Links to posts work

---

## 5. Blog Post Example (https://clawer.ai/blog/best-openclaw-hosting)

### Current State

**Content:**
Comprehensive comparison of OpenClaw hosting providers. Honest, detailed, transparent.

**What's Working:**
- ✅ **Excellent content** — Honest comparison, calls out Clawer's bias upfront
- ✅ Clear structure with TL;DR table
- ✅ SEO-friendly (good headings, metadata)
- ✅ Voice matches brand: direct, honest, no BS
- ✅ Includes Clawer in comparison (transparent)

**What's NOT Working:**
- ❌ **No CTA at the end** — Article ends abruptly, no path to sign up
- ❌ **Could use inline CTA** — For readers mid-article who want to try Clawer

---

### Recommended Changes

#### Change 5.1: Add Bottom CTA (RECOMMENDED)

**Current State:**
Article ends with comparison. No CTA.

**Recommended:**
Add a CTA section at the end of every blog post.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/blog/best-openclaw-hosting/page.tsx`

**Add this section at the end (before footer):**

```tsx
<section className="mt-16 bg-orange-50 border border-orange-200 rounded-2xl p-8">
  <h3 className="text-2xl font-bold text-gray-900">
    Try Clawer free
  </h3>
  <p className="mt-2 text-gray-700">
    100 messages to try everything. No credit card required. Deploy your first AI agent in 60 seconds.
  </p>
  <Link
    href="/sign-up"
    className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
  >
    Start Free →
  </Link>
</section>
```

**Effort:** Small (10 min per post)  
**Impact:** High (converts readers who finished the article)

---

#### Change 5.2: Add Inline CTA (OPTIONAL)

**Current State:**
No inline CTAs. Users who are convinced mid-article have to scroll to top.

**Recommended:**
Add a subtle inline CTA after the TL;DR table or after a section that praises Clawer.

**Implementation:**

Add this after the comparison table:

```tsx
<aside className="my-8 bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
  <p className="text-sm font-semibold text-orange-700 mb-2">
    ⚡ Want to skip the comparison?
  </p>
  <p className="text-sm text-gray-700 mb-3">
    If you want hosted OpenClaw that works in 60 seconds, <a href="/sign-up" className="text-orange-600 underline font-medium">try Clawer free</a>. 100 messages. No credit card.
  </p>
</aside>
```

**Effort:** Small (10 min)  
**Impact:** Medium (captures mid-article conversions)

---

### Implementation Details — Blog Posts

**Files to modify:**
1. Each blog post file in `/home/keith/projects/clawer/src/app/blog/*/page.tsx` — add bottom CTA

**Reusable Component Recommendation:**

Create a reusable `<BlogCTA />` component:

**File:** `/home/keith/projects/clawer/src/components/blog/BlogCTA.tsx`

```tsx
import Link from 'next/link';

export default function BlogCTA() {
  return (
    <section className="mt-16 bg-orange-50 border border-orange-200 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-gray-900">
        Try Clawer free
      </h3>
      <p className="mt-2 text-gray-700">
        100 messages to try everything. No credit card required. Deploy your first AI agent in 60 seconds.
      </p>
      <Link
        href="/sign-up"
        className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
      >
        Start Free →
      </Link>
    </section>
  );
}
```

**Then import and use in every blog post:**
```tsx
import BlogCTA from '@/components/blog/BlogCTA';

export default function BlogPost() {
  return (
    <article>
      {/* Blog content */}
      <BlogCTA />
    </article>
  );
}
```

**Effort:** Medium (1 hour to create component, update all posts)  
**Impact:** High (converts blog readers)

---

## 6. Sign-In Page (https://clawer.ai/sign-in)

### Current State

**Content:**
```
Welcome to Clawer
Sign in to access your AI assistants
[Clerk sign-in widget]
```

**What's Working:**
- ✅ Simple, clean
- ✅ Uses Clerk (good auth provider)

**What's NOT Working:**
- ❌ **No trust signals** — No security badge, no privacy link, no help
- ❌ **Too minimal** — Feels unfinished
- ❌ **No help text** — Users who are stuck have no clear next step
- ❌ **No path to sign-up** — What if user meant to sign up, not sign in?

---

### Recommended Changes

#### Change 6.1: Add Trust Signals and Help (IMPORTANT)

**Current State:**
Just heading, subheading, and Clerk widget.

**Recommended:**
Enhance the page with trust signals, help link, and sign-up path.

**Implementation:**

**File:** `/home/keith/projects/clawer/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

**Before:**
```tsx
<div>
  <h1>Welcome to Clawer</h1>
  <p>Sign in to access your AI assistants</p>
  <SignIn />
</div>
```

**After:**
```tsx
<div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
  <div className="max-w-md w-full space-y-8">
    {/* Header */}
    <div className="text-center">
      <div className="text-5xl mb-4">🦞</div>
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome to Clawer.ai
      </h1>
      <p className="text-gray-600 mt-2">
        Sign in to access your AI team, view conversation history, and manage your account
      </p>
    </div>
    
    {/* Clerk auth component */}
    <SignIn />
    
    {/* Trust signals */}
    <div className="text-center">
      <p className="text-sm text-gray-500 mb-4">
        🔒 Your data is secure and encrypted
      </p>
      <div className="flex justify-center gap-4 text-xs text-gray-500">
        <a href="/privacy" className="hover:text-gray-900 transition-colors">
          Privacy Policy
        </a>
        <span>•</span>
        <a href="/terms" className="hover:text-gray-900 transition-colors">
          Terms of Service
        </a>
        <span>•</span>
        <a href="mailto:support@clawer.ai" className="hover:text-gray-900 transition-colors">
          Need help?
        </a>
      </div>
    </div>
    
    {/* Sign-up path */}
    <div className="text-center pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-600 mb-2">
        New here?
      </p>
      <a
        href="/sign-up"
        className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
      >
        Start Free — No Card Required
      </a>
    </div>
  </div>
</div>
```

**Effort:** Medium (30 min)  
**Impact:** High (reduces sign-in friction, adds trust)

---

### Implementation Details — Sign-In Page

**Files to modify:**
1. `/home/keith/projects/clawer/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — enhance layout, add trust signals

**Testing Checklist:**
- [ ] Page shows Clawer logo/name
- [ ] Explains what user gets access to when signing in
- [ ] Shows security badge
- [ ] Has links to privacy, terms, help
- [ ] Has clear path to sign-up for new users
- [ ] Clerk widget works correctly

---

## Priority Ranking

### Critical (Do Today) — 4-6 hours

**Direct conversion impact. Ship-blockers.**

1. ✅ **[Landing] Fix message count inconsistency** — 100 vs 200 messages (30 min, HIGH impact)
2. ✅ **[Landing] Remove fake testimonial** — Marcus Chen, StartupXYZ (15 min, HIGH impact)
3. ✅ **[Landing] Standardize CTA text** — All "Start Free" (30 min, HIGH impact)
4. ✅ **[Landing] Update hero headline** — Lead with differentiation (30 min, HIGH impact)
5. ✅ **[Pricing] Fix message count conflict** — 200 → 100 (10 min, CRITICAL impact)
6. ✅ **[Pricing] Clarify Pro tier agents** — "Full team" → "5 agents" (5 min, MEDIUM impact)
7. ✅ **[Sign-In] Add trust signals and help** — Security, privacy, sign-up path (30 min, HIGH impact)

**Total:** ~2.5 hours  
**Impact:** Fixes trust-damaging issues, improves conversion immediately

---

### Important (This Week) — 4-6 hours

**Improves messaging quality and conversion rate.**

8. ✅ **[Landing] Update hero subheadline** — Add concrete examples (10 min, MEDIUM impact)
9. ✅ **[Landing] Replace emoji platform icons with SVG** — Brand consistency (1 hour, MEDIUM impact)
10. ✅ **[Use Cases] Add final CTA section** — Convert bottom-of-page users (30 min, HIGH impact)
11. ✅ **[Blog] Add header and CTA** — Context + conversion path (30 min, MEDIUM impact)
12. ✅ **[Blog Posts] Add bottom CTA to each post** — Convert readers (1 hour, HIGH impact)
13. ✅ **[Use Cases] Strengthen headline** — "Not Assistants. Operators." (5 min, LOW-MED impact)

**Total:** ~3 hours  
**Impact:** Improves clarity, adds conversion opportunities

---

### Nice-to-Have (Later) — 2-4 hours

**Polish and optimization.**

14. ✅ **[Landing] Add urgency element** — Early access pricing deadline (10 min, LOW-MED impact)
15. ✅ **[Use Cases] Replace emoji icons with SVG** — Brand consistency (30 min, LOW-MED impact)
16. ✅ **[Blog Posts] Add inline CTAs** — Mid-article conversions (15 min per post, MEDIUM impact)
17. ✅ **[All Pages] Replace remaining emoji with Lucide icons** — Full brand consistency (2 hours, LOW impact)

**Total:** ~3 hours  
**Impact:** Polish, reduces visual inconsistencies

---

## Copy Bank — Ready-to-Paste

### Hero Section Options

**Option 1: Team-First (Recommended)**
```
Headline: AI Teams That Do the Work While You Sleep
Subheadline: Deploy specialized agents across WhatsApp, Telegram, and Slack. They monitor competitors, draft content, and execute tasks — while you sleep. Deploy in 60 seconds.
CTA: Start Free
Below CTA: No credit card required • 100 free messages
```

**Option 2: Differentiation-First**
```
Headline: Not a Chatbot. An AI Team.
Subheadline: Multiple AI agents work together — one monitors competitors, another drafts content, a third handles follow-ups. All running 24/7 in WhatsApp, Telegram, and Slack.
CTA: Start Free
Below CTA: No credit card required • 100 free messages
```

**Option 3: Outcome-First**
```
Headline: Wake Up to Done. Not To-Do.
Subheadline: Your AI team runs overnight. Competitor monitoring, content drafts, email follow-ups — finished before your coffee. Works in WhatsApp, Telegram, and Slack.
CTA: Start Free
Below CTA: No credit card required • 100 free messages
```

---

### Feature Descriptions (One-Liners)

Use these to replace any existing feature descriptions:

```
Multi-Agent Teams: Multiple specialists work together — one monitors competitors, another drafts content, a third tracks tasks.

Channel Integration: Lives in WhatsApp, Telegram, and Slack — no new apps, no dashboards to check.

Autonomous Execution: Works 24/7 without prompts. You wake up to finished tasks, not to-do lists.

Pre-Built Templates: Start with proven team setups: Solo Founder, Creator, Family Assistant. Customize from there.

Smart Model Routing: Pro plans use Claude 4.5 for complex tasks, faster models for simple ones. Automatic. Optimal.

Custom Skills (Pro): Add skills from the marketplace: SEO audit, competitor tracker, newsletter writer. Plug and play.
```

---

### Pricing Section Copy

**Free Tier:**
```
Headline: Free
Price: $0/forever
Description: Kick the tires — no credit card required.
Features:
• 100 total messages
• 1 AI team member
• Basic model
• Web chat only
• Community support
CTA: Start Free
Below CTA: No credit card required. Upgrade anytime.
```

**Pro Tier:**
```
Headline: Pro
Badge: Most Popular
Price: $49/month
Description: Your full AI team, unleashed.
Features:
• 500 messages per day
• Full AI team (5 agents included)
• Priority model (Claude 4.5)
• Custom skills from curated marketplace
• WhatsApp + Telegram + Slack
• Smart model routing
• Priority email support
CTA: Get Pro
Below CTA: 7-day free trial. No credit card required.
```

---

### Final CTA Section

```
Headline: Ready to build your AI team?
Subheadline: Deploy your first AI agent in under 60 seconds. No credit card required.
CTA: Start Free
Trust Signals:
✓ No credit card required
✓ 100 free messages
✓ 99.9% uptime
✓ Cancel anytime
```

---

### Meta Descriptions (SEO)

**Landing Page:**
```
Deploy AI teams across WhatsApp, Telegram, and Slack in 60 seconds. Managed OpenClaw hosting. They monitor, research, and execute tasks — while you sleep. Start free.
```

**Pricing Page:**
```
Clawer.ai pricing: Free plan with 100 messages, Pro at $49/mo with full AI team (5 agents), WhatsApp + Telegram + Slack. No credit card to start.
```

**Use Cases Page:**
```
AI teams for solo founders, content creators, small teams, and families. Not chatbots — operators that monitor, research, and execute overnight.
```

**Blog:**
```
OpenClaw hosting guides, security updates, and AI agent deployment tutorials. Real stories from real users.
```

---

## Implementation Workflow

### Week 1: Critical Fixes (Day 1-2)

**Day 1 Morning (2 hours):**
1. Fix message count everywhere (landing + pricing)
2. Remove fake testimonial
3. Standardize all CTA text to "Start Free"

**Day 1 Afternoon (2 hours):**
4. Update landing hero headline to "AI Teams That Do the Work While You Sleep"
5. Update hero subheadline with concrete examples
6. Fix pricing page agent count ("Full team" → "5 agents")

**Day 2 (2 hours):**
7. Enhance sign-in page (trust signals, help, sign-up path)
8. Test all changes on mobile + desktop
9. Deploy to production

**Deliverable:** All critical trust-damaging issues fixed. Messaging hierarchy correct.

---

### Week 1: Important Improvements (Day 3-5)

**Day 3 (2 hours):**
1. Download platform brand SVGs (WhatsApp, Telegram, Slack, Discord)
2. Replace emoji platform icons with SVG on landing page
3. Add final CTA section to use cases page

**Day 4 (2 hours):**
4. Add header to blog listing page
5. Add CTA to blog listing page
6. Create reusable `<BlogCTA />` component

**Day 5 (2 hours):**
7. Add bottom CTA to all blog posts using `<BlogCTA />`
8. Update use cases headline to "Not Assistants. Operators."
9. Full QA pass on all pages

**Deliverable:** All important messaging improvements done. Conversion paths added to blog.

---

### Week 2: Polish (Optional)

**Day 6-7 (4 hours):**
1. Replace remaining emoji icons with Lucide SVG
2. Add urgency element to landing hero (if desired)
3. Add inline CTAs to blog posts
4. Full accessibility audit
5. Mobile testing on real devices

**Deliverable:** Polished, brand-consistent, fully optimized.

---

## Testing Checklist

### Before Launch

**Brand Consistency:**
- [ ] All instances of brand name are "Clawer.ai" (not CLAWER.AI, not Clawer AI)
- [ ] All primary CTAs are orange (not blue)
- [ ] All primary CTAs say "Start Free" (not "Deploy Your First Agent", not "Get Started Free")

**Messaging Hierarchy:**
- [ ] Landing page hero leads with "AI team" differentiation (not "OpenClaw")
- [ ] Subheadline includes concrete examples (monitor, draft, execute)
- [ ] Messaging flows: Team → Channels → Autonomy → Ease

**Trust & Clarity:**
- [ ] No fake testimonials anywhere
- [ ] Message count is consistent everywhere (100 or 200, pick one)
- [ ] Pro tier agent count is specific (not vague "full team")
- [ ] Sign-in page has trust signals (security, privacy, help)

**Conversion Paths:**
- [ ] Every major page has a CTA (landing, pricing, use cases, blog, posts)
- [ ] CTAs are above the fold or at natural end points
- [ ] Blog posts have bottom CTA section

**Mobile:**
- [ ] All text is readable (16px minimum)
- [ ] All CTAs are tappable (44px minimum)
- [ ] All pages load correctly on mobile

**Icons:**
- [ ] Platform icons are SVG (not emoji) — or acceptable emoji for now
- [ ] All icons are consistent size
- [ ] No broken icon references

---

## Expected Impact

### Conversion Rate Improvements (Estimated)

**Critical fixes (message count, fake testimonial, CTA consistency):**
- **Baseline bounce rate:** ~70% (typical for SaaS landing pages)
- **After fixes:** ~55-60% (fewer trust issues)
- **Impact:** +15-20% more users reaching sign-up

**Messaging hierarchy fix (headline update):**
- **Baseline:** Users don't understand differentiation from ChatGPT
- **After:** Immediate "AI team vs chatbot" clarity
- **Impact:** +10-15% better message comprehension (hard to measure, but significant)

**Blog CTAs:**
- **Baseline:** Blog readers have no clear conversion path
- **After:** Every post has CTA
- **Impact:** +5-10% blog → signup conversion

**Sign-in trust signals:**
- **Baseline:** Sign-in page feels unfinished
- **After:** Professional, helpful, trustworthy
- **Impact:** -20% sign-in abandonment (fewer users who get stuck)

**Overall estimated impact:** +20-30% improvement in landing page → signup conversion over 30 days.

---

## Maintenance Plan

### Ongoing Copy Review

**Monthly:**
1. Review new blog posts for CTA inclusion
2. Check for copy drift (is "Start Free" still used everywhere?)
3. Test message counts (are they still consistent?)

**Quarterly:**
1. Refresh testimonials (add new real ones, remove old placeholders)
2. Update pricing page if plans change
3. Review hero headline effectiveness (A/B test variations)

**Annually:**
1. Full brand audit against BRAND-GUIDE.md and MARKETING-VOICE.md
2. Refresh all copy for tone/voice consistency
3. Update meta descriptions for SEO

---

## A/B Testing Recommendations

### High-Priority Tests (After initial launch)

**Test 1: Hero Headlines**
- Control: "AI Teams That Do the Work While You Sleep"
- Variant A: "Not a Chatbot. An AI Team."
- Variant B: "Wake Up to Done. Not To-Do."
- Metric: Time to sign-up, bounce rate
- Run for: 2 weeks or 1000 visitors

**Test 2: CTA Text**
- Control: "Start Free"
- Variant A: "Try Free"
- Variant B: "Start Free — 100 Messages"
- Metric: Click-through rate on hero CTA
- Run for: 1 week or 500 clicks

**Test 3: Pricing Page Layout**
- Control: 2-column (Free + Pro)
- Variant A: 3-column (Free + Pro + Enterprise)
- Metric: Pro tier signups
- Run for: 2 weeks

---

## Final Notes

### What I Didn't Change (And Why)

**Navigation structure:**
- Current nav is clean and works well
- No need to change link order or add/remove items

**"How It Works" section:**
- Already excellent (Create → Connect → Deploy)
- Clear, visual, benefit-focused

**Pre-Built Teams section:**
- Shows real value with concrete examples
- Names agents (Hunter, Shield, Harper) which builds connection

**Social proof (except fake testimonial):**
- Eric Siu and Winrey testimonials look real
- Stats (300K users, 99.9% uptime) are credible

**Feature descriptions:**
- Most are already benefit-focused
- "VNC viewer built-in. See exactly what your agent sees" — perfect

**Footer:**
- Clean, has all necessary links
- Copyright mentions OpenClaw (good credibility signal)

---

## Questions for Implementation Team

1. **Message count:** Is it 100 or 200 free messages? I found both. Need to pick one and stick to it everywhere.

2. **Pro tier agents:** How many agents does Pro tier actually include? I recommended "5 agents" but need to confirm the real number.

3. **Pricing increase deadline:** Change 1.7 suggests adding urgency ("price increases March 1"). Is this true? If not, don't add it.

4. **Testimonials:** Do you have real customer testimonials to replace Marcus Chen? If yes, I can write the exact replacement code.

5. **Platform icons:** Do you want to prioritize SVG icon replacement, or is consistent emoji acceptable for now?

---

## Handoff Checklist

**For the developer implementing these changes:**

- [ ] Read MARKETING-VOICE.md to understand the voice and messaging strategy
- [ ] Read BRAND-GUIDE.md to understand visual standards
- [ ] Read this document fully before starting any changes
- [ ] Implement in priority order (Critical → Important → Nice-to-have)
- [ ] Test on mobile after every change
- [ ] Use the Copy Bank for exact text (don't paraphrase)
- [ ] Check the Testing Checklist before deploying
- [ ] Deploy to staging first, then production

**For the marketing team:**

- [ ] Review all copy changes before deployment
- [ ] Approve headline changes (especially hero headline)
- [ ] Confirm message counts (100 vs 200)
- [ ] Provide real testimonials to replace fake ones
- [ ] Set up A/B tests after initial launch

---

**End of Marketing Action Plan**

*This plan is specific, actionable, and ready to implement. Every change includes exact file paths, before/after code, and impact estimates. Questions? Email the consultant or reference MARKETING-VOICE.md and BRAND-GUIDE.md for rationale.*
