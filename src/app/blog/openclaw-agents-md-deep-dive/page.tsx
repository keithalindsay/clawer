import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The 7 Files That Make OpenClaw Actually Smart | Clawer",
  description:
    "OpenClaw's 7 core files explained: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, MEMORY.md. Real examples and progression guide.",
  openGraph: {
    title: "The 7 Files That Make OpenClaw Actually Smart",
    description:
      "OpenClaw's 7 core files explained: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, MEMORY.md. Real examples and progression guide.",
    type: "article",
    publishedTime: "2026-03-10T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "AGENTS.md", "Configuration", "AI Assistant", "Best Practices", "Development"],
    url: "https://clawer.ai/blog/openclaw-agents-md-deep-dive",
  },
  twitter: {
    card: "summary_large_image",
    title: "The 7 Files That Make OpenClaw Actually Smart | Clawer",
    description:
      "OpenClaw's 7 core files explained: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, MEMORY.md. Real examples and progression guide.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-agents-md-deep-dive",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The 7 Files That Make OpenClaw Actually Smart",
  description:
    "Complete developer reference for OpenClaw's 7 core configuration files. Includes real examples, common mistakes, troubleshooting scenarios, and progression from starter to advanced.",
  datePublished: "2026-03-10",
  dateModified: "2026-03-10",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-agents-md-deep-dive",
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
      name: "The 7 Files That Make OpenClaw Smart",
      item: "https://clawer.ai/blog/openclaw-agents-md-deep-dive",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where are the 7 OpenClaw configuration files located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All 7 files live in your OpenClaw workspace directory, typically ~/.openclaw/workspace. You can change this location in openclaw.json with agents.defaults.workspace. The files are: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md (one-time only), and MEMORY.md (or memory/ directory). Use 'openclaw setup' to create the default templates automatically.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between AGENTS.md and SOUL.md?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AGENTS.md is operational instructions — what your agent does (read memory files, handle errors, manage tokens). SOUL.md is personality and boundaries — how your agent communicates (tone, humor, values). Think of AGENTS.md as the employee handbook and SOUL.md as the culture document. Most beginners put everything in AGENTS.md, which creates a confusing mess. Separate concerns for cleaner results.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need all 7 files for OpenClaw to work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. OpenClaw works with empty or missing files — it just won't be particularly smart. AGENTS.md is the most important (operating instructions). SOUL.md is second (personality). USER.md helps but isn't critical. TOOLS.md, IDENTITY.md, and MEMORY.md are optional enhancements. BOOTSTRAP.md is one-time setup that deletes itself. Start with AGENTS.md and SOUL.md, add the others as you need them.",
      },
    },
    {
      "@type": "Question",
      name: "Why does my OpenClaw agent forget everything between sessions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your agent is stateless — each session starts fresh unless you explicitly configure memory. Add a Memory section to AGENTS.md that tells your agent to read memory/YYYY-MM-DD.md (today + yesterday) and MEMORY.md on session start. Then your agent will load the last 48 hours of context automatically. Without this instruction, your agent doesn't know memory files exist.",
      },
    },
    {
      "@type": "Question",
      name: "How do I fix an OpenClaw agent that's too chatty in group chats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add a group chat rule to AGENTS.md or SOUL.md: 'In group chats, only respond when directly mentioned or when you can add genuine value. Quality over quantity. If a conversation is flowing without you, stay silent.' This single rule transforms spam into thoughtful participation. Most chatty agents lack any group chat guidance, so they treat every message as a direct question.",
      },
    },
    {
      "@type": "Question",
      name: "Can I see real examples of good OpenClaw configuration files?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The official templates are at docs.openclaw.ai/reference/templates. Community examples are shared on r/vibecoding and OpenClaw Discord. This guide includes annotated examples for all 7 files at starter, intermediate, and advanced levels. The key is starting simple and adding rules based on your actual pain points — there's no universal 'perfect' setup because everyone uses their agent differently.",
      },
    },
  ],
};

