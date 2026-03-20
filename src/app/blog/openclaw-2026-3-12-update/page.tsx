import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw 2026.3.12: Dashboard Overhaul + 4 CVEs Patched",
  description:
    "OpenClaw 2026.3.12 ships dashboard-v2, AI-Infra-Guard security scanning, and patches for 4 critical CVEs including a CVSS 9.9 WebSocket exploit.",
  openGraph: {
    title: "OpenClaw 2026.3.12: Dashboard Overhaul + 4 CVEs Patched",
    description:
      "OpenClaw 2026.3.12 ships dashboard-v2, AI-Infra-Guard security scanning, and patches for 4 critical CVEs including a CVSS 9.9 WebSocket exploit.",
    type: "article",
    publishedTime: "2026-03-20T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Security", "Update", "Dashboard", "CVE", "AI Agent"],
    url: "https://clawer.ai/blog/openclaw-2026-3-12-update",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw 2026.3.12: Dashboard Overhaul + 4 CVEs Patched",
    description:
      "OpenClaw 2026.3.12 ships dashboard-v2, AI-Infra-Guard security scanning, and patches for 4 critical CVEs including a CVSS 9.9 WebSocket exploit.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-2026-3-12-update",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw 2026.3.12: Dashboard Overhaul + 4 Critical CVEs Patched",
  description:
    "OpenClaw 2026.3.12 dropped on March 12, 2026 with a complete dashboard redesign, built-in security scanning, and patches for four critical CVEs including a CVSS 9.9 WebSocket privilege escalation. Here's what changed and what to do if you self-host.",
  datePublished: "2026-03-20",
  dateModified: "2026-03-20",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-2026-3-12-update",
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
      name: "OpenClaw 2026.3.12 Update",
      item: "https://clawer.ai/blog/openclaw-2026-3-12-update",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are the critical CVEs patched in OpenClaw 2026.3.12?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenClaw 2026.3.12 patches four critical vulnerabilities: (1) WebSocket Privilege Escalation (CVSS 9.9) allowing any authenticated client to self-grant admin scope, (2) Feishu Webhook Forgery (CVSS 8.6) enabling attackers to impersonate Feishu senders, (3) Credential Exposure in Setup Codes (CVSS 5.3) embedding long-lived auth tokens in QR codes, and (4) Exec Approval Bypass (CVSS 5.3) allowing agents to execute commands without user approval.",
      },
    },
    {
      "@type": "Question",
      name: "What is dashboard-v2 in OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dashboard-v2 is a complete rewrite of the OpenClaw Control UI with modular architecture. It features a command palette (Ctrl+K or Cmd+K), mobile-first navigation with bottom tabs, separate views for chat/config/agents/sessions, and slash commands for quick actions. Initial load time is 40% faster due to lazy loading, and mobile navigation is now thumb-reachable.",
      },
    },
    {
      "@type": "Question",
      name: "What is AI-Infra-Guard v4.0?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI-Infra-Guard v4.0 is OpenClaw's built-in security framework that adds OpenClaw Security Scan (one-click configuration auditing) and Agent-Scan (dynamic testing for multi-agent workflows). It evaluates network exposure, plugin permissions, API key storage, and agent capability boundaries, then generates a risk score with specific remediation steps. Agent-Scan simulates adversarial agents to test for privilege escalation and prompt injection vulnerabilities.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to upgrade to OpenClaw 2026.3.12?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, if you self-host. The CVSS 9.9 WebSocket privilege escalation vulnerability is trivial to exploit and allows any authenticated user to grant themselves full admin access. Update to 2026.3.12, rotate gateway credentials, configure encryptKey for Feishu integrations if used, and review your security hardening setup.",
      },
    },
    {
      "@type": "Question",
      name: "What are bootstrap tokens in OpenClaw 2026.3.12?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bootstrap tokens replace long-lived gateway credentials in device pairing. They expire after 15 minutes, are single-use only, and provide limited scope access for device registration. This prevents attackers who intercept pairing codes from gaining persistent gateway access. Use 'openclaw token generate --bootstrap' for automated provisioning scripts.",
      },
    },
    {
      "@type": "Question",
      name: "How do I upgrade my OpenClaw instance to 2026.3.12?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For self-hosted instances: update via your package manager (npm, Docker, binary), restart the gateway, then rotate gateway credentials. Update browser bookmarks from hash-based routing (/#/agents) to route-based (/dashboard/agents). For Clawer.ai users, all instances were automatically upgraded with zero downtime on March 13, 2026.",
      },
    },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="mb-4 flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
            <time dateTime="2026-03-20">March 20, 2026</time>
            <span>•</span>
            <span>15 min read</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            OpenClaw 2026.3.12: Dashboard Overhaul + 4 Critical CVEs Patched
          </h1>
          <p className="text-xl leading-relaxed text-neutral-600 dark:text-neutral-300">
            OpenClaw 2026.3.12 dropped on March 12 with a complete dashboard redesign,
            built-in security scanning, and patches for four critical vulnerabilities
            including a CVSS 9.9 WebSocket privilege escalation. Here's what changed and
            what to do if you self-host.
          </p>
        </header>

        <img
          src="/blog/openclaw-2026-3-12-hero.png"
          alt="OpenClaw 2026.3.12 dashboard-v2 redesign with command palette and security scanning interface"
          className="mb-12 w-full rounded-xl shadow-lg"
        />

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          <p>
            If you self-host OpenClaw, this release demands immediate attention. Four
            critical CVEs got patched, including one that scores CVSS 9.9. If you're running
            an older version, any authenticated user can grant themselves admin access with
            a single WebSocket handshake.
          </p>

          <p>
            But 2026.3.12 isn't just a security release. It's also the biggest UX overhaul
            since OpenClaw went viral — a complete dashboard redesign, built-in security
            scanning, Kubernetes support, and provider plugin architecture that decouples
            local inference from core.
          </p>

          <p>
            This is the "what changed and why it matters" breakdown for people who actually
            run OpenClaw in production.
          </p>

          <h2 id="the-four-critical-cves">The Four Critical CVEs You Need to Know About</h2>

          <p>
            On March 13, four security advisories hit OpenClaw. If you haven't upgraded yet,
            you're vulnerable. Here's what got fixed:
          </p>

          <h3 id="websocket-privilege-escalation">1. WebSocket Privilege Escalation (CVSS 9.9)</h3>

          <p>
            This is the big one. Any authenticated client could self-declare{" "}
            <code>operator.admin</code> scope during the WebSocket handshake. The server
            never verified whether the device identity actually had that scope.
          </p>

          <p>
            A low-privilege user could grant themselves full admin access to your gateway.
            The attack is trivial — no exploitation confirmed in the wild, but only because
            nobody was looking. Fixed in 2026.3.12.
          </p>

          <p>
            <strong>Impact:</strong> Complete gateway compromise. An attacker with basic
            access could read all agent configurations, modify workflow triggers, or inject
            arbitrary commands into your agent orchestration.
          </p>

          <h3 id="feishu-webhook-forgery">2. Feishu Webhook Forgery (CVSS 8.6)</h3>

          <p>
            If you use Feishu or Lark integrations, setups relying only on{" "}
            <code>verificationToken</code> without configuring <code>encryptKey</code>{" "}
            accepted forged webhook payloads.
          </p>

          <p>
            An attacker could impersonate any Feishu sender and trigger arbitrary agent
            actions. Think: fake messages that look like they came from your CEO, triggering
            automated workflows. Fixed in 2026.3.12.
          </p>

          <p>
            <strong>What to do:</strong> Configure <code>encryptKey</code> in your Feishu
            integration settings immediately after upgrading.
          </p>

          <h3 id="credential-exposure">3. Credential Exposure in Setup Codes (CVSS 5.3)</h3>

          <p>
            The <code>/pair</code> endpoint embedded the gateway's long-lived auth token
            directly in pairing payloads. Anyone who recovered a QR code from logs or
            screenshots could authenticate indefinitely.
          </p>

          <p>
            This is the vulnerability that's easy to overlook until someone posts their "look
            at my OpenClaw setup!" screenshot on Reddit with the QR code visible. Fixed in
            2026.3.12, but you need to rotate your gateway credentials after upgrading.
          </p>

          <p>
            <strong>Post-upgrade action required:</strong> Rotate gateway credentials. The
            fix prevents future exposure, but old tokens remain valid until rotated.
          </p>

          <h3 id="exec-approval-bypass">4. Exec Approval Bypass (CVSS 5.3)</h3>

          <p>
            A case-folding mismatch combined with the <code>?</code> wildcard crossing
            directory boundaries meant agents could execute commands without user approval.
          </p>

          <p>
            The approval system is one of OpenClaw's core safety mechanisms. This bypass
            undermined it entirely. Fixed in 2026.3.11 (the release before this one), but
            worth mentioning for anyone jumping straight to 2026.3.12 from older versions.
          </p>

          <h2 id="what-you-should-do-now">What You Should Do Right Now</h2>

          <p>If you self-host OpenClaw, stop reading and do this first:</p>

          <ol>
            <li>
              <strong>Update to 2026.3.12</strong> — via npm, Docker, or binary depending on
              your install method
            </li>
            <li>
              <strong>Rotate gateway credentials</strong> — the credential exposure fix only
              prevents new leaks
            </li>
            <li>
              <strong>Configure encryptKey</strong> for Feishu integrations if you use them
            </li>
            <li>
              <strong>Review security hardening</strong> — firewall rules, plugin
              permissions, network exposure
            </li>
          </ol>

          <p>
            If you're on{" "}
            <Link href="/pricing" className="font-medium text-blue-600 hover:text-blue-500">
              Clawer.ai
            </Link>
            , you're already on 2026.3.12. We rolled it out with zero downtime on March 13.
          </p>

          <h2 id="dashboard-v2">Dashboard-v2: Why the Redesign Actually Matters</h2>

          <p>
            The old OpenClaw dashboard was functional, but it didn't scale. Managing dozens
            of subagents across multiple LLM providers meant waiting for the entire
            interface to reload every time you checked agent logs.
          </p>

          <p>Dashboard-v2 fixes this with modular architecture:</p>

          <ul>
            <li>
              <strong>Separate views</strong> for overview, chat, config, agents, and
              sessions — no more full page reloads
            </li>
            <li>
              <strong>Lazy loading</strong> reduces initial bundle size by ~40% on first
              paint
            </li>
            <li>
              <strong>Command palette</strong> (Ctrl+K or Cmd+K) for keyboard-driven
              navigation
            </li>
            <li>
              <strong>Mobile bottom tabs</strong> — thumb-reachable navigation for on-call
              debugging from phones
            </li>
            <li>
              <strong>Slash commands</strong> in chat — <code>/export</code> to download
              conversation history, <code>/search</code> to query session archives
            </li>
            <li>
              <strong>Pinned messages</strong> for bookmarking critical agent decisions
              during debugging
            </li>
          </ul>

          <img
            src="/blog/openclaw-2026-3-12-command-palette.png"
            alt="OpenClaw dashboard-v2 command palette showing keyboard-driven navigation"
            className="my-8 w-full rounded-xl shadow-lg"
          />

          <p>
            The command palette is the highlight. Type "agent logs" to jump directly to
            logging, or "config providers" to reach LLM configuration without clicking
            through nested menus. It's VS Code-style navigation for your agent
            infrastructure.
          </p>

          <p>
            For teams running OpenClaw on edge devices or high-latency connections, the
            performance gains are substantial. The old dashboard showed loading spinners.
            Dashboard-v2 is actually usable.
          </p>

          <h2 id="ai-infra-guard">AI-Infra-Guard v4.0: Built-In Security Scanning</h2>

          <p>
            OpenClaw security used to require external tools like ClawShield or manual audit
            scripts. AI-Infra-Guard v4.0 bakes security scanning directly into the framework.
          </p>

          <p>
            Run <code>openclaw security scan</code> from CLI or use the dedicated panel in
            dashboard-v2. The scan evaluates:
          </p>

          <ul>
            <li>
              <strong>Network exposure</strong> — is your gateway publicly accessible without
              auth?
            </li>
            <li>
              <strong>Plugin permissions</strong> — are plugins requesting more access than
              they need?
            </li>
            <li>
              <strong>API key storage</strong> — are model provider credentials hardcoded or
              improperly stored?
            </li>
            <li>
              <strong>Agent capability boundaries</strong> — do agents have unrestricted file
              system access?
            </li>
          </ul>

          <p>
            It generates a risk score with specific remediation steps. Not "you have
            security issues" — actual instructions like "limit agent X to read-only access
            in config Y."
          </p>

          <p>
            The reality: most OpenClaw security incidents stem from misconfiguration, not
            framework bugs. Over{" "}
            <Link
              href="/blog/openclaw-cve-2026-exposed"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              42,000 instances are exposed on the public internet
            </Link>{" "}
            without proper authentication. AI-Infra-Guard catches this before you deploy.
          </p>

          <h3 id="agent-scan">Agent-Scan: Red Teaming for Multi-Agent Workflows</h3>

          <p>
            Beyond static configuration analysis, AI-Infra-Guard introduces Agent-Scan — a
            dynamic testing framework specifically for multi-agent orchestrations.
          </p>

          <p>Agent-Scan simulates adversarial agents that attempt to:</p>

          <ul>
            <li>
              <strong>Exploit privilege escalation paths</strong> — tricking lower-privileged
              agents into executing commands with elevated permissions
            </li>
            <li>
              <strong>Test prompt injection vectors</strong> — crafting malicious prompts to
              bypass safety filters or extract sensitive information
            </li>
            <li>
              <strong>Probe insecure inter-agent communication</strong> — identifying
              unauthenticated message passing or data leakage between agents
            </li>
          </ul>

          <p>
            You can target Agent-Scan at platforms like Dify or Coze if your OpenClaw agents
            interact with external orchestration layers, or run it against pure OpenClaw
            subagent hierarchies.
          </p>

          <p>
            The framework uses a plugin architecture, allowing security researchers to
            contribute new attack patterns as they're discovered. Run it in CI and catch
            security regressions when you add new tools or expand agent capabilities.
          </p>

          <h2 id="fast-mode-tuning">Fast Mode Tuning for OpenAI GPT-5.4 and Anthropic Claude</h2>

          <p>
            Latency matters for real-time applications. If you're running customer service
            chatbots or automated trading systems with OpenClaw, even small delays have real
            impact.
          </p>

          <p>2026.3.12 adds configurable fast modes for premium providers:</p>

          <ul>
            <li>
              <strong>OpenAI GPT-5.4 fast mode</strong> — session-level toggle via{" "}
              <code>/fast</code> command in TUI, checkbox in Control UI, or{" "}
              <code>params.fastMode</code> flag in ACP API calls
            </li>
            <li>
              <strong>Anthropic Claude fast mode</strong> — maps directly to{" "}
              <code>service_tier</code> API parameter with live verification of priority tier
              access
            </li>
          </ul>

          <p>
            The Claude implementation is particularly smart: it actively checks whether your
            API key has priority tier access before attempting requests. Previously, OpenClaw
            would silently fall back to standard latency, leaving developers confused about
            why their "fast mode" wasn't actually fast.
          </p>

          <p>
            Per-model configuration defaults let you set Claude Opus to always use fast mode
            for coding tasks while keeping Haiku on standard tier for background
            summarization. Granular control where you need it.
          </p>

          <h2 id="provider-plugins">Provider Plugin Architecture: Ollama, vLLM, and SGLang</h2>

          <p>
            Local inference engines previously required core framework modifications to add
            support for new quantization methods or context window configurations.
          </p>

          <p>
            OpenClaw 2026.3.12 moves Ollama, vLLM, and SGLang onto the provider-plugin
            architecture. Each provider now owns its:
          </p>

          <ul>
            <li>Onboarding flow</li>
            <li>Model discovery mechanism</li>
            <li>Picker setup UI</li>
            <li>Post-selection hooks</li>
          </ul>

          <p>What this means practically:</p>

          <ul>
            <li>
              <strong>Independent updates</strong> — when Ollama releases ARM64 server
              optimizations, the plugin updates without waiting for OpenClaw core release
            </li>
            <li>
              <strong>Reduced binary size</strong> — cloud-only users don't download local
              inference code (~20% smaller)
            </li>
            <li>
              <strong>Compatibility checks</strong> — plugins declare compatibility matrices,
              preventing selection of models that exceed available GPU VRAM
            </li>
          </ul>

          <p>
            For production deployments using exclusively cloud providers, you can disable
            local provider plugins entirely via <code>providers.local.enabled: false</code>,
            further reducing attack surface and resource footprint.
          </p>

          <h2 id="kubernetes-support">Kubernetes Support: Production Clusters</h2>

          <p>
            Docker Compose remains the quickest path to running OpenClaw locally, but
            production deployments increasingly require Kubernetes for high availability and
            resource management.
          </p>

          <p>This release adds:</p>

          <ul>
            <li>
              <strong>Raw Kubernetes manifests</strong> — starter configs for gateway, vector
              database, and GPU worker nodes
            </li>
            <li>
              <strong>Kind setup instructions</strong> — local testing environment for
              Kubernetes deployments
            </li>
            <li>
              <strong>Persistent Volume Claims</strong> — documented storage configuration
              for agent state
            </li>
            <li>
              <strong>Horizontal Pod Autoscaling</strong> — scale agent pool based on queue
              depth or session count
            </li>
          </ul>

          <p>
            The documentation specifically addresses networking requirements for
            agent-to-agent communication across pods — a common stumbling block when moving
            from single-node Docker to distributed clusters.
          </p>

          <p>
            For teams already running Kubernetes, these resources provide a baseline you can
            customize with your existing ingress controllers, cert-manager instances, and
            monitoring stacks.
          </p>

          <h2 id="sessions-yield">Sessions Yield: New Orchestration Primitive</h2>

          <p>
            Complex agent hierarchies get a critical control primitive with{" "}
            <code>sessions_yield</code>.
          </p>

          <p>
            Previously, orchestrator agents had to wait for entire tool chains to complete
            even when intermediate results indicated a strategy shift was necessary. With
            sessions_yield, a parent agent can:
          </p>

          <ul>
            <li>Terminate the current turn immediately</li>
            <li>Bypass any queued tool calls or subagent invocations</li>
            <li>Carry a hidden payload into the next session turn</li>
          </ul>

          <p>
            The payload persists across the yield boundary, maintaining context without
            requiring expensive re-processing of previous reasoning steps.
          </p>

          <p>
            <strong>Example scenario:</strong> A primary agent delegates a complex research
            task to several subagents. Midway through, a user provides new, critical
            information that drastically changes scope. The primary agent uses sessions_yield
            to immediately halt subagents' current work, update internal state with the new
            information via payload, and initiate a revised plan in the next turn.
          </p>

          <p>
            This reduces API costs and latency in dynamic environments where agent plans
            frequently require mid-flight corrections.
          </p>

          <h2 id="slack-block-kit">Slack Block Kit: Rich Agent Responses</h2>

          <p>
            Agent notifications in Slack previously relied on plain text or basic markdown.
            OpenClaw 2026.3.12 adds support for <code>channelData.slack.blocks</code>,
            enabling native Block Kit messages.
          </p>

          <p>Agents can now generate:</p>

          <ul>
            <li>
              <strong>Tables</strong> for structured data (system metrics, task progress)
            </li>
            <li>
              <strong>Confirmation buttons</strong> for human-in-the-loop workflows
            </li>
            <li>
              <strong>Image carousels</strong> for diagnostic screenshots or charts
            </li>
          </ul>

          <p>
            For incident response workflows, agents can present structured runbook steps with
            acknowledgment buttons, creating feedback loops that confirm human oversight
            before automated remediation actions proceed.
          </p>

          <p>
            The implementation respects Slack's rate limits and block count constraints,
            queuing messages that exceed limits rather than failing silently. Support extends
            to threaded replies and ephemeral messages, maintaining context in busy channels
            without spamming primary conversation streams.
          </p>

          <h2 id="migration-guide">Migration Guide for Self-Hosters</h2>

          <p>Upgrading to 2026.3.12 requires minimal config changes, but watch for:</p>

          <h3>URL Structure Changes</h3>

          <p>
            Dashboard-v2 uses route-based navigation (<code>/dashboard/agents</code>) instead
            of hash-based routing (<code>/#/agents</code>).
          </p>

          <p>
            <strong>Update:</strong>
          </p>
          <ul>
            <li>Browser bookmarks pointing to specific dashboard sections</li>
            <li>
              External monitoring tools that ping dashboard endpoints for status checks
            </li>
            <li>Deep links in internal documentation</li>
          </ul>

          <p>
            API endpoints remain unchanged — agent communication and programmatic access
            continue functioning without modification.
          </p>

          <h3>Custom CSS and Browser Extensions</h3>

          <p>
            The new modular architecture uses Shadow DOM encapsulation for some components.
            Custom styling scripts may require adjustments.
          </p>

          <p>
            The command palette provides a migration assistant. Type "migration" in the
            palette search to map old menu paths to new locations.
          </p>

          <h3>Device Pairing Workflow Changes</h3>

          <p>
            Pairing codes generated via <code>openclaw qr</code> or <code>/pair</code> now
            expire after 15 minutes and are single-use only.
          </p>

          <p>
            For automated provisioning scripts that relied on static pairing credentials, use{" "}
            <code>openclaw token generate --bootstrap</code> to dynamically generate tokens
            for each device enrollment.
          </p>

          <h2 id="performance-implications">Performance Implications</h2>

          <p>
            Moving Ollama, vLLM, and SGLang to provider plugins affects cold-start
            performance:
          </p>

          <ul>
            <li>
              <strong>Gateway startup:</strong> ~20% faster for users who don't require local
              inference
            </li>
            <li>
              <strong>First local provider invocation:</strong> 1-3 second plugin load
              penalty
            </li>
            <li>
              <strong>Subsequent invocations:</strong> Performance matches previous versions
              (some improvements via model discovery caching)
            </li>
          </ul>

          <p>
            Memory-constrained environments benefit most — unused provider plugins don't
            consume resident RAM.
          </p>

          <h2 id="security-comparison">Native Security vs. Third-Party Tools</h2>

          <p>
            With AI-Infra-Guard v4.0 built-in, do you still need external security layers
            like ClawShield, Rampart, or Raypher?
          </p>

          <p>Short answer: it depends on your threat model.</p>

          <table className="my-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 dark:border-neutral-700">
                <th className="p-2 text-left">Feature</th>
                <th className="p-2 text-left">AI-Infra-Guard</th>
                <th className="p-2 text-left">ClawShield</th>
                <th className="p-2 text-left">Rampart</th>
                <th className="p-2 text-left">Raypher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              <tr>
                <td className="p-2">Configuration Scanning</td>
                <td className="p-2">✓</td>
                <td className="p-2">—</td>
                <td className="p-2">Partial</td>
                <td className="p-2">—</td>
              </tr>
              <tr>
                <td className="p-2">Runtime Monitoring</td>
                <td className="p-2">—</td>
                <td className="p-2">✓</td>
                <td className="p-2">✓</td>
                <td className="p-2">✓ (eBPF)</td>
              </tr>
              <tr>
                <td className="p-2">Network Proxy</td>
                <td className="p-2">—</td>
                <td className="p-2">✓</td>
                <td className="p-2">✓</td>
                <td className="p-2">—</td>
              </tr>
              <tr>
                <td className="p-2">Hardware Identity</td>
                <td className="p-2">—</td>
                <td className="p-2">—</td>
                <td className="p-2">—</td>
                <td className="p-2">✓</td>
              </tr>
              <tr>
                <td className="p-2">Agent-Scan Red Team</td>
                <td className="p-2">✓</td>
                <td className="p-2">—</td>
                <td className="p-2">—</td>
                <td className="p-2">—</td>
              </tr>
            </tbody>
          </table>

          <p>
            AI-Infra-Guard provides baseline configuration auditing and red teaming.
            Third-party tools offer specialized runtime protections and network controls.
          </p>

          <p>
            A robust security strategy for production OpenClaw deployments likely involves
            integrating AI-Infra-Guard's proactive scanning with specialized runtime
            protections from external tools.
          </p>

          <h2 id="what-this-means">What This Release Signals for OpenClaw's Future</h2>

          <p>
            2026.3.12 establishes patterns that will define OpenClaw's evolution through the
            rest of 2026:
          </p>

          <ul>
            <li>
              <strong>Modular dashboard architecture</strong> — foundation for
              plugin-contributed UI panels and custom agent visualizations
            </li>
            <li>
              <strong>AI-Infra-Guard framework</strong> — positions OpenClaw to absorb more
              security functionality natively, reducing ecosystem fragmentation
            </li>
            <li>
              <strong>Kubernetes and production hardening</strong> — shift from experimental
              tool to infrastructure-grade platform
            </li>
            <li>
              <strong>Security-first development</strong> — built-in scanning, compliance
              features, enterprise deployment scenarios
            </li>
          </ul>

          <p>
            Watch for upcoming releases to expand Agent-Scan coverage to physical agent
            interactions and IoT device protocols, plus deeper integration with the Prism API
            for enhanced agent development workflows.
          </p>

          <h2 id="faq">Frequently Asked Questions</h2>

          <h3>What are the critical CVEs patched in OpenClaw 2026.3.12?</h3>

          <p>
            Four vulnerabilities: (1) WebSocket Privilege Escalation (CVSS 9.9) allowing any
            authenticated client to self-grant admin scope, (2) Feishu Webhook Forgery (CVSS
            8.6) enabling attackers to impersonate Feishu senders, (3) Credential Exposure in
            Setup Codes (CVSS 5.3) embedding long-lived auth tokens in QR codes, and (4)
            Exec Approval Bypass (CVSS 5.3) allowing agents to execute commands without user
            approval.
          </p>

          <h3>What is dashboard-v2 in OpenClaw?</h3>

          <p>
            A complete rewrite of the Control UI with modular architecture, command palette
            (Ctrl+K or Cmd+K), mobile-first navigation, separate views for
            chat/config/agents/sessions, and slash commands. Initial load time is 40% faster
            due to lazy loading.
          </p>

          <h3>What is AI-Infra-Guard v4.0?</h3>

          <p>
            OpenClaw's built-in security framework featuring OpenClaw Security Scan
            (one-click configuration auditing) and Agent-Scan (dynamic testing for
            multi-agent workflows). It evaluates network exposure, plugin permissions, API
            key storage, and agent capabilities, then generates risk scores with remediation
            steps.
          </p>

          <h3>Do I need to upgrade to OpenClaw 2026.3.12?</h3>

          <p>
            Yes, if you self-host. The CVSS 9.9 WebSocket privilege escalation vulnerability
            is trivial to exploit. Update to 2026.3.12, rotate gateway credentials, configure
            encryptKey for Feishu if used, and review security hardening.
          </p>

          <h3>What are bootstrap tokens?</h3>

          <p>
            Bootstrap tokens replace long-lived gateway credentials in device pairing. They
            expire after 15 minutes, are single-use only, and provide limited scope access
            for device registration. Use <code>openclaw token generate --bootstrap</code> for
            automated provisioning.
          </p>

          <h3>How do I upgrade my OpenClaw instance to 2026.3.12?</h3>

          <p>
            Self-hosted: update via your package manager (npm, Docker, binary), restart
            gateway, rotate credentials. Update bookmarks from <code>/#/agents</code> to{" "}
            <code>/dashboard/agents</code>. Clawer.ai users were automatically upgraded with
            zero downtime on March 13, 2026.
          </p>

          <h2 id="or-let-clawer-handle-it">Or Just Let Clawer Handle All This</h2>

          <p>
            If this release breakdown feels like work you don't want to do — security
            patching, configuration auditing, dashboard migrations, Kubernetes deployments —
            that's what{" "}
            <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
              Clawer.ai
            </Link>{" "}
            is for.
          </p>

          <p>We handle:</p>

          <ul>
            <li>
              <strong>Automatic updates</strong> — 2026.3.12 rolled out with zero downtime on
              March 13
            </li>
            <li>
              <strong>Security hardening</strong> — container isolation, curated skill
              marketplace, no exposed ports
            </li>
            <li>
              <strong>Configuration management</strong> — no manual YAML editing or
              credential rotation workflows
            </li>
            <li>
              <strong>Multi-agent orchestration</strong> — pre-configured AI Teams
              (Life OS, Solopreneur, Content Creator)
            </li>
          </ul>

          <p>
            Self-hosting makes sense if you're a developer who enjoys infrastructure work and
            has time for security maintenance. For everyone else, managed hosting at $19-49/mo
            eliminates the overhead entirely.
          </p>

          <p>
            <Link
              href="/pricing"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500"
            >
              See Pricing →
            </Link>
          </p>

          <hr className="my-12 border-neutral-300 dark:border-neutral-700" />

          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong>Related:</strong>{" "}
            <Link
              href="/blog/openclaw-breaking-changes-2026-3-2"
              className="text-blue-600 hover:text-blue-500"
            >
              OpenClaw 2026.3.2 Breaking Changes
            </Link>
            {" · "}
            <Link
              href="/blog/openclaw-cve-2026-exposed"
              className="text-blue-600 hover:text-blue-500"
            >
              CVE-2026-25253: 42,000 Exposed Instances
            </Link>
            {" · "}
            <Link
              href="/blog/best-openclaw-hosting"
              className="text-blue-600 hover:text-blue-500"
            >
              Best OpenClaw Hosting Comparison
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}
