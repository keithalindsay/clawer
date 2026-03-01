import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw on Telegram: Complete Setup Guide | Clawer",
  description:
    "Set up OpenClaw with Telegram in 10 minutes. BotFather walkthrough, DM pairing, group chat config, and production-ready security. Real commands, not theory",
  openGraph: {
    title: "OpenClaw on Telegram: Complete Setup Guide",
    description:
      "Set up OpenClaw with Telegram in 10 minutes. BotFather walkthrough, DM pairing, group chat config, and production-ready security. Real commands, not theory.",
    type: "article",
    publishedTime: "2026-03-01T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Telegram", "Bot Setup", "AI Assistant", "Tutorial", "Messaging"],
    url: "https://clawer.ai/blog/openclaw-telegram-setup",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw on Telegram: Complete Setup Guide | Clawer",
    description:
      "Set up OpenClaw with Telegram in 10 minutes. BotFather walkthrough, DM pairing, group chat config, and production-ready security. Real commands, not theory.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-telegram-setup",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw on Telegram: Complete Setup Guide",
  description:
    "Step-by-step guide to connecting OpenClaw with Telegram. Covers BotFather setup, DM pairing, group chat configuration, and production security.",
  datePublished: "2026-03-01",
  dateModified: "2026-03-01",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-telegram-setup",
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
      name: "OpenClaw Telegram Setup",
      item: "https://clawer.ai/blog/openclaw-telegram-setup",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I connect OpenClaw to Telegram?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create a bot with @BotFather, copy the token, add it to your OpenClaw config under channels.telegram.botToken, enable the channel with enabled: true, restart your gateway, and approve DM pairing requests with 'openclaw pairing approve telegram <CODE>'. Full setup takes 10 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "What is DM pairing and why do I need it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DM pairing is OpenClaw's security mechanism that requires admin approval before anyone can chat with your bot. Without it, anyone who finds your bot username can send prompts to your AI agent. With pairing enabled (dmPolicy: 'pairing'), new users get a pairing code that you must approve before the bot responds. This prevents unauthorized access to your agent's tools and data.",
      },
    },
    {
      "@type": "Question",
      name: "Why doesn't my Telegram bot respond in group chats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Telegram bots have privacy mode enabled by default, which means they only see messages that @mention them or start with /commands. Either disable privacy mode in BotFather (/setprivacy → Disable), or instruct users to @mention the bot when they want a response. After changing privacy mode, remove and re-add the bot to the group for the change to take effect.",
      },
    },
    {
      "@type": "Question",
      name: "Should I use webhook mode or long-polling for Telegram?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use long-polling (the default) unless you need sub-second latency. Polling works behind firewalls without a public URL, requires zero webhook configuration, and adds only 1-3 seconds of latency. Webhooks are faster but require a public HTTPS endpoint with a valid TLS certificate. For 99% of use cases, polling is simpler and safer.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find my Telegram user ID for whitelisting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Message @userinfobot on Telegram and it will reply with your numeric user ID. You can also check 'openclaw logs --follow' after DMing your bot and look for the 'from.id' field. Use this ID in channels.telegram.allowFrom to whitelist specific users.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use the same Telegram bot with multiple OpenClaw instances?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. A Telegram bot token can only connect to one polling client at a time. If two instances try to use the same token, one will fail or both will get intermittent messages. Create a separate bot in BotFather for each OpenClaw instance.",
      },
    },
  ],
};

