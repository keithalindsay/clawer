import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw Security: Why 42,000+ Instances Are Exposed (And How to Fix It) | Clawer Blog",
  description:
    "CVE-2026-25253, 341 malicious ClawHub skills, and 42,000+ exposed instances. The OpenClaw security crisis explained — and how Clawer solves it.",
  openGraph: {
    title: "OpenClaw Security: Why 42,000+ Instances Are Exposed (And How to Fix It)",
    description:
      "CVE-2026-25253, 341 malicious ClawHub skills, and 42,000+ exposed instances. The OpenClaw security crisis explained — and how Clawer solves it.",
    type: "article",
    publishedTime: "2026-02-16T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["Security", "OpenClaw", "CVE-2026-25253", "ClawHavoc"],
    url: "https://clawer.ai/blog/openclaw-security-guide",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw Security: Why 42,000+ Instances Are Exposed (And How to Fix It)",
    description:
      "CVE-2026-25253, 341 malicious skills, 42,000+ exposed instances. Here's what happened and how to protect yourself.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-security-guide",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clawer.ai" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://clawer.ai/blog" },
    { "@type": "ListItem", position: 3, name: "OpenClaw Security Guide", item: "https://clawer.ai/blog/openclaw-security-guide" },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw Security: Why 42,000+ Instances Are Exposed (And How to Fix It)",
  datePublished: "2026-02-16",
  dateModified: "2026-02-16",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  url: "https://clawer.ai/blog/openclaw-security-guide",
  description:
    "CVE-2026-25253, 341 malicious ClawHub skills, and 42,000+ exposed instances. The OpenClaw security crisis explained — and how Clawer solves it.",
};

