import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw Hosting Security: 15 Critical Checks | Clawer",
  description:
    "15-point security checklist for evaluating OpenClaw hosting. Questions to ask about isolation, credentials, and patches.",
  openGraph: {
    title: "OpenClaw Hosting Security: What to Look For Before You Trust a Provider",
    description:
      "15-point security checklist for evaluating OpenClaw hosting providers. Container isolation, credential handling, network exposure, and backup policies explained.",
    type: "article",
    publishedTime: "2026-03-03T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Security", "Hosting", "Container Isolation", "AI Safety"],
    url: "https://clawer.ai/blog/openclaw-hosting-security-checklist",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw Hosting Security: 15 Critical Checks | Clawer",
    description:
      "Security checklist for OpenClaw hosting. 15 questions to verify before trusting a provider with your AI agent. Container isolation, token handling, updates.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-hosting-security-checklist",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw Hosting Security: What to Look For Before You Trust a Provider",
  description:
    "15-point security checklist for evaluating OpenClaw hosting providers. Learn what questions to ask about container isolation, credential handling, network exposure, and backup policies.",
  datePublished: "2026-03-03",
  dateModified: "2026-03-03",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-hosting-security-checklist",
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
      name: "OpenClaw Hosting Security Checklist",
      item: "https://clawer.ai/blog/openclaw-hosting-security-checklist",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is OpenClaw hosting secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenClaw hosting security varies dramatically by provider. Over 42,000 self-hosted instances are currently exposed without proper authentication. Security depends on container isolation, credential handling, network configuration, update policies, and skill vetting. Managed providers like Clawer.ai handle these concerns by default. Self-hosters must actively manage firewalls, patches, and access controls.",
      },
    },
    {
      "@type": "Question",
      name: "What is container isolation for OpenClaw?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Container isolation means each OpenClaw agent runs in a separate container with its own filesystem, network namespace, and resource limits. This prevents one agent from accessing another agent's data, credentials, or memory. Without container isolation, a compromised agent can read your host system, access other users' data, and exfiltrate credentials from shared storage.",
      },
    },
    {
      "@type": "Question",
      name: "How should OpenClaw handle API tokens securely?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "API tokens should be stored encrypted at rest, never logged in plaintext, and injected as environment variables at container runtime rather than written to disk. Providers should use secrets management systems and never store tokens in Git repos, database dumps, or backup archives without encryption. Check if your provider can prove they encrypt tokens and rotate encryption keys regularly.",
      },
    },
    {
      "@type": "Question",
      name: "Should OpenClaw port 18789 be exposed to the internet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. OpenClaw's default Gateway port (18789) should never be directly exposed to the public internet without authentication. A 2026 vulnerability exposed 42,000+ instances because port 18789 was open without gateway.auth configured. Providers should use reverse proxies with HTTPS, authentication middleware, and rate limiting. Direct port exposure is a critical security failure.",
      },
    },
    {
      "@type": "Question",
      name: "What should OpenClaw backup policies include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenClaw backups should include: daily automated snapshots of agent config and memory files, encrypted storage of backups, 30-day retention minimum, and documented restore procedures with tested recovery time. Backups should be immutable (attackers can't delete them) and stored separately from the production environment. Ask providers for their last successful test restore date.",
      },
    },
    {
      "@type": "Question",
      name: "How do I audit my current OpenClaw security?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Run 'openclaw security audit --deep' from your host. This checks Gateway auth exposure, browser control exposure, elevated allowlists, and filesystem permissions. For hosted environments, verify container isolation, check if port 18789 is reachable externally, review which skills are installed, and confirm update policies with your provider. Test by attempting to access another user's agent data.",
      },
    },
  ],
};

