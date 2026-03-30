import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw 2026.3.29: Plugin Approval System Arrives | Clawer",
  description:
    "OpenClaw 2026.3.29 ships plugin approval hooks after 9 CVEs and 341 malicious ClawHub skills. What changed, what's still broken, and how to update.",
  openGraph: {
    title: "OpenClaw 2026.3.29: Plugin Approval System (After 9 CVEs in a Week)",
    description:
      "After 9 CVEs in four days and 341 malicious skills on ClawHub, OpenClaw 2026.3.29 ships plugin approval hooks. What changed, what's still broken, and what this means for security.",
    type: "article",
    publishedTime: "2026-03-30T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Security", "Plugin Approval", "CVE", "Updates", "2026.3.29"],
    url: "https://clawer.ai/blog/openclaw-2026-3-29-plugin-approval",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw 2026.3.29: Plugin Approval System Arrives | Clawer",
    description:
      "After 9 CVEs in four days and 341 malicious skills on ClawHub, OpenClaw 2026.3.29 ships plugin approval hooks. What changed, what's still broken, and what this means for security.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-2026-3-29-plugin-approval",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw 2026.3.29: Plugin Approval System Arrives (After 9 CVEs in a Week)",
  description:
    "OpenClaw 2026.3.29 ships plugin approval hooks after March's security crisis. Covers what changed, how to use approval gates, and what's still missing.",
  datePublished: "2026-03-30",
  dateModified: "2026-03-30",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-2026-3-29-plugin-approval",
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
      name: "OpenClaw 2026.3.29 Plugin Approval",
      item: "https://clawer.ai/blog/openclaw-2026-3-29-plugin-approval",
    },
  ],
};