export default function OpenClawTelegramSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Clawer
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          OpenClaw on Telegram: Complete Setup Guide
        </h1>

        <div className="text-gray-600 mb-8">
          Published March 1, 2026 · 12 min read
        </div>

        <img
          src="/blog/openclaw-telegram-setup-hero.png"
          alt="OpenClaw Telegram bot setup workflow from BotFather to production deployment"
          className="rounded-xl w-full mb-12 shadow-lg"
        />

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-8">
            Telegram is the most popular messaging channel in the OpenClaw ecosystem, and for good reason: five-minute setup, no webhook requirements, and it works everywhere. But most setup guides stop at getting your first response, skipping the DM pairing, group chat config, and production security that separate a demo from a deployment.
          </p>

          <p>
            This guide walks you through the complete Telegram setup for OpenClaw — BotFather token creation, channel configuration, DM pairing approval, group chat settings, and the production gotchas that break when you scale. By the end, you'll have a Telegram bot that's locked down, scales reliably, and handles both DMs and group chats without surprises.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Why Telegram Is OpenClaw's Most Popular Channel
          </h2>

          <p>
            Before diving into setup, it helps to understand why Telegram dominates. Three reasons stand out:
          </p>

          <p>
            <strong>Zero infrastructure.</strong> Unlike Slack or Discord, Telegram bots can use long-polling instead of webhooks. Your OpenClaw instance checks Telegram's servers for new messages. No public URL required. No reverse proxy. No TLS certificate. It works behind firewalls, behind NAT, even on a laptop with no port forwarding. You can run OpenClaw on your local machine and still chat with it from your phone.
          </p>

          <p>
            <strong>Instant bot creation.</strong> Telegram's BotFather is the fastest bot provisioning system across any platform. You open a chat, send <code>/newbot</code>, answer two questions, and get a working bot token in 90 seconds. No app review process. No business verification. No OAuth consent screen. Just a token.
          </p>

          <p>
            <strong>Cross-platform reach.</strong> Telegram runs on iOS, Android, macOS, Windows, Linux, and the web. Your agent is accessible from every device without platform-specific setup. One bot, every screen.
          </p>

          <p>
            For these reasons, Telegram is typically the first channel people connect when setting up OpenClaw, and often the only channel they need.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Step 1: Create Your Bot with BotFather
          </h2>

          <p>
            Every Telegram bot starts with BotFather, Telegram's official bot management tool. Open Telegram, search for <code>@BotFather</code>, and verify it has a blue checkmark. There are impersonators. If there's no checkmark, you're talking to the wrong account.
          </p>

          <p>Send <code>/newbot</code> and answer two questions:</p>

          <ul>
            <li>
              <strong>Name:</strong> The display name for your bot. Example: "DevOps Assistant" or "Support Agent". Use something descriptive.
            </li>
            <li>
              <strong>Username:</strong> A unique identifier ending in <code>bot</code>. Example: <code>devops_assistant_bot</code> or <code>support_agent_bot</code>. This can't be changed later.
            </li>
          </ul>

          <p>
            BotFather responds with your bot token. It looks like this:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code><YOUR_TELEGRAM_BOT_TOKEN></code>
          </pre>

          <p>
            <strong>Save this immediately.</strong> Treat it like a password. Anyone with this token can control your bot, read messages sent to it, and send messages from it. Do not commit it to version control or share it in screenshots.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-8">
            <p className="text-blue-900 font-semibold mb-2">🔐 Security Note</p>
            <p className="text-blue-800">
              Your bot token is a bearer credential. Store it in your <code>.env</code> file or a secrets manager, never in your config YAML. On{" "}
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                Clawer
              </Link>, tokens are encrypted in a vault on our control plane, never visible in logs or environment variables.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Step 2: Configure OpenClaw's Telegram Channel
          </h2>

          <p>
            With your bot token saved, configure the Telegram channel in OpenClaw. Open your <code>openclaw.yaml</code> config file and add:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`channels:
  telegram:
    enabled: true
    botToken: "<YOUR_TELEGRAM_BOT_TOKEN>"
    dmPolicy: "pairing"  # Require approval for new users (critical)
    groups:
      "*":
        requireMention: true`}</code>
          </pre>

          <p>
            If you're using environment variables (recommended for production), add the token to your <code>.env</code> file instead:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>TELEGRAM_BOT_TOKEN=<YOUR_TELEGRAM_BOT_TOKEN></code>
          </pre>

          <p>Then reference it in your config:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`channels:
  telegram:
    enabled: true
    # botToken pulled from TELEGRAM_BOT_TOKEN env var
    dmPolicy: "pairing"`}</code>
          </pre>

          <p>Restart your OpenClaw gateway to apply the config:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>openclaw gateway restart</code>
          </pre>

          <p>Check the logs to confirm Telegram initialized:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>openclaw logs --follow | grep -i telegram</code>
          </pre>

          <p>
            You should see a log line indicating the Telegram channel is polling. If you see an "Invalid token" error, double-check your <code>.env</code> file for typos or trailing whitespace.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Step 3: Understanding DM Pairing (Critical Security)
          </h2>

          <img
            src="/blog/openclaw-telegram-setup-pairing.png"
            alt="OpenClaw DM pairing workflow showing pairing request and admin approval process"
            className="rounded-xl w-full mb-8 shadow-lg"
          />

          <p>
            The <code>dmPolicy: "pairing"</code> setting is the single most important security configuration for your Telegram bot. Here's why it matters.
          </p>

          <p>
            Your OpenClaw agent isn't just a chatbot. It has tools: browsing the web, executing code, sending emails, querying databases. If your agent is connected to business services, anyone who can chat with it can potentially trigger those actions.
          </p>

          <p>Without DM pairing, here's the attack path:</p>

          <ol>
            <li>A stranger discovers your bot username (Telegram bot usernames are public and searchable)</li>
            <li>They start a conversation and send prompts</li>
            <li>Your agent responds and executes tools on behalf of an unauthorized user</li>
            <li>If the agent has CRM access, the attacker queries your customer data</li>
            <li>If the agent has email capabilities, the attacker sends emails from your agent's identity</li>
            <li>If the agent has code execution access, the attacker runs commands on your server</li>
          </ol>

          <p>
            This isn't theoretical. Security researchers demonstrated these attack vectors against OpenClaw instances with open DM policies during the{" "}
            <Link href="/blog/openclaw-security-guide" className="text-blue-600 hover:text-blue-700">
              42,000 exposed instances campaign
            </Link>.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            How Pairing Works
          </h3>

          <p>With <code>dmPolicy: "pairing"</code> enabled:</p>

          <ol>
            <li>A new user sends a message to your bot</li>
            <li>The bot does NOT respond with AI-generated content</li>
            <li>Instead, a pairing request is generated with a unique code</li>
            <li>You (the admin) review and approve or deny the request</li>
            <li>Only after approval does the bot begin responding to that user</li>
            <li>The approval persists — approved users don't need to pair again</li>
          </ol>

          <p>To approve a pairing request:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`# List pending pairing requests
openclaw pairing list telegram

# Approve a specific request
openclaw pairing approve telegram <CODE>`}</code>
          </pre>

          <p>
            This is the correct setting for any deployment where the agent has access to sensitive tools or business data. It ensures only authorized users can interact with your agent.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 my-8">
            <p className="text-yellow-900 font-semibold mb-2">⚠️ Open Mode Warning</p>
            <p className="text-yellow-800">
              You can set <code>dmPolicy: "open"</code> to skip pairing and let anyone chat with your bot. Only use this for public-facing bots with no access to internal systems, combined with strict tool sandboxing (<code>sandbox.mode: "all"</code>). Never run an agent with open DM policy and broad tool access.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Step 4: Group Chat Configuration
          </h2>

          <p>
            Telegram bots can join group chats, which is useful for team scenarios where multiple people need access to the same agent. Setting this up correctly requires understanding Telegram's group privacy model.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Privacy Mode Explained
          </h3>

          <p>
            Telegram bots have a "privacy mode" that controls what messages they can see in groups:
          </p>

          <ul>
            <li>
              <strong>Privacy mode ON (default):</strong> The bot only sees messages that start with <code>/commands</code> or <code>@mention</code> the bot. All other messages are invisible.
            </li>
            <li>
              <strong>Privacy mode OFF:</strong> The bot sees all messages in the group.
            </li>
          </ul>

          <p>
            You control this in BotFather with <code>/setprivacy</code>.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Recommended Setup: Privacy Mode ON
          </h3>

          <p>
            For most use cases, keep privacy mode ON and have users interact with the bot using @mentions:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`# In BotFather:
/setprivacy
# Select your bot → Choose "Enable"

# Users interact like this in groups:
@your_bot_username What's the status of the deployment?`}</code>
          </pre>

          <p>This approach has several advantages:</p>

          <ul>
            <li>The bot doesn't consume AI tokens processing irrelevant group conversation</li>
            <li>Users explicitly choose when to invoke the bot</li>
            <li>The bot's responses are clearly in context of a specific request</li>
            <li>You avoid sending every group message through your AI model API (which gets expensive fast in busy groups)</li>
          </ul>

          <p>In your OpenClaw config, ensure groups require mentions:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`channels:
  telegram:
    groups:
      "*":  # Applies to all groups
        requireMention: true`}</code>
          </pre>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Adding Your Bot to a Group
          </h3>

          <ol>
            <li>Open the group chat in Telegram</li>
            <li>Tap the group name to open settings</li>
            <li>Tap "Add Members"</li>
            <li>Search for your bot's username and add it</li>
            <li>Test with: <code>@your_bot_username Hello, are you online?</code></li>
          </ol>

          <p>
            <strong>Important:</strong> After changing privacy mode in BotFather, remove and re-add the bot to the group for the change to take effect.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Step 5: Production Gotchas and Rate Limiting
          </h2>

          <p>
            The setup above gets your bot working. These next items keep it working when you scale.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Telegram API Rate Limits
          </h3>

          <p>
            Telegram limits bots to 30 messages per second globally and 1 message per second per individual chat. If your agent sends messages faster than this, Telegram rejects them.
          </p>

          <p>
            This happens when your agent loops, sends a status update for each tool call, or processes a burst of queued messages. Configure a rate limit in OpenClaw to stay under Telegram's threshold:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`channels:
  telegram:
    # Limit outbound messages to 1 per second per chat
    textChunkLimit: 4000
    chunkMode: "newline"  # Split on paragraphs, not mid-sentence`}</code>
          </pre>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            AI Budget Protection
          </h3>

          <p>
            Rate limiting protects Telegram's API. Budget controls protect your wallet. If you're using OpenRouter or direct API keys, set a monthly spending limit:
          </p>

          <ul>
            <li>Log in to OpenRouter → Keys → Set monthly budget limit</li>
            <li>Start with $25-50 while testing</li>
            <li>When the limit is reached, requests are rejected gracefully instead of accruing charges</li>
          </ul>

          <p>
            This is especially important for Telegram bots because they're always online. A runaway conversation loop or heavy usage can consume tokens faster than expected.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Token Rotation
          </h3>

          <p>
            Telegram bot tokens don't expire, which means a leaked token remains valid indefinitely. Rotate your bot token every 90 days or immediately if you suspect it's been exposed.
          </p>

          <p>In BotFather:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`/revoke
# Select your bot → Confirm revocation
# BotFather generates a new token
# Update your .env file with the new token
# Restart your gateway`}</code>
          </pre>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Webhook vs. Polling: Which Should You Use?
          </h2>

          <img
            src="/blog/openclaw-telegram-setup-polling-vs-webhook.png"
            alt="Comparison diagram of Telegram long-polling vs webhook architecture for OpenClaw"
            className="rounded-xl w-full mb-8 shadow-lg"
          />

          <p>
            OpenClaw defaults to long-polling, which works out of the box with no networking configuration. Your OpenClaw instance makes outbound HTTPS requests to Telegram's servers to check for new messages.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Long-Polling (Recommended)
          </h3>

          <p><strong>Advantages:</strong></p>
          <ul>
            <li>Works behind firewalls and NAT</li>
            <li>No public URL required</li>
            <li>No TLS certificate needed</li>
            <li>Simpler to debug (no webhook delivery issues)</li>
          </ul>

          <p><strong>Disadvantages:</strong></p>
          <ul>
            <li>Slightly higher latency (1-3 seconds)</li>
            <li>Consumes slightly more bandwidth due to repeated API calls</li>
          </ul>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Webhook Mode (Advanced)
          </h3>

          <p>
            If you need sub-second latency, configure webhook mode. This requires a publicly accessible HTTPS endpoint:
          </p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{`channels:
  telegram:
    enabled: true
    webhookUrl: "https://your-domain.com/telegram/webhook"
    webhookSecret: "a-long-random-secret-string"`}</code>
          </pre>

          <p>
            <strong>Requirements:</strong> Your server must have a valid TLS certificate and a publicly reachable URL. If your gateway is bound to loopback (as it should be for security), you'll need a reverse proxy (Nginx or Caddy) to terminate TLS and forward webhook requests.
          </p>

          <p>
            <strong>Verdict:</strong> For 99% of use cases, long-polling is simpler and safer. The 1-3 second latency is imperceptible in a chat conversation, and the zero-config setup reduces your attack surface.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Troubleshooting Common Issues
          </h2>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Bot Doesn't Respond at All
          </h3>

          <p>Check the container is running:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>docker compose ps</code>
          </pre>

          <p>Verify the bot token is valid:</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>curl https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getMe</code>
          </pre>

          <p>
            If this returns <code>{`{"ok":false,"error_code":401}`}</code>, the token is invalid or has been revoked. Regenerate it in BotFather.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Bot Works in DMs but Not Groups
          </h3>

          <p>
            This is almost always a privacy mode issue. If privacy mode is enabled, the bot can only see messages that start with <code>/commands</code> or <code>@mention</code> the bot.
          </p>

          <p>Either:</p>
          <ul>
            <li>Disable privacy mode in BotFather (<code>/setprivacy</code> → Disable)</li>
            <li>Or instruct users to @mention the bot in group chats</li>
          </ul>

          <p>After changing privacy mode, remove and re-add the bot to the group.</p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            "Unauthorized" Errors in Logs
          </h3>

          <p>
            401 errors mean the bot token is incorrect, revoked, or contains trailing whitespace. Regenerate the token in BotFather, update your <code>.env</code> file, and restart the gateway.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Slow Responses (10+ Seconds)
          </h3>

          <p>Slow responses are usually caused by:</p>

          <ul>
            <li><strong>Model choice:</strong> Larger models (GPT-4o, Claude Sonnet 4) take 3-8 seconds. Smaller models (Haiku) are faster.</li>
            <li><strong>Tool execution:</strong> Each tool call adds time. Check logs to see what tools are being invoked.</li>
            <li><strong>Server resources:</strong> Underpowered VPS (&lt;2 vCPU, &lt;4GB RAM) can bottleneck. Check with <code>docker stats</code>.</li>
            <li><strong>API rate limits:</strong> If your AI model API key is being rate-limited, check logs for warnings.</li>
          </ul>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Skip the Config: Telegram on Clawer
          </h2>

          <p>
            That's the full setup: BotFather token, DM pairing, group chat config, rate limits, and token rotation. BotFather takes 2 minutes, but production security adds hours on top of the{" "}
            <Link href="/blog/how-to-set-up-openclaw" className="text-blue-600 hover:text-blue-700">
              base OpenClaw installation
            </Link>.
          </p>

          <p>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
              Clawer
            </Link>{" "}
            includes Telegram on every plan. Here's what that looks like:
          </p>

          <ul>
            <li>Create a bot in BotFather (takes 2 minutes — Telegram requires this step)</li>
            <li>Paste your bot token into the Clawer dashboard</li>
            <li>Done. Your agent is live on Telegram with DM pairing, rate limiting, and security hardening already configured</li>
          </ul>

          <p>
            Every security measure covered in this guide is applied automatically: container isolation, token encryption, automatic patching, and curated skill allowlists. You get a production-ready Telegram bot in under 5 minutes, not 5 hours.
          </p>

          <p>
            If you want full control and don't mind the configuration overhead, the guide above gives you everything you need. If you want to skip straight to a working bot and focus on what your agent actually does,{" "}
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">
              Clawer handles the infrastructure
            </Link>.
          </p>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 my-12">
            <h3 className="text-2xl font-bold mb-4">
              Deploy Your AI Team on Telegram in 60 Seconds
            </h3>
            <p className="text-blue-100 mb-6">
              Pre-configured Telegram bots with DM pairing, security hardening, and zero configuration. All AI models included. Start free.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              View Pricing →
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
            Frequently Asked Questions
          </h2>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            How do I find my Telegram user ID for whitelisting?
          </h3>
          <p>
            Message <code>@userinfobot</code> on Telegram and it will reply with your numeric user ID. You can also check <code>openclaw logs --follow</code> after DMing your bot and look for the <code>from.id</code> field.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            Can I use the same Telegram bot with multiple OpenClaw instances?
          </h3>
          <p>
            No. A Telegram bot token can only connect to one polling client at a time. If two instances try to use the same token, one will fail or both will get intermittent messages. Create a separate bot in BotFather for each instance.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            Does the bot work in Telegram broadcast channels?
          </h3>
          <p>
            Telegram channels are one-to-many broadcast channels, not interactive conversations. Bots can post to channels where they're admins, but they can't respond to individual messages. For interactive use cases, use direct messages or group chats.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            How much does Telegram integration cost?
          </h3>
          <p>
            The Telegram integration itself is free. The only costs are running your OpenClaw server and AI model API usage for generating responses. On Clawer, Telegram is included on every plan with no per-channel fee.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            What happens when I reach my AI budget limit?
          </h3>
          <p>
            If you're using OpenRouter with a budget cap, your agent stops generating responses when the limit is reached. On Clawer, the agent pauses gracefully and you receive a notification. Top up credits anytime to resume.
          </p>

          <div className="bg-gray-100 rounded-xl p-8 my-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Related Guides
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog/how-to-set-up-openclaw" className="text-blue-600 hover:text-blue-700 font-medium">
                  How to Set Up OpenClaw in 2026: Complete Guide →
                </Link>
              </li>
              <li>
                <Link href="/blog/openclaw-security-guide" className="text-blue-600 hover:text-blue-700 font-medium">
                  OpenClaw Security: Why 42,000+ Instances Are Exposed →
                </Link>
              </li>
              <li>
                <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:text-blue-700 font-medium">
                  Best OpenClaw Hosting in 2026: Honest Comparison →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </article>

      {/* Footer CTA */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Deploy Your AI Agent on Telegram?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Skip the setup. Get a production-ready Telegram bot in 60 seconds.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg transition text-lg"
          >
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
