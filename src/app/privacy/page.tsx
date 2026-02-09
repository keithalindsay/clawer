import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Clawer.ai",
  description:
    "Privacy Policy for Clawer.ai. Learn how we collect, use, and protect your data when you use our AI assistant service.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About</Link>
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <article className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto prose prose-gray prose-lg">
          <h1>Privacy Policy</h1>
          <p className="text-gray-500">Last updated: February 9, 2026</p>

          <p>
            Clawer.ai (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            respects your privacy. This Privacy Policy explains how we collect,
            use, share, and protect your personal information when you use our
            AI assistant service (&ldquo;Service&rdquo;).
          </p>

          <h2>1. Information We Collect</h2>

          <h3>Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Name and email address (via Clerk authentication)</li>
            <li>Payment information (processed and stored by Stripe — we do not store full card numbers)</li>
            <li>Phone number (if you connect via WhatsApp or Telegram)</li>
          </ul>

          <h3>Usage Data</h3>
          <ul>
            <li>Messages you send to and receive from the AI assistant</li>
            <li>Connected integrations (email, calendar, etc.)</li>
            <li>Feature usage and interaction patterns</li>
            <li>Device type, browser, IP address, and general location</li>
          </ul>

          <h3>Data from Integrations</h3>
          <p>
            If you connect third-party services (Gmail, Google Calendar, etc.),
            we access only the data necessary to fulfil your requests. We do not
            store integration data longer than needed to provide the Service.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and improve the Service</li>
            <li>To process your AI assistant requests and deliver responses</li>
            <li>To process payments and manage your subscription</li>
            <li>To communicate with you about your account, updates, and support</li>
            <li>To detect and prevent fraud, abuse, or security incidents</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p>
            <strong>We do not use your data to train AI models.</strong> Your
            conversations are used solely to provide the Service to you.
          </p>

          <h2>3. Third-Party Services</h2>
          <p>
            We use the following third-party services to operate Clawer.ai.
            Each has its own privacy policy governing data handling:
          </p>
          <ul>
            <li>
              <strong>Clerk</strong> — Authentication and user management.{" "}
              <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <strong>Stripe</strong> — Payment processing and billing.{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <strong>OpenAI</strong> — AI model provider (GPT models).{" "}
              <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <strong>Anthropic</strong> — AI model provider (Claude models).{" "}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <strong>Google</strong> — AI model provider (Gemini models) and
              integration services (Gmail, Calendar).{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </li>
          </ul>
          <p>
            We have data processing agreements with these providers. Your
            conversation data sent to AI providers is not used to train their
            models (we use API access with data-use opt-outs where available).
          </p>

          <h2>4. Data Retention</h2>
          <ul>
            <li>
              <strong>Account data:</strong> Retained while your account is
              active and for 30 days after deletion.
            </li>
            <li>
              <strong>Conversation history:</strong> Retained while your account
              is active. Deleted within 30 days of account termination or upon
              your request.
            </li>
            <li>
              <strong>Payment records:</strong> Retained as required by tax and
              financial regulations (typically 7 years).
            </li>
            <li>
              <strong>Usage analytics:</strong> Aggregated and anonymized data
              may be retained indefinitely for service improvement.
            </li>
          </ul>

          <h2>5. Data Security</h2>
          <p>We protect your data with:</p>
          <ul>
            <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
            <li>Access controls and authentication for internal systems</li>
            <li>Regular security audits and monitoring</li>
            <li>Minimal data access principles — employees access data only when necessary</li>
          </ul>

          <h2>6. Your Rights (GDPR &amp; Global Privacy)</h2>
          <p>
            Regardless of your location, we extend the following rights to all
            users:
          </p>
          <ul>
            <li>
              <strong>Access:</strong> Request a copy of the personal data we
              hold about you.
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or
              incomplete data.
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal data
              (&ldquo;right to be forgotten&rdquo;).
            </li>
            <li>
              <strong>Portability:</strong> Request your data in a
              machine-readable format.
            </li>
            <li>
              <strong>Restriction:</strong> Request that we limit processing of
              your data.
            </li>
            <li>
              <strong>Objection:</strong> Object to processing based on
              legitimate interests.
            </li>
            <li>
              <strong>Withdraw consent:</strong> Withdraw consent at any time
              where processing is based on consent.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:hello@clawer.ai" className="text-blue-600 hover:underline">
              hello@clawer.ai
            </a>
            . We will respond within 30 days.
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management.
            We do not use tracking or advertising cookies. Third-party services
            (Clerk, Stripe) may set their own cookies as described in their
            privacy policies.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for children under 18. We do not
            knowingly collect personal information from children. If you believe
            a child has provided us with personal data, please contact us and we
            will delete it.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Your data may be processed in the United States and other countries
            where our service providers operate. We ensure appropriate
            safeguards are in place for international transfers, including
            Standard Contractual Clauses where applicable.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes via email or through the Service. The
            &ldquo;Last updated&rdquo; date at the top indicates the most recent
            revision.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or your
            data, contact us:
          </p>
          <ul>
            <li>
              Email:{" "}
              <a href="mailto:hello@clawer.ai" className="text-blue-600 hover:underline">
                hello@clawer.ai
              </a>
            </li>
            <li>
              For privacy-specific requests:{" "}
              <a href="mailto:privacy@clawer.ai" className="text-blue-600 hover:underline">
                privacy@clawer.ai
              </a>
            </li>
          </ul>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white font-bold text-lg">🦞 CLAWER.AI</div>
          <div className="flex gap-8 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:support@clawer.ai" className="hover:text-white transition-colors">Support</a>
          </div>
          <p className="text-sm">© 2026 Clawer.ai</p>
        </div>
      </footer>
    </div>
  );
}
