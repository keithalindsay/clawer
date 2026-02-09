import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Clawer.ai",
  description:
    "Terms of Service for Clawer.ai. Read our service agreement covering usage, billing, data handling, and more.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="text-gray-500">Last updated: February 9, 2026</p>

          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Clawer.ai
            (&ldquo;Service&rdquo;), operated by Clawer.ai (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
            or &ldquo;our&rdquo;). By accessing or using the Service, you agree to be
            bound by these Terms.
          </p>

          <h2>1. Service Description</h2>
          <p>
            Clawer.ai provides AI-powered assistant services accessible through
            messaging platforms (WhatsApp, Telegram, Slack, Discord, iMessage)
            and a web-based chat interface. The Service uses third-party AI
            models to process your requests and deliver responses.
          </p>

          <h2>2. Account Registration</h2>
          <p>
            To use the Service, you must create an account. You agree to provide
            accurate, current, and complete information during registration and
            to keep your account credentials secure. You are responsible for all
            activity that occurs under your account.
          </p>
          <p>
            You must be at least 18 years old to create an account and use the
            Service.
          </p>

          <h2>3. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with a person or entity</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or related systems</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use the Service for spam, phishing, or distributing malware</li>
            <li>Violate any applicable local, state, national, or international law</li>
            <li>Generate content that infringes on intellectual property rights of others</li>
            <li>Use automated systems to abuse or overload the Service beyond normal usage patterns</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate your account if you
            violate these terms.
          </p>

          <h2>4. Billing and Payments</h2>
          <p>
            The Service is offered on a subscription basis. Billing is processed
            through <strong>Stripe</strong>, a third-party payment processor. By
            subscribing, you agree to Stripe&apos;s terms and conditions.
          </p>
          <ul>
            <li>
              <strong>Subscription fees</strong> are billed monthly in advance at
              the rate displayed at the time of purchase.
            </li>
            <li>
              <strong>Free trial:</strong> New accounts receive a 7-day free
              trial. You will not be charged until the trial period ends.
            </li>
            <li>
              <strong>Automatic renewal:</strong> Subscriptions renew
              automatically each billing cycle unless cancelled before the
              renewal date.
            </li>
            <li>
              <strong>Refunds:</strong> We offer a 7-day money-back guarantee
              from the date of your first payment. After this period, payments
              are non-refundable.
            </li>
            <li>
              <strong>Price changes:</strong> We may change our pricing with 30
              days&apos; notice. Existing subscribers will be notified via email
              before any price increase takes effect.
            </li>
          </ul>

          <h2>5. Data Handling</h2>
          <p>
            Your use of the Service involves the processing of data by
            third-party AI providers. Please review our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            for details on how we collect, use, and protect your data.
          </p>
          <ul>
            <li>We do not use your data to train AI models.</li>
            <li>Conversation data is retained to provide the Service and is deleted upon account termination or upon your request.</li>
            <li>We encrypt data in transit and at rest.</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its design, features, and content (excluding
            user-generated content), is owned by Clawer.ai and protected by
            intellectual property laws. You retain ownership of content you
            create using the Service.
          </p>

          <h2>7. AI-Generated Content</h2>
          <p>
            The Service uses AI to generate responses. AI outputs may be
            inaccurate, incomplete, or outdated. You are responsible for
            reviewing and verifying any AI-generated content before relying on
            it. We do not guarantee the accuracy of AI responses.
          </p>

          <h2>8. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted
            access to the Service. We may perform maintenance, updates, or
            experience outages that temporarily affect availability. We will
            make reasonable efforts to notify you of planned downtime.
          </p>

          <h2>9. Termination</h2>
          <ul>
            <li>
              <strong>By you:</strong> You may cancel your subscription at any
              time from your dashboard. Cancellation takes effect at the end of
              the current billing period.
            </li>
            <li>
              <strong>By us:</strong> We may suspend or terminate your account
              if you violate these Terms, fail to pay, or if required by law. We
              will provide notice when possible.
            </li>
            <li>
              <strong>Effect of termination:</strong> Upon termination, your
              access to the Service will cease. We will delete your data within
              30 days unless required by law to retain it.
            </li>
          </ul>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Clawer.ai shall
            not be liable for any indirect, incidental, special, consequential,
            or punitive damages, including loss of profits, data, or business
            opportunities, arising from your use of the Service.
          </p>
          <p>
            Our total liability for any claim related to the Service shall not
            exceed the amount you paid us in the 12 months preceding the claim.
          </p>

          <h2>11. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
            without warranties of any kind, either express or implied, including
            but not limited to implied warranties of merchantability, fitness
            for a particular purpose, and non-infringement.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Clawer.ai, its officers,
            employees, and agents from any claims, damages, or expenses arising
            from your use of the Service or violation of these Terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Texas, United
            States, without regard to conflict of law principles. Any disputes
            shall be resolved in the courts located in Travis County, Texas.
          </p>

          <h2>14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of
            material changes via email or through the Service. Continued use of
            the Service after changes take effect constitutes acceptance of the
            revised Terms.
          </p>

          <h2>15. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at{" "}
            <a href="mailto:hello@clawer.ai" className="text-blue-600 hover:underline">
              hello@clawer.ai
            </a>.
          </p>
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
