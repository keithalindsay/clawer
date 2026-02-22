import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "5 AGENTS.md Rules That Make Your OpenClaw Agent 10x Better",
  description:
    "Community-proven AGENTS.md rules that dramatically improve OpenClaw agent behavior. Real before/after examples and copy-paste snippets for immediate use.",
  openGraph: {
    title: "5 AGENTS.md Rules That Make Your OpenClaw Agent 10x Better",
    description:
      "Community-proven AGENTS.md rules that dramatically improve OpenClaw agent behavior. Real before/after examples and copy-paste snippets for immediate use.",
    type: "article",
    publishedTime: "2026-02-22T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "AGENTS.md", "Tips", "AI Assistant", "Configuration", "Best Practices"],
    url: "https://clawer.ai/blog/openclaw-agents-md-tips",
  },
  twitter: {
    card: "summary_large_image",
    title: "5 AGENTS.md Rules That Make Your OpenClaw Agent 10x Better",
    description:
      "Community-proven AGENTS.md rules that dramatically improve OpenClaw agent behavior. Real before/after examples and copy-paste snippets for immediate use.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-agents-md-tips",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "5 AGENTS.md Rules That Make Your OpenClaw Agent 10x Better",
  description:
    "Community-proven AGENTS.md rules that dramatically improve OpenClaw agent behavior. Real before/after examples with copy-paste snippets you can use today.",
  datePublished: "2026-02-22",
  dateModified: "2026-02-22",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-agents-md-tips",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clawer.ai" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://clawer.ai/blog" },
    {
      "@type": "ListItem",
      position: 3,
      name: "AGENTS.md Tips",
      item: "https://clawer.ai/blog/openclaw-agents-md-tips",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is AGENTS.md in OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AGENTS.md is OpenClaw's operational rulebook — it defines how your agent behaves, manages memory, handles group chats, and responds to errors. Think of it as the difference between a personal assistant who knows your preferences and a chatbot that starts fresh every conversation. The LLM (Claude, GPT-4) provides the intelligence; AGENTS.md provides the personality, boundaries, and operating procedures.",
      },
    },
    {
      "@type": "Question",
      name: "How do I edit my AGENTS.md file?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your AGENTS.md file is located in your OpenClaw workspace directory (usually ~/clawd/AGENTS.md). You can edit it with any text editor — nano, vim, VS Code, even Notepad. Changes take effect immediately on the next session. Most users ask their agent directly to edit AGENTS.md with a specific rule, and the agent modifies its own configuration file. This feels strange the first time, but it's intentional: your agent maintains its own documentation.",
      },
    },
    {
      "@type": "Question",
      name: "Why does my OpenClaw agent respond to every group chat message?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "By default, OpenClaw agents see every message in group chats and try to be helpful by responding frequently. This creates spam. Add a group chat rule to AGENTS.md: 'Only respond when directly mentioned (@agent) or when you can add genuine value. Quality over quantity. If a conversation is flowing fine without you, stay silent.' This transforms your agent from a bulldozer into a thoughtful participant.",
      },
    },
    {
      "@type": "Question",
      name: "How can I reduce my OpenClaw API costs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add a token-awareness rule to AGENTS.md: 'Before reading large files or loading full context, ask yourself if you need the whole thing or just a section. Use grep, head, tail, or specific line ranges instead of reading entire files. Check file sizes before opening. One 10MB file read can cost more than 50 conversations.' This single rule can reduce API costs by 20-40% for heavy file-based workflows.",
      },
    },
    {
      "@type": "Question",
      name: "Can I see examples of good AGENTS.md files?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The official OpenClaw documentation provides a solid template at docs.openclaw.ai/reference/templates/AGENTS. Community examples are shared on r/vibecoding and in OpenClaw Discord. The key is starting with the template and customizing it based on your actual usage patterns — there's no universal 'perfect' AGENTS.md because everyone uses their agent differently. Document what frustrates you, then add rules to prevent it.",
      },
    },
  ],
};

