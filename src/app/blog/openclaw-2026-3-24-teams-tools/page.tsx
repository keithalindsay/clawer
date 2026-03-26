import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw 2026.3.24: Teams Gets Smart, Tools Get Visible",
  description:
    "OpenClaw 2026.3.24 adds native Microsoft Teams, OpenAI-compatible sub-agent routing, and tool visibility controls. What actually matters for users.",
  openGraph: {
    title: "OpenClaw 2026.3.24: Teams Gets Smart, Tools Get Visible",
    description:
      "OpenClaw 2026.3.24 adds native Microsoft Teams, OpenAI-compatible sub-agent routing, and tool visibility controls. What actually matters for users.",
    type: "article",
    publishedTime: "2026-03-26T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Release", "Microsoft Teams", "OpenAI API", "Tools"],
    url: "https://clawer.ai/blog/openclaw-2026-3-24-teams-tools",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw 2026.3.24: Teams Gets Smart, Tools Get Visible",
    description:
      "OpenClaw 2026.3.24 adds native Microsoft Teams, OpenAI-compatible sub-agent routing, and tool visibility controls. What actually matters for users.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-2026-3-24-teams-tools",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw 2026.3.24: Teams Gets Smart, Tools Get Visible",
  description:
    "Analysis of OpenClaw 2026.3.24 release: native Microsoft Teams integration, OpenAI-compatible API improvements, and tool visibility controls.",
  datePublished: "2026-03-26",
  dateModified: "2026-03-26",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-2026-3-24-teams-tools",
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
      name: "OpenClaw 2026.3.24 Release",
      item: "https://clawer.ai/blog/openclaw-2026-3-24-teams-tools",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What's new in OpenClaw 2026.3.24?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenClaw 2026.3.24 includes native Microsoft Teams integration with the official SDK, improved OpenAI API compatibility for sub-agent routing, visible /tools command showing active capabilities, one-click skill dependency installation, and Slack interactive reply buttons. Released March 25, 2026.",
      },
    },
    {
      "@type": "Question",
      name: "Does OpenClaw work with Microsoft Teams now?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. OpenClaw 2026.3.24 migrated to the official Microsoft Teams SDK with AI-optimized UX: streaming replies, welcome cards, typing indicators, native AI labeling, and message edit/delete support. It works in 1:1 DMs, group chats, and channels with Teams Bot Framework setup.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use OpenClaw as an OpenAI API replacement?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Partially. OpenClaw 2026.3.24 added /v1/models and /v1/embeddings endpoints and improved /v1/chat/completions model routing. This lets OpenWebUI and other OpenAI-compatible clients talk to OpenClaw sub-agents. It's designed for multi-agent orchestration, not general-purpose API replacement.",
      },
    },
    {
      "@type": "Question",
      name: "What does the /tools command do in OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The /tools command now shows exactly which tools your agent can use right now — not just what's installed, but what's actually enabled and configured with API keys. The Control UI also gained an 'Available Right Now' section. This fixes constant user confusion about why a skill exists but doesn't work.",
      },
    },
    {
      "@type": "Question",
      name: "Is OpenClaw 2026.3.24 stable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Released as the official stable version on March 25, 2026. Previous beta versions (2026.3.24-beta.1, 2026.3.24-beta.2) ran for 2-3 days each for testing. This is a feature update, not a security patch — upgrade when convenient.",
      },
    },
  ],
};