export default function OpenClawSecurityGuidePage() {
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Blog
          </Link>
          <Link href="/" className="text-lg font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Header */}
          <header className="mb-8 border-b border-gray-200 pb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full font-medium">Security</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">OpenClaw</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              OpenClaw Security: Why 42,000+ Instances Are Exposed (And How to Fix It)
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <time>February 16, 2026</time>
              <span>·</span>
              <span>8 min read</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg prose-gray max-w-none">
            <p className="lead text-xl text-gray-700 mb-6">
              OpenClaw has become the default platform for personal AI assistants — and attackers have noticed. In the past 90 days, security researchers have uncovered a critical remote code execution vulnerability, a coordinated malware campaign targeting the skill marketplace, and over 42,000 OpenClaw instances running naked on the public internet. If you&apos;re self-hosting OpenClaw, this is the article you need to read.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              The Numbers Are Ugly
            </h2>

            <p className="text-gray-700 mb-6">
              Let&apos;s start with the facts before we get into the fix:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>42,000+ OpenClaw instances</strong> are publicly accessible without proper authentication, according to Censys and Shodan scans from January 2026</li>
              <li><strong>CVE-2026-25253</strong> — a critical RCE vulnerability that lets attackers execute arbitrary code through a crafted share link</li>
              <li><strong>341 malicious skills</strong> discovered on ClawHub in the &quot;ClawHavoc&quot; campaign, representing a 12% infection rate across the marketplace</li>
              <li><strong>Unknown patch rate</strong> — nobody knows how many of those 42,000 instances have applied the security fix</li>
            </ul>

            <p className="text-gray-700 mb-6">
              This isn&apos;t a theoretical risk. These are active attack vectors being exploited right now.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              CVE-2026-25253: One Click to Full Compromise
            </h2>

            <p className="text-gray-700 mb-6">
              Discovered on January 29, 2026, CVE-2026-25253 is about as bad as vulnerabilities get. The attack is elegant in its simplicity: an attacker crafts a malicious OpenClaw &quot;share link&quot; — the kind users routinely exchange to share conversation threads or skill configurations. When a victim clicks the link, the attacker steals their session token and gains full remote code execution on the victim&apos;s OpenClaw instance.
            </p>

            <p className="text-gray-700 mb-4">
              Why it&apos;s particularly dangerous:
            </p>

            <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Zero installation required</strong> — unlike malware skills, this needs no user consent beyond clicking a link</li>
              <li><strong>Looks legitimate</strong> — the share link format is identical to real OpenClaw shares</li>
              <li><strong>Full RCE</strong> — attackers get complete code execution with the permissions of the OpenClaw process</li>
              <li><strong>Scales trivially</strong> — drop the link in a Discord, Reddit thread, or email, and wait</li>
            </ol>

            <p className="text-gray-700 mb-6">
              OpenClaw maintainers patched the vulnerability within 48 hours. The problem? Self-hosted instances only get patched when their admins manually update. Based on historical patch adoption rates for OpenClaw, fewer than 30% of instances are likely updated within the first month.
            </p>

            <p className="text-gray-700 mb-6">
              That means <strong>roughly 29,000 instances remain vulnerable right now</strong>, weeks after the fix was available.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              The ClawHavoc Campaign: 341 Trojan Skills
            </h2>

            <p className="text-gray-700 mb-6">
              While CVE-2026-25253 was the headline, the ClawHavoc campaign may be more damaging long-term. Working with VirusTotal, OpenClaw maintainers scanned the entire ClawHub marketplace and found 341 malicious skills — about 12% of all published skills.
            </p>

            <p className="text-gray-700 mb-4">
              The campaign was sophisticated. These weren&apos;t crude scripts. The malicious skills:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Crypto wallet theft</strong> — scanned local filesystems for wallet files, exfiltrated private keys to attacker-controlled servers</li>
              <li><strong>SSH key harvesting</strong> — copied entire ~/.ssh directories, giving attackers lateral movement across connected servers</li>
              <li><strong>Browser credential stealing</strong> — dumped saved passwords from Chrome, Firefox, and Edge profiles</li>
              <li><strong>Persistent backdoors</strong> — established reverse shells for ongoing, stealthy access</li>
              <li><strong>Environment variable exfiltration</strong> — stole API keys for OpenAI, AWS, GCP, and other cloud services</li>
            </ul>

            <p className="text-gray-700 mb-6">
              The attack succeeded because OpenClaw skills run with the same permissions as the OpenClaw process. There&apos;s no sandboxing, no permission model, no review process. If you install a skill, it can do anything your user account can do.
            </p>

            <p className="text-gray-700 mb-6">
              Many victims didn&apos;t realize they were compromised. The malicious skills actually worked as advertised — they just <em>also</em> stole your data in the background.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              42,000 Open Doors
            </h2>

            <p className="text-gray-700 mb-6">
              Internet scanning platforms Censys and Shodan identified over 42,000 OpenClaw instances running on the public internet without adequate security configuration. These instances had some combination of:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Default or no authentication</li>
              <li>No firewall rules restricting access</li>
              <li>Full filesystem access enabled</li>
              <li>API tokens and cloud credentials exposed in environment variables</li>
              <li>Outdated versions with known vulnerabilities</li>
            </ul>

            <p className="text-gray-700 mb-6">
              The number is double what was reported just six months ago. OpenClaw&apos;s popularity is growing faster than its users&apos; ability to secure it. Every new Docker tutorial that ends with &quot;expose port 3000&quot; creates another target.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              If You&apos;re Self-Hosting: Immediate Actions
            </h2>

            <p className="text-gray-700 mb-4">
              If you run your own OpenClaw instance, do this today:
            </p>

            <ol className="list-decimal pl-6 mb-6 space-y-3 text-gray-700">
              <li><strong>Update to the latest version</strong> — this patches CVE-2026-25253 and other recent fixes</li>
              <li><strong>Audit your installed skills</strong> — remove anything you didn&apos;t personally verify. Check each skill&apos;s source code, not just its description</li>
              <li><strong>Check your firewall</strong> — your instance should NOT be accessible from the public internet. Use a VPN or reverse proxy with authentication</li>
              <li><strong>Rotate all credentials</strong> — if you had any ClawHavoc-era skills installed, assume your API keys, SSH keys, and stored passwords are compromised</li>
              <li><strong>Enable authentication</strong> — if you haven&apos;t already, enable OpenClaw&apos;s built-in auth and set a strong password</li>
              <li><strong>Monitor logs</strong> — watch for unusual outbound connections, unexpected file access, or new processes</li>
            </ol>

            <p className="text-gray-700 mb-6">
              This is the minimum. If you want to do it right, you also need automated updates, intrusion detection, and regular security audits. That&apos;s a lot of work for something that&apos;s supposed to be a productivity tool.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              How Clawer Solves This
            </h2>

            <p className="text-gray-700 mb-6">
              We built <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">Clawer</Link> specifically because we saw this coming. The OpenClaw project is excellent software, but security is a full-time job that most users aren&apos;t equipped for. Here&apos;s how we handle it:
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Containerized Isolation
            </h3>
            <p className="text-gray-700 mb-6">
              Every Clawer instance runs in its own isolated container with minimal permissions. There are no SSH keys to steal, no browser profiles to dump, no crypto wallets to exfiltrate — because none of that exists in the container. Even if a skill somehow went rogue, the blast radius is contained to an empty sandbox.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Skill Allowlists
            </h3>
            <p className="text-gray-700 mb-6">
              We don&apos;t connect to ClawHub. Period. Every skill available on Clawer comes from our curated marketplace. Each skill is code-reviewed, sandboxed-tested, and continuously monitored. No community-contributed code runs without our explicit approval. The ClawHavoc campaign couldn&apos;t happen here because there&apos;s no open marketplace to poison.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Automated Security Scanning
            </h3>
            <p className="text-gray-700 mb-6">
              Every container image is scanned for known vulnerabilities before deployment. We run automated CVE checks, dependency audits, and behavioral analysis. When CVE-2026-25253 was announced, every Clawer instance was patched within 2 hours — with zero user action required.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              No Exposed Surfaces
            </h3>
            <p className="text-gray-700 mb-6">
              Clawer instances are never directly exposed to the internet. All access goes through our authenticated API gateway with rate limiting, anomaly detection, and DDoS protection. There&apos;s no port to scan, no default credential to guess, no misconfigured firewall to exploit.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">
              Automatic Updates
            </h3>
            <p className="text-gray-700 mb-6">
              Security patches are applied automatically across all instances. No admin action required. No update notification to ignore. No &quot;I&apos;ll do it this weekend&quot; that turns into never. When a CVE drops, you&apos;re patched before you finish reading the advisory.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              Self-Hosted vs. Managed: The Security Comparison
            </h2>

            <div className="overflow-x-auto my-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Security Aspect</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Self-Hosted</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-600">Clawer</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4">Patch application</td>
                    <td className="text-center py-3 px-4">Manual (days/weeks)</td>
                    <td className="text-center py-3 px-4 text-green-700 font-medium">Automatic (&lt;2 hours)</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 pr-4">Skill vetting</td>
                    <td className="text-center py-3 px-4">None (ClawHub is open)</td>
                    <td className="text-center py-3 px-4 text-green-700 font-medium">Curated allowlist</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4">Instance isolation</td>
                    <td className="text-center py-3 px-4">Shares host OS</td>
                    <td className="text-center py-3 px-4 text-green-700 font-medium">Isolated container</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 pr-4">Network exposure</td>
                    <td className="text-center py-3 px-4">Often public</td>
                    <td className="text-center py-3 px-4 text-green-700 font-medium">Behind auth gateway</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4">Credential protection</td>
                    <td className="text-center py-3 px-4">Env vars on host</td>
                    <td className="text-center py-3 px-4 text-green-700 font-medium">Encrypted secrets store</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-3 pr-4">Security monitoring</td>
                    <td className="text-center py-3 px-4">DIY</td>
                    <td className="text-center py-3 px-4 text-green-700 font-medium">24/7 automated</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
              The Bottom Line
            </h2>

            <p className="text-gray-700 mb-6">
              OpenClaw is powerful software. But power without security is a liability. The 42,000 exposed instances, the ClawHavoc campaign, and CVE-2026-25253 aren&apos;t anomalies — they&apos;re the predictable result of putting complex infrastructure in the hands of users who want an AI assistant, not a second job as a security engineer.
            </p>

            <p className="text-gray-700 mb-6">
              If you have a dedicated security team and the time to maintain hardened infrastructure, self-hosting can work. For everyone else — freelancers, small businesses, startups, anyone who just wants AI that works — managed hosting isn&apos;t a luxury. It&apos;s the responsible choice.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 my-8">
              <p className="text-lg font-semibold text-gray-900 mb-3">
                <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 underline">
                  Start your free Clawer instance →
                </Link>
              </p>
              <p className="text-gray-700">
                100 messages per day, free forever. No credit card. Security patches applied automatically. AI Teams and custom skills on Pro ($19/mo).
              </p>
            </div>

            <hr className="my-8 border-gray-200" />

            <p className="text-sm text-gray-500 italic">
              Clawer.ai is an independent managed hosting service built on OpenClaw. We respect the OpenClaw project and its maintainers. This article is intended to help users make informed decisions about their deployment strategy.
            </p>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="text-white font-bold text-lg">🦞 CLAWER.AI</Link>
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