export default function OpenClaw20263_29PluginApproval() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="prose prose-lg max-w-none">
        <h1>OpenClaw 2026.3.29: Plugin Approval System Arrives (After 9 CVEs in a Week)</h1>

        <p className="text-xl text-gray-600 font-medium">
          After 9 CVEs in four days and 341 malicious skills on ClawHub, OpenClaw ships the feature everyone's been asking for. Here's what actually changed and what's still broken.
        </p>

        <p className="text-sm text-gray-500">Published March 30, 2026 • 8 min read</p>

        <img
          src="/blog/openclaw-2026-3-29-hero.png"
          alt="OpenClaw 2026.3.29 plugin approval system security update dashboard"
          className="rounded-xl w-full my-8"
        />

        <p>
          OpenClaw 2026.3.29 dropped March 29, 2026 — one week after <Link href="/blog/openclaw-nine-cves-march-2026" className="text-blue-600 hover:underline">nine CVEs in four days</Link> exposed OpenClaw's security problems to anyone paying attention.
        </p>

        <p>
          The headline feature: <strong>plugin approval hooks</strong>. Plugins can now pause execution and ask for your permission before running sensitive operations.
        </p>

        <p>
          If you've been running OpenClaw with third-party skills from ClawHub — and statistically, <Link href="/blog/openclaw-clawhub-malware-security" className="text-blue-600 hover:underline">341 of those skills contained malware</Link> — this update matters.
        </p>

        <h2>What Plugin Approval Hooks Actually Do</h2>

        <p>
          Before 2026.3.29, OpenClaw plugins could execute anything — file deletions, API calls, system commands — without asking. If your agent decided to run a skill, it ran. No checkpoint. No review.
        </p>

        <p>Now plugins can call <code>requireApproval</code> in their <code>before_tool_call</code> hooks.</p>

        <p>When triggered, OpenClaw pauses execution and presents an approval prompt:</p>

        <ul>
          <li><strong>Telegram:</strong> Inline buttons (Approve / Deny)</li>
          <li><strong>Discord:</strong> Interaction components</li>
          <li><strong>Other channels:</strong> <code>/approve</code> command</li>
        </ul>

        <p>The agent waits. You review the operation. You approve or reject. Then execution resumes or aborts.</p>

        <p>
          This is what exec approval has been doing for shell commands since day one. Now plugins get the same treatment.
        </p>

        <h3>How to Use Approval Gates (If You Write Plugins)</h3>

        <p>If you maintain a plugin, here's the pattern from the release notes:</p>

        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`async before_tool_call(context, tool) {
  if (tool.name === 'dangerous_operation') {
    const approved = await context.requireApproval({
      prompt: "Delete all files in /data? This can't be undone.",
      metadata: { tool: tool.name, risk: "high" }
    });
    
    if (!approved) {
      throw new Error("User denied approval");
    }
  }
}`}
        </pre>

        <p>That's it. One async call. The framework handles routing across channels.</p>

        <h3>What This Fixes (And What It Doesn't)</h3>

        <p><strong>What approval hooks solve:</strong></p>

        <ul>
          <li>Malicious skills asking to delete your files</li>
          <li>Plugins calling external APIs without your knowledge</li>
          <li>Accidental destructive operations in multi-agent setups</li>
          <li>Supply chain attacks where a skill update introduces new permissions</li>
        </ul>

        <p><strong>What approval hooks do NOT solve:</strong></p>

        <ul>
          <li>Skills that lie about what they're doing (approval prompt says "search," actual code exfiltrates data)</li>
          <li>Skills that don't implement approval hooks at all</li>
          <li>Skills that run malicious code during initialization, before any tool calls</li>
          <li>The fact that ClawHub has no mandatory security review or sandboxing</li>
        </ul>

        <p>
          Approval hooks are <strong>opt-in</strong>. A malicious plugin author can simply... not use them.
        </p>

        <p>
          You're still trusting the skill author to be honest. OpenClaw doesn't enforce approval for risky operations. It just provides the mechanism.
        </p>

        <h2>The Other Changes in 2026.3.29</h2>

        <p>Plugin approval is the security story, but there's more:</p>

        <h3>1. xAI Grok Search Integration</h3>

        <p>
          The bundled xAI provider now uses the Responses API with first-class <code>x_search</code> support. If you have a Grok API key, web search works without configuring plugins.
        </p>

        <p>
          During <code>openclaw onboard</code>, the flow will offer to set up <code>x_search</code> with your existing xAI credentials.
        </p>

        <p>
          This is a nice alternative to Brave Search or Perplexity — especially for X/Twitter content, where Grok has native access.
        </p>

        <h3>2. MiniMax Image Generation</h3>

        <p>
          MiniMax's <code>image-01</code> model is now a first-class image generation provider. Supports text-to-image and image-to-image editing with aspect ratio control.
        </p>

        <p>
          Another option for cover art, visuals, or mockups without leaving OpenClaw. Competes with DALL-E, Midjourney proxies, and Stable Diffusion.
        </p>

        <h3>3. ACP Binding for Discord/iMessage</h3>

        <p>
          ACP (the protocol that lets coding agents like Codex work in OpenClaw) can now bind directly to your current conversation on Discord, BlueBubbles, and iMessage.
        </p>

        <p>
          Instead of spawning a child thread, run:
        </p>

        <pre className="bg-gray-100 p-4 rounded-lg">
          <code>/acp spawn codex --bind here</code>
        </pre>

        <p>Your current chat becomes a Codex workspace. Useful for quick coding sessions where you don't want thread overhead.</p>

        <h3>4. OpenAI apply_patch Enabled by Default</h3>

        <p>
          The <code>apply_patch</code> feature (code editing via diffs) is now enabled by default for OpenAI and OpenAI Codex models.
        </p>

        <p>
          Previously you had to manually enable it. Now it just works. Sandbox policy access aligns with write permissions.
        </p>

        <h3>5. Breaking Change: Qwen Portal Auth Removed</h3>

        <p>
          The deprecated <code>qwen-portal-auth</code> OAuth integration for <code>portal.qwen.ai</code> is gone.
        </p>

        <p>
          If you were using it, migrate to Model Studio with:
        </p>

        <pre className="bg-gray-100 p-4 rounded-lg">
          <code>openclaw onboard --auth-choice modelstudio-api-key</code>
        </pre>

        <p>
          Old configs from before February 2026 will fail validation instead of being auto-migrated.
        </p>

        <h2>What's Still Missing: The Security Gaps Plugin Approval Doesn't Fix</h2>

        <p>
          Plugin approval hooks are a patch, not a solution.
        </p>

        <p>Here's what OpenClaw still doesn't have:</p>

        <h3>1. Mandatory Skill Sandboxing</h3>

        <p>
          Skills run in the same process as your agent. They have access to your <code>~/.openclaw/</code> directory, your filesystem, your API keys.
        </p>

        <p>
          Compare this to browser extensions, which run in isolated sandboxes with explicit permission manifests. OpenClaw has no equivalent.
        </p>

        <p>
          A malicious skill can read your <code>openclaw.json</code> (where API keys are stored), send them to a remote server, and you'd never know unless you're packet-sniffing.
        </p>

        <h3>2. Skill Audit Logs</h3>

        <p>
          When a plugin runs, OpenClaw doesn't log what files it touched, what network requests it made, or what data it accessed.
        </p>

        <p>You can't review what happened after the fact. You just have to trust it was benign.</p>

        <h3>3. ClawHub Security Review Process</h3>

        <p>
          ClawHub — OpenClaw's official skill marketplace — has no mandatory security review. Anyone can publish a skill. The <Link href="/blog/openclaw-clawhub-malware-security" className="text-blue-600 hover:underline">ClawHavoc campaign proved this</Link>, infecting 341 skills with RedLine and Lumma infostealers.
        </p>

        <p>
          The malware sat in the marketplace for <strong>three weeks</strong> before being discovered by security researchers.
        </p>

        <p>
          There's still no automated malware scanning. There's still no human review queue. You're on your own.
        </p>

        <h3>4. Permission Manifests</h3>

        <p>Skills don't declare what they need access to before installation. No "This skill requires:</p>

        <ul>
          <li>Filesystem read/write</li>
          <li>Network access</li>
          <li>Ability to execute shell commands"</li>
        </ul>

        <p>
          You install a skill, it runs with full privileges, and you hope for the best.
        </p>

        <h2>Why Managed Hosting Wins (Again)</h2>

        <p>
          <strong>Most people shouldn't be self-hosting OpenClaw.</strong>
        </p>

        <p>If you're running OpenClaw yourself, you are responsible for:</p>

        <ul>
          <li>Vetting every skill before installation (and re-vetting after updates)</li>
          <li>Monitoring network traffic for data exfiltration</li>
          <li>Keeping up with CVEs and patching within 24 hours of disclosure</li>
          <li>Configuring firewalls correctly (over 42,000 instances are exposed)</li>
          <li>Understanding plugin hooks well enough to know when approval should be required</li>
        </ul>

        <p>
          That's <strong>operational security</strong> work. It takes time, knowledge, and vigilance.
        </p>

        <p>Managed hosting providers do this for you:</p>

        <ul>
          <li>
            <Link href="/" className="text-blue-600 hover:underline">Clawer.ai</Link>: Curated skill marketplace, automatic security patching, container isolation, skills vetted before deployment
          </li>
          <li>xCloud: Managed instances with automatic updates, firewall defaults, monitoring included</li>
          <li>BirchBark: Security-first hosting with audit logs and compliance tooling for enterprise</li>
        </ul>

        <p>
          Plugin approval hooks make self-hosting <em>safer</em>. They don't make it <em>safe</em>.
        </p>

        <h2>How to Update to 2026.3.29</h2>

        <p>If you're self-hosting OpenClaw:</p>

        <pre className="bg-gray-100 p-4 rounded-lg">
          <code>npm install -g openclaw@latest</code>
        </pre>

        <p>Or with Docker:</p>

        <pre className="bg-gray-100 p-4 rounded-lg">
{`docker pull openclaw/openclaw:latest
docker restart openclaw`}
        </pre>

        <p>
          Check your config for Qwen portal auth if you were using it. Migrate to Model Studio before the old auth stops working entirely.
        </p>

        <p>If you're on managed hosting:</p>

        <ul>
          <li>
            <strong>Clawer.ai:</strong> Already updated. No action required.
          </li>
          <li>
            <strong>xCloud:</strong> Rolling update over next 24 hours. Check dashboard for status.
          </li>
          <li>
            <strong>BirchBark:</strong> Updates deploy during your maintenance window (configurable).
          </li>
        </ul>

        <h2>Should You Use Plugin Approval Hooks?</h2>

        <p>If you write plugins: <strong>yes, absolutely</strong>.</p>

        <p>Add approval gates for:</p>

        <ul>
          <li>File deletions or modifications outside your plugin's designated directory</li>
          <li>Network requests to third-party APIs</li>
          <li>Shell command execution</li>
          <li>Database operations (writes, especially)</li>
        </ul>

        <p>
          If you're a user: approval hooks only help if plugin authors implement them. You can't force a skill to ask for permission.
        </p>

        <p>Your best defense is still:</p>

        <ol>
          <li>Only install skills from authors you trust</li>
          <li>Review the source code before installation (it's all open source)</li>
          <li>Run OpenClaw in a container or VM, not your main machine</li>
          <li>Use managed hosting with vetted skill marketplaces</li>
        </ol>

        <h2>What's Next for OpenClaw Security</h2>

        <p>
          Plugin approval hooks are step one. The community is already discussing what needs to come next:
        </p>

        <ul>
          <li>
            <strong>Skill sandboxing:</strong> Run plugins in isolated containers with explicit permission grants (GitHub issue #48520)
          </li>
          <li>
            <strong>Permission manifests:</strong> Skills declare what they need before installation (GitHub issue #49103)
          </li>
          <li>
            <strong>Audit logging:</strong> Record all plugin activity for post-incident review (GitHub issue #47892)
          </li>
          <li>
            <strong>ClawHub security review:</strong> Automated malware scanning + human review for popular skills (no official timeline)
          </li>
        </ul>

        <p>
          The OpenClaw team has acknowledged these gaps. Whether they ship before the next security crisis is anyone's guess.
        </p>

        <h2>Final Thoughts: Progress, Not a Fix</h2>

        <p>
          OpenClaw 2026.3.29 is a good update. Plugin approval hooks are genuinely useful. Grok search integration is convenient. MiniMax image generation adds flexibility.
        </p>

        <p>
          But let's not pretend this fixes the security problems that <Link href="/blog/openclaw-nine-cves-march-2026" className="text-blue-600 hover:underline">surfaced in March</Link>.
        </p>

        <p>
          Approval hooks are damage control. They give you a checkpoint. They don't prevent the damage from happening if you approve blindly or if the plugin lies.
        </p>

        <p>
          ClawHub is still a malware risk. Self-hosting is still an operational burden. And most users are still running exposed instances with default configs.
        </p>

        <p>
          If you're technical, understand the risks, and enjoy the control: keep self-hosting. Use approval hooks. Vet your skills. Lock down your firewall.
        </p>

        <p>
          If you just want an AI assistant that works and doesn't require a security engineering degree: <Link href="/pricing" className="text-blue-600 hover:underline">managed hosting</Link> is the answer.
        </p>

        <p>
          OpenClaw is getting better. Slowly. But it's not safe by default yet.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-8">
          <h3 className="text-xl font-semibold mb-4">Want OpenClaw Without the Security Headaches?</h3>
          <p className="mb-4">
            Clawer.ai handles security, updates, and skill vetting for you. Deploy AI Teams in 60 seconds with pre-configured agents, curated skills, and automatic patching.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            See Pricing →
          </Link>
        </div>

        <hr className="my-12" />

        <div className="text-sm text-gray-600">
          <p>
            <strong>Related:</strong>
          </p>
          <ul>
            <li>
              <Link href="/blog/openclaw-nine-cves-march-2026" className="text-blue-600 hover:underline">
                Nine CVEs in Four Days: OpenClaw's March 2026 Security Flood
              </Link>
            </li>
            <li>
              <Link href="/blog/openclaw-clawhub-malware-security" className="text-blue-600 hover:underline">
                341 Malicious Skills on ClawHub: Protect Your Agent
              </Link>
            </li>
            <li>
              <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:underline">
                Best OpenClaw Hosting in 2026: Honest Comparison
              </Link>
            </li>
            <li>
              <Link href="/blog/openclaw-diy-vs-hosted" className="text-blue-600 hover:underline">
                OpenClaw DIY vs Hosted: The Honest Comparison
              </Link>
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}