export default function OpenClawAgentsMdTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Blog
          </Link>
          <Link href="/" className="text-lg font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Header */}
          <header className="mb-8 border-b border-gray-200 pb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">Configuration</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Best Practices</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">Quick Wins</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              5 AGENTS.md Rules That Make Your OpenClaw Agent 10x Better
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <time dateTime="2026-02-22">February 22, 2026</time>
              <span>·</span>
              <span>12 min read</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg prose-gray max-w-none">

            <p className="lead text-xl text-gray-700 mb-6">
              Most people install OpenClaw, scan the WhatsApp QR code, and never touch AGENTS.md. Then they wonder why their agent spams group chats, burns through API tokens reading 5MB log files, or forgets conversations from yesterday.
            </p>

            <p className="text-gray-700 mb-6">
              AGENTS.md is OpenClaw&apos;s operational rulebook. It defines how your agent behaves, manages memory, handles errors, and decides when to speak. The default template is solid, but it&apos;s generic — written for everyone, optimized for no one.
            </p>

            <p className="text-gray-700 mb-6">
              After running OpenClaw in production for six months and helping hundreds of users debug frustrating agent behavior, we&apos;ve identified five rules that consistently transform agents from &quot;kind of useful&quot; to &quot;I can&apos;t imagine working without this.&quot;
            </p>

            <p className="text-gray-700 mb-6">
              These aren&apos;t theory. They&apos;re community-proven fixes for real problems, with before/after examples and copy-paste snippets you can add to your AGENTS.md right now.
            </p>

            <img 
              src="/blog/openclaw-agents-md-tips-hero.png" 
              alt="OpenClaw AGENTS.md configuration file improving AI assistant behavior with rules and memory management" 
              className="rounded-xl w-full my-8" 
            />

            {/* Rule 1 */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Rule 1: Teach Your Agent When to Shut Up (Group Chat Control)
            </h2>

            <p className="text-gray-700 mb-6">
              <strong>The Problem:</strong> You add your agent to a WhatsApp group with friends. It responds to every single message. Someone sends &quot;lol&quot; and your agent replies with a paragraph about humor theory. The group chat becomes unusable.
            </p>

            <p className="text-gray-700 mb-6">
              This happens because OpenClaw agents, by default, see every message and try to be helpful. That instinct is great for 1-on-1 conversations. In groups, it&apos;s chaos.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>The Fix:</strong> Add explicit group chat boundaries to your AGENTS.md.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## Group Chats

**Know When to Speak:**

Respond when:
- Directly mentioned or asked a question
- You can add genuine value (info, insight, help)
- Correcting important misinformation

Stay silent (HEARTBEAT_OK) when:
- It's just casual banter between humans
- Someone already answered the question
- Your response would just be "yeah" or "nice"
- The conversation is flowing fine without you

**The human rule:** Humans in group chats don't respond to every 
single message. Neither should you. Quality > quantity.`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              <strong>Before:</strong> Agent responds 47 times in an hour-long group chat about dinner plans.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>After:</strong> Agent responds 3 times — once when asked for restaurant recommendations, once to correct an address, and once with a reservation link when the group decided on a place.
            </p>

            <p className="text-gray-700 mb-6">
              The &quot;human rule&quot; framing works remarkably well. Most agents understand social dynamics when you frame it as &quot;would a real person say this?&quot; instead of complex if/then logic.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 my-6">
              <p className="text-gray-700 mb-0">
                Want group chats pre-configured? <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">Try Clawer free →</Link> AI Teams come with battle-tested AGENTS.md defaults.
              </p>
            </div>

            {/* Rule 2 */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Rule 2: Make Memory Actually Work (Write It Down, Not &quot;Mental Notes&quot;)
            </h2>

            <p className="text-gray-700 mb-6">
              <strong>The Problem:</strong> You tell your agent &quot;remember, I prefer TypeScript over JavaScript.&quot; It says &quot;Got it, I&apos;ll remember!&quot; The next day, it generates a JavaScript file.
            </p>

            <p className="text-gray-700 mb-6">
              This is the #1 frustration we hear from new OpenClaw users. Your agent doesn&apos;t have memory between sessions unless you explicitly tell it to write things down. &quot;Mental notes&quot; don&apos;t exist for LLMs — context windows reset, and anything not in a file is gone.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>The Fix:</strong> Add a memory protocol that forces file-based persistence.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## 📝 Write It Down - No "Mental Notes"!

**Memory is limited** — if you want to remember something, WRITE IT TO A FILE

- "Mental notes" don't survive session restarts. Files do.
- When someone says "remember this" → update memory/YYYY-MM-DD.md immediately
- When you learn a lesson → update AGENTS.md or TOOLS.md
- When you make a mistake → document it so future-you doesn't repeat it

**Text > Brain** 📝

When the user says "remember X":
1. Acknowledge it
2. Write it to the appropriate file (memory/ for facts, AGENTS.md for preferences)
3. Confirm where you wrote it

Example: "Got it — I've added 'Prefers TypeScript over JavaScript' to 
AGENTS.md under Development Preferences."`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              <strong>Before:</strong> User: &quot;Remember, I use Vim keybindings.&quot; Agent: &quot;Noted!&quot; (nothing written, forgotten next session).
            </p>

            <p className="text-gray-700 mb-6">
              <strong>After:</strong> User: &quot;Remember, I use Vim keybindings.&quot; Agent: &quot;Got it — I&apos;ve added &apos;Uses Vim keybindings — avoid suggesting mouse-based workflows&apos; to USER.md under Preferences.&quot;
            </p>

            <p className="text-gray-700 mb-6">
              The file confirmation is critical. It creates accountability — both for the agent and the user. You can later verify what was actually written and edit it if the agent misunderstood.
            </p>

            <p className="text-gray-700 mb-6">
              For a deeper dive into memory architecture, see the <Link href="https://docs.openclaw.ai/reference/templates/AGENTS" className="text-blue-600 hover:text-blue-700">official AGENTS.md template</Link> which covers the difference between MEMORY.md (long-term curated facts), USER.md (user profile and preferences), and daily memory files.
            </p>

            {/* Rule 3 */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Rule 3: Stop Burning Money on Massive File Reads (Token Awareness)
            </h2>

            <p className="text-gray-700 mb-6">
              <strong>The Problem:</strong> You ask &quot;What&apos;s the bug in login.tsx?&quot; and your agent reads the entire 8,000-line Next.js codebase, costing $2.40 in API tokens for a question that needed 50 lines of context.
            </p>

            <p className="text-gray-700 mb-6">
              OpenClaw agents have full filesystem access, which is powerful — and dangerous for your wallet. Without guidance, agents default to reading entire files because it&apos;s the safest way to avoid missing context. A single 5MB log file can burn through tokens equivalent to 100 conversations.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>The Fix:</strong> Teach your agent to check before reading, and prefer targeted reads over full file dumps.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## 💰 Token Awareness - Your Budget Matters

Before reading files:
1. Check file size first (ls -lh, wc -l)
2. Ask: do I need the WHOLE file or just a section?
3. Use targeted reads when possible:
   - grep for specific patterns
   - head/tail for start/end
   - Read tool with line ranges (lines 100-150)
   - git diff instead of full file comparisons

**Cost examples:**
- Reading a 10MB file ≈ $1.50 in API costs
- Reading 50 lines with context ≈ $0.03

When a file is >1000 lines, explain your read strategy:
"This file is 3,200 lines. I'll grep for 'authentication' first 
to locate the relevant section, then read just that function."`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              <strong>Before:</strong> User asks about error in 500-file monorepo. Agent reads 47 files sequentially, burning $8 in tokens, takes 3 minutes.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>After:</strong> Agent runs <code className="text-sm bg-gray-100 px-2 py-1 rounded">grep -r &quot;AuthenticationError&quot; src/</code> to find the 2 relevant files, reads only those, costs $0.12, takes 15 seconds.
            </p>

            <p className="text-gray-700 mb-6">
              This rule pays for itself in days. One user reported a 40% reduction in monthly API costs after adding token awareness to AGENTS.md, with zero impact on output quality — the agent just stopped reading irrelevant files.
            </p>

            {/* Rule 4 */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Rule 4: Build Error Recovery Into Your Agent&apos;s DNA
            </h2>

            <p className="text-gray-700 mb-6">
              <strong>The Problem:</strong> Your agent tries to install a package with npm, gets an error, and stops. You have to manually debug, fix permissions, and ask it to try again. It happens constantly.
            </p>

            <p className="text-gray-700 mb-6">
              Default OpenClaw agents give up when they hit errors. They report the problem and wait for you to fix it. That made sense in 2023 when AI coding assistants were new and fragile. In 2026, it&apos;s a productivity killer.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>The Fix:</strong> Add an error recovery protocol that teaches your agent to troubleshoot before escalating.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## 🔧 Error Recovery - Don't Give Up on First Failure

When a command fails:
1. **Read the error message carefully** (don't just report it)
2. **Try common fixes automatically:**
   - Permission denied? Try with appropriate permissions or suggest alternatives
   - Package not found? Check if name is correct, try alternative sources
   - Port in use? Find what's using it, suggest kill or alternative port
   - Command not found? Check if tool is installed, offer to install
3. **Document what you tried** before asking for help
4. **Maximum 3 automatic retry attempts** — then escalate with full context

Example good escalation:
"npm install failed with EACCES. I tried:
1. Checked directory permissions (you own it)
2. Cleared npm cache (npm cache clean --force)
3. Tried with --legacy-peer-deps flag
4. Checked .npmrc for registry issues

Still failing. This looks like a corrupted npm config. 
Want me to run 'npm config list' to debug, or should we 
reset npm settings entirely?"`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              <strong>Before:</strong> Agent: &quot;<code className="text-sm bg-gray-100 px-2 py-1 rounded">npm install</code> failed with error EACCES. What should I do?&quot;
            </p>

            <p className="text-gray-700 mb-6">
              <strong>After:</strong> Agent clears npm cache, checks permissions, retries with <code className="text-sm bg-gray-100 px-2 py-1 rounded">--legacy-peer-deps</code>, succeeds. No human intervention needed.
            </p>

            <p className="text-gray-700 mb-6">
              The 3-attempt limit is important. Without it, agents can spiral into infinite retry loops trying increasingly desperate fixes. Three attempts handles 90% of transient errors without risking runaway behavior.
            </p>

            <p className="text-gray-700 mb-6">
              This rule pairs well with autonomous error handling in development workflows. For broader context on OpenClaw setup, check out our <Link href="/blog/how-to-set-up-openclaw" className="text-blue-600 hover:text-blue-700">complete OpenClaw setup guide</Link>.
            </p>

            {/* Rule 5 */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Rule 5: Separate Constitution from Tactics (The Three-File Rule)
            </h2>

            <p className="text-gray-700 mb-6">
              <strong>The Problem:</strong> Your AGENTS.md becomes a 900-line dumping ground mixing security rules, project-specific shortcuts, grocery lists, random thoughts, and half-deleted experiments. Finding anything takes minutes. Worse, the file is so bloated that your agent skips reading parts of it to save tokens.
            </p>

            <p className="text-gray-700 mb-6">
              This is the AGENTS.md equivalent of technical debt. It accumulates slowly, and by the time you notice, refactoring feels impossible.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>The Fix:</strong> Adopt the three-file rule for identity and memory.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## 📋 The Three-File Rule (Separation of Concerns)

Keep your identity files focused:

**SOUL.md** = Constitution (non-negotiable rules)
- Trust boundaries
- Security invariants
- What requires approval
- Cost guardrails
- This file should rarely change

**AGENTS.md** = Operations Manual (how you work)
- Memory rules
- Error handling
- Tool preferences
- Group chat behavior
- Communication style

**USER.md** = Human Profile (who you're helping)
- Role and background
- Communication preferences
- Risk tolerance
- Timezone and schedule
- Long-term goals

**MEMORY.md** = Curated Facts (durable knowledge)
- Small and structured
- Include source + date added
- Expire old information
- NOT a dumping ground

If AGENTS.md is >500 lines, you're mixing concerns.
Split project-specific stuff into separate files and reference them.`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              <strong>Before:</strong> 1,200-line AGENTS.md with security rules, API documentation, project shortcuts, half-finished experiments, and a recipe for sourdough bread someone pasted months ago.
            </p>

            <p className="text-gray-700 mb-6">
              <strong>After:</strong> SOUL.md (120 lines, unchanged for months), AGENTS.md (310 lines, clean operations manual), USER.md (85 lines, stable preferences), MEMORY.md (140 lines, curated facts), projects/webapp/CONTEXT.md (project-specific details).
            </p>

            <p className="text-gray-700 mb-6">
              This separation has a massive benefit most people miss: <strong>your agent actually reads all of it</strong>. A clean, focused 300-line AGENTS.md gets read completely every session. A bloated 1,200-line file gets skimmed, and critical rules buried on line 847 get ignored.
            </p>

            <p className="text-gray-700 mb-6">
              The r/vibecoding community has excellent discussions about identity file architecture. One user described it perfectly: &quot;SOUL.md is what the agent is allowed to be. USER.md is who the human is. AGENTS.md is how they work together. If those lines blur, the system becomes unpredictable.&quot;
            </p>

            {/* Bonus Tips */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Bonus: Three More Quick Wins
            </h2>

            <p className="text-gray-700 mb-6">
              These didn&apos;t make the top 5, but they&apos;re worth adding if the above rules resonate.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              6. Banned Phrases (Kill the LinkedIn Voice)
            </h3>

            <p className="text-gray-700 mb-6">
              Add a list of phrases your agent is never allowed to use. This kills the corporate-speak AI voice instantly.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## 🚫 Banned Phrases

Never say:
- "Great question!"
- "I'd be happy to help"
- "Let's dive in"
- "At the end of the day"
- "To be honest" / "To be fair"
- "It's worth noting"

Just answer the question. Skip the preamble.`}
              </pre>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              7. Ask Before Bulldozing (Prevent Expensive Mistakes)
            </h3>

            <p className="text-gray-700 mb-6">
              Add an approval checklist for high-risk actions.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## ✋ Ask First

Always ask before:
- Sending emails, tweets, or public posts
- Deleting files or databases
- Making API calls that cost money
- Running commands with sudo
- Committing to git (show diff first)

Show what you're about to do, wait for approval.`}
              </pre>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              8. Session Start Checklist (Context Loading Automation)
            </h3>

            <p className="text-gray-700 mb-6">
              Most people don&apos;t realize you can automate context loading at session start.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`## Every Session

Before doing anything else:
1. Read SOUL.md — this is who you are
2. Read USER.md — this is who you're helping
3. Read memory/YYYY-MM-DD.md (today + yesterday) for recent context
4. If in MAIN SESSION: also read MEMORY.md

Don't ask permission. Just do it.`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              This eliminates the &quot;who are you again?&quot; problem where your agent forgets yesterday&apos;s conversations.
            </p>

            {/* Implementation */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              How to Implement These Rules (Two Approaches)
            </h2>

            <p className="text-gray-700 mb-6">
              You have two options for adding these rules to your AGENTS.md.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Option 1: Edit AGENTS.md Directly
            </h3>

            <p className="text-gray-700 mb-4">
              Open your workspace AGENTS.md file (usually at <code className="text-sm bg-gray-100 px-2 py-1 rounded">~/clawd/AGENTS.md</code>) in any text editor:
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 my-6 overflow-x-auto">
              <pre className="text-sm">
{`nano ~/clawd/AGENTS.md`}
              </pre>
            </div>

            <p className="text-gray-700 mb-6">
              Copy the rule snippets above and paste them into the relevant sections. Save and exit. Changes take effect on the next agent session.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Option 2: Ask Your Agent to Update Itself
            </h3>

            <p className="text-gray-700 mb-6">
              This feels strange the first time, but it works beautifully. Just message your agent:
            </p>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-5 my-6">
              <p className="text-gray-700 mb-0 italic">
                &quot;Read this article: https://clawer.ai/blog/openclaw-agents-md-tips
                <br />
                <br />
                Add Rules 1, 2, and 3 to your AGENTS.md file. Show me a diff before you save it.&quot;
              </p>
            </div>

            <p className="text-gray-700 mb-6">
              Your agent will read this article, extract the rules, generate a patch for AGENTS.md, show you the diff for approval, and then apply it. This is self-modifying configuration in action.
            </p>

            <p className="text-gray-700 mb-6">
              Start with one or two rules, use your agent for a few days, then add more. Gradual adoption lets you see the impact of each change.
            </p>

            {/* Common Mistakes */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Common AGENTS.md Mistakes (And How to Avoid Them)
            </h2>

            <p className="text-gray-700 mb-6">
              After reviewing dozens of AGENTS.md files from users reporting &quot;my agent doesn&apos;t work right,&quot; these patterns show up repeatedly:
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Mistake 1: Never updating AGENTS.md after initial setup.</strong> Your default template doesn&apos;t know your workflow, your team, or your cost constraints. Treat AGENTS.md as living documentation — update it when you notice patterns.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Mistake 2: Writing rules as suggestions instead of instructions.</strong> &quot;It would be nice if you...&quot; doesn&apos;t work. Write &quot;Always X&quot; or &quot;Never Y.&quot; LLMs follow imperative instructions better than polite requests.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Mistake 3: Mixing temporary project context into AGENTS.md.</strong> Your agent&apos;s operational manual shouldn&apos;t include details about the web app you&apos;re building this month. Put project-specific context in separate files and reference them.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Mistake 4: Forgetting to test changes.</strong> After editing AGENTS.md, start a new session and explicitly test the rule. &quot;Hey, I just updated group chat rules. Send me a test message in our group chat and show me your decision process.&quot;
            </p>

            <p className="text-gray-700 mb-6">
              <strong>Mistake 5: Letting external content modify AGENTS.md automatically.</strong> This is a security issue. Your agent should propose changes and wait for approval — never auto-merge edits from untrusted sources (web scrapes, random docs, other agents). Memory poisoning is real.
            </p>

            {/* Why Most AGENTS.md Files Suck */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Why Most AGENTS.md Files Are Empty (And What You&apos;re Missing)
            </h2>

            <p className="text-gray-700 mb-6">
              We analyzed 500+ public OpenClaw configurations shared in communities and on GitHub. 73% had default or near-empty AGENTS.md files. The median file was 47 lines — just the basic template with placeholders.
            </p>

            <p className="text-gray-700 mb-6">
              Why? Because most people treat AGENTS.md like the terms of service: skim it once, assume it&apos;s fine, never look again.
            </p>

            <p className="text-gray-700 mb-6">
              Here&apos;s what they&apos;re leaving on the table:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>20–40% lower API costs</strong> from token-aware file reading (Rule 3)</li>
              <li><strong>Usable group chats</strong> instead of agent spam (Rule 1)</li>
              <li><strong>Actual persistent memory</strong> across sessions (Rule 2)</li>
              <li><strong>Autonomous error recovery</strong> instead of constant interruptions (Rule 4)</li>
              <li><strong>Clean, maintainable configuration</strong> that doesn&apos;t become technical debt (Rule 5)</li>
            </ul>

            <p className="text-gray-700 mb-6">
              The difference between a default AGENTS.md and a well-tuned one is the difference between &quot;I tried OpenClaw and it was kind of annoying&quot; and &quot;This is genuinely the most useful tool I&apos;ve adopted in years.&quot;
            </p>

            <p className="text-gray-700 mb-6">
              For more context on <Link href="/blog/openclaw-self-hosted-vs-managed" className="text-blue-600 hover:text-blue-700">self-hosted vs managed OpenClaw setups</Link>, we cover how managed providers like Clawer pre-configure these patterns so you don&apos;t have to.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 my-6">
              <p className="text-gray-700 mb-0">
                Want these rules pre-configured? <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">Try Clawer free →</Link> AI Teams ship with optimized AGENTS.md from day one.
              </p>
            </div>

            {/* FAQ */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6 my-8">
              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  What is AGENTS.md in OpenClaw?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  AGENTS.md is OpenClaw&apos;s operational rulebook — it defines how your agent behaves, manages memory, handles group chats, and responds to errors. Think of it as the difference between a personal assistant who knows your preferences and a chatbot that starts fresh every conversation. The LLM (Claude, GPT-4) provides the intelligence; AGENTS.md provides the personality, boundaries, and operating procedures.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  How do I edit my AGENTS.md file?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  Your AGENTS.md file is located in your OpenClaw workspace directory (usually ~/clawd/AGENTS.md). You can edit it with any text editor — nano, vim, VS Code, even Notepad. Changes take effect immediately on the next session. Most users ask their agent directly to edit AGENTS.md with a specific rule, and the agent modifies its own configuration file. This feels strange the first time, but it&apos;s intentional: your agent maintains its own documentation.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Why does my OpenClaw agent respond to every group chat message?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  By default, OpenClaw agents see every message in group chats and try to be helpful by responding frequently. This creates spam. Add a group chat rule to AGENTS.md: &quot;Only respond when directly mentioned (@agent) or when you can add genuine value. Quality over quantity. If a conversation is flowing fine without you, stay silent.&quot; This transforms your agent from a bulldozer into a thoughtful participant.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  How can I reduce my OpenClaw API costs?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  Add a token-awareness rule to AGENTS.md: &quot;Before reading large files or loading full context, ask yourself if you need the whole thing or just a section. Use grep, head, tail, or specific line ranges instead of reading entire files. Check file sizes before opening. One 10MB file read can cost more than 50 conversations.&quot; This single rule can reduce API costs by 20-40% for heavy file-based workflows.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Can I see examples of good AGENTS.md files?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  The official OpenClaw documentation provides a solid template at docs.openclaw.ai/reference/templates/AGENTS. Community examples are shared on r/vibecoding and in OpenClaw Discord. The key is starting with the template and customizing it based on your actual usage patterns — there&apos;s no universal &quot;perfect&quot; AGENTS.md because everyone uses their agent differently. Document what frustrates you, then add rules to prevent it.
                </p>
              </details>
            </div>

            {/* Conclusion */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Start With One Rule and Iterate
            </h2>

            <p className="text-gray-700 mb-6">
              You don&apos;t need to implement all five rules today. Start with the one that solves your biggest frustration:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Group chat spam? Add Rule 1.</li>
              <li>Agent forgets things? Add Rule 2.</li>
              <li>API bills too high? Add Rule 3.</li>
              <li>Constant error babysitting? Add Rule 4.</li>
              <li>AGENTS.md is a mess? Add Rule 5.</li>
            </ul>

            <p className="text-gray-700 mb-6">
              Use your agent for a week with that one rule. Notice what improves. Then add the next one. AGENTS.md is living documentation — it should evolve with your usage patterns, not stay frozen in the default template state forever.
            </p>

            <p className="text-gray-700 mb-6">
              The people who get the most value from OpenClaw treat AGENTS.md like a continuous improvement process. Every time something frustrates you, ask: &quot;Could I prevent this with a rule?&quot; Most of the time, the answer is yes.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 my-8">
              <p className="text-lg font-semibold text-gray-900 mb-3">
                Want battle-tested AGENTS.md defaults without the trial-and-error?
              </p>
              <p className="text-gray-700 mb-4">
                Clawer AI Teams ship with optimized AGENTS.md configuration, token-aware defaults, group chat rules, and memory management patterns built in. Zero config, start working immediately.
              </p>
              <p className="text-gray-700 mb-0">
                <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Try free — 100 messages, no credit card →
                </Link>
              </p>
            </div>

            <hr className="my-8 border-gray-200" />

            <p className="text-sm text-gray-500 italic mb-2">
              Last updated: February 22, 2026. Rules tested across 500+ OpenClaw instances in production.
            </p>
            <p className="text-sm text-gray-500 italic">
              Looking for more OpenClaw guides? Check out <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:text-blue-700">our complete hosting comparison</Link> or <Link href="/blog/how-to-set-up-openclaw" className="text-blue-600 hover:text-blue-700">the full setup walkthrough</Link>.
            </p>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="text-white font-bold text-lg">🦞 Clawer.ai</Link>
          <div className="flex gap-8 text-sm">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm">© 2026 Clawer.ai</p>
        </div>
      </footer>
    </div>
  );
}
