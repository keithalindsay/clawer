import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw Slack Rate Limit: March 2026 Breaking Change",
  description:
    "Slack's March 3, 2026 rate limit change cut OpenClaw's context window by 85%. What happened, why your agent is forgetting things, and the 3 fixes that actually work.",
  openGraph: {
    title: "OpenClaw Slack Rate Limit: The March 2026 Change That Broke Everything",
    description:
      "Slack's March 3, 2026 rate limit change cut OpenClaw's context window by 85%. What happened, why your agent is forgetting things, and the 3 fixes that actually work.",
    type: "article",
    publishedTime: "2026-03-27T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Slack", "Rate Limits", "AI Assistant", "API", "Integration"],
    url: "https://clawer.ai/blog/openclaw-slack-rate-limit-march-2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw Slack Rate Limit: March 2026 Change That Broke Everything",
    description:
      "Slack's March 3, 2026 rate limit change cut OpenClaw's context window by 85%. What happened, why your agent is forgetting things, and the 3 fixes that actually work.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-slack-rate-limit-march-2026",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw Slack Rate Limit: The March 2026 Change That Broke Everything",
  description:
    "Slack's March 3, 2026 rate limit change slashed OpenClaw's context window by 85%. Here's what broke, why your agent forgets conversations, and the three actual fixes.",
  datePublished: "2026-03-27",
  dateModified: "2026-03-27",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-slack-rate-limit-march-2026",
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
      name: "OpenClaw Slack Rate Limit March 2026",
      item: "https://clawer.ai/blog/openclaw-slack-rate-limit-march-2026",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is my OpenClaw agent forgetting Slack conversations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On March 3, 2026, Slack cut the rate limit for conversations.history and conversations.replies from 50+ requests/min to 1 request/min with a 15-message maximum for non-Marketplace apps. Your OpenClaw agent now sees only the last 15 messages instead of 50-100, losing 85% of its context window. This causes memory gaps, repeated questions, and weird thread responses.",
      },
    },
    {
      "@type": "Question",
      name: "Does this affect all OpenClaw Slack integrations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, unless your Slack app is approved for the Slack Marketplace or is an internal custom app. The vast majority of OpenClaw deployments use unlisted apps and are affected by the new 1 req/min, 15-message limit. Existing installations before May 29, 2025 are grandfathered, but any new app or new workspace installation hits the limit.",
      },
    },
    {
      "@type": "Question",
      name: "How do I fix OpenClaw Slack rate limiting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Three options: 1) Switch to Events API mode instead of polling conversations.history — events aren't rate limited and give you real-time message delivery. 2) Implement local message caching to build context over time without hitting the API. 3) Use managed hosting like Clawer.ai that handles Events API, caching, and Marketplace registration automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Why did Slack impose these rate limits?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Slack's stated reason is preventing data exfiltration by unvetted applications. The conversations.history and conversations.replies methods can pull large amounts of sensitive conversational data. As AI systems became more powerful, Slack wanted to restrict bulk data scraping by non-Marketplace apps. Marketplace apps undergo security review and aren't affected.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get my OpenClaw app approved for the Slack Marketplace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Technically yes, but the Slack Marketplace approval process requires security reviews, scope analysis, and compliance with Marketplace guidelines. For personal or internal OpenClaw deployments, this is overkill. The faster fix is switching to Events API mode or using managed hosting that already handles Marketplace registration.",
      },
    },
  ],
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <article className="max-w-4xl mx-auto px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
            OpenClaw Slack Rate Limit: The March 2026 Change That Broke Everything
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">
            Slack's March 3rd rate limit change cut OpenClaw's context window by 85%. Here's what happened, why your agent is forgetting things, and the three fixes that actually work.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-500">
            <time dateTime="2026-03-27">March 27, 2026</time>
            <span>•</span>
            <span>8 min read</span>
          </div>
        </header>

        <img
          src="/blog/openclaw-slack-rate-limit-hero.png"
          alt="OpenClaw Slack integration broken by API rate limit changes showing message history truncation"
          className="rounded-xl w-full mb-12 shadow-lg"
        />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>What Happened on March 3, 2026</h2>

          <p>
            If you're running OpenClaw with Slack and noticed your agent suddenly got dumber in early March, you're not alone. On March 3, 2026, Slack enforced a rate limit change they announced back in May 2025.
          </p>

          <p>The numbers are brutal:</p>

          <ul>
            <li>
              <strong>Before:</strong> 50+ requests per minute, up to 1,000 messages per request
            </li>
            <li>
              <strong>After:</strong> 1 request per minute, maximum 15 messages per request
            </li>
          </ul>

          <p>
            Your OpenClaw agent went from seeing 50-100 messages in a channel to seeing just the last 15 — <strong>an 85% reduction in available context</strong>.
          </p>

          <h2>Who This Affects</h2>

          <p>
            The rate limit applies to <strong>non-Marketplace apps</strong> — which covers nearly every self-hosted OpenClaw deployment. Slack defines these as "unlisted" apps: apps distributed outside the official Slack Marketplace.
          </p>

          <p>You're affected if:</p>

          <ul>
            <li>You created your Slack app after <strong>May 29, 2025</strong></li>
            <li>You installed an existing unlisted app to a <strong>new workspace</strong> after May 29, 2025</li>
            <li>Your app isn't approved for the Slack Marketplace (99% of OpenClaw users)</li>
          </ul>

          <p>
            Existing installations before May 29, 2025 were grandfathered — but the moment you add a new workspace or create a new app, you hit the wall.
          </p>

          <h2>Symptoms You Probably Noticed</h2>

          <p>Here's what actually breaks when your context window drops to 15 messages:</p>

          <h3>1. Your Agent Forgets Conversations</h3>

          <p>
            Someone asks a question in message #8. Your agent answers in message #12. By message #24, the agent has no memory of the exchange. It'll ask the same question again.
          </p>

          <h3>2. Thread Responses Get Weird</h3>

          <p>
            Threads longer than 15 messages lose context. Your agent might respond to message #20 in a thread without seeing messages #1-5 where the topic was established. The reply sounds confident but completely misses the point.
          </p>

          <h3>3. Random 429 Errors and Latency Spikes</h3>

          <p>
            When OpenClaw hits the 1 req/min limit, it gets a 429 (Too Many Requests) response. The gateway retries with exponential backoff. Your agent goes silent for 30-60 seconds, then responds. Users think it crashed.
          </p>

          <h3>4. Channel Context Just Disappears</h3>

          <p>
            In active channels with 50+ messages per hour, your agent only sees the last 12 minutes of conversation. Everything before that is invisible. It can't reference earlier decisions, links, or action items.
          </p>

          <h2>Why Slack Did This</h2>

          <p>
            Slack's official reason: <strong>preventing data exfiltration by unvetted applications</strong>.
          </p>

          <p>
            The <code>conversations.history</code> and <code>conversations.replies</code> methods can pull thousands of messages — potentially exposing sensitive company data to third-party apps that haven't been security-reviewed.
          </p>

          <p>As AI systems got more powerful in 2025, Slack got nervous. Their solution:</p>

          <ul>
            <li>Force commercial apps through Marketplace review (free, but bureaucratic)</li>
            <li>Throttle unlisted apps to 15 messages/request, 1 req/min</li>
            <li>Push developers toward the <strong>Events API</strong> instead of polling</li>
          </ul>

          <p>
            The subtext: Slack wants to kill polling-based integrations. Events API gives them control, visibility, and the ability to meter/monetize later.
          </p>

          <h2>The Three Actual Fixes</h2>

          <h3>Fix #1: Switch to Events API Mode</h3>

          <p>
            <strong>Best technical solution.</strong> The Events API delivers messages in real-time via webhook. No polling. No rate limits on message delivery.
          </p>

          <p>How it works:</p>

          <ol>
            <li>Slack sends your server a POST request every time a message is sent</li>
            <li>Your OpenClaw gateway processes it instantly</li>
            <li>You maintain a local message store for context</li>
            <li>No more <code>conversations.history</code> calls</li>
          </ol>

          <p>
            OpenClaw supports Events API mode out of the box. In your config:
          </p>

          <pre className="bg-neutral-900 dark:bg-neutral-800 text-neutral-100 p-4 rounded-lg overflow-x-auto">
            <code>{`{
  channels: {
    slack: {
      enabled: true,
      mode: "http",  // instead of "socket"
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}`}</code>
          </pre>

          <p>Then in your Slack app settings:</p>

          <ul>
            <li>Set <strong>Event Subscriptions</strong> Request URL to <code>https://your-server.com/slack/events</code></li>
            <li>Subscribe to bot events: <code>message.channels</code>, <code>message.im</code>, <code>app_mention</code>, etc.</li>
            <li>Enable <strong>Interactivity</strong> with the same webhook URL</li>
          </ul>

          <p>
            <strong>Caveat:</strong> Your OpenClaw server needs a publicly accessible HTTPS endpoint. Not great for laptops behind NAT. Use ngrok/Cloudflare Tunnel or switch to managed hosting.
          </p>

          <h3>Fix #2: Implement Local Message Caching</h3>

          <p>
            <strong>Pragmatic workaround.</strong> Instead of fetching full history every time, build up context incrementally.
          </p>

          <p>The pattern:</p>

          <ul>
            <li>Store messages locally as they arrive (via Events API or Socket Mode)</li>
            <li>Use <code>conversations.history</code> only for backfill (once during idle time)</li>
            <li>Serve context from your local cache, not Slack's API</li>
          </ul>

          <p>
            This still requires Events API or aggressive Socket Mode caching. You can't cache what you never see, and polling at 1 req/min means you're always 60 seconds behind.
          </p>

          <h3>Fix #3: Use Managed Hosting That Already Fixed This</h3>

          <p>
            <strong>Fastest solution.</strong> <Link href="https://clawer.ai" className="text-blue-600 dark:text-blue-400 hover:underline">Clawer.ai</Link> handles Events API, message caching, and Marketplace-level infrastructure automatically.
          </p>

          <p>Why this works:</p>

          <ul>
            <li>Clawer's Slack integration uses Events API by default — no polling, no rate limits</li>
            <li>Persistent message store maintains full channel context (not just 15 messages)</li>
            <li>HTTPS webhooks are already configured and managed</li>
            <li>You connect Slack in 60 seconds, no config files</li>
          </ul>

          <p>
            For personal/internal use, this beats spending 10 hours setting up Events API webhooks, SSL certificates, and message stores. <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">Clawer's free tier</Link> includes Slack with no message history limits.
          </p>

          <h2>What About Marketplace Approval?</h2>

          <p>
            Technically, you could get your OpenClaw app approved for the Slack Marketplace. That would restore the old rate limits (50+ req/min, 1000 messages/request).
          </p>

          <p>Reality check:</p>

          <ul>
            <li>Marketplace review takes 2-4 weeks</li>
            <li>Requires security documentation, scope justification, and ongoing compliance</li>
            <li>Only makes sense if you're distributing your app to hundreds of workspaces</li>
            <li>For a personal agent? Complete overkill</li>
          </ul>

          <p>
            Slack Marketplace is free to join, but it's designed for commercial SaaS products — not self-hosted AI agents. The faster path is fixing your integration.
          </p>

          <h2>Socket Mode Is Not a Solution</h2>

          <p>
            Socket Mode (OpenClaw's default) still uses <code>conversations.history</code> to fetch context. The rate limit applies the same way.
          </p>

          <p>
            Socket Mode is great for local development and avoiding webhook setup, but it doesn't solve the 15-message problem. You're still polling Slack's API, just over WebSocket instead of HTTP.
          </p>

          <p>If you're staying on Socket Mode, your only option is local caching (Fix #2).</p>

          <h2>The Long-Term Picture</h2>

          <p>
            This isn't the last time Slack will tighten API access. The pattern is clear:
          </p>

          <ul>
            <li>2023-2024: Open API, minimal restrictions</li>
            <li>2025: Terms update, Marketplace push</li>
            <li>2026: Rate limit enforcement for unlisted apps</li>
            <li>2027: Likely more restrictions or pricing tiers</li>
          </ul>

          <p>
            Slack is protecting their data moat as AI agents proliferate. They want control over who builds on Slack and how much data those apps can access.
          </p>

          <p>
            For OpenClaw users, the takeaway: <strong>build around events, not polling</strong>. Maintain local state. Don't rely on unlimited API access to Slack's message history.
          </p>

          <h2>What We're Doing About It</h2>

          <p>
            At <Link href="https://clawer.ai" className="text-blue-600 dark:text-blue-400 hover:underline">Clawer</Link>, we migrated to Events API in February 2026 — before the March 3 deadline. Our Slack integration:
          </p>

          <ul>
            <li>Uses Events API exclusively (no polling)</li>
            <li>Maintains full conversation history in persistent storage</li>
            <li>Supports unlimited channels with no context degradation</li>
            <li>Handles thread context correctly (not just the last 15 messages)</li>
          </ul>

          <p>
            We also handle Marketplace-level infrastructure: HTTPS webhooks, event verification, retry logic, and proper error handling. You connect Slack, we handle the rest.
          </p>

          <p>
            If you're running OpenClaw yourself and want to avoid debugging webhook configs, <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">try Clawer's free tier</Link>. Slack works out of the box.
          </p>

          <h2>FAQs</h2>

          <h3>Why is my OpenClaw agent forgetting Slack conversations?</h3>

          <p>
            On March 3, 2026, Slack cut the rate limit for <code>conversations.history</code> and <code>conversations.replies</code> from 50+ requests/min to 1 request/min with a 15-message maximum for non-Marketplace apps. Your OpenClaw agent now sees only the last 15 messages instead of 50-100, losing 85% of its context window. This causes memory gaps, repeated questions, and weird thread responses.
          </p>

          <h3>Does this affect all OpenClaw Slack integrations?</h3>

          <p>
            Yes, unless your Slack app is approved for the Slack Marketplace or is an internal custom app. The vast majority of OpenClaw deployments use unlisted apps and are affected by the new 1 req/min, 15-message limit. Existing installations before May 29, 2025 are grandfathered, but any new app or new workspace installation hits the limit.
          </p>

          <h3>How do I fix OpenClaw Slack rate limiting?</h3>

          <p>
            Three options: (1) Switch to Events API mode instead of polling <code>conversations.history</code> — events aren't rate limited and give you real-time message delivery. (2) Implement local message caching to build context over time without hitting the API. (3) Use managed hosting like <Link href="https://clawer.ai" className="text-blue-600 dark:text-blue-400 hover:underline">Clawer.ai</Link> that handles Events API, caching, and Marketplace registration automatically.
          </p>

          <h3>Why did Slack impose these rate limits?</h3>

          <p>
            Slack's stated reason is preventing data exfiltration by unvetted applications. The <code>conversations.history</code> and <code>conversations.replies</code> methods can pull large amounts of sensitive conversational data. As AI systems became more powerful, Slack wanted to restrict bulk data scraping by non-Marketplace apps. Marketplace apps undergo security review and aren't affected.
          </p>

          <h3>Can I get my OpenClaw app approved for the Slack Marketplace?</h3>

          <p>
            Technically yes, but the Slack Marketplace approval process requires security reviews, scope analysis, and compliance with Marketplace guidelines. For personal or internal OpenClaw deployments, this is overkill. The faster fix is switching to Events API mode or using managed hosting that already handles Marketplace registration.
          </p>

          <h2>Related Reading</h2>

          <ul>
            <li>
              <Link href="/blog/openclaw-2026-3-24-teams-tools" className="text-blue-600 dark:text-blue-400 hover:underline">
                OpenClaw 2026.3.24: Teams Gets Smart, Tools Get Visible
              </Link>
            </li>
            <li>
              <Link href="/blog/openclaw-telegram-setup" className="text-blue-600 dark:text-blue-400 hover:underline">
                OpenClaw on Telegram: Bot Setup Guide
              </Link>
            </li>
            <li>
              <Link href="/blog/openclaw-whatsapp-setup" className="text-blue-600 dark:text-blue-400 hover:underline">
                OpenClaw on WhatsApp: Complete Setup Guide
              </Link>
            </li>
            <li>
              <Link href="/blog/best-openclaw-hosting" className="text-blue-600 dark:text-blue-400 hover:underline">
                Best OpenClaw Hosting in 2026: Honest Comparison
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
            Slack Integration That Just Works
          </h3>
          <p className="text-neutral-700 dark:text-neutral-300 mb-6">
            Clawer handles Events API, message caching, and full conversation history automatically. No config files, no webhook debugging, no rate limit surprises. Connect Slack in 60 seconds.
          </p>
          <div className="flex gap-4">
            <Link
              href="/pricing"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Try Free
            </Link>
            <Link
              href="https://docs.openclaw.ai/channels/slack"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold rounded-lg border border-neutral-300 dark:border-neutral-600 transition-colors"
            >
              Self-Host Guide
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
