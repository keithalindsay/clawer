import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Set Up OpenClaw in 2026: Complete Guide",
  description:
    "Set up OpenClaw on Mac, Linux, Windows, or a VPS — with real commands, API cost guidance, and a post-install workflow. Includes the no-server option.",
  openGraph: {
    title: "How to Set Up OpenClaw in 2026: Complete Setup Guide",
    description:
      "Set up OpenClaw on Mac, Linux, Windows, or a VPS — with real commands, API cost guidance, and a post-install workflow. Includes the no-server option.",
    type: "article",
    publishedTime: "2026-02-19T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Setup Guide", "Installation", "AI Assistant", "Tutorial"],
    url: "https://clawer.ai/blog/how-to-set-up-openclaw",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Set Up OpenClaw in 2026: Complete Setup Guide",
    description:
      "Set up OpenClaw on Mac, Linux, Windows, or a VPS — with real commands, API cost guidance, and a post-install workflow. Includes the no-server option.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/how-to-set-up-openclaw",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Set Up OpenClaw in 2026: Complete Setup Guide",
  description:
    "Set up OpenClaw on Mac, Linux, Windows, or a VPS — with real commands, API cost guidance, and a post-install workflow. Includes the no-server option.",
  datePublished: "2026-02-19",
  dateModified: "2026-02-19",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/how-to-set-up-openclaw",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I set up OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Run the one-line installer: `curl -fsSL https://openclaw.ai/install.sh | bash` on Mac or Linux, or `iwr -useb https://openclaw.ai/install.ps1 | iex` on Windows. The onboarding wizard handles the rest — model selection, API key entry, and optional channel setup (Telegram, WhatsApp, etc.). Total time: 10-30 minutes depending on whether you already have an API key.",
      },
    },
    {
      "@type": "Question",
      name: "Can I set up OpenClaw without a server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can run OpenClaw on your existing Mac, Linux machine, or Windows PC — no dedicated server required. OpenClaw runs as a background daemon on your machine. If you want it available 24/7 without keeping your computer on, you'd need a VPS (from $4/month on Hetzner) or a managed hosting service like Clawer.ai that handles everything for you.",
      },
    },
    {
      "@type": "Question",
      name: "Can I set up OpenClaw without coding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The installer is one copy-paste command — no coding required. However, you'll need to be comfortable with a terminal window, creating an API key on the AI provider's website, and following on-screen prompts. If you want a completely no-terminal setup, Clawer.ai's managed hosting requires zero command-line work.",
      },
    },
    {
      "@type": "Question",
      name: "What API key do I need for OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You need an API key from an AI model provider. The most popular choices are Anthropic (Claude models) and OpenAI (GPT models). For cost-conscious users, MiniMax and Google Gemini Flash are cheap options. Create an account on the provider's platform, fund it with $10-20 to start, and copy your API key. Monthly costs for moderate personal use typically run $5-30.",
      },
    },
    {
      "@type": "Question",
      name: "How long does OpenClaw setup take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The installer itself takes under 5 minutes. If you already have an API key, the full setup including Telegram channel configuration is about 15 minutes. WhatsApp setup adds 10-30 minutes due to QR pairing. VPS setup from scratch takes 1-3 hours. Managed hosting via Clawer.ai takes 60 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI model should I pick for OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For general use, Claude Sonnet 4.5 or GPT-4o mini are good starting points — capable enough for most tasks, not expensive. Avoid defaulting to the most powerful model (Claude Opus, GPT-4o) unless you have a specific reason — they cost 5-20x more per message. For budget users, MiniMax or Gemini Flash run fine for casual use at very low cost.",
      },
    },
  ],
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
      name: "How to Set Up OpenClaw",
      item: "https://clawer.ai/blog/how-to-set-up-openclaw",
    },
  ],
};

