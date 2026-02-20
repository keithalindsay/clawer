import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw on WhatsApp: Complete Setup Guide (2026)",
  description:
    "Connect OpenClaw to WhatsApp in 10 minutes. QR code setup, config examples, common errors (status=515 fix), and when to use WhatsApp vs Telegram.",
  openGraph: {
    title: "OpenClaw on WhatsApp: Complete Setup Guide — From QR Code to Production",
    description:
      "Step-by-step WhatsApp setup for OpenClaw. Includes QR authentication, allowlist config, group chat setup, status=515 error fix, and managed vs DIY comparison.",
    type: "article",
    publishedTime: "2026-02-20T00:00:00.000Z",
    authors: ["Clawer Team"],
    tags: ["OpenClaw", "WhatsApp", "Setup Guide", "AI Assistant", "Baileys", "Messaging Channels"],
    url: "https://clawer.ai/blog/openclaw-whatsapp-setup",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw on WhatsApp: Complete Setup Guide (2026)",
    description:
      "Connect OpenClaw to WhatsApp in 10 minutes. QR code setup, config examples, common errors (status=515 fix), and when to use WhatsApp vs Telegram.",
  },
  alternates: {
    canonical: "https://clawer.ai/blog/openclaw-whatsapp-setup",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "OpenClaw on WhatsApp: Complete Setup Guide — From QR Code to Production",
  description:
    "Step-by-step guide to connecting OpenClaw to WhatsApp. Covers QR code authentication, access policies, group chats, troubleshooting, and when managed hosting makes sense.",
  datePublished: "2026-02-20",
  dateModified: "2026-02-20",
  author: { "@type": "Organization", name: "Clawer.ai", url: "https://clawer.ai" },
  publisher: {
    "@type": "Organization",
    name: "Clawer.ai",
    url: "https://clawer.ai",
    logo: { "@type": "ImageObject", url: "https://clawer.ai/og-image.png" },
  },
  url: "https://clawer.ai/blog/openclaw-whatsapp-setup",
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
      name: "OpenClaw WhatsApp Setup",
      item: "https://clawer.ai/blog/openclaw-whatsapp-setup",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I connect OpenClaw to WhatsApp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Run 'openclaw channels login --channel whatsapp' in your terminal. A QR code will appear. On your phone, open WhatsApp → Settings → Linked Devices → Link a Device, then scan the QR code. Connection completes in 30-60 seconds. You'll need a WhatsApp account and OpenClaw Gateway running.",
      },
    },
    {
      "@type": "Question",
      name: "What is the status=515 error in OpenClaw WhatsApp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Status=515 is a stream error that happens when WhatsApp's protocol changes break the Baileys library. Fix: Go to Settings → Config in the OpenClaw web UI, click Update (no changes needed), then return to Channels. If that fails, restart the Gateway with 'openclaw gateway restart'. This forces a fresh connection attempt.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use OpenClaw with my personal WhatsApp number?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, but it's not recommended for production. Personal-number mode works, but you risk WhatsApp disconnecting your session if you have too many linked devices or your phone goes offline. A dedicated WhatsApp number (via a second SIM or virtual number service) is more reliable and keeps your personal chats separate from agent activity.",
      },
    },
    {
      "@type": "Question",
      name: "Why does OpenClaw use Baileys instead of the official WhatsApp API?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WhatsApp doesn't offer an official API for personal accounts — only for WhatsApp Business API, which requires company verification and costs money. Baileys reverse-engineers the WhatsApp Web protocol to enable personal account integration. The downside: it's unofficial, so it breaks when WhatsApp updates their protocol (usually fixed within days by the Baileys team).",
      },
    },
    {
      "@type": "Question",
      name: "How do I set up OpenClaw in WhatsApp group chats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add groupPolicy: 'allowlist' and groupAllowFrom: ['+1234567890'] to your WhatsApp config. By default, OpenClaw only responds to group messages that mention it. Find the group ID in your logs after sending a test message, then add it to the 'groups' array in config if you want to whitelist specific groups. Group chat support works, but mention-gating can be annoying in fast-moving conversations.",
      },
    },
    {
      "@type": "Question",
      name: "Is managed OpenClaw hosting worth it for WhatsApp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If you're non-technical or value your time, yes. Self-hosting WhatsApp requires maintaining Docker, handling QR re-authentication when sessions break, debugging Baileys protocol errors, and keeping up with OpenClaw updates. Managed hosting (like Clawer.ai) handles all of this, including automatic reconnection and 24/7 monitoring. WhatsApp is one of the more fragile channels — having someone else handle the maintenance is worth it for most users.",
      },
    },
  ],
};

