/**
 * Usage Details Page - Full breakdown of token usage
 * 
 * Shows:
 * - Current week summary
 * - Orchestrator vs Worker split
 * - Last 4 weeks history
 * - Per-request log with pagination
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UsageDetails } from '@/components/UsageDetails';

export default async function UsagePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Usage Details
            </h1>
          </div>
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <UsageDetails />
      </main>
    </div>
  );
}