export default function OpenClaw2026324Page() {
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

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            ← Clawer.ai
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-lg max-w-none">
          <h1>OpenClaw 2026.3.24: Teams Gets Smart, Tools Get Visible</h1>
          
          <p className="text-gray-600 text-sm mb-8">
            Published March 26, 2026 • 6 min read
          </p>

          <img
            src="/blog/openclaw-2026-3-24-teams-tools-hero.png"
            alt="OpenClaw 2026.3.24 release showing Microsoft Teams integration and tool visibility controls"
            className="rounded-xl w-full mb-8"
          />

          <p>
            OpenClaw 2026.3.24 dropped yesterday (March 25, 2026). The release notes run 15,000 words
            across three beta versions and one stable release. Most of it's noise.
          </p>

          <p>
            Here's what actually matters if you run OpenClaw or you're deciding whether{" "}
            <Link href="/blog/best-openclaw-hosting">managed hosting</Link> is worth it.
          </p>

          <h2>Microsoft Teams Finally Works Like an AI Assistant Should</h2>

          <p>
            The biggest change: OpenClaw migrated to the official Microsoft Teams SDK. Before 2026.3.24,
            Teams support existed but felt bolted-on. Messages showed up. Replies worked. That was about it.
          </p>

          <p>Now you get:</p>

          <ul>
            <li><strong>Streaming 1:1 replies</strong> — messages appear in real-time as the agent types, not in one slow dump</li>
            <li><strong>Welcome cards with prompt starters</strong> — new users see suggested commands when they first message the bot</li>
            <li><strong>Typing indicators</strong> — you know when the agent is working on your request</li>
            <li><strong>Native AI labeling</strong> — Teams shows the bot as an AI assistant, not just another user</li>
            <li><strong>Message edit and delete support</strong> — agents can fix their own mistakes in-thread</li>
          </ul>

          <p>
            This addresses the core UX problem with AI in workplace chat: people couldn't tell when the agent
            was broken vs just thinking. Now they can.
          </p>

          <p>
            If you've been running OpenClaw on Slack or Discord but avoiding Teams because it felt janky,
            this version closes that gap. Teams setup still requires Azure Bot Framework config (not trivial),
            but once it's running, the experience matches Slack quality.
          </p>

          <h2>OpenAI API Compatibility: Sub-Agents via OpenWebUI</h2>

          <p>
            OpenClaw added <code>/v1/models</code> and <code>/v1/embeddings</code> endpoints, plus improved
            model routing through <code>/v1/chat/completions</code>.
          </p>

          <p>
            What this enables: you can now use <strong>OpenWebUI</strong> (or any OpenAI-compatible client)
            to talk to OpenClaw sub-agents. Your main OpenClaw instance can orchestrate multiple specialized
            agents, and external tools can trigger them via standard API calls.
          </p>

          <p>
            Example use case: you run a main OpenClaw agent on WhatsApp for personal tasks. It spawns
            sub-agents for specific workflows (financial analysis, code generation, research). OpenWebUI
            connects to OpenClaw's gateway and lets you chat with any sub-agent directly through a web UI,
            without touching WhatsApp or the CLI.
          </p>

          <p>
            This isn't "OpenClaw replaces OpenAI's API." It's "OpenClaw can now route requests to the right
            agent in a multi-agent setup without forcing you to use OpenClaw's native commands."
          </p>

          <p>
            For self-hosters: you still need to expose port 18789 or set up a reverse proxy. This is where{" "}
            <Link href="/pricing">Clawer's managed hosting</Link> saves time — we handle gateway routing
            and SSL automatically.
          </p>

          <h2>The /tools Command Finally Shows What's Actually Available</h2>

          <p>
            This should have existed from day one. The old behavior: <code>/tools</code> listed every skill
            you'd installed, whether or not it was configured, enabled, or had working API keys.
          </p>

          <p>
            Users would see "weather" in the tools list, ask for a forecast, and get "API key not configured."
            Repeat 50 times across GitHub issues and Discord.
          </p>

          <p>New behavior in 2026.3.24:</p>

          <ul>
            <li><code>/tools</code> shows <strong>only tools the agent can use right now</strong></li>
            <li>Compact default view — shows what's active without walls of JSON</li>
            <li>Optional detailed mode for debugging</li>
            <li>Control UI gained an "Available Right Now" section — same info, graphical</li>
          </ul>

          <p>
            This is a quality-of-life fix for everyone, but especially important for teams running shared
            OpenClaw instances. You can finally hand someone a bot and they'll know what it can do without
            trial-and-error or reading docs.
          </p>

          <h2>One-Click Skill Dependency Installation</h2>

          <p>
            Seven bundled skills (coding-agent, gh-issues, openai-whisper-api, session-logs, tmux, trello, weather)
            now ship with <strong>install recipes</strong>. When you try to enable a skill that needs external
            dependencies, the CLI and Control UI offer to install them for you.
          </p>

          <p>
            Before: "Skill requires tmux. Install tmux." (no instructions, no automation)
          </p>

          <p>
            After: "Skill requires tmux. [Install now] [Skip]"
          </p>

          <p>
            Small change, big reduction in setup friction. Self-hosters who aren't DevOps veterans will
            actually get skills working instead of giving up.
          </p>

          <p>
            If you're on{" "}
            <Link href="/blog/best-openclaw-hosting">managed OpenClaw hosting</Link>, this doesn't affect you —
            providers pre-install common dependencies. But if you're self-hosting or trying OpenClaw for the
            first time, this removes a major setup hurdle.
          </p>

          <h2>Slack Gets Interactive Reply Buttons</h2>

          <p>
            OpenClaw can now auto-render simple trailing <code>Options:</code> lines as Slack buttons or
            select menus. Example:
          </p>

          <blockquote>
            <p>
              I found 3 deployment options. Which would you like?<br />
              Options: Production | Staging | Rollback
            </p>
          </blockquote>

          <p>
            Slack displays those as clickable buttons. Users click instead of typing. Faster, cleaner,
            less error-prone.
          </p>

          <p>
            Enable this in your config:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`channels:
  slack:
    - account: my-workspace
      interactive: true  # Enable button rendering`}
          </pre>

          <p>Low-effort to enable, immediately visible in Slack DMs and channels.</p>

          <h2>Discord Auto-Thread Naming (Optional)</h2>

          <p>
            Minor addition: <code>autoThreadName: "generated"</code> lets Discord threads get LLM-generated
            titles instead of using the first message. Opt-in, not default. Useful for high-traffic servers
            where thread organization matters. Most users can ignore this.
          </p>

          <h2>Security Fixes: Sandbox Media Bypass Closed</h2>

          <p>
            Buried in the fixes list: <strong>Security/sandbox media dispatch</strong> closed a
            <code>mediaUrl/fileUrl</code> alias bypass. Outbound tool actions could previously escape
            media-root restrictions.
          </p>

          <p>
            If you run OpenClaw with <code>workspaceOnly</code> sandbox mode (recommended for security),
            this was a real vulnerability. Agents could access files outside their designated workspace.
          </p>

          <p>Patched silently. No CVE issued. Update if you care about sandboxing.</p>

          <p>
            This is why{" "}
            <Link href="/blog/openclaw-security-guide">self-hosted OpenClaw security</Link> requires active
            monitoring. Managed providers like Clawer apply patches same-day. Self-hosters need to watch
            release notes or subscribe to security lists.
          </p>

          <h2>WhatsApp and Telegram: Group Message Fixes</h2>

          <p>
            <strong>WhatsApp:</strong> Fixed echo suppression for group chats using linked accounts. Agents
            were suppressing their own <code>/status</code> and <code>/activation</code> commands because
            they came from <code>fromMe</code> traffic. Now fixed — owner commands work again.
          </p>

          <p>
            <strong>Telegram:</strong> Fixed #General topic 1 routing when Telegram omits forum metadata.
            Commands and interactive callbacks in default topics work again.
          </p>

          <p>
            Both fixes address real bugs from GitHub issues. Not exciting, but critical for people running
            agents in group chats.
          </p>

          <h2>Should You Upgrade to 2026.3.24?</h2>

          <p>
            <strong>How to upgrade:</strong>
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6">
{`# npm users:
npm install -g openclaw@2026.3.24

# Docker users:
docker pull openclaw/openclaw:2026.3.24
docker compose up -d

# Check version:
openclaw --version`}
          </pre>

          <p>
            <strong>Upgrade now if:</strong>
          </p>
          <ul>
            <li>You use or plan to use Microsoft Teams</li>
            <li>You orchestrate sub-agents and want OpenWebUI integration</li>
            <li>You run WhatsApp/Telegram group bots (fixes real bugs)</li>
            <li>You want the sandboxing vulnerability patched</li>
          </ul>

          <p>
            <strong>Upgrade when convenient if:</strong>
          </p>
          <ul>
            <li>You don't use Teams, multi-agent setups, or group chats</li>
            <li>You're on <Link href="/blog/openclaw-2026-3-12-update">2026.3.12</Link> or newer (security patches already applied)</li>
            <li>You want the tool visibility QoL fix but it's not urgent</li>
          </ul>

          <p>
            <strong>Wait if:</strong>
          </p>
          <ul>
            <li>You're running custom plugins — check compatibility first</li>
            <li>You're on a production deployment and prefer to wait 3-5 days for community bug reports</li>
          </ul>

          <h2>What Clawer.ai Does Differently</h2>

          <p>
            We run OpenClaw at scale for 180+ users. Here's how we handle releases like 2026.3.24:
          </p>

          <ul>
            <li>
              <strong>Same-day security patches</strong> — sandboxing fix applied within 6 hours of release
            </li>
            <li>
              <strong>Staged rollouts</strong> — we test on dev instances before pushing to production
            </li>
            <li>
              <strong>Pre-configured Teams/Slack</strong> — if you need enterprise chat, we handle Azure Bot setup
            </li>
            <li>
              <strong>Curated skills only</strong> — no ClawHub access, no malware risk from untrusted skills
            </li>
            <li>
              <strong>Zero-config sub-agents</strong> — OpenWebUI routing works out of the box, no port forwarding
            </li>
          </ul>

          <p>
            Self-hosting gives you control. Managed hosting gives you time.
          </p>

          <p>
            <Link href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium">
              See Clawer pricing →
            </Link>
          </p>

          <h2>Bottom Line</h2>

          <p>
            OpenClaw 2026.3.24 is a solid feature release. Teams integration is the headliner, but the tool
            visibility fix and sub-agent routing matter more for daily use. Security patches are quiet but critical.
          </p>

          <p>
            If you self-host, budget 30-60 minutes for upgrade and config review (especially if you use Teams
            or Slack). If you're on Clawer, it's already done.
          </p>

          <p>
            Next major update: watch for 2026.4.x in early April. Pattern suggests feature releases every
            10-14 days, security patches as-needed.
          </p>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold mb-3">Want OpenClaw Without the Maintenance?</h3>
            <p className="mb-4">
              Clawer runs OpenClaw for you. No Docker, no updates, no exposed ports. Teams, Slack, and
              WhatsApp work out of the box. Sub-agent orchestration pre-configured.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Start free — 100 messages, no credit card
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