export default function Page() {
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
      <article className="mx-auto max-w-3xl px-6 py-16 prose prose-lg prose-slate dark:prose-invert">
        <h1>OpenClaw on WhatsApp: Complete Setup Guide</h1>

        <p className="lead">
          WhatsApp is the most-requested OpenClaw channel. It's also the most temperamental. This
          guide shows you how to connect OpenClaw to WhatsApp in 10 minutes, what breaks (and why),
          and when you should just pay someone else to handle it.
        </p>

        <img
          src="/blog/openclaw-whatsapp-setup-hero.png"
          alt="OpenClaw WhatsApp setup showing QR code authentication flow and linked devices screen"
          className="rounded-xl w-full"
        />

        <p>
          I've run OpenClaw on WhatsApp for six months. It works beautifully when it works. And
          when it breaks — usually at 3am because WhatsApp updated their protocol — you remember
          why the official docs recommend a dedicated number.
        </p>

        <h2>Why WhatsApp for OpenClaw?</h2>

        <p>
          Most people ask for WhatsApp because that's where their contacts are. Your family isn't
          on Discord. Your business partners aren't switching to Telegram. WhatsApp has 2.78
          billion users. If you want your AI agent accessible to normal humans, WhatsApp is often
          the only option.
        </p>

        <p>The reality:</p>

        <ul>
          <li>
            <strong>WhatsApp is the most familiar</strong> — People already know how to use it. No
            app downloads, no account creation, no "what's a bot token?"
          </li>
          <li>
            <strong>Multi-device support works</strong> — Unlike iMessage (Apple-only), WhatsApp's
            linked device mode is cross-platform and stable.
          </li>
          <li>
            <strong>But it's unofficial</strong> — OpenClaw uses Baileys, which reverse-engineers
            the WhatsApp Web protocol. When WhatsApp updates, Baileys breaks. Usually fixed in
            days, but plan for occasional downtime.
          </li>
        </ul>

        <p>
          If you're technical and your contacts are flexible, Telegram is less maintenance. But if
          you need WhatsApp, here's how to set it up properly.
        </p>

        <h2>Prerequisites: What You Need</h2>

        <p>Before you start:</p>

        <ul>
          <li>
            <strong>OpenClaw installed and running</strong> — If you haven't set up OpenClaw yet,
            see our{" "}
            <Link href="/blog/how-to-set-up-openclaw">complete OpenClaw setup guide</Link>.
          </li>
          <li>
            <strong>A WhatsApp account</strong> — Ideally a dedicated number, not your personal
            one. More on this below.
          </li>
          <li>
            <strong>Gateway running</strong> — Check with <code>openclaw gateway status</code>. If
            it's not running, start it with <code>openclaw gateway</code>.
          </li>
          <li>
            <strong>Node.js runtime</strong> — WhatsApp has known issues with Bun. Use Node.
          </li>
        </ul>

        <h2>Dedicated Number vs Personal Number</h2>

        <p>
          The official docs say "OpenClaw recommends running WhatsApp on a separate number when
          possible." Here's what that actually means in practice:
        </p>

        <h3>Dedicated Number (Recommended)</h3>

        <p>
          <strong>Pros:</strong>
        </p>
        <ul>
          <li>Clean separation between personal chats and agent activity</li>
          <li>Fewer linked devices = more stable connection</li>
          <li>No risk of accidentally triggering your agent in personal conversations</li>
          <li>Clearer allowlist management (only trusted users, no self-chat confusion)</li>
        </ul>

        <p>
          <strong>Cons:</strong>
        </p>
        <ul>
          <li>Requires a second phone number (SIM card or virtual number service)</li>
          <li>Costs $5-15/month for a virtual number</li>
        </ul>

        <p>
          <strong>How to get a dedicated number:</strong>
        </p>
        <ul>
          <li>Physical SIM: Buy a prepaid SIM, activate on a spare phone or dual-SIM device</li>
          <li>
            Virtual number: Google Voice (US only, free), Twilio ($1/mo), MySudo ($0.99/mo first
            number)
          </li>
        </ul>

        <h3>Personal Number (Works But Fragile)</h3>

        <p>You can use your personal WhatsApp number. OpenClaw has self-chat protections:</p>

        <ul>
          <li>Skips read receipts for messages you send to yourself</li>
          <li>
            Adds a response prefix (default: <code>[openclaw]</code>) to distinguish agent replies
          </li>
          <li>Ignores self-mention triggers</li>
        </ul>

        <p>
          <strong>The risk:</strong> WhatsApp limits linked devices to 5. If you're already using
          WhatsApp Web on your laptop, WhatsApp Desktop on your work computer, and have your tablet
          linked, adding OpenClaw puts you at the limit. WhatsApp occasionally force-disconnects
          sessions when it detects "unusual activity" (which is exactly what OpenClaw looks like).
        </p>

        <p>When your session gets disconnected, you have to re-scan the QR code. At 3am.</p>

        <h2>Step 1: Configure WhatsApp Access Policy</h2>

        <p>
          OpenClaw won't respond to just anyone who messages your WhatsApp number. You need to
          configure an access policy first.
        </p>

        <p>
          Edit your OpenClaw config. You can do this in the web UI (
          <code>http://localhost:18789</code>, Settings → Config → RAW) or directly edit{" "}
          <code>~/.openclaw/config/openclaw.json</code>:
        </p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+12025551234"],
      "groupPolicy": "disabled",
      "sendReadReceipts": true,
      "mediaMaxMb": 50
    }
  }
}`}
        </pre>

        <h3>What These Settings Mean</h3>

        <p>
          <strong>
            <code>dmPolicy</code>
          </strong>{" "}
          — Controls who can message your agent directly:
        </p>
        <ul>
          <li>
            <code>"allowlist"</code> — Only numbers in <code>allowFrom</code> can message (most
            secure, recommended)
          </li>
          <li>
            <code>"pairing"</code> — Unknown numbers get a pairing request you can approve/deny
          </li>
          <li>
            <code>"open"</code> — Anyone can message (requires <code>allowFrom: ["*"]</code>, not
            recommended)
          </li>
          <li>
            <code>"disabled"</code> — No direct messages allowed
          </li>
        </ul>

        <p>
          <strong>
            <code>allowFrom</code>
          </strong>{" "}
          — Whitelist of phone numbers. <strong>Must use E.164 format</strong>: country code +
          number, no spaces, no dashes.
        </p>

        <p>Examples:</p>
        <ul>
          <li>
            <strong>Correct:</strong> <code>+12025551234</code> (US), <code>+447700900000</code>{" "}
            (UK), <code>+8613800138000</code> (China)
          </li>
          <li>
            <strong>Wrong:</strong> <code>202-555-1234</code>, <code>+1 202 555 1234</code>,{" "}
            <code>2025551234</code>
          </li>
        </ul>

        <p>
          The number one reason for "my agent isn't responding" is incorrect phone number format.
          Check the <code>+</code> and country code.
        </p>

        <p>
          <strong>
            <code>groupPolicy</code>
          </strong>{" "}
          — Controls group chat access:
        </p>
        <ul>
          <li>
            <code>"disabled"</code> — No group messages (cleanest for personal use)
          </li>
          <li>
            <code>"allowlist"</code> — Only responds to users in <code>groupAllowFrom</code>
          </li>
          <li>
            <code>"open"</code> — Anyone in allowed groups can trigger the agent
          </li>
        </ul>

        <p>
          Group chat support works, but it's annoying. By default, OpenClaw only responds when
          someone mentions it (WhatsApp @mention or configured mention patterns). In fast-moving
          group chats, this means your agent misses context and gives weird answers. I keep{" "}
          <code>groupPolicy: "disabled"</code> unless I specifically need group support.
        </p>

        <p>
          <strong>
            <code>sendReadReceipts</code>
          </strong>{" "}
          — Whether to send blue checkmarks for messages. Defaults to <code>true</code>. Set to{" "}
          <code>false</code> if you want "ghost mode."
        </p>

        <p>
          <strong>
            <code>mediaMaxMb</code>
          </strong>{" "}
          — Maximum size for inbound media files. Default is 50MB. Lower this if you're on a
          limited bandwidth connection.
        </p>

        <h2>Step 2: Link WhatsApp (QR Code Authentication)</h2>

        <p>
          With your config saved, link your WhatsApp account. Run this command in your terminal:
        </p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`openclaw channels login --channel whatsapp`}
        </pre>

        <p>A QR code will appear in your terminal. On your phone:</p>

        <ol>
          <li>
            Open <strong>WhatsApp</strong>
          </li>
          <li>
            Tap <strong>Settings</strong> (three dots on Android, bottom-right on iOS)
          </li>
          <li>
            Tap <strong>Linked Devices</strong>
          </li>
          <li>
            Tap <strong>Link a Device</strong>
          </li>
          <li>
            <strong>Scan the QR code</strong> displayed in your terminal
          </li>
        </ol>

        <p>
          If successful, the terminal will show "WhatsApp connected" and the Channels page in the
          web UI (<code>http://localhost:18789/channels</code>) will show WhatsApp as green
          (connected).
        </p>

        <h3>QR Code Troubleshooting</h3>

        <p>
          <strong>QR code expired:</strong> QR codes are valid for 60 seconds. If scanning fails,
          the terminal will automatically generate a new one. Just scan again.
        </p>

        <p>
          <strong>QR code too small or blurry:</strong> Increase your terminal font size. On macOS
          Terminal: Cmd+Plus. On iTerm2: Cmd+Plus. On Windows Terminal: Ctrl+Plus.
        </p>

        <p>
          <strong>QR code won't appear:</strong> Make sure the Gateway is running (
          <code>openclaw gateway status</code>). If using a remote server, you'll need X11
          forwarding or access the web UI to see the QR code (it appears on the Channels page).
        </p>

        <h2>Step 3: Test the Connection</h2>

        <p>Send yourself a message on WhatsApp:</p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`Hello, can you hear me?`}
        </pre>

        <p>
          If configured correctly, your agent should respond within 2-5 seconds (depending on AI
          model speed).
        </p>

        <p>
          <strong>No response?</strong> Check:
        </p>
        <ul>
          <li>
            Is your number in <code>allowFrom</code>? (
            <code>openclaw config get channels.whatsapp.allowFrom</code>)
          </li>
          <li>
            Correct format? Must be <code>+countrycode number</code>
          </li>
          <li>
            Gateway running? (<code>openclaw gateway status</code>)
          </li>
          <li>
            Check logs: <code>openclaw logs --follow</code> — Look for "WhatsApp inbound" or error
            messages
          </li>
        </ul>

        <h2>Common Errors and Fixes</h2>

        <h3>Status=515 Unknown Stream Errored</h3>

        <p>This is the most common WhatsApp error. Full message:</p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`WhatsApp login failed: status=515 Unknown Stream Errored (restart required)`}
        </pre>

        <p>
          <strong>What it means:</strong> The Baileys library lost connection to WhatsApp's
          servers. Usually happens when WhatsApp updates their protocol or after your server
          restarts.
        </p>

        <p>
          <strong>Fix:</strong>
        </p>

        <ol>
          <li>
            Go to the web UI: <code>http://localhost:18789</code>
          </li>
          <li>
            Navigate to <strong>Settings → Config</strong>
          </li>
          <li>
            Click <strong>Update</strong> in the top-right (you don't need to change anything)
          </li>
          <li>
            Return to <strong>Channels</strong> and check connection status
          </li>
        </ol>

        <p>If that doesn't work, restart the Gateway:</p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`openclaw gateway restart`}
        </pre>

        <p>This forces a fresh connection attempt. In six months, this has fixed it every time.</p>

        <h3>Permission Denied / No Reply</h3>

        <p>
          <strong>Symptom:</strong> You send a message, but the agent doesn't respond.
        </p>

        <p>
          <strong>Causes:</strong>
        </p>
        <ul>
          <li>Your number isn't in the allowlist</li>
          <li>Phone number format is wrong (missing country code or plus sign)</li>
          <li>
            <code>dmPolicy</code> is set to <code>"disabled"</code>
          </li>
          <li>You're in a group chat with restrictive group policies</li>
        </ul>

        <p>
          <strong>Debug:</strong> Check logs (<code>openclaw logs --follow</code>). Look for:
        </p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`WhatsApp inbound blocked: sender +12025551234 not in allowlist`}
        </pre>

        <p>
          If you see this, add your number to <code>allowFrom</code> in the correct format.
        </p>

        <h3>Disconnected After Gateway Restart</h3>

        <p>
          <strong>Symptom:</strong> WhatsApp works, then stops working after you restart your
          computer or the OpenClaw Gateway.
        </p>

        <p>
          <strong>Cause:</strong> Session credentials are stored in{" "}
          <code>~/.openclaw/credentials/whatsapp/</code>. If this directory is missing or corrupted,
          you'll need to re-authenticate.
        </p>

        <p>
          <strong>Fix:</strong> Re-run <code>openclaw channels login --channel whatsapp</code> and
          scan the QR code again.
        </p>

        <p>
          <strong>Prevention:</strong> Back up <code>~/.openclaw/credentials/</code> regularly. Do
          not commit this directory to git or share it publicly — it contains your WhatsApp session
          keys.
        </p>

        <h3>Group Messages Not Working</h3>

        <p>
          <strong>Symptom:</strong> Direct messages work, but the agent doesn't respond in group
          chats.
        </p>

        <p>
          <strong>Causes:</strong>
        </p>
        <ul>
          <li>
            <code>groupPolicy</code> is set to <code>"disabled"</code>
          </li>
          <li>
            Group isn't in the <code>groups</code> allowlist array
          </li>
          <li>Your number isn't in <code>groupAllowFrom</code>
          </li>
          <li>Agent wasn't mentioned (mention-gating is on by default)</li>
        </ul>

        <p>
          <strong>To enable group support:</strong>
        </p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`{
  "channels": {
    "whatsapp": {
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["+12025551234"],
      "groups": ["120363123456789012@g.us"]
    }
  }
}`}
        </pre>

        <p>
          <strong>How to find the group ID:</strong> Send a message in the group, then check logs (
          <code>openclaw logs</code>). Look for a line like:
        </p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`WhatsApp inbound from 120363123456789012@g.us`}
        </pre>

        <p>
          That's your group ID. Add it to the <code>groups</code> array.
        </p>

        <h2>Advanced: Multi-Account Setup</h2>

        <p>
          OpenClaw supports multiple WhatsApp accounts. Useful if you want separate agents for work
          and personal, or different agents for different clients.
        </p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`{
  "channels": {
    "whatsapp": {
      "accounts": {
        "personal": {
          "enabled": true,
          "dmPolicy": "allowlist",
          "allowFrom": ["+12025551234"]
        },
        "work": {
          "enabled": true,
          "dmPolicy": "allowlist",
          "allowFrom": ["+12025555678"]
        }
      }
    }
  }
}`}
        </pre>

        <p>Link each account separately:</p>

        <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
          {`openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account work`}
        </pre>

        <p>
          Each account gets its own QR code. Scan the first QR with your personal WhatsApp number,
          the second with your work number.
        </p>

        <h2>Should You Self-Host WhatsApp or Use Managed Hosting?</h2>

        <p>
          I've been running OpenClaw on WhatsApp self-hosted for six months. It's doable, but it's
          maintenance.
        </p>

        <p>
          <strong>Self-hosting WhatsApp requires:</strong>
        </p>
        <ul>
          <li>
            <strong>Docker/Linux knowledge</strong> — You'll need to troubleshoot when things break
          </li>
          <li>
            <strong>QR re-authentication</strong> — Every few weeks, WhatsApp force-disconnects and
            you re-scan
          </li>
          <li>
            <strong>Baileys updates</strong> — When WhatsApp updates their protocol (every 2-3
            months), you need to update Baileys, which means updating OpenClaw
          </li>
          <li>
            <strong>Session file backups</strong> — If you lose{" "}
            <code>~/.openclaw/credentials/whatsapp/</code>, you start over
          </li>
          <li>
            <strong>Monitoring</strong> — You need to notice when the connection drops (usually at
            the worst possible time)
          </li>
        </ul>

        <p>Estimate: 3-5 hours/month of maintenance.</p>

        <p>
          <strong>Managed hosting (like Clawer) handles:</strong>
        </p>
        <ul>
          <li>Automatic reconnection when sessions drop</li>
          <li>Baileys updates (we test in staging before pushing to production)</li>
          <li>Session backups and recovery</li>
          <li>24/7 monitoring with alerts when connections fail</li>
          <li>Multi-account management through a web UI</li>
        </ul>

        <p>
          WhatsApp is one of the channels where managed hosting makes the most sense. Telegram is
          stable — I've had Telegram bots run for 6+ months without intervention. WhatsApp breaks
          more often, and when it breaks, you need to be available to re-scan a QR code.
        </p>

        <p>
          If you're non-technical, or you just want WhatsApp to work without babysitting it,{" "}
          <Link href="/pricing">Clawer's managed hosting</Link> starts at $19/month and includes
          WhatsApp setup, automatic reconnection, and support. For most people, the time saved is
          worth it.
        </p>

        <p>
          If you're technical and enjoy the tinkering, self-hosting is totally viable. Just budget
          for the maintenance time.
        </p>

        <h2>WhatsApp vs Telegram vs Discord: Which Channel for What?</h2>

        <p>After running all three channels in production:</p>

        <p>
          <strong>Use WhatsApp when:</strong>
        </p>
        <ul>
          <li>Your contacts are non-technical family/friends who won't install new apps</li>
          <li>You need cross-platform support (Android + iOS + Desktop)</li>
          <li>You're okay with occasional maintenance (or paying for managed hosting)</li>
        </ul>

        <p>
          <strong>Use Telegram when:</strong>
        </p>
        <ul>
          <li>You want the most stable, low-maintenance channel</li>
          <li>You're building public bots or services (Telegram has official bot APIs)</li>
          <li>Your users are technical or already on Telegram</li>
          <li>You want advanced features (inline keyboards, channels, bot commands)</li>
        </ul>

        <p>
          <strong>Use Discord when:</strong>
        </p>
        <ul>
          <li>You're running a community or gaming server</li>
          <li>You want slash commands and rich embeds</li>
          <li>Your users are already on Discord</li>
        </ul>

        <p>
          For personal use, I'd rank them: <strong>Telegram &gt; WhatsApp &gt; Discord</strong>.
          Telegram is the easiest to maintain. WhatsApp reaches more people but needs babysitting.
          Discord is great for communities but overkill for personal assistants.
        </p>

        <p>
          See our full{" "}
          <Link href="/blog/best-openclaw-hosting">OpenClaw hosting comparison</Link> for more on
          DIY vs managed setup across all channels.
        </p>

        <h2>Security Notes</h2>

        <p>WhatsApp has access to your AI agent, which has access to your system. Lock it down:</p>

        <ul>
          <li>
            <strong>Use allowlist mode</strong> — Never use <code>"open"</code> dmPolicy unless you
            know exactly what you're doing
          </li>
          <li>
            <strong>Dedicated number recommended</strong> — Keeps your personal chats separate from
            agent activity
          </li>
          <li>
            <strong>Protect session files</strong> —{" "}
            <code>~/.openclaw/credentials/whatsapp/</code> contains your WhatsApp auth. Do not
            commit to git, do not share publicly, back up encrypted.
          </li>
          <li>
            <strong>Regularly check linked devices</strong> — WhatsApp Settings → Linked Devices.
            If you see unknown devices, remove them immediately.
          </li>
          <li>
            <strong>Disable group chats unless needed</strong> — Group chat support is powerful but
            risky. Someone in a group chat can trigger your agent, and if your agent has file
            access or system commands enabled, that's a potential attack vector.
          </li>
        </ul>

        <p>
          For production deployments,{" "}
          <Link href="/blog/openclaw-security-guide">read our full OpenClaw security guide</Link>.
        </p>

        <h2>What's Next?</h2>

        <p>
          WhatsApp is connected. If you haven't already,{" "}
          <Link href="/blog/how-to-set-up-openclaw">complete the full OpenClaw setup</Link> to
          configure your AI models and skills. Then test image recognition (if using GPT-4V or
          Claude with vision) by sending a photo and asking "what's in this image?"
        </p>

        <p>
          For multi-channel setups, add Telegram or Discord using the same process. Each channel
          runs through the same agent, so you can message your assistant from wherever your
          contacts are.
        </p>

        <p>
          If you're spending more than 3-5 hours/month maintaining your OpenClaw instance, or if
          you just want WhatsApp to work without thinking about it,{" "}
          <Link href="/pricing">check out Clawer's managed hosting</Link>. We handle the QR codes,
          the reconnections, and the 3am Baileys errors. Plans start at $19/month, and we include
          WhatsApp setup for free.
        </p>

        <h2>Frequently Asked Questions</h2>

        <h3>How do I connect OpenClaw to WhatsApp?</h3>
        <p>
          Run <code>openclaw channels login --channel whatsapp</code> in your terminal. A QR code
          will appear. On your phone, open WhatsApp → Settings → Linked Devices → Link a Device,
          then scan the QR code. Connection completes in 30-60 seconds. You'll need a WhatsApp
          account and OpenClaw Gateway running.
        </p>

        <h3>What is the status=515 error in OpenClaw WhatsApp?</h3>
        <p>
          Status=515 is a stream error that happens when WhatsApp's protocol changes break the
          Baileys library. Fix: Go to Settings → Config in the OpenClaw web UI, click Update (no
          changes needed), then return to Channels. If that fails, restart the Gateway with{" "}
          <code>openclaw gateway restart</code>. This forces a fresh connection attempt.
        </p>

        <h3>Can I use OpenClaw with my personal WhatsApp number?</h3>
        <p>
          Yes, but it's not recommended for production. Personal-number mode works, but you risk
          WhatsApp disconnecting your session if you have too many linked devices or your phone
          goes offline. A dedicated WhatsApp number (via a second SIM or virtual number service) is
          more reliable and keeps your personal chats separate from agent activity.
        </p>

        <h3>Why does OpenClaw use Baileys instead of the official WhatsApp API?</h3>
        <p>
          WhatsApp doesn't offer an official API for personal accounts — only for WhatsApp Business
          API, which requires company verification and costs money. Baileys reverse-engineers the
          WhatsApp Web protocol to enable personal account integration. The downside: it's
          unofficial, so it breaks when WhatsApp updates their protocol (usually fixed within days
          by the Baileys team).
        </p>

        <h3>How do I set up OpenClaw in WhatsApp group chats?</h3>
        <p>
          Add <code>groupPolicy: "allowlist"</code> and{" "}
          <code>groupAllowFrom: ["+1234567890"]</code> to your WhatsApp config. By default,
          OpenClaw only responds to group messages that mention it. Find the group ID in your logs
          after sending a test message, then add it to the <code>groups</code> array in config if
          you want to whitelist specific groups. Group chat support works, but mention-gating can
          be annoying in fast-moving conversations.
        </p>

        <h3>Is managed OpenClaw hosting worth it for WhatsApp?</h3>
        <p>
          If you're non-technical or value your time, yes. Self-hosting WhatsApp requires
          maintaining Docker, handling QR re-authentication when sessions break, debugging Baileys
          protocol errors, and keeping up with OpenClaw updates. Managed hosting (like Clawer.ai)
          handles all of this, including automatic reconnection and 24/7 monitoring. WhatsApp is one
          of the more fragile channels — having someone else handle the maintenance is worth it for
          most users.
        </p>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-xl border-l-4 border-blue-600">
          <h3 className="mt-0">Want WhatsApp Without the Maintenance?</h3>
          <p className="mb-4">
            Clawer handles WhatsApp setup, automatic reconnection, and 24/7 monitoring. No QR code
            babysitting, no status=515 debugging, no 3am session failures.{" "}
            <Link href="/pricing" className="font-semibold text-blue-600 dark:text-blue-400">
              Plans start at $19/month
            </Link>
            .
          </p>
          <p className="mb-0 text-sm text-slate-600 dark:text-slate-400">
            Includes: WhatsApp + Telegram + Discord setup, AI model access, web dashboard, automatic
            updates, and actual human support when things break.
          </p>
        </div>
      </article>
    </>
  );
}
