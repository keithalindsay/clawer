import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Clawer.ai",
  description: "Terms of Service for Clawer.ai — Managed AI Teams powered by OpenClaw.",
  alternates: {
    canonical: "https://clawer.ai/terms",
  },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a
          href="/"
          className="mb-8 inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Home
        </a>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-12">
          Last updated: February 18, 2026
        </p>

        <div className="prose prose-gray max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_li]:text-gray-600">
          <p>
            Welcome to Clawer AI. These Terms of Service (&quot;Terms&quot;) govern your access
            to and use of the services provided by Aigen Inc, doing business as Clawer AI
            (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), available at{" "}
            <a href="https://clawer.ai" className="text-blue-600 hover:underline">
              clawer.ai
            </a>{" "}
            (the &quot;Service&quot;). By accessing or using the Service, you agree to be bound
            by these Terms. If you do not agree, do not use the Service.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years of age to use the Service. By creating an account,
            you represent and warrant that you meet this requirement and have the legal
            capacity to enter into a binding agreement.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Clawer AI provides a managed AI team hosting platform that enables users to
            deploy and interact with chat-based AI assistants. The Service utilizes
            third-party large language models (including but not limited to those provided by
            OpenAI, MiniMax, and other providers) to generate responses. We do not guarantee
            the accuracy, completeness, or reliability of AI-generated outputs.
          </p>

          <h2>3. Accounts and Authentication</h2>
          <p>
            Account creation and authentication are managed through Clerk, a third-party
            authentication provider. You are responsible for maintaining the confidentiality
            of your account credentials and for all activities that occur under your account.
            You agree to notify us immediately of any unauthorized use.
          </p>

          <h2>4. Plans and Pricing</h2>
          <p>We offer the following plans:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>
              <strong>Free Tier:</strong> Up to 100 total messages, 1 team member. No
              service level guarantees.
            </li>
            <li>
              <strong>Paid Tier ($49/month):</strong> Up to 500 messages per day, full team
              access, and priority support.
            </li>
          </ul>
          <p>
            We reserve the right to modify pricing, features, and usage limits at any time
            with reasonable notice. Changes to paid plans will take effect at the start of
            your next billing cycle.
          </p>

          <h2>5. Payment and Billing</h2>
          <p>
            Payments are processed through Stripe. By subscribing to a paid plan, you
            authorize us to charge your payment method on a recurring monthly basis. All fees
            are non-refundable except as required by applicable law. You are responsible for
            any taxes associated with your use of the Service.
          </p>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Violate any applicable law, regulation, or third-party rights</li>
            <li>Generate, distribute, or store illegal, harmful, or abusive content</li>
            <li>Attempt to reverse-engineer, exploit, or circumvent usage limits</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Use the Service to develop competing AI hosting products</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or
            engage in abusive behavior, at our sole discretion and without prior notice.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service, including its design, features, and underlying technology, is owned
            by Aigen Inc and protected by intellectual property laws. You retain ownership of
            any content you submit to the Service. By using the Service, you grant us a
            limited, non-exclusive license to process your content solely for the purpose of
            providing the Service.
          </p>

          <h2>8. AI-Generated Content</h2>
          <p>
            Responses generated by AI assistants on the platform are produced by third-party
            models and may contain errors, inaccuracies, or biased information. You
            acknowledge that AI outputs should not be relied upon as professional, legal,
            medical, or financial advice. You are solely responsible for how you use
            AI-generated content.
          </p>

          <h2>9. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            . Conversations and data submitted to the Service are stored to provide
            functionality. You may request deletion of your data at any time by contacting
            us.
          </p>

          <h2>10. Service Availability</h2>
          <p>
            We strive to maintain high availability but do not guarantee uninterrupted
            access. The Free Tier is provided &quot;as is&quot; with no service level
            commitments. Paid plans include reasonable uptime expectations, but we are not
            liable for downtime caused by maintenance, third-party provider outages, or
            circumstances beyond our control.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, AIGEN INC AND ITS AFFILIATES, OFFICERS,
            DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
            DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE
            SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY.
          </p>
          <p>
            OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU
            PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S.
            DOLLARS ($100).
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Aigen Inc and its affiliates
            from any claims, damages, losses, or expenses (including reasonable
            attorneys&apos; fees) arising from your use of the Service, your violation of
            these Terms, or your violation of any third-party rights.
          </p>

          <h2>13. Dispute Resolution and Arbitration</h2>
          <p>
            Any dispute arising out of or relating to these Terms or the Service shall be
            resolved through binding arbitration administered by the American Arbitration
            Association (AAA) under its Commercial Arbitration Rules. Arbitration shall take
            place in the State of Texas, and the arbitrator&apos;s decision shall be final
            and binding. You agree to waive any right to participate in a class action
            lawsuit or class-wide arbitration.
          </p>

          <h2>14. Termination</h2>
          <p>
            You may terminate your account at any time by contacting us or through your
            account settings. We may suspend or terminate your access at any time for any
            reason, including violation of these Terms. Upon termination, your right to use
            the Service ceases immediately. Provisions that by their nature should survive
            termination shall survive.
          </p>

          <h2>15. Modifications to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material
            changes by posting the updated Terms on this page and updating the &quot;Last
            updated&quot; date. Your continued use of the Service after changes constitutes
            acceptance of the revised Terms.
          </p>

          <h2>16. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the
            State of Texas, United States, without regard to conflict of law principles.
          </p>

          <h2>17. Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <a
              href="mailto:legal@clawer.ai"
              className="text-blue-600 hover:underline"
            >
              legal@clawer.ai
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
