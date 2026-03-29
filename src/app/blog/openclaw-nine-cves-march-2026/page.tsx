import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "9 CVEs in 4 Days: OpenClaw's March 2026 Security Flood",
  description:
    "Between March 18-21, nine CVEs hit OpenClaw — including a 9.9 critical. Timeline, technical breakdown, and what self-hosters must do now.",
  openGraph: {
    title: "Nine CVEs in Four Days: OpenClaw's March 2026 Security Flood",
    description:
      "Between March 18-21, nine security vulnerabilities hit OpenClaw — including a 9.9 critical. Timeline, technical breakdown, and what self-hosters need to do now.",
    type: "article",
    publishedTime: "2026-03-29T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "Security", "CVE", "Vulnerabilities", "Self-Hosting"],
    url: "https://clawer.ai/blog/openclaw-nine-cves-march-2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "9 CVEs in 4 Days: OpenClaw's March 2026 Security Flood",
    description:
      "Between March 18-21, nine CVEs hit OpenClaw — including a 9.9 critical. Timeline, technical breakdown, and what self-hosters must do now.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-nine-cves-march-2026",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Nine CVEs in Four Days: OpenClaw's March 2026 Security Flood",
  description:
    "Between March 18 and March 21, 2026, nine CVEs were publicly disclosed for OpenClaw. One scored a 9.9 out of 10 on the CVSS scale. Technical breakdown and response guidance.",
  datePublished: "2026-03-29",
  dateModified: "2026-03-29",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-nine-cves-march-2026",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://clawer.ai" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://clawer.ai/blog" },
    { "@type": "ListItem", position: 3, name: "Nine CVEs in Four Days: OpenClaw's March 2026 Security Flood" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What CVEs were disclosed for OpenClaw in March 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nine CVEs were disclosed between March 18-21, 2026: CVE-2026-22172 (9.9 CVSS - WebSocket scope escalation), CVE-2026-32025 (7.5 - browser brute-force attack), CVE-2026-32048 (7.5 - sandbox escape), CVE-2026-32051 (8.8 - privilege escalation), CVE-2026-32049 (7.5 - DoS via media payloads), CVE-2026-32027 (7.0 - shell execution via SHELL variable), CVE-2026-22171 (8.2 - path traversal), CVE-2026-29607 (6.4 - wrapper bypass), and CVE-2026-28460 (5.9 - allowlist bypass). Six were high severity, one critical, two medium.",
      },
    },
    {
      "@type": "Question",
      name: "Is CVE-2026-22172 actively exploited?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No confirmed exploitation in the wild as of March 29, 2026. However, the attack is trivial — any authenticated user can self-declare admin scope during WebSocket handshake without server verification. Fixed in OpenClaw 2026.3.12. Given the simplicity and 9.9 CVSS score, patching immediately is critical.",
      },
    },
    {
      "@type": "Question",
      name: "How do I protect my OpenClaw instance from these vulnerabilities?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Update to OpenClaw v2026.3.12 or later immediately. Bind your gateway to localhost (not 0.0.0.0). Rotate gateway credentials after updating. Configure encryptKey for Feishu integrations. Review allow-always approvals. Enable rate limiting on WebSocket connections. Monitor the jgamblin/OpenClawCVEs GitHub tracker — 128 advisories still await CVE assignment.",
      },
    },
    {
      "@type": "Question",
      name: "Should I still self-host OpenClaw after these CVEs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Self-hosting remains viable if you commit to continuous security maintenance: tracking upstream releases, applying patches within 24-48 hours of disclosure, monitoring CVE trackers, and hardening network exposure. For users without dedicated security resources or time for weekly patching cycles, managed hosting eliminates vulnerability exposure by handling updates automatically.",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-6">Nine CVEs in Four Days: OpenClaw's March 2026 Security Flood</h1>

        <div className="text-gray-600 mb-8">Published March 29, 2026</div>

        <img
          src="/blog/openclaw-nine-cves-march-2026-hero.png"
          alt="OpenClaw security timeline showing nine CVE disclosures between March 18-21, 2026"
          className="rounded-xl w-full mb-8"
        />

        <p className="text-xl mb-6">
          Between March 18 and March 21, 2026, nine CVEs were publicly disclosed for OpenClaw. One scored a 9.9 out of
          10 on the CVSS scale. Six were high severity. Two medium. One critical.
        </p>

        <p className="mb-6">
          Four days, nine holes, and an uncomfortable spotlight on the security model of self-hosted AI agents with
          root-equivalent access.
        </p>

        <p className="mb-6">
          This wasn't an anomaly. The{" "}
          <a
            href="https://github.com/jgamblin/OpenClawCVEs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            jgamblin/OpenClawCVEs
          </a>{" "}
          tracker now lists 156 total security advisories for OpenClaw, with 128 still awaiting CVE assignment.
          Belgium's Centre for Cybersecurity issued a "Patch Immediately" advisory in March for seven more CVEs in the
          Nextcloud Talk plugin alone — all scoring 9.2–9.4.
        </p>

        <p className="mb-8">
          Here's what happened, what each vulnerability does, why the timing makes everything worse, and what
          self-hosters need to do right now.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Full Scorecard</h2>

        <div className="overflow-x-auto mb-8">
          <p className="mb-4 font-semibold">Nine CVEs Disclosed March 18-21, 2026:</p>
          <ul className="space-y-4 mb-6">
            <li>
              <strong>CVE-2026-22171</strong> (8.2 High) — Path traversal in Feishu media download allows arbitrary
              file write. Patched in 2026.2.19.
            </li>
            <li>
              <strong>CVE-2026-28460</strong> (5.9 Medium) — Allowlist bypass via shell line-continuation enables
              command injection. Patched in 2026.2.22.
            </li>
            <li>
              <strong>CVE-2026-29607</strong> (6.4 Medium) — Allow-always wrapper bypass: approve safe command, swap
              payload, execute arbitrary code. Patched in 2026.2.22.
            </li>
            <li>
              <strong>CVE-2026-32027</strong> (7.0 High) — Untrusted SHELL environment variable leads to arbitrary shell
              execution on shared hosts. Patched in 2026.2.22.
            </li>
            <li>
              <strong>CVE-2026-32025</strong> (7.5 High) — WebSocket brute-force with no rate limiting. Full session
              hijack from browser ("ClawJacked"). Patched in 2026.2.25.
            </li>
            <li>
              <strong>CVE-2026-22172</strong> (9.9 Critical) — WebSocket scope self-declaration. Low-privilege user
              becomes full admin by asking. Patched in 2026.3.12.
            </li>
            <li>
              <strong>CVE-2026-32048</strong> (7.5 High) — Sandbox escape. Sandboxed sessions spawn unsandboxed
              children. Patched in 2026.3.1.
            </li>
            <li>
              <strong>CVE-2026-32049</strong> (7.5 High) — Oversized media payload DoS. Crash the service remotely, no
              auth needed. Patched in 2026.2.22.
            </li>
            <li>
              <strong>CVE-2026-32051</strong> (8.8 High) — Privilege escalation. operator.write scope reaches owner-only
              surfaces. Patched in 2026.3.1.
            </li>
          </ul>
        </div>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Worst One: CVE-2026-22172</h2>

        <p className="mb-6">A 9.9 CVSS score is about as bad as it gets without being a remote code execution zero-day.</p>

        <p className="mb-6">When connecting to OpenClaw's gateway via WebSocket using shared-token or password auth, the server let clients declare their own permission scopes during the handshake.</p>

        <p className="mb-6">Log in as a regular user. Tell the server "I'm operator.admin." The server says "okay."</p>

        <p className="mb-6">
          No exploit toolkit. No buffer overflow. No race condition. You just ask. Full administrative access — gateway
          operations, cron management, everything.
        </p>

        <p className="mb-6">
          TheHackerWire called it a "self-declaration" vulnerability, which is a diplomatic way of saying the
          authorization check wasn't there.
        </p>

        <p className="mb-8">
          Patched in v2026.3.12 on March 13. If you're running anything older, any authenticated user on your instance
          is one WebSocket message away from admin privileges.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Browser Attack: CVE-2026-32025 ("ClawJacked")</h2>

        <p className="mb-6">
          Discovered by Oasis Security, this one is clever and deeply unsettling for anyone running OpenClaw on their
          local machine.
        </p>

        <p className="mb-6">
          OpenClaw's gateway had no rate limiting on authentication attempts from localhost. Sounds fine — until you
          remember browsers can open WebSocket connections to localhost.
        </p>

        <p className="mb-6">A malicious website you visit can:</p>

        <ul className="list-disc pl-8 mb-6 space-y-2">
          <li>Connect to your local OpenClaw gateway</li>
          <li>Brute-force the password at hundreds of attempts per second</li>
          <li>Exploit the fact that localhost connections auto-approve device pairing</li>
        </ul>

        <p className="mb-8">
          Full session access. Your AI agent compromised because you opened the wrong browser tab.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Sandbox That Wasn't: CVE-2026-32048</h2>

        <p className="mb-6">
          OpenClaw's sandbox mode is one of the features people cite when arguing it's safe to self-host. Turns out it
          had a fundamental flaw.
        </p>

        <p className="mb-6">
          When a sandboxed session spawns a child process through <code>sessions_spawn</code>, OpenClaw failed to
          inherit sandbox restrictions. The child runs with <code>sandbox.mode: off</code>.
        </p>

        <p className="mb-6">
          A compromised sandboxed agent escapes confinement entirely — arbitrary code execution, data access, and DoS
          all on the table.
        </p>

        <p className="mb-8">
          This is especially ironic given that{" "}
          <Link href="/blog/nvidia-nemoclaw-openclaw-enterprise" className="text-blue-600 hover:underline">
            NVIDIA built NemoClaw
          </Link>{" "}
          specifically to add better sandboxing around OpenClaw for enterprise use.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">Two Ways Past the Same Boundary</h2>

        <p className="mb-6">
          CVE-2026-29607 and CVE-2026-28460 are thematically linked — both bypass OpenClaw's command approval system,
          disclosed on the same day.
        </p>

        <p className="mb-6">
          <strong>CVE-2026-29607</strong> exploits the "allow always" feature. Approve a safe-looking wrapped command
          once, and the approval persists at the wrapper level, not the inner command. Swap the inner payload later →
          RCE without re-prompting.
        </p>

        <p className="mb-6">
          <strong>CVE-2026-28460</strong> bypasses the allowlist entirely using shell line-continuation characters.
          Different technique, same security boundary broken.
        </p>

        <p className="mb-8">
          Together they demonstrate that OpenClaw's human-in-the-loop approval model — one of its core safety claims —
          had fundamental implementation gaps.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Patch Gap Problem</h2>

        <p className="mb-6">Here's the timing detail that makes everything worse.</p>

        <p className="mb-6">
          Several patches shipped weeks before the CVEs were published. Version 2026.2.22, which fixes five of the nine
          CVEs, released around February 22. The CVEs referencing it weren't published until March 19–21. That's nearly
          a month.
        </p>

        <p className="mb-6">
          This is good practice from the OpenClaw team: fix the bug, ship the patch, then disclose. But it only works if
          people update.
        </p>

        <p className="mb-6">
          Most self-hosters don't follow upstream releases daily. They wait for CVE publications, security advisories, or
          posts like this one. Industry research suggests self-hosters take 1–4 weeks to apply non-critical patches after
          awareness.
        </p>

        <p className="mb-8">
          For these March 19 disclosures, many instances were exposed for a month after the fix existed. Some still are
          right now.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Bigger Picture</h2>

        <p className="mb-6">
          This four-day flood isn't an anomaly. It's what happens when a project grows from enthusiast tool to
          infrastructure faster than its security surface can mature.
        </p>

        <p className="mb-6">
          OpenClaw went from 0 to 316,000+ GitHub stars in under five months. It runs with root-equivalent access on
          tens of thousands of machines. The security establishment has noticed:
        </p>

        <ul className="list-disc pl-8 mb-6 space-y-2">
          <li>
            Trend Micro published "CISOs in a Pinch: A Security Analysis of OpenClaw," calling it root-access-equivalent
            with probabilistic-model risk
          </li>
          <li>Cisco labeled it "a security nightmare" for enterprise environments</li>
          <li>Microsoft released enterprise security guidance for OpenClaw deployments</li>
          <li>
            <Link href="/blog/openclaw-cve-2026-exposed" className="text-blue-600 hover:underline">
              42,900+ internet-exposed instances
            </Link>{" "}
            were found by researchers, with 15,200 vulnerable to RCE
          </li>
        </ul>

        <p className="mb-8">
          And this is just one week. The 128 advisories still awaiting CVE assignment suggest the disclosure pipeline
          has months of backlog.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">What to Do Right Now</h2>

        <p className="mb-6">If you're running OpenClaw on your own infrastructure:</p>

        <ol className="list-decimal pl-8 mb-6 space-y-4">
          <li>
            <strong>Update immediately.</strong> At minimum, run v2026.3.12 or later. That covers the critical 9.9 scope
            escalation. Ideally, update to the latest release.
          </li>
          <li>
            <strong>Bind the gateway to localhost.</strong> Don't expose it on 0.0.0.0. Use Tailscale, SSH tunneling, or
            a reverse proxy with authentication.
          </li>
          <li>
            <strong>Don't rely on the sandbox alone.</strong> Until the sandbox inheritance fix (CVE-2026-32048) is
            verified in your version, assume sandboxed agents can escape.
          </li>
          <li>
            <strong>Review your allow-always rules.</strong> The wrapper bypass (CVE-2026-29607) means old approvals may
            cover commands you didn't intend.
          </li>
          <li>
            <strong>Enable rate limiting on your gateway.</strong> The default configuration had none for WebSocket auth
            attempts.
          </li>
          <li>
            <strong>Watch the CVE tracker.</strong> 128 advisories are still pending assignment. More CVE numbers are
            coming.
          </li>
        </ol>

        <h2 className="text-3xl font-bold mb-6 mt-12">The Self-Hosting Tradeoff</h2>

        <p className="mb-6">
          None of this means OpenClaw is fundamentally broken. The project's response time on patches has been fast —
          often same-day or next-day. The open-source model means every vulnerability gets public scrutiny and
          transparent fixes.
        </p>

        <p className="mb-6">
          But the March flood makes one thing clear: self-hosting an AI agent that runs with system-level access is a
          continuous security commitment, not a set-and-forget deployment.
        </p>

        <p className="mb-6">
          If you're running OpenClaw, you're signing up to track upstream releases, apply patches promptly, and monitor
          advisories — indefinitely.
        </p>

        <p className="mb-6">
          For many users, that's a reasonable tradeoff. For others, it's the argument for managed hosting.{" "}
          <Link href="/pricing" className="text-blue-600 hover:underline">
            Clawer handles security patching automatically
          </Link>
          , applies CVE fixes within 24 hours of disclosure, and runs container isolation by default.
        </p>

        <p className="mb-8">
          Either way, nine CVEs in four days is the kind of wake-up call that shouldn't be ignored.
        </p>

        <h2 className="text-3xl font-bold mb-6 mt-12">FAQ</h2>

        <div className="space-y-6 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-2">What CVEs were disclosed for OpenClaw in March 2026?</h3>
            <p>
              Nine CVEs were disclosed between March 18-21, 2026. The most critical was CVE-2026-22172 (9.9 CVSS -
              WebSocket scope escalation). Others included CVE-2026-32025 (browser brute-force), CVE-2026-32048 (sandbox
              escape), CVE-2026-32051 (privilege escalation), and five more ranging from 5.9 to 8.8 severity.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Is CVE-2026-22172 actively exploited?</h3>
            <p>
              No confirmed exploitation in the wild as of March 29, 2026. However, the attack is trivial — any
              authenticated user can self-declare admin scope during WebSocket handshake without server verification.
              Fixed in OpenClaw 2026.3.12.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              How do I protect my OpenClaw instance from these vulnerabilities?
            </h3>
            <p>
              Update to OpenClaw v2026.3.12 or later immediately. Bind your gateway to localhost (not 0.0.0.0). Rotate
              gateway credentials after updating. Configure encryptKey for Feishu integrations. Review allow-always
              approvals. Enable rate limiting on WebSocket connections. Monitor the jgamblin/OpenClawCVEs GitHub tracker.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Should I still self-host OpenClaw after these CVEs?</h3>
            <p>
              Self-hosting remains viable if you commit to continuous security maintenance: tracking upstream releases,
              applying patches within 24-48 hours of disclosure, monitoring CVE trackers, and hardening network exposure.
              For users without dedicated security resources or time for weekly patching cycles,{" "}
              <Link href="/blog/best-openclaw-hosting" className="text-blue-600 hover:underline">
                managed hosting
              </Link>{" "}
              eliminates vulnerability exposure by handling updates automatically.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-xl mt-12">
          <h3 className="text-2xl font-bold mb-4">Want OpenClaw Without the Security Headaches?</h3>
          <p className="mb-6">
            Clawer handles security patching automatically, applies CVE fixes within 24 hours, and runs container
            isolation by default. Deploy your AI agent in 60 seconds.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            View Pricing →
          </Link>
        </div>
      </article>
    </>
  );
}
