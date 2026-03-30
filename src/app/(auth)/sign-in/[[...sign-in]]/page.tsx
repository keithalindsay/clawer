/**
 * Sign-in page for Clawer.ai
 */

import type { Metadata } from "next";
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Sign In — Clawer.ai",
  description: "Sign in to your Clawer.ai account to access your AI team.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://clawer.ai/sign-in" },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">🦞</div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Clawer.ai
          </h1>
          <p className="mt-2 text-gray-600">
            Your AI team is waiting.
          </p>
        </div>
        
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white shadow-xl',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-3">
            🔒 Secure and private
          </p>
          <p className="text-xs text-gray-500">
            New here?{' '}
            <a href="/sign-up" className="text-orange-500 hover:text-orange-600 font-medium">
              Start free — no credit card required
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
