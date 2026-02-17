export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-12">
          Last updated: February 17, 2026
        </p>

        <div className="prose prose-gray max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_li]:text-gray-600">
          <p>
            Aigen Inc, doing business as Clawer AI (&quot;Company,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;), operates the platform at{" "}
            <a href="https://clawer.ai" className="text-blue-600 hover:underline">
              clawer.ai
            </a>{" "}
            (the &quot;Service&quot;). This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use the Service. Please read
            this policy carefully. If you do not agree with the terms, please do not use the
            Service.
          </p>

          <h2>1. Information We Collect</h2>

          <h3 className="text-lg font-medium mt-6 mb-3 text-gray-800">
            Personal Information
          </h3>
          <p>When you create an account or use the Service, we may collect:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Name and email address (via Clerk authentication)</li>
            <li>Billing and payment information (processed by Stripe — we do not store full card details)</li>
            <li>Account preferences and settings</li>
            <li>Profile information you choose to provide</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3 text-gray-800">
            Usage Data
          </h3>
          <p>We automatically collect:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Conversation content and messages sent through AI assistants</li>
            <li>Usage metrics (message counts, feature usage, session duration)</li>
            <li>Device information (browser type, operating system, IP address)</li>
            <li>Log data (access times, pages viewed, referring URLs)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>Provide, operate, and maintain the Service</li>
            <li>Process transactions and manage your subscription</li>
            <li>Send administrative communications (billing, security, service updates)</li>
            <li>Improve the Service, develop new features, and analyze usage patterns</li>
            <li>Enforce our Terms of Service and prevent abuse</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Conversation Data</h2>
          <p>
            Messages and conversations you conduct through the Service are stored on our
            servers to provide core functionality, including conversation history and context
            for AI assistants. Conversation data may be sent to third-party AI model
            providers (such as OpenAI, MiniMax, and others) for processing. These providers
            process data in accordance with their own privacy policies and data processing
            agreements.
          </p>
          <p>
            We do not use your conversation data to train our own AI models. We do not sell
            your conversation data to third parties.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>
              <strong>Clerk</strong> — Authentication and user management
            </li>
            <li>
              <strong>Stripe</strong> — Payment processing (subject to{" "}
              <a
                href="https://stripe.com/privacy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&apos;s Privacy Policy
              </a>
              )
            </li>
            <li>
              <strong>AI Model Providers</strong> (OpenAI, MiniMax, and others) — Language
              model inference
            </li>
          </ul>
          <p>
            Each third-party provider operates under its own privacy policy. We encourage you
            to review them.
          </p>

          <h2>5. Data Retention and Deletion</h2>
          <p>
            We retain your personal information and conversation data for as long as your
            account is active or as needed to provide the Service. You may request deletion
            of your data at any time by contacting us at{" "}
            <a
              href="mailto:privacy@clawer.ai"
              className="text-blue-600 hover:underline"
            >
              privacy@clawer.ai
            </a>
            . Upon receiving a valid deletion request, we will remove your data within 30
            days, except where retention is required by law.
          </p>
          <p>
            When you delete your account, we will delete or anonymize your personal data and
            conversation history, unless we are legally required to retain it.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We implement commercially reasonable technical and organizational measures to
            protect your data, including encryption in transit (TLS) and at rest. However, no
            method of transmission or storage is 100% secure, and we cannot guarantee
            absolute security.
          </p>

          <h2>7. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your
            personal data:
          </p>
          <ul className="list-disc pl-6 space-y-2 my-4">
            <li>
              <strong>Access:</strong> Request a copy of the personal data we hold about you
            </li>
            <li>
              <strong>Rectification:</strong> Request correction of inaccurate data
            </li>
            <li>
              <strong>Erasure:</strong> Request deletion of your personal data
            </li>
            <li>
              <strong>Portability:</strong> Request your data in a structured, machine-readable format
            </li>
            <li>
              <strong>Restriction:</strong> Request that we limit processing of your data
            </li>
            <li>
              <strong>Objection:</strong> Object to processing based on legitimate interests
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:privacy@clawer.ai"
              className="text-blue-600 hover:underline"
            >
              privacy@clawer.ai
            </a>
            . We will respond within 30 days.
          </p>

          <h2>8. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your
            country of residence, including the United States. Where we transfer data
            internationally, we ensure appropriate safeguards are in place in accordance with
            applicable data protection laws, including standard contractual clauses where
            required.
          </p>

          <h2>9. Cookies and Tracking</h2>
          <p>
            We use essential cookies to maintain your session and provide core functionality.
            We may also use analytics cookies to understand how the Service is used. You can
            control cookie preferences through your browser settings. The Service does not
            respond to Do Not Track signals.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for individuals under the age of 18. We do not
            knowingly collect personal information from minors. If we learn that we have
            collected data from a person under 18, we will take steps to delete it promptly.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            material changes by posting the updated policy on this page and updating the
            &quot;Last updated&quot; date. Your continued use of the Service after changes
            constitutes acceptance of the revised policy.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <div className="my-4 rounded-lg bg-gray-50 p-6 text-gray-600">
            <p className="font-medium text-gray-900">Aigen Inc (dba Clawer AI)</p>
            <p>
              Email:{" "}
              <a
                href="mailto:privacy@clawer.ai"
                className="text-blue-600 hover:underline"
              >
                privacy@clawer.ai
              </a>
            </p>
            <p>
              Website:{" "}
              <a href="https://clawer.ai" className="text-blue-600 hover:underline">
                clawer.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
