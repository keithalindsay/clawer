/**
 * Usage Analytics Page - Full usage breakdown and analytics
 * 
 * Shows:
 * - Billing period summary with token usage
 * - Daily message count chart (30 days)
 * - Model usage donut chart
 * - Tier distribution (SIMPLE/MEDIUM/COMPLEX/REASONING)
 * - Platform breakdown (Web/WhatsApp/Telegram/Slack)
 * - Response latency metrics
 * - Cost estimates
 * - Detailed request logs (existing)
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UsageAnalytics } from '@/components/UsageAnalytics';
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
              Usage Analytics
            </h1>
          </div>
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Analytics Dashboard */}
        <UsageAnalytics />

        {/* Detailed Logs */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Usage Logs</h2>
          <UsageDetails />
        </div>
      </main>
    </div>
  );
}