export default function BlogPost() {
  return (
    <>
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

      <article className="prose prose-lg max-w-4xl mx-auto px-6 py-12">
        <h1>OpenClaw Hosting Security: What to Look For Before You Trust a Provider</h1>

        <p className="text-xl text-gray-600 dark:text-gray-400">
          42,000+ OpenClaw instances are currently exposed on the public internet without proper
          authentication. Here's how to verify your hosting provider isn't one of them.
        </p>

        <img
          src="/blog/openclaw-hosting-security-hero.png"
          alt="OpenClaw security architecture showing container isolation and authentication layers"
          className="rounded-xl w-full my-8"
        />

        <p>
          OpenClaw is powerful because it has real access: your API keys, your files, your
          messaging channels, your terminal. This makes hosting security critical — not "nice to
          have."
        </p>

        <p>
          Microsoft's security team published guidance treating OpenClaw as "untrusted code
          execution with persistent credentials." That's not FUD. That's an accurate description of
          what AI agents do. They execute code. They hold credentials. They act on your behalf.
        </p>

        <p>
          Most{" "}
          <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:text-blue-700">
            OpenClaw hosting providers
          </Link>{" "}
          don't publish security documentation. This checklist gives you the questions to ask —
          whether you're self-hosting, using a VPS, or evaluating managed providers.
        </p>

        <h2>Why OpenClaw Security Is Different</h2>

        <p>
          Traditional web app security assumes you control what code runs. OpenClaw breaks that
          assumption in three ways:
        </p>

        <ul>
          <li>
            <strong>Dynamic code execution:</strong> Agents download and run "skills" from ClawHub
            or other sources. 341 malicious skills were found on ClawHub in February 2026, including
            RedLine and Lumma infostealers targeting <code>~/.openclaw/</code> directories.
          </li>
          <li>
            <strong>Persistent credentials:</strong> Your agent holds API tokens for Anthropic,
            OpenAI, GitHub, Gmail, Telegram, and more. If the agent is compromised, those tokens
            are exfiltrated.
          </li>
          <li>
            <strong>Untrusted input:</strong> Agents read external content (emails, web pages,
            Discord messages) and can be instructed through prompt injection to execute malicious
            commands or modify their own memory.
          </li>
        </ul>

        <p>
          This shifts security from "protect the server" to "protect the blast radius when
          something goes wrong." Because something will eventually go wrong.
        </p>

        <h2>The 15-Point Security Checklist</h2>

        <p>
          Use this checklist to evaluate any OpenClaw hosting setup — self-hosted, VPS, or managed.
          Each question includes what good looks like and common red flags.
        </p>

        <h3>Authentication & Access Control</h3>

        <h4>1. Is Gateway authentication enabled and enforced?</h4>

        <p>
          <strong>What it is:</strong> OpenClaw's <code>gateway.auth</code> system controls who can
          send messages and commands to your agent. Without it, anyone who discovers your IP and
          port can control your agent.
        </p>

        <p>
          <strong>What good looks like:</strong> <code>gateway.auth.required: true</code> in config,
          authentication tokens or device pairing enforced for all API access, no public endpoints
          accepting unauthenticated messages.
        </p>

        <p>
          <strong>Red flag:</strong> Provider can't show you the auth configuration. Claims "it's
          behind a firewall so auth isn't needed." Port 18789 reachable without credentials.
        </p>

        <p>
          <strong>Test it:</strong> Try accessing{" "}
          <code>http://[your-instance-ip]:18789/api/status</code> without auth headers. If you get a
          response, auth is not enforced.
        </p>

        <h4>2. Is there per-agent container isolation?</h4>

        <p>
          <strong>What it is:</strong> Each agent runs in a separate container with its own
          filesystem, network namespace, and resource limits. One compromised agent can't access
          another agent's data.
        </p>

        <p>
          <strong>What good looks like:</strong> Docker or Podman containers with distinct
          namespaces, no shared volumes between customer containers, resource limits preventing one
          agent from consuming all CPU/RAM.
        </p>

        <p>
          <strong>Red flag:</strong> "All agents run on the same VM for efficiency." Shared{" "}
          <code>~/.openclaw/</code> directory across users. Provider can't explain their isolation
          model.
        </p>

        <p>
          <strong>Test it:</strong> Ask to see container logs or namespace configuration. Request
          documentation on their isolation architecture.
        </p>

        <h4>3. Can agents access each other's memory or credentials?</h4>

        <p>
          <strong>What it is:</strong> Agent memory (MEMORY.md, daily notes, config files) and API
          tokens must be scoped per user. Cross-contamination means one user can read another's
          private conversations or steal tokens.
        </p>

        <p>
          <strong>What good looks like:</strong> Each agent's data stored in isolated volumes,
          encrypted at rest, no shared filesystem mounts, API tokens stored in per-container secrets
          management.
        </p>

        <p>
          <strong>Red flag:</strong> All user data in <code>/shared/openclaw/users/</code> with
          world-readable permissions. Tokens stored in plaintext environment files accessible from
          host.
        </p>

        <p>
          <strong>Test it:</strong> If you have access to your container, try <code>ls /proc</code>{" "}
          and see if you can see other users' processes. Attempt to access{" "}
          <code>/home/other-user/</code>.
        </p>

        <h3>Network & Infrastructure Security</h3>

        <h4>4. Is port 18789 exposed to the public internet?</h4>

        <p>
          <strong>What it is:</strong> A vulnerability disclosed in early 2026 exposed 42,000+ OpenClaw instances because
          port 18789 (Gateway default) was publicly reachable without authentication.
        </p>

        <p>
          <strong>What good looks like:</strong> Gateway behind reverse proxy (nginx, Caddy, or
          Cloudflare Tunnel), HTTPS with valid certificates, authentication middleware before
          reaching OpenClaw, rate limiting and DDoS protection.
        </p>

        <p>
          <strong>Red flag:</strong> Port 18789 shows up on Shodan scans. Provider uses Docker{" "}
          <code>-p 18789:18789</code> without firewall rules. Claims "we use a non-standard port for
          security."
        </p>

        <p>
          <strong>Test it:</strong> From an external network, run{" "}
          <code>nmap -p 18789 [provider-ip]</code>. If the port responds, it's exposed.
        </p>

        <h4>5. Are browser control ports secured?</h4>

        <p>
          <strong>What it is:</strong> OpenClaw's browser automation uses Chrome DevTools Protocol,
          typically on port 9222. Exposed CDP ports allow full browser takeover remotely.
        </p>

        <p>
          <strong>What good looks like:</strong> Browser runs inside the container with no external
          port exposure, localhost-only binding, ephemeral sessions that don't persist credentials.
        </p>

        <p>
          <strong>Red flag:</strong> Port 9222 accessible from outside the container. Browsers
          logged into personal accounts. Shared browser profile across multiple agents.
        </p>

        <p>
          <strong>Test it:</strong> Check <code>netstat -tuln | grep 9222</code> — should only show{" "}
          <code>127.0.0.1:9222</code>, not <code>0.0.0.0:9222</code>.
        </p>

        <h4>6. What network egress filtering is applied?</h4>

        <p>
          <strong>What it is:</strong> Limiting what external domains your agent can reach reduces
          exfiltration risk if compromised. A malicious skill shouldn't be able to phone home to
          attacker infrastructure.
        </p>

        <p>
          <strong>What good looks like:</strong> Allowlist for known-good domains (anthropic.com,
          github.com, etc.), DNS filtering to block known malware C2 domains, logging of all
          outbound connections.
        </p>

        <p>
          <strong>Red flag:</strong> Unrestricted internet access. No logging of outbound
          connections. Provider doesn't know what egress filtering means.
        </p>

        <p>
          <strong>Test it:</strong> Ask for their network architecture diagram. Request a sample of
          egress logs showing blocked connection attempts.
        </p>

        <h3>Credential & Token Management</h3>

        <h4>7. How are API tokens stored?</h4>

        <p>
          <strong>What it is:</strong> Your Anthropic, OpenAI, GitHub, and other API keys are
          valuable. Tokens stored in plaintext config files or database rows are easily stolen.
        </p>

        <p>
          <strong>What good looks like:</strong> Encrypted at rest with envelope encryption, secrets
          injected as environment variables at runtime, never written to disk in plaintext, never
          logged, encryption keys rotated quarterly.
        </p>

        <p>
          <strong>Red flag:</strong> Tokens in <code>openclaw.json</code> committed to Git repos.
          Stored in MySQL <code>VARCHAR</code> fields. Visible in process lists via{" "}
          <code>ps aux</code>. Included in backups without encryption.
        </p>

        <p>
          <strong>Test it:</strong> Ask to see a sanitized config file example. Request their
          encryption key management policy. Check if tokens appear in their public GitHub repos.
        </p>

        <h4>8. Can the hosting provider read my agent's memory?</h4>

        <p>
          <strong>What it is:</strong> Your agent's memory files (MEMORY.md, daily notes, message
          history) contain private conversations, work context, and potentially sensitive data.
        </p>

        <p>
          <strong>What good looks like:</strong> Encrypted volumes with customer-controlled keys,
          provider cannot decrypt without customer action, clear privacy policy stating they don't
          access memory files.
        </p>

        <p>
          <strong>Red flag:</strong> "We may access your data for debugging purposes." Memory files
          stored unencrypted on provider-managed disks. No customer-controlled encryption option.
        </p>

        <p>
          <strong>Test it:</strong> Read their privacy policy. Ask if support staff can read your
          agent conversations. Request documentation on encryption implementation.
        </p>

        <h4>9. Are credentials used to train AI models?</h4>

        <p>
          <strong>What it is:</strong> Some AI providers use API interactions to improve models. If
          your agent's messages (which contain your data) are sent to model providers without
          opting out, your private context could train future models.
        </p>

        <p>
          <strong>What good looks like:</strong> API calls use data-protection flags (OpenAI's{" "}
          <code>user</code> field, Anthropic's enterprise tier), provider has written policy on
          zero-training guarantees, uses model providers with strict data retention policies.
        </p>

        <p>
          <strong>Red flag:</strong> Provider doesn't know if data is used for training. Uses free
          API tiers with unclear data policies. No mention of data retention in their terms.
        </p>

        <p>
          <strong>Test it:</strong> Ask which AI model tiers they use and whether training opt-out
          is enabled. Check their terms for data usage clauses.
        </p>

        <h3>Updates & Patch Management</h3>

        <h4>10. How often are OpenClaw updates applied?</h4>

        <p>
          <strong>What it is:</strong> OpenClaw releases security patches regularly. CVE-2026-25253
          was patched in version 0.8.4, but thousands of instances never updated.
        </p>

        <p>
          <strong>What good looks like:</strong> Automated updates within 24-48 hours of release,
          security patches applied immediately, testing in staging before production rollout, update
          logs available to customers.
        </p>

        <p>
          <strong>Red flag:</strong> "We update monthly." Running OpenClaw 0.7.x in March 2026
          (multiple known CVEs). Provider doesn't track release notes. Claims "we customize the code
          so updates don't apply."
        </p>

        <p>
          <strong>Test it:</strong> Ask which OpenClaw version they're running. Check{" "}
          <code>openclaw version</code> in your instance. Compare to{" "}
          <a
            href="https://github.com/openclaw/openclaw/releases"
            className="text-blue-600 hover:text-blue-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            latest GitHub releases
          </a>
          .
        </p>

        <h4>11. Who is responsible for dependency updates?</h4>

        <p>
          <strong>What it is:</strong> OpenClaw uses Node.js, Docker, nginx, and dozens of npm
          packages. Each dependency can have security vulnerabilities requiring updates.
        </p>

        <p>
          <strong>What good looks like:</strong> Provider-managed dependency updates, automated
          vulnerability scanning (Dependabot, Snyk), documented patch SLA (e.g., "critical CVEs
          patched within 72 hours").
        </p>

        <p>
          <strong>Red flag:</strong> "Dependencies are your responsibility." No automated scanning.
          Node.js version from 2024. Provider doesn't know what Dependabot is.
        </p>

        <p>
          <strong>Test it:</strong> Check <code>node --version</code> and <code>npm --version</code>{" "}
          in your instance. Ask for their vulnerability disclosure policy.
        </p>

        <h3>Skills & Extension Management</h3>

        <h4>12. How are ClawHub skills vetted?</h4>

        <p>
          <strong>What it is:</strong> 341 malicious skills were found on ClawHub in February 2026.
          Installing skills is essentially running arbitrary code in your agent's container.
        </p>

        <p>
          <strong>What good looks like:</strong> Provider maintains curated skill marketplace,
          automated security scanning of skill code, manual review for popular skills, quarantine
          for flagged skills, CVE tracking for skill dependencies.
        </p>

        <p>
          <strong>Red flag:</strong> Direct access to ClawHub without filtering. "All skills are
          pre-installed for convenience." No documentation on which skills are installed by default.
        </p>

        <p>
          <strong>Test it:</strong> Ask which skills are installed in new instances. Request their
          skill vetting process documentation. Check if they publish a curated skill list.
        </p>

        <h4>13. Can agents install skills autonomously?</h4>

        <p>
          <strong>What it is:</strong> Some OpenClaw configurations allow agents to install skills
          without human approval. A compromised agent can install malware.
        </p>

        <p>
          <strong>What good looks like:</strong> Skill installation requires explicit user
          confirmation, audit logs showing what skills were installed and when, ability to disable
          autonomous installation globally.
        </p>

        <p>
          <strong>Red flag:</strong> Agent installs skills mentioned in conversations automatically.
          No approval workflow. No audit trail.
        </p>

        <p>
          <strong>Test it:</strong> Ask your agent to install a skill and watch what happens. Check{" "}
          <code>openclaw.json</code> for <code>skills.autoInstall</code> settings.
        </p>

        <h3>Monitoring & Incident Response</h3>

        <h4>14. What monitoring and alerting exists?</h4>

        <p>
          <strong>What it is:</strong> Detecting anomalies (unusual API usage, large data transfers,
          new outbound connections) helps catch compromises early.
        </p>

        <p>
          <strong>What good looks like:</strong> Resource usage monitoring, anomaly detection for
          unusual behavior, alerting on failed auth attempts, rate limiting per agent, audit logs
          with 90-day retention minimum.
        </p>

        <p>
          <strong>Red flag:</strong> No monitoring. "Check the logs yourself if something seems
          wrong." Logs only kept for 7 days. No alerting on suspicious behavior.
        </p>

        <p>
          <strong>Test it:</strong> Ask to see sample monitoring dashboards. Request their incident
          response documentation. Check if you receive alerts for unusual activity.
        </p>

        <h4>15. What is the backup and recovery policy?</h4>

        <p>
          <strong>What it is:</strong> If your agent is compromised, you need clean backups to
          restore from. If the provider loses your data, you need recoverability guarantees.
        </p>

        <p>
          <strong>What good looks like:</strong> Daily automated backups of agent config and memory,
          encrypted backup storage, 30+ day retention, immutable backups (attackers can't delete
          them), documented restore procedures, tested recovery time (ask for last test date).
        </p>

        <p>
          <strong>Red flag:</strong> "Backups are your responsibility." Backups stored on same
          server as production. No encryption. No testing of restore procedures. Backup retention{" "}
          {"<"} 7 days.
        </p>

        <p>
          <strong>Test it:</strong> Request a backup restore. Ask when they last tested recovery
          procedures. Check their SLA for recovery time objectives (RTO).
        </p>

        <h2>Evaluating Your Current Setup</h2>

        <p>Run through this workflow to audit what you have today:</p>

        <h3>For Self-Hosted Deployments</h3>

        <ol>
          <li>
            Run <code>openclaw security audit --deep</code> and review the output
          </li>
          <li>
            Check external exposure: <code>nmap -p 18789,9222 [your-public-ip]</code>
          </li>
          <li>
            Verify Gateway auth: <code>grep gateway.auth ~/.openclaw/openclaw.json</code>
          </li>
          <li>
            List installed skills: <code>ls ~/.openclaw/skills/</code> and audit each one
          </li>
          <li>
            Check OpenClaw version: <code>openclaw version</code> (compare to latest release)
          </li>
          <li>Review firewall rules: <code>sudo ufw status</code> or equivalent</li>
          <li>
            Verify token encryption: <code>cat ~/.openclaw/openclaw.json</code> — are API keys
            plaintext?
          </li>
        </ol>

        <h3>For Managed Providers</h3>

        <ol>
          <li>Send this checklist to your provider and ask them to fill it out</li>
          <li>Request their security documentation (architecture, policies, certifications)</li>
          <li>Ask for sample audit logs showing their monitoring in action</li>
          <li>
            Test external exposure from an external IP (your phone's 4G, not your office network)
          </li>
          <li>Request a backup restore to verify their recovery process works</li>
          <li>Check their public GitHub repos for accidentally committed credentials</li>
          <li>
            Review their terms of service for data usage, liability, and incident disclosure
            policies
          </li>
        </ol>

        <h2>What Good Looks Like: A Working Example</h2>

        <p>
          Full disclosure: we built{" "}
          <Link href="/pricing" className="text-blue-600 hover:text-blue-700">
            Clawer.ai
          </Link>{" "}
          to solve these exact problems. Here's how we handle each checklist item:
        </p>

        <ul>
          <li>
            <strong>Authentication:</strong> Device pairing + JWT tokens required for all API access
          </li>
          <li>
            <strong>Container isolation:</strong> Dedicated Docker containers per agent with
            namespace isolation, resource limits, and read-only root filesystems
          </li>
          <li>
            <strong>Network security:</strong> All traffic through Cloudflare proxy, HTTPS-only, no
            direct port 18789 exposure
          </li>
          <li>
            <strong>Token storage:</strong> Envelope encryption with AWS KMS, secrets injected at
            runtime, quarterly key rotation
          </li>
          <li>
            <strong>Memory privacy:</strong> Encrypted volumes, zero-knowledge architecture option
            for enterprise, we cannot read your agent conversations
          </li>
          <li>
            <strong>Training opt-out:</strong> All API calls use enterprise tiers with no-training
            guarantees
          </li>
          <li>
            <strong>Updates:</strong> Automated OpenClaw updates within 24 hours of release,
            security patches same-day
          </li>
          <li>
            <strong>Dependencies:</strong> Dependabot + Snyk scanning, critical CVEs patched within
            72 hours
          </li>
          <li>
            <strong>Skills:</strong> Curated marketplace, automated malware scanning, manual review
            for top 100 skills
          </li>
          <li>
            <strong>Skill installation:</strong> User approval required, audit log of all
            installations
          </li>
          <li>
            <strong>Monitoring:</strong> Prometheus + Grafana dashboards, anomaly detection, alert
            thresholds per customer
          </li>
          <li>
            <strong>Backups:</strong> Daily snapshots, encrypted S3 storage, 90-day retention,
            immutable backups, tested monthly
          </li>
        </ul>

        <p>
          You can verify most of this yourself — try accessing our API without auth, scan
          our public IPs, test skill installation flows.
        </p>

        <p>
          For teams evaluating{" "}
          <Link
            href="/blog/openclaw-self-hosted-vs-managed"
            className="text-blue-600 hover:text-blue-700"
          >
            self-hosted vs managed OpenClaw
          </Link>
          , the security overhead is significant. It's doable, but it's real work that compounds
          over time.
        </p>

        <h2>When to Walk Away</h2>

        <p>Some red flags mean you should immediately find a different provider:</p>

        <ul>
          <li>Port 18789 is publicly accessible without authentication</li>
          <li>Provider can't explain their container isolation model</li>
          <li>API tokens stored in plaintext anywhere (config files, databases, logs)</li>
          <li>Running OpenClaw 0.7.x or earlier (multiple known CVEs)</li>
          <li>No backup policy or untested backup restores</li>
          <li>Provider claims they "don't need security because it's containerized"</li>
          <li>
            Terms of service claim right to access your data without specifying when/why/how
          </li>
        </ul>

        <p>
          These aren't minor issues. They're fundamental security failures that put your
          credentials, data, and connected systems at risk.
        </p>

        <h2>The Reality: Security Is Ongoing Work</h2>

        <p>
          No setup is perfectly secure. The question is: who's responsible for that ongoing work?
        </p>

        <p>
          If you self-host, it's you. You need to monitor OpenClaw releases, patch CVEs, update
          dependencies, audit skills, review logs, test backups, and respond to incidents. Budget
          5-10 hours per month minimum.
        </p>

        <p>
          If you use a managed provider, it's them — but only if they're actually doing the work.
          This checklist helps you verify that they are.
        </p>

        <p>
          Most{" "}
          <Link
            href="/blog/openclaw-hosting-cost"
            className="text-blue-600 hover:text-blue-700"
          >
            OpenClaw hosting cost
          </Link>{" "}
          comparisons focus on monthly server fees. The real cost is security maintenance labor. At
          $50/hour for your time, 5 hours/month = $250/month in hidden costs. Managed hosting at
          $24-49/month isn't expensive — it's subsidized.
        </p>

        <h2>FAQ</h2>

        <h3>Is OpenClaw hosting secure?</h3>
        <p>
          OpenClaw hosting security varies dramatically by provider. Over 42,000 self-hosted
          instances are currently exposed without proper authentication. Security depends on
          container isolation, credential handling, network configuration, update policies, and
          skill vetting. Managed providers like Clawer.ai handle these concerns by default.
          Self-hosters must actively manage firewalls, patches, and access controls.
        </p>

        <h3>What is container isolation for OpenClaw?</h3>
        <p>
          Container isolation means each OpenClaw agent runs in a separate container with its own
          filesystem, network namespace, and resource limits. This prevents one agent from accessing
          another agent's data, credentials, or memory. Without container isolation, a compromised
          agent can read your host system, access other users' data, and exfiltrate credentials
          from shared storage.
        </p>

        <h3>How should OpenClaw handle API tokens securely?</h3>
        <p>
          API tokens should be stored encrypted at rest, never logged in plaintext, and injected as
          environment variables at container runtime rather than written to disk. Providers should
          use secrets management systems and never store tokens in Git repos, database dumps, or
          backup archives without encryption. Check if your provider can prove they encrypt tokens
          and rotate encryption keys regularly.
        </p>

        <h3>Should OpenClaw port 18789 be exposed to the internet?</h3>
        <p>
          No. OpenClaw's default Gateway port (18789) should never be directly exposed to the
          public internet without authentication. A 2026 vulnerability exposed 42,000+ instances because
          port 18789 was open without <code>gateway.auth</code> configured. Providers should use
          reverse proxies with HTTPS, authentication middleware, and rate limiting. Direct port
          exposure is a critical security failure.
        </p>

        <h3>What should OpenClaw backup policies include?</h3>
        <p>
          OpenClaw backups should include: daily automated snapshots of agent config and memory
          files, encrypted storage of backups, 30-day retention minimum, and documented restore
          procedures with tested recovery time. Backups should be immutable (attackers can't delete
          them) and stored separately from the production environment. Ask providers for their last
          successful test restore date.
        </p>

        <h3>How do I audit my current OpenClaw security?</h3>
        <p>
          Run <code>openclaw security audit --deep</code> from your host. This checks Gateway auth
          exposure, browser control exposure, elevated allowlists, and filesystem permissions. For
          hosted environments, verify container isolation, check if port 18789 is reachable
          externally, review which skills are installed, and confirm update policies with your
          provider. Test by attempting to access another user's agent data.
        </p>

        <h3>Can I use this checklist for self-hosted OpenClaw?</h3>
        <p>
          Yes. The checklist applies to any OpenClaw deployment. For self-hosting, you're
          responsible for implementing each control yourself. Focus on items 1, 4, 7, 10, and 12 as
          your minimum baseline: Gateway authentication, no public port exposure, encrypted token
          storage, keeping OpenClaw updated, and vetting skills before installation. Consider using{" "}
          <code>openclaw security audit</code> as a regular cron job to catch configuration drift.
        </p>

        <h3>What happens if my OpenClaw instance is compromised?</h3>
        <p>
          Immediate steps: (1) Revoke all API tokens stored in OpenClaw — Anthropic, OpenAI, GitHub,
          etc. (2) Disconnect network access to prevent exfiltration. (3) Review audit logs for
          what data was accessed. (4) Restore from a clean backup before the compromise date. (5)
          Identify the attack vector (malicious skill, prompt injection, exposed port) and fix it
          before redeploying. This is why backup policies and audit logging are critical — you need
          them to recover.
        </p>

        <h3>Are managed providers really more secure than self-hosting?</h3>
        <p>
          It depends on your skill level and available time. Managed providers with mature security
          practices (like Clawer.ai) handle patching, monitoring, isolation, and incident response
          as full-time work. Self-hosting can be equally secure if you have ops experience and
          commit 5-10 hours monthly to maintenance. What's consistently insecure: self-hosting
          without the time or knowledge to maintain it. That's where the 42,000+ exposed instances
          come from.
        </p>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Try Clawer.ai — Security Built In</h3>
          <p className="mb-4">
            Every item on this checklist is handled for you. Deploy your AI Team in 60 seconds with
            dedicated containers per agent, same-day security patches, and a curated skill marketplace.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Free Trial →
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Related:</strong>{" "}
            <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:text-blue-700">
              Best OpenClaw Hosting Providers
            </Link>
            {" · "}
            <Link
              href="/blog/openclaw-self-hosted-vs-managed"
              className="text-blue-600 hover:text-blue-700"
            >
              Self-Hosted vs Managed OpenClaw
            </Link>
            {" · "}
            <Link
              href="/blog/openclaw-hosting-cost"
              className="text-blue-600 hover:text-blue-700"
            >
              OpenClaw Hosting Cost Analysis
            </Link>
          </p>
        </div>
      </article>
    </>
  );
}
