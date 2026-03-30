/**
 * Sign-up page for Clawer.ai
 */

import type { Metadata } from "next";
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Start Free — Clawer.ai | Managed OpenClaw Hosting",
  description:
    "Create your free Clawer.ai account. Deploy AI teams on WhatsApp, Telegram, and Slack in 60 seconds. 100 messages free, no credit card required.",
  alternates: { canonical: "https://clawer.ai/sign-up" },
  openGraph: {
    title: "Start Free — Clawer.ai | Managed OpenClaw Hosting",
    description:
      "Deploy AI teams on WhatsApp, Telegram, and Slack in 60 seconds. 100 messages free, no credit card required.",
    url: "https://clawer.ai/sign-up",
    type: "website",
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Join <span className="text-blue-600">Clawer</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Get your AI assistants ready in 2 minutes
          </p>
        </div>
        
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white shadow-xl',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