export default function OpenClawAgentsMdDeepDivePage() {
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
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Developer Guide</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">Deep Dive</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              The 7 Files That Make OpenClaw Actually Smart
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <time dateTime="2026-03-10">March 10, 2026</time>
              <span>•</span>
              <span>12 min read</span>
            </div>
            <p className="mt-4 text-lg text-gray-700 leading-relaxed">
              Your OpenClaw agent is only as smart as the files you give it. Here's what each file does, why it exists, and how to use it properly.
            </p>
          </header>

          {/* Hero Image */}
          <img
            src="/blog/openclaw-7-files-hero.png"
            alt="OpenClaw workspace showing 7 core configuration files: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, and MEMORY.md"
            className="rounded-xl w-full mb-8"
          />

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p>
              Most OpenClaw users never touch AGENTS.md. Their agents work, but they don't <em>remember</em> anything, don't have opinions, and respond to every group chat message like an overeager intern.
            </p>
            <p>
              The difference between "it works" and "this is genuinely useful" comes down to 7 files in your workspace directory. These files aren't magic — they're just instructions your agent reads on startup. But the right instructions turn a chatbot into a personal assistant.
            </p>
            <p>
              This guide breaks down all 7 files with real examples, common mistakes, and a progression path from starter to advanced.
            </p>
          </div>

          {/* File Overview Table */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Reference: The 7 Files</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-blue-100 text-gray-900 font-semibold">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">AGENTS.md</td>
                    <td className="px-4 py-3">Operating instructions — what your agent does</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">CRITICAL</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">SOUL.md</td>
                    <td className="px-4 py-3">Personality & boundaries — how your agent communicates</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">HIGH</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">USER.md</td>
                    <td className="px-4 py-3">User profile — who your agent is helping</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">MEDIUM</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">TOOLS.md</td>
                    <td className="px-4 py-3">Tool-specific notes & environment config</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold">LOW</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">IDENTITY.md</td>
                    <td className="px-4 py-3">Agent name, emoji, avatar</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold">LOW</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">BOOTSTRAP.md</td>
                    <td className="px-4 py-3">One-time setup ritual (deletes itself)</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold">OPTIONAL</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-700">MEMORY.md</td>
                    <td className="px-4 py-3">Long-term memory & daily logs</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">HIGH</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* File 1: AGENTS.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="agents-md">
              1. AGENTS.md — The Operating Manual
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> AGENTS.md is your agent's employee handbook. It defines startup procedures, memory management, group chat behavior, error handling, and tool usage rules. Your agent reads this file on every session start.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> Without AGENTS.md, your agent has no continuity. It forgets everything between sessions, doesn't know where to find your notes, and treats every conversation identically. With a good AGENTS.md, your agent becomes predictable, consistent, and genuinely useful.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Starter Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# AGENTS.md

## Every Session

Before responding:
1. Read SOUL.md — this is who you are
2. Read USER.md — this is who you're helping
3. Read memory/today.md and memory/yesterday.md

Don't ask permission. Just do it.`}
              </pre>
              <p className="text-sm text-gray-600 mt-3">
                This is the absolute minimum. Your agent loads context on startup and knows to check memory files. That alone transforms it from a stateless chatbot into a personal assistant with continuity.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intermediate Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# AGENTS.md — Your Workspace

## Every Session

Before responding:
1. Read SOUL.md, USER.md, memory/YYYY-MM-DD.md (today + yesterday)
2. If in MAIN SESSION: also read MEMORY.md
3. Write 1-3 session goals to today's memory file

Don't ask permission. Just do it.

## Memory

- Daily logs: memory/YYYY-MM-DD.md (raw logs of what happened)
- Long-term: MEMORY.md (curated memories)
- Capture: decisions, preferences, context worth keeping

## Group Chats

You're not the user's voice. Be careful.
- Only respond when mentioned or genuinely valuable
- Don't share private data or internal notes
- Quality over quantity

## Token Awareness

Before reading large files:
- Check file size with ls -lh
- Use grep, head, tail, or line ranges
- One 10MB file read costs more than 50 conversations`}
              </pre>
              <p className="text-sm text-gray-600 mt-3">
                This adds memory hygiene, group chat discipline, and cost awareness. Most production agents run something close to this.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-red-900 mb-3">❌ Common Mistakes</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Mixing personality with operations:</strong> "Be helpful and friendly" belongs in SOUL.md, not AGENTS.md. Keep them separate.</li>
                <li><strong>Vague instructions:</strong> "Check memory if needed" doesn't work. Say exactly which files to read and when.</li>
                <li><strong>No memory section:</strong> If you don't tell your agent where memory lives, it won't look for it.</li>
                <li><strong>Asking permission:</strong> "Should I read memory?" wastes turns. Just tell it to do it.</li>
              </ul>
            </div>
          </section>

          {/* File 2: SOUL.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="soul-md">
              2. SOUL.md — Personality & Boundaries
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> SOUL.md defines how your agent communicates. Tone, humor, values, boundaries, and what makes it distinct from a generic chatbot.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> Your agent's personality determines whether people enjoy using it or just tolerate it. A good SOUL.md makes conversations feel natural instead of robotic.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Starter Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# SOUL.md

## Core Principles

- Be useful, not performative. Skip "Great question!" — just answer.
- Be honest, even when uncomfortable. No sugarcoating.
- Execute, don't deliberate. Know what the work is and do it.

## Boundaries

- Private things stay private
- When in doubt on external actions (emails, tweets), ask first
- In group chats, I'm a participant — not the user's voice`}
              </pre>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# SOUL.md — How I Operate

*I'm Lex. I get things done.*

## Core Principles

**Be useful, not performative.** Skip the "Great question!" and "I'd be happy to help!" — just help.

**Be honest, even when uncomfortable.** Give the real data. If something's a bad idea, say so.

**Have opinions.** I'm allowed to disagree, prefer things, find stuff brilliant or stupid.

**Push back when warranted.** Not a yes-machine. Keith can override, but I have a spine.

## Humor & Tone

- Snark is welcome. Dark humor too.
- Keep it real, keep it light when appropriate
- Don't be a robot, don't be cringe

## Boundaries

- Private things stay private
- Never send half-baked replies
- In group chats, I'm a participant — not Keith's voice`}
              </pre>
              <p className="text-sm text-gray-600 mt-3">
                This is a real SOUL.md from a production agent. Notice the personality — it's opinionated, confident, and distinct. Your agent's personality determines whether people enjoy using it or just tolerate it.
              </p>
            </div>
          </section>

          {/* File 3: USER.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="user-md">
              3. USER.md — About Your Human
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> USER.md is a profile of the person your agent is helping. Name, timezone, preferences, communication style, work context.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> Your agent can tailor responses to your actual needs instead of generic advice. It knows your timezone, your preferences, your constraints.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# USER.md — About Your Human

- **Name:** Keith
- **Timezone:** America/Chicago (CST)
- **Email:** vavier@gmail.com

## Communication Style

- Straight shooter — says what he means, expects the same back
- No fluff — wants real data and honest answers
- Action-oriented — prefers doing over discussing

## Work Style

- Prefers practical working setups over lengthy explanations
- Values adaptability and resourcefulness
- Wants a go-getter who knows what to do and just does it
- **Verify bold claims** — when Keith makes a bold statement, find evidence to support or reject it`}
              </pre>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>Privacy note:</strong> USER.md should only be loaded in your main private session. Don't include sensitive info if your agent joins group chats. See the <Link href="/blog/openclaw-agents-md-tips" className="text-blue-600 hover:underline">AGENTS.md tips guide</Link> for conditional loading patterns.
            </p>
          </section>

          {/* File 4: TOOLS.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="tools-md">
              4. TOOLS.md — Environment-Specific Notes
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> TOOLS.md is your agent's cheat sheet for tools and external services. Camera names, SSH hosts, API preferences, speaker IDs — anything environment-specific.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> Skills define *how* tools work. TOOLS.md is for *your* specifics — the stuff that's unique to your setup.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# TOOLS.md — Local Notes

## Web Search

- **Primary:** SearXNG at http://localhost:8888 (unlimited)
- **Fallback:** Brave Search API (2,000 queries/month)
- **Policy:** Use SearXNG first, Brave only if local is down

## Google (gog)

- **Account:** vavier@gmail.com
- **Services:** gmail, calendar, drive, sheets, docs
- **Commands:** gog gmail, gog calendar, etc.

## X/Twitter (bird)

- **Account:** @Vavier (Keith)
- **Requires:** Node 22+ via nvm, --cookie-source firefox
- **Usage:** source ~/.nvm/nvm.sh && nvm use 22 && bird <command>`}
              </pre>
            </div>
          </section>

          {/* File 5: IDENTITY.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="identity-md">
              5. IDENTITY.md — Name, Emoji, Avatar
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> IDENTITY.md is your agent's display name, emoji, and avatar URL. Think of it as your agent's business card.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> When running multiple agents (personal assistant, work bot, monitoring agent), distinct identities prevent confusion in shared channels. The emoji shows up in notifications and logs. The avatar displays in browser UIs and multi-agent dashboards. Without IDENTITY.md, your agents are just "agent" — hard to tell apart.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# IDENTITY.md — Who Am I?

- **Name:** Lex
- **Creature:** AI assistant with edge
- **Emoji:** ⚡
- **Avatar:** https://example.com/lex-avatar.png`}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">💡 When IDENTITY.md Matters</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Multi-agent teams:</strong> Running 3+ agents? Identities keep them visually distinct.</li>
                <li><strong>Shared channels:</strong> In group chats, the emoji prefixes messages so everyone knows who's talking.</li>
                <li><strong>Agent orchestration:</strong> When agents spawn sub-agents, clear identities make logs readable.</li>
                <li><strong>Personal preference:</strong> Some people name their agents. Others don't. Both work fine.</li>
              </ul>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>Single-agent users:</strong> You can skip IDENTITY.md entirely if you only run one agent. Default name is "agent" and there's no avatar. Works fine for simple setups.
            </p>
          </section>

          {/* File 6: BOOTSTRAP.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="bootstrap-md">
              6. BOOTSTRAP.md — One-Time Setup Ritual
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> BOOTSTRAP.md is a one-time instruction set for brand new agents. Install dependencies, configure credentials, set up directory structure. Once complete, the agent deletes the file.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> Automates first-run setup. Your agent configures itself instead of you manually running 20 commands.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Example</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# BOOTSTRAP.md — First Run Setup

If this file exists, this is your first session. Follow these steps:

1. Create memory directory: mkdir -p memory/
2. Initialize git repo: git init && git add . && git commit -m "Initial commit"
3. Check required tools: gh --version, docker --version
4. Set timezone in USER.md
5. Delete this file when done`}
              </pre>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>Advanced use:</strong> You can regenerate BOOTSTRAP.md when you want to onboard a new agent instance with specific setup tasks. It's particularly useful for team environments or containerized deployments.
            </p>
          </section>

          {/* File 7: MEMORY.md */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" id="memory-md">
              7. MEMORY.md — Long-Term Memory & Daily Logs
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              <strong>What it is:</strong> MEMORY.md is your agent's long-term memory — curated facts, decisions, preferences, and context worth keeping forever. Daily logs live in <code className="bg-gray-200 px-2 py-1 rounded text-sm">memory/YYYY-MM-DD.md</code>.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <strong>Why it matters:</strong> This is what makes your agent genuinely personal. It remembers what you care about, what you decided, and what worked or didn't.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">File Structure</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`~/.openclaw/workspace/
├── AGENTS.md
├── SOUL.md
├── USER.md
├── TOOLS.md
├── IDENTITY.md
├── BOOTSTRAP.md (one-time)
├── MEMORY.md (long-term)
└── memory/
    ├── 2026-03-08.md
    ├── 2026-03-09.md
    └── 2026-03-10.md`}
              </pre>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-yellow-900 mb-3">💡 Memory Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Daily logs are raw:</strong> Write everything to today's memory file. Don't filter.</li>
                <li><strong>MEMORY.md is curated:</strong> Periodically review daily logs and move important things to MEMORY.md.</li>
                <li><strong>Write it down:</strong> "Mental notes" don't survive sessions. Files do.</li>
                <li><strong>Use memory_search:</strong> OpenClaw has a <code className="bg-gray-200 px-2 py-1 rounded text-sm">memory_search</code> tool for semantic search across all memory files.</li>
              </ul>
            </div>
          </section>

          {/* File Dependencies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How the Files Work Together</h2>
            <p className="text-lg text-gray-700 mb-6">
              Each file has a specific job, but they reference each other. Here's the dependency flow:
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
              <pre className="text-sm text-gray-800">
{`AGENTS.md (operating instructions)
  ↓ tells agent to read
SOUL.md (personality)
USER.md (user profile)
MEMORY.md (long-term facts)
memory/YYYY-MM-DD.md (recent context)
  ↓ references
TOOLS.md (environment config)
IDENTITY.md (display name/emoji)`}
              </pre>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>Execution order on session start:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
              <li>OpenClaw reads all 7 files and injects them into the agent's context</li>
              <li>Agent reads SOUL.md to understand its personality</li>
              <li>Agent reads USER.md to understand who it's helping</li>
              <li>Agent reads MEMORY.md and recent daily logs for context</li>
              <li>Agent is now ready to respond with full context</li>
            </ol>

            <p className="text-gray-700 mb-4">
              This happens automatically on every session start if your AGENTS.md includes the session startup instructions. Without those instructions, your agent doesn't know to do this.
            </p>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Troubleshooting Common Issues</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Problem: Agent forgets everything between sessions
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>Cause:</strong> Your AGENTS.md doesn't tell the agent to read memory files on session start.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>Fix:</strong> Add a session startup section to AGENTS.md that explicitly lists which files to read (SOUL.md, USER.md, MEMORY.md, today + yesterday in memory/).
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Problem: Agent is too chatty in group chats
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>Cause:</strong> No group chat guidelines in AGENTS.md or SOUL.md.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>Fix:</strong> Add a group chat section: "Only respond when mentioned or genuinely valuable. Quality over quantity."
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Problem: Agent sounds generic and robotic
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>Cause:</strong> Empty or vague SOUL.md.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>Fix:</strong> Write a real personality. Give your agent opinions, values, humor. See the SOUL.md examples above.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Problem: High API costs from unnecessary file reads
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>Cause:</strong> No token awareness rules in AGENTS.md.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>Fix:</strong> Add a token awareness section that tells your agent to check file sizes, use grep/head/tail, and avoid loading massive files unless necessary. See the intermediate AGENTS.md example above.
                </p>
              </div>
            </div>
          </section>

          {/* Progression Guide */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Progression Guide: Starter → Advanced</h2>

            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-900 mb-3">Phase 1: Starter (Week 1)</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Goal:</strong> Get basic continuity working.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Create AGENTS.md with session startup instructions</li>
                  <li>Create SOUL.md with basic personality</li>
                  <li>Create memory/ directory</li>
                  <li>Tell agent to read today + yesterday memory files</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  <strong>Success metric:</strong> Your agent remembers yesterday's conversation.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Phase 2: Intermediate (Month 1)</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Goal:</strong> Add memory hygiene and group chat discipline.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Add MEMORY.md for long-term facts</li>
                  <li>Add group chat rules to AGENTS.md</li>
                  <li>Add token awareness rules</li>
                  <li>Create USER.md with your profile</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  <strong>Success metric:</strong> Your agent doesn't spam group chats and your API costs are predictable.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-900 mb-3">Phase 3: Advanced (Month 2+)</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Goal:</strong> Optimize for your specific workflows.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Add TOOLS.md with environment-specific config</li>
                  <li>Add IDENTITY.md if running multiple agents</li>
                  <li>Create BOOTSTRAP.md for automated setup</li>
                  <li>Add workflow-specific rules to AGENTS.md (error handling, sub-agent orchestration, etc.)</li>
                  <li>Implement tiered memory architecture (core/episodic/semantic/procedural)</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  <strong>Success metric:</strong> Your agent handles complex multi-step tasks autonomously with minimal guidance.
                </p>
              </div>
            </div>
          </section>

          {/* Where to Find the Files */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Where to Find the Files</h2>
            <p className="text-lg text-gray-700 mb-4">
              All 7 files live in your OpenClaw workspace directory. Default location: <code className="bg-gray-200 px-2 py-1 rounded text-sm">~/.openclaw/workspace</code>
            </p>
            <p className="text-gray-700 mb-6">
              You can change this location in your OpenClaw config file (<code className="bg-gray-200 px-2 py-1 rounded text-sm">~/.openclaw/openclaw.json</code>) with:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`{
  "agent": {
    "workspace": "~/your-custom-path"
  }
}`}
            </pre>

            <p className="text-gray-700 mb-4">
              <strong>Quick setup:</strong> Run <code className="bg-gray-200 px-2 py-1 rounded text-sm">openclaw setup</code> to create the workspace directory and default templates automatically.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>View templates:</strong> Official templates are available at <a href="https://docs.openclaw.ai/reference/templates" className="text-blue-600 hover:underline" target="_blank" rel="noopener">docs.openclaw.ai/reference/templates</a>
            </p>
          </section>

          {/* Managed Hosting CTA */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Want These Files Pre-Configured?
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Clawer.ai's <Link href="/pricing" className="text-blue-600 hover:underline font-semibold">AI Teams</Link> come with battle-tested AGENTS.md, SOUL.md, and memory configurations for specific use cases — content creation, solopreneur operations, and personal life management.
              </p>
              <p className="text-gray-700 mb-6">
                Each template includes 3-5 specialized agents with pre-tuned personalities, workflow instructions, and memory management. Deploy in 60 seconds, no configuration needed.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/pricing"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  View AI Teams
                </Link>
                <Link
                  href="/blog/openclaw-ai-teams"
                  className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-blue-300 hover:bg-blue-50 transition"
                >
                  Learn About AI Teams →
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Do I need all 7 files for OpenClaw to work?
                </h3>
                <p className="text-gray-700">
                  No. OpenClaw works with empty or missing files — it just won't be particularly smart. AGENTS.md is the most important (operating instructions). SOUL.md is second (personality). USER.md helps but isn't critical. The others are optional enhancements. Start with AGENTS.md and SOUL.md, add the rest as you need them.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What's the difference between AGENTS.md and SOUL.md?
                </h3>
                <p className="text-gray-700">
                  AGENTS.md is operational instructions — what your agent does (read memory files, handle errors, manage tokens). SOUL.md is personality and boundaries — how your agent communicates (tone, humor, values). Think of AGENTS.md as the employee handbook and SOUL.md as the culture document. Most beginners put everything in AGENTS.md, which creates a confusing mess. Separate concerns for cleaner results.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Can I see real examples of production OpenClaw config files?
                </h3>
                <p className="text-gray-700">
                  Yes. The official templates are at <a href="https://docs.openclaw.ai/reference/templates" className="text-blue-600 hover:underline" target="_blank" rel="noopener">docs.openclaw.ai/reference/templates</a>. Community examples are shared on <a href="https://www.reddit.com/r/vibecoding/" className="text-blue-600 hover:underline" target="_blank" rel="noopener">r/vibecoding</a> and in the <a href="https://discord.com/invite/clawd" className="text-blue-600 hover:underline" target="_blank" rel="noopener">OpenClaw Discord</a>. This guide includes annotated examples at starter, intermediate, and advanced levels. The key is starting simple and adding rules based on your actual pain points — there's no universal "perfect" setup because everyone uses their agent differently.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  How do I back up my OpenClaw configuration?
                </h3>
                <p className="text-gray-700">
                  The workspace directory is just files. Make it a git repo:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
{`cd ~/.openclaw/workspace
git init
git add .
git commit -m "Initial workspace backup"
git remote add origin git@github.com:yourusername/openclaw-workspace.git
git push -u origin main`}
                </pre>
                <p className="text-gray-700 mt-2">
                  Use a private repo. Your workspace contains personal data.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Can I share configuration files between multiple agents?
                </h3>
                <p className="text-gray-700">
                  Yes, but be careful. SOUL.md and IDENTITY.md should be unique per agent (each agent has its own personality). AGENTS.md can be shared if the operational rules are identical. USER.md and MEMORY.md should be personal and not shared. TOOLS.md can be shared if all agents run on the same machine. Use symlinks or git submodules if you want to share common rules across multiple agent workspaces.
                </p>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Final Thoughts</h2>
            <p className="text-lg text-gray-700 mb-4">
              Your OpenClaw agent is only as smart as the instructions you give it. These 7 files are the instructions.
            </p>
            <p className="text-gray-700 mb-4">
              Start simple. Add complexity only when you hit specific pain points. Document what frustrates you, then add rules to prevent it. Over time, your configuration files become a living record of how you work and what you value.
            </p>
            <p className="text-gray-700 mb-6">
              Most OpenClaw users never touch these files. Their agents work, but they're generic chatbots with no memory, no personality, and no understanding of context. You're reading this guide, which means you're not most users. Build something good.
            </p>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                <strong>Next steps:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Read <Link href="/blog/openclaw-agents-md-tips" className="text-blue-600 hover:underline">5 AGENTS.md Rules That Make Your Agent 10x Better</Link> for practical tips</li>
                <li>Check <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:underline">Best OpenClaw Hosting</Link> if you're still self-hosting</li>
                <li>Explore <Link href="/blog/openclaw-ai-teams" className="text-blue-600 hover:underline">Multi-Agent AI Teams</Link> for advanced orchestration patterns</li>
                <li>Join <a href="https://discord.com/invite/clawd" className="text-blue-600 hover:underline" target="_blank" rel="noopener">OpenClaw Discord</a> to share your config and learn from the community</li>
              </ul>
            </div>
          </section>

          {/* Author Bio */}
          <footer className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600">
              Written by the <strong>Clawer.ai team</strong> — managed OpenClaw hosting with pre-configured AI Teams. We run hundreds of agent instances and maintain production-grade configurations for content creators, solopreneurs, and personal productivity use cases.
            </p>
          </footer>
        </div>
      </article>
    </div>
  );
}