export default function HowToSetUpOpenClawPage() {
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
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Setup Guide</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">All Platforms</span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              How to Set Up OpenClaw in 2026: Complete Guide
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <time dateTime="2026-02-19">February 19, 2026</time>
              <span>·</span>
              <span>25 min read</span>
            </div>
          </header>

          {/* Hero Image */}
          <img
            src="/blog/how-to-set-up-openclaw-hero.png"
            alt="OpenClaw setup guide: terminal showing installation process with a messaging app on the right receiving AI responses"
            className="rounded-xl w-full mb-8"
          />

          {/* Content */}
          <div className="prose prose-lg prose-gray max-w-none">

            {/* Disclosure */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 my-6">
              <p className="text-sm text-amber-900 mb-0">
                <strong>Who wrote this:</strong> We&apos;re Clawer.ai, a managed OpenClaw hosting provider. We know this software deeply — we deploy it for hundreds of users. This guide covers the full self-hosted setup honestly, including the parts that are genuinely hard. We mention Clawer once, at the end, as one option among several.
              </p>
            </div>

            <p className="lead text-xl text-gray-700 mb-6">
              How you set up OpenClaw depends on how you plan to use it. Running it on your laptop for occasional use is a 10-minute job. Running it 24/7 on a VPS so your AI assistant is always reachable from WhatsApp is closer to 2 hours. And if you don&apos;t want to touch a server at all, managed hosting gets you there in 60 seconds.
            </p>

            <p className="text-gray-700 mb-6">
              This guide covers all three paths with real commands, honest API cost estimates, and a post-install workflow so you actually use OpenClaw instead of just installing it. Most setup tutorials stop at &quot;your gateway is running.&quot; This one doesn&apos;t.
            </p>

            {/* Choose Your Path */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Before You Start: Pick Your Setup Path
            </h2>

            <p className="text-gray-700 mb-6">
              There are three fundamentally different ways to run OpenClaw. The install commands are similar; what differs is where the gateway runs and who&apos;s responsible for keeping it up.
            </p>

            <div className="space-y-4 my-8">
              <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
                <p className="font-semibold text-gray-900 mb-1">📱 Path A: Local machine (your laptop/desktop)</p>
                <p className="text-gray-700 text-sm mb-0">
                  Good for: Testing, development, using OpenClaw when your machine is on.<br />
                  Bad for: 24/7 availability — your AI assistant stops responding when your computer sleeps.
                </p>
              </div>
              <div className="border border-green-200 rounded-lg p-5 bg-green-50">
                <p className="font-semibold text-gray-900 mb-1">🖥️ Path B: VPS (always-on cloud server)</p>
                <p className="text-gray-700 text-sm mb-0">
                  Good for: 24/7 availability, full control, lowest monthly cost if you&apos;re technical.<br />
                  Bad for: Requires Linux skills, manual security hardening, your time for maintenance.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <p className="font-semibold text-gray-900 mb-1">☁️ Path C: Managed hosting (no server needed)</p>
                <p className="text-gray-700 text-sm mb-0">
                  Good for: Non-technical users, 24/7 availability without maintaining infrastructure.<br />
                  Bad for: Less control, higher monthly cost than a VPS ($24–49/mo vs $4–12/mo).
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              If you&apos;re unsure: start with Path A to learn the software, then graduate to Path B or C once you know what you want. The configuration carries over.
            </p>

            {/* What you need */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              What You Need Before Installing
            </h2>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              1. Node.js 22+
            </h3>

            <p className="text-gray-700 mb-4">
              OpenClaw is Node.js-based. Check your version:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>node --version</code>
            </pre>
            <p className="text-gray-700 mb-6">
              If you see <code className="bg-gray-100 px-1 rounded text-sm">v22.x.x</code> or higher, you&apos;re fine. If not — or if <code className="bg-gray-100 px-1 rounded text-sm">node</code> isn&apos;t found — the installer script handles it automatically on Mac and Linux. On Windows, download Node 22 from <a href="https://nodejs.org" className="text-blue-600 hover:text-blue-700">nodejs.org</a> first.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              2. An API Key (and a funded account)
            </h3>

            <p className="text-gray-700 mb-4">
              OpenClaw itself is free. The AI models it talks to are not. You need an account with at least one provider. Here&apos;s the practical breakdown:
            </p>

            <div className="overflow-x-auto my-6 -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">Provider</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">Recommended Model</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">~$/1M tokens</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">~Monthly (moderate use)</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3 font-medium">Anthropic</td>
                    <td className="py-3 px-3">Claude Sonnet 4.5</td>
                    <td className="text-right py-3 px-3">$3 in / $15 out</td>
                    <td className="text-right py-3 px-3 text-green-700">$5–25</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 px-3 font-medium">OpenAI</td>
                    <td className="py-3 px-3">GPT-4o mini</td>
                    <td className="text-right py-3 px-3">$0.15 / $0.60</td>
                    <td className="text-right py-3 px-3 text-green-700">$1–10</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3 font-medium">MiniMax</td>
                    <td className="py-3 px-3">M2.5 Flash</td>
                    <td className="text-right py-3 px-3">~$0.10 / $0.40</td>
                    <td className="text-right py-3 px-3 text-green-700">&lt;$5</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 px-3 font-medium">Google</td>
                    <td className="py-3 px-3">Gemini Flash</td>
                    <td className="text-right py-3 px-3">$0.075 / $0.30</td>
                    <td className="text-right py-3 px-3 text-green-700">&lt;$5</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3 font-medium">Ollama (local)</td>
                    <td className="py-3 px-3">Llama 3 / Qwen</td>
                    <td className="text-right py-3 px-3">Free</td>
                    <td className="text-right py-3 px-3 text-green-700">$0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 mb-6">
              <strong>Practical guidance:</strong> Start with $10–20 on Anthropic or OpenAI. Don&apos;t default to the most powerful model (Claude Opus 4.5, GPT-4o) — they cost 5–20x more per message and you won&apos;t feel a difference for everyday tasks. Claude Sonnet 4.5 is the sweet spot for most users. If budget is tight, GPT-4o mini or Gemini Flash are genuinely capable at a fraction of the cost.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
              <p className="text-sm text-yellow-900 mb-0">
                <strong>Don&apos;t forget:</strong> Create your API key and fund your account <em>before</em> running the installer. The wizard will ask for it partway through. Having it ready saves 10 minutes of pause-and-go.
              </p>
            </div>

            {/* PATH A: Local install */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Path A: Install OpenClaw on Your Local Machine
            </h2>

            <img
              src="/blog/how-to-set-up-openclaw-install.png"
              alt="OpenClaw installation wizard in terminal showing model selection and channel setup steps"
              className="rounded-xl w-full my-6"
            />

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Mac and Linux
            </h3>

            <p className="text-gray-700 mb-4">
              Open Terminal and paste this:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>curl -fsSL https://openclaw.ai/install.sh | bash</code>
            </pre>
            <p className="text-gray-700 mb-6">
              The script downloads and installs the OpenClaw CLI, then automatically launches the onboarding wizard. From here, everything is interactive.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Windows
            </h3>

            <p className="text-gray-700 mb-4">
              Open PowerShell (not Command Prompt) and run:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>iwr -useb https://openclaw.ai/install.ps1 | iex</code>
            </pre>
            <p className="text-gray-700 mb-6">
              This is the native Windows installer — no WSL required. If you hit an execution policy error, run <code className="bg-gray-100 px-1 rounded text-sm">Set-ExecutionPolicy RemoteSigned -Scope CurrentUser</code> first, then retry.
            </p>

            <p className="text-gray-700 mb-4">
              Alternatively, if you prefer managing your own Node environment:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`npm install -g openclaw@latest
openclaw onboard --install-daemon`}</code>
            </pre>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Walking Through the Onboarding Wizard
            </h3>

            <p className="text-gray-700 mb-4">
              The wizard has six steps. Here&apos;s what to expect at each one:
            </p>

            <ol className="list-decimal pl-6 mb-6 space-y-4 text-gray-700">
              <li>
                <strong>Security acknowledgment.</strong> OpenClaw shows a security advisory and asks you to confirm you understand the risks. Read it — it&apos;s not boilerplate. The software has significant capabilities (shell access, file system, network). Hit Yes to continue.
              </li>
              <li>
                <strong>Installation type.</strong> Choose <strong>QuickStart</strong> unless you have a specific reason not to. It sets secure defaults that you can tune later. The &quot;Custom&quot; option is for people who know exactly what they want to change.
              </li>
              <li>
                <strong>Model provider.</strong> Pick your AI provider from the list. The wizard will ask for your API key immediately after. Have it copied to your clipboard.
              </li>
              <li>
                <strong>Model selection.</strong> The wizard shows available models from your provider. Don&apos;t pick the top of the list by default — that&apos;s usually the most expensive. <code className="bg-gray-100 px-1 rounded text-sm">claude-sonnet-4-5</code> or <code className="bg-gray-100 px-1 rounded text-sm">gpt-4o-mini</code> are good starting points.
              </li>
              <li>
                <strong>Channel setup (optional).</strong> Pick a messaging channel — Telegram is the easiest. You can skip this and use the web dashboard instead if you just want to test. You can add channels later with <code className="bg-gray-100 px-1 rounded text-sm">openclaw channels login</code>.
              </li>
              <li>
                <strong>Skills (optional).</strong> The wizard asks if you want to install skills. Skip for now — install skills after you&apos;ve verified the basics work. A bad skill at install time is harder to debug.
              </li>
            </ol>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Verify It&apos;s Working
            </h3>

            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`openclaw gateway status   # should show "running"
openclaw health           # full health check
openclaw dashboard        # opens the web dashboard`}</code>
            </pre>

            <p className="text-gray-700 mb-6">
              The dashboard opens at <code className="bg-gray-100 px-1 rounded text-sm">http://127.0.0.1:18789</code>. If it prompts for a token, get it with:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>openclaw config get gateway.auth.token</code>
            </pre>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
              <p className="text-sm text-red-900 mb-0">
                <strong>Security note:</strong> Do not expose the dashboard URL publicly. It&apos;s an admin surface with full access to your agent and its tools. Localhost only — or use Tailscale if you need remote access.
              </p>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Common Install Errors and Fixes
            </h3>

            <div className="space-y-4 my-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1 font-mono text-sm">sharp: Please add node-gyp to your dependencies</p>
                <p className="text-gray-700 text-sm mb-2">This happens when you have a global libvips (common on macOS with Homebrew). Fix:</p>
                <pre className="bg-gray-900 text-green-400 rounded text-xs p-3 mb-0">
                  <code>SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest</code>
                </pre>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1 font-mono text-sm">pnpm: Ignored build scripts</p>
                <p className="text-gray-700 text-sm mb-2">If you use pnpm, it requires explicit approval for packages with build scripts. After the warning appears:</p>
                <pre className="bg-gray-900 text-green-400 rounded text-xs p-3 mb-0">
                  <code>pnpm approve-builds -g</code>
                </pre>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1 font-mono text-sm">Windows: PowerShell execution policy error</p>
                <p className="text-gray-700 text-sm mb-2">Run this first, then retry the installer:</p>
                <pre className="bg-gray-900 text-green-400 rounded text-xs p-3 mb-0">
                  <code>Set-ExecutionPolicy RemoteSigned -Scope CurrentUser</code>
                </pre>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1 font-mono text-sm">Port 18789 already in use</p>
                <p className="text-gray-700 text-sm mb-2">Another process has that port. Start with a custom port:</p>
                <pre className="bg-gray-900 text-green-400 rounded text-xs p-3 mb-0">
                  <code>openclaw gateway --port 19000</code>
                </pre>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1 font-mono text-sm">Wizard completed but agent isn&apos;t responding to messages</p>
                <p className="text-gray-700 text-sm mb-2">Check the logs first — most issues show a clear error there:</p>
                <pre className="bg-gray-900 text-green-400 rounded text-xs p-3 mb-0">
                  <code>{`openclaw logs tail              # live log stream
journalctl -u openclaw -f      # if installed as systemd service
openclaw gateway status        # confirm gateway is actually running`}</code>
                </pre>
                <p className="text-gray-700 text-xs mt-2 mb-0">Common causes: invalid API key, wrong model name, channel token expired (re-run <code className="bg-gray-800 px-1 rounded">openclaw channels login</code>).</p>
              </div>
            </div>

            {/* PATH B: VPS */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Path B: Setting Up OpenClaw on a VPS (Always-On)
            </h2>

            <p className="text-gray-700 mb-6">
              If you want your AI assistant reachable 24/7 without keeping your laptop running, you need an always-on server. The cheapest options: Hetzner starts at €3.79/month (community favorite), DigitalOcean starts at $8/month (best security defaults). For a full comparison, see our <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:text-blue-700">hosting comparison</Link>.
            </p>

            <p className="text-gray-700 mb-4">
              <strong>Minimum VPS specs:</strong> 2 vCPUs, 4GB RAM, 40GB SSD. Ubuntu 22.04 or 24.04 LTS recommended.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Step 1: Provision and Secure the Server
            </h3>

            <p className="text-gray-700 mb-4">
              SSH into your fresh server and lock it down before installing anything:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`# Create a non-root user
adduser openclaw
usermod -aG sudo openclaw

# Configure firewall (allow SSH, HTTP, HTTPS only)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw limit 22/tcp   # rate-limit SSH to prevent brute force
sudo ufw enable

# Switch to the non-root user for the rest of setup
su - openclaw`}</code>
            </pre>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
              <p className="text-sm text-red-900 mb-0">
                <strong>Don&apos;t skip the firewall.</strong> Over 42,000 OpenClaw instances are reachable from the public internet without auth. Don&apos;t be one of them. Read our <Link href="/blog/openclaw-security-guide" className="text-blue-600 hover:text-blue-700 text-sm">OpenClaw security guide</Link> for the full picture.
              </p>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Step 2: Install Node.js 22
            </h3>

            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should show v22.x.x`}</code>
            </pre>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Step 3: Install OpenClaw
            </h3>

            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>curl -fsSL https://openclaw.ai/install.sh | bash</code>
            </pre>

            <p className="text-gray-700 mb-6">
              Follow the same wizard steps as Path A. The difference: when it asks about running as a daemon, say <strong>Yes</strong> — this registers OpenClaw as a systemd service that restarts automatically after reboots and crashes.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Step 4: Lock Down the Configuration
            </h3>

            <p className="text-gray-700 mb-4">
              After the wizard completes, open the config file and make two important changes:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>nano ~/.openclaw/openclaw.json</code>
            </pre>

            <p className="text-gray-700 mb-4">Key settings to check:</p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`{
  "gateway": {
    "host": "127.0.0.1",  // NOT 0.0.0.0 — keep it localhost-only
    "port": 18789,
    "auth": {
      "token": "your-generated-token"  // verify this exists
    }
  }
}`}</code>
            </pre>

            <p className="text-gray-700 mb-6">
              If <code className="bg-gray-100 px-1 rounded text-sm">host</code> shows <code className="bg-gray-100 px-1 rounded text-sm">0.0.0.0</code>, change it to <code className="bg-gray-100 px-1 rounded text-sm">127.0.0.1</code> immediately. Binding to all interfaces on a public server exposes your OpenClaw instance to the internet.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Step 5: Verify the Daemon Is Running
            </h3>

            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`openclaw gateway status
# If using systemd:
systemctl status openclaw`}</code>
            </pre>

            <p className="text-gray-700 mb-6">
              If you need to access the dashboard remotely without exposing it publicly, use an SSH tunnel:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>ssh -L 18789:localhost:18789 user@your-server-ip</code>
            </pre>
            <p className="text-gray-700 mb-6">
              Then open <code className="bg-gray-100 px-1 rounded text-sm">http://localhost:18789</code> in your local browser. The tunnel forwards traffic securely without exposing the port.
            </p>

            {/* PATH C: Managed */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Path C: OpenClaw Without a Server
            </h2>

            <p className="text-gray-700 mb-6">
              If you want a 24/7 AI assistant without managing a server, managed hosting handles everything. No terminal required. The tradeoff: you pay $24–49/month instead of $4–12/month for a VPS, and you give up some control over the underlying infrastructure.
            </p>

            <p className="text-gray-700 mb-6">
              The main managed options right now: <strong>Clawer.ai</strong> (includes AI models — no API key needed), <strong>xCloud</strong> ($24/month, BYOK), and <strong>OpenClaw AWS Hosting</strong> (best for teams). We compared all of them in our <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:text-blue-700">hosting comparison</Link>.
            </p>

            <p className="text-gray-700 mb-6">
              If you want to try the managed route: <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">Clawer.ai offers 100 free messages</Link> with no credit card required — useful for evaluating whether OpenClaw fits your workflow before committing to either a VPS or a paid managed plan.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 my-6">
              <p className="font-semibold text-gray-900 mb-2">When managed hosting actually makes sense</p>
              <p className="text-gray-700 text-sm mb-0">
                The math here is straightforward. If your time is worth $30/hour and setup takes 2 hours ($60) and monthly maintenance takes 3 hours ($90/month), a $24/month managed service pays for itself in month one. If you genuinely enjoy infrastructure work and have the skills, self-hosting wins on cost and control. Neither answer is wrong — but be honest with yourself about which category you fall into. More detail in our <Link href="/blog/openclaw-self-hosted-vs-managed" className="text-blue-600 hover:text-blue-700">self-hosted vs managed comparison</Link>.
              </p>
            </div>

            {/* Channel Setup */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Connecting Your First Messaging Channel
            </h2>

            <p className="text-gray-700 mb-6">
              OpenClaw&apos;s power is messaging your AI agent from the apps you already use. The web dashboard is fine for setup and testing, but the real experience is texting your assistant from WhatsApp or Telegram. Here&apos;s how to connect each.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Telegram (Start Here — Easiest)
            </h3>

            <ol className="list-decimal pl-6 mb-6 space-y-3 text-gray-700">
              <li>Open Telegram and search for <strong>@BotFather</strong>.</li>
              <li>Send <code className="bg-gray-100 px-1 rounded text-sm">/newbot</code>, pick a name, pick a username (must end in <code className="bg-gray-100 px-1 rounded text-sm">bot</code>).</li>
              <li>BotFather sends you a token. Copy it.</li>
              <li>
                In your terminal:
                <pre className="bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto text-sm my-2">
                  <code>openclaw channels login</code>
                </pre>
              </li>
              <li>Select Telegram, paste the token when prompted.</li>
              <li>Open your new bot in Telegram and send it a message. You should get an AI response within a few seconds.</li>
            </ol>

            <p className="text-gray-700 mb-6">
              If you want the bot only responding to you (recommended), restrict access in your config. For more detail, see our dedicated <Link href="/blog/openclaw-telegram-setup" className="text-blue-600 hover:text-blue-700">Telegram setup guide</Link>.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              WhatsApp (10–30 minutes, more steps)
            </h3>

            <p className="text-gray-700 mb-4">
              WhatsApp connection uses the Baileys library for unofficial WhatsApp Web API access. It&apos;s not the official Meta Business API — it&apos;s the same protocol your phone uses when you open WhatsApp Web. This means no account approval process, but also Meta technically prohibits it in their ToS.
            </p>

            <ol className="list-decimal pl-6 mb-6 space-y-3 text-gray-700">
              <li>
                Run the channel login:
                <pre className="bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto text-sm my-2">
                  <code>openclaw channels login</code>
                </pre>
              </li>
              <li>Select WhatsApp from the channel list.</li>
              <li>A QR code appears in your terminal. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device.</li>
              <li>Scan the QR code. The pairing takes a few seconds.</li>
              <li>Send your OpenClaw agent a message from your phone to confirm it&apos;s working.</li>
            </ol>

            <p className="text-gray-700 mb-6">
              WhatsApp sessions expire periodically and need to be re-paired. This is a known limitation of the unofficial API. If reliability matters, Telegram is more stable. For a deeper walkthrough of WhatsApp-specific gotchas, see our <Link href="/blog/openclaw-whatsapp-setup" className="text-blue-600 hover:text-blue-700">WhatsApp setup guide</Link>.
            </p>

            {/* Config Explained */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Understanding Your Configuration File
            </h2>

            <p className="text-gray-700 mb-4">
              OpenClaw stores everything in <code className="bg-gray-100 px-1 rounded text-sm">~/.openclaw/openclaw.json</code>. Most guides skip explaining what&apos;s in there. Here are the settings that actually matter:
            </p>

            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`{
  "gateway": {
    "host": "127.0.0.1",  // KEEP THIS. Don't change to 0.0.0.0.
    "port": 18789,
    "auth": {
      "token": "abc123..."  // Your access token. Guard this.
    }
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"],  // Only allow your number
      "groups": {
        "*": { "requireMention": true }  // In groups, require @mention
      }
    }
  },
  "messages": {
    "groupChat": {
      "mentionPatterns": ["@openclaw"]  // How to trigger the bot in groups
    }
  }
}`}</code>
            </pre>

            <p className="text-gray-700 mb-4">
              The <code className="bg-gray-100 px-1 rounded text-sm">allowFrom</code> list is your primary access control. If it&apos;s empty, anyone who messages your bot can interact with your AI agent — including seeing its capabilities and potentially its tools. Add your phone number there immediately.
            </p>

            {/* Post-install workflow */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Your First Hour: What to Actually Do After Setup
            </h2>

            <img
              src="/blog/how-to-set-up-openclaw-workflow.png"
              alt="OpenClaw first-use workflow showing a WhatsApp conversation with an AI assistant completing calendar, research, and writing tasks"
              className="rounded-xl w-full my-6"
            />

            <p className="text-gray-700 mb-6">
              Most setup guides stop once the gateway is running. That&apos;s where the useful stuff begins. Here&apos;s a 60-minute workflow to actually get value from OpenClaw on day one:
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              First 10 Minutes: Test Basic Capabilities
            </h3>

            <p className="text-gray-700 mb-4">
              Send your agent these messages from your channel of choice (or the dashboard). They verify different capabilities are working:
            </p>

            <div className="space-y-3 my-6">
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="font-mono text-sm text-gray-800 mb-1">&quot;What&apos;s today&apos;s date and time?&quot;</p>
                <p className="text-xs text-gray-500">Tests: basic connectivity, model responding</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="font-mono text-sm text-gray-800 mb-1">&quot;Search the web for the latest OpenClaw release version&quot;</p>
                <p className="text-xs text-gray-500">Tests: web browsing skill (if installed), tool use</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="font-mono text-sm text-gray-800 mb-1">&quot;What tools and capabilities do you have right now?&quot;</p>
                <p className="text-xs text-gray-500">Tests: self-awareness, lists installed skills</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="font-mono text-sm text-gray-800 mb-1">&quot;Create a file in my workspace called test.txt with the content &apos;setup working&apos;&quot;</p>
                <p className="text-xs text-gray-500">Tests: filesystem access — may trigger an approval dialog</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Next 20 Minutes: Give It a Soul (Persona + Memory)
            </h3>

            <p className="text-gray-700 mb-4">
              OpenClaw agents are blank by default — capable but generic. Tell yours who it is:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded p-4 my-4">
              <p className="font-mono text-sm text-gray-800 mb-0">
                &quot;Your name is [name]. You help me with [your main use case]. You know that I [relevant context about you]. When I ask for something, you should [preferred behavior]. Save this as your memory so you remember it every session.&quot;
              </p>
            </div>

            <p className="text-gray-700 mb-6">
              OpenClaw has persistent memory — it can save notes to a file that gets loaded on each session. The more context you give it upfront, the less explaining you do later. Treat this like onboarding an employee: time invested now pays back in every future conversation.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Remaining 30 Minutes: Run a Real Task
            </h3>

            <p className="text-gray-700 mb-4">
              Pick something you actually need done today. Good first tasks:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Draft an email from a bullet list of points</li>
              <li>Research a topic and give you a 5-point summary</li>
              <li>Write a script that does something on your computer</li>
              <li>Set up a cron job to send you a morning briefing</li>
              <li>Summarize a document you paste in</li>
            </ul>

            <p className="text-gray-700 mb-6">
              The goal isn&apos;t to test limits — it&apos;s to find the workflow that makes you reach for OpenClaw instead of doing the thing manually. That&apos;s when the setup cost pays off.
            </p>

            {/* Security hardening */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Security Checklist Before You Share Access
            </h2>

            <p className="text-gray-700 mb-4">
              Before adding anyone else to your OpenClaw instance — or before trusting it with anything sensitive — verify these five things:
            </p>

            <div className="space-y-3 my-6">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-0">Gateway is bound to localhost only</p>
                  <p className="text-gray-600 text-sm"><code className="bg-gray-100 px-1 rounded text-xs">openclaw config get gateway.host</code> → should show <code className="bg-gray-100 px-1 rounded text-xs">127.0.0.1</code></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-0">Auth token is set and non-empty</p>
                  <p className="text-gray-600 text-sm"><code className="bg-gray-100 px-1 rounded text-xs">openclaw config get gateway.auth.token</code> → should return a long random string</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-0">Channel allowFrom list is set</p>
                  <p className="text-gray-600 text-sm">Your phone number is in the allowFrom list for each channel you connected</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-0">Skills vetted before installing</p>
                  <p className="text-gray-600 text-sm">ClawHub has known malware-infected skills. Check the <a href="https://github.com/cisco-ai-defense/skill-scanner" className="text-blue-600 hover:text-blue-700 text-sm">Cisco Skill Scanner</a> before installing any community skill.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-0">Run the built-in security audit</p>
                  <p className="text-gray-600 text-sm"><code className="bg-gray-100 px-1 rounded text-xs">openclaw security audit --deep</code> — checks your config against known insecure patterns</p>
                </div>
              </div>
            </div>

            {/* Keeping it updated */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Keeping OpenClaw Updated
            </h2>

            <p className="text-gray-700 mb-4">
              OpenClaw ships updates frequently — new features, bug fixes, and occasionally security patches. CVE-2026-25253 (one-click RCE through share links) required an emergency patch, and a significant portion of self-hosted instances hadn&apos;t updated weeks later.
            </p>

            <p className="text-gray-700 mb-4">Update commands:</p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm my-4">
              <code>{`# Check your current version
openclaw --version

# Update (npm)
npm update -g openclaw

# Or with the update command (if available in your version)
openclaw update`}</code>
            </pre>

            <p className="text-gray-700 mb-6">
              Set a monthly reminder to check for updates. If a CVE is announced in the OpenClaw security channel, patch that day — don&apos;t wait.
            </p>

            {/* FAQ */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6 my-8">
              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Can I set up OpenClaw without coding?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  The installer is a single copy-paste command. You don&apos;t need to write any code — just follow the interactive wizard prompts. You do need to be comfortable opening a terminal window and navigating a few prompts. If even that is too much friction, Clawer.ai&apos;s managed hosting requires zero terminal work — just a web browser.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Can I set up OpenClaw without a server?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  Yes — OpenClaw runs fine on your local Mac, Linux, or Windows machine. The limitation is that it stops working when your computer is off or asleep. For always-on access from your phone, you need either a VPS (cheap, requires Linux skills) or managed hosting (more expensive, no setup). There is no &quot;middle path&quot; that&apos;s both free and always-on without running some hardware somewhere.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  How much does OpenClaw cost per month?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  OpenClaw itself is free and open-source. Your costs are: AI model API fees ($5–30/month for moderate personal use, depending on model) plus optional server costs ($4–12/month for a VPS, or $24–49/month for managed hosting). Total: $5–80/month depending on your setup. Managed hosting like Clawer.ai includes model access, so no separate API costs.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Which model should I pick for OpenClaw?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  For most users: Claude Sonnet 4.5 (Anthropic) or GPT-4o mini (OpenAI). Both are capable for everyday tasks at reasonable cost. Avoid Claude Opus or GPT-4o as your default — they&apos;re 10–20x more expensive and you won&apos;t feel the quality difference for typical chat, research, and writing tasks. If budget matters, Gemini Flash or MiniMax M2.5 are surprisingly good at very low cost.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Is OpenClaw safe to install?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  The core software is safe — it&apos;s open-source and actively maintained. The risks are in how you configure it. If you expose your gateway to the internet (binding to 0.0.0.0) without authentication, your AI agent is accessible to anyone. If you install skills from ClawHub without vetting them, you may install malware. Follow the security checklist above and you&apos;re in good shape.
                </p>
              </details>

              <details className="border border-gray-200 rounded-lg p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  My OpenClaw stops responding when my laptop sleeps. How do I fix this?
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-3">
                  This is expected behavior for local installations. Options: (1) Use a Mac utility like Amphetamine to keep your machine awake. (2) Move to a VPS so the server runs 24/7 regardless of your laptop. (3) Use managed hosting, which handles availability for you. The VPS path gives you 24/7 access for $4–12/month and is the right call if you find yourself hitting this limitation frequently.
                </p>
              </details>
            </div>

            {/* Summary */}
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Summary: Which Setup is Right for You
            </h2>

            <div className="overflow-x-auto my-8 -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">If you...</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Use this path</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Want to try OpenClaw before committing</td>
                    <td className="py-3 px-4">Path A (local) or Clawer free tier</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 px-4">Are comfortable with Docker and Linux</td>
                    <td className="py-3 px-4">Path B (VPS — Hetzner or DigitalOcean)</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Want 24/7 availability, no server work</td>
                    <td className="py-3 px-4">Path C (managed hosting)</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 px-4">Already have API keys and want cheap hosting</td>
                    <td className="py-3 px-4">Path B (VPS) or xCloud managed</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Don&apos;t want to manage API keys at all</td>
                    <td className="py-3 px-4">Clawer.ai (models included)</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 px-4">Running local AI models (Ollama, Llama)</td>
                    <td className="py-3 px-4">Path B with Contabo (most RAM per dollar)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 mb-6">
              Whatever path you choose, the setup is the easy part. The value comes from the first month of actual use — what tasks you delegate, what workflows you build, what you stop doing manually because your AI assistant handles it. Give OpenClaw real work to do, not just test prompts, and you&apos;ll understand quickly why the project has 170,000+ GitHub stars.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 my-8">
              <p className="text-lg font-semibold text-gray-900 mb-3">
                Skip the setup entirely →{" "}
                <Link href="/pricing" className="text-blue-600 hover:text-blue-700 underline">
                  Try Clawer free
                </Link>
              </p>
              <p className="text-gray-700 mb-0">
                100 messages included, no credit card required, no server setup, AI models included. If you decide self-hosting is the right move after testing, the knowledge carries over — OpenClaw config is config regardless of where it runs.
              </p>
            </div>

            <hr className="my-8 border-gray-200" />

            <p className="text-sm text-gray-500 italic mb-2">
              Last updated: February 19, 2026. Commands verified against OpenClaw current stable release.
            </p>
            <p className="text-sm text-gray-500 italic">
              Clawer.ai is an independent managed OpenClaw hosting provider. We are not affiliated with the OpenClaw open-source project.
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
