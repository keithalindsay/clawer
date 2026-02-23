import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CronJobsPanel } from '@/components/dashboard/CronJobsPanel';

export const metadata = {
  title: 'Cron Jobs — Clawer.ai',
  description: 'Monitor your scheduled cron jobs and execution history',
};

export default async function CronsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm inline-block mb-2"
          >
            ← Back
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⏱</span>
                <h1 className="text-lg font-bold text-gray-900">Cron Jobs</h1>
              </div>
              <p className="text-sm text-gray-600">
                Scheduled tasks that run automatically on a timer
              </p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
              Read-only · Phase 1
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Help banner */}
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-blue-900">
              <span className="text-base">ℹ️</span>
              <span>What are cron jobs?</span>
              <span className="ml-auto text-blue-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 text-sm text-blue-800 space-y-2 pl-6">
              <p>
                <strong>Cron jobs are like setting an alarm for your AI.</strong> They run automatically 
                at specific times without you having to do anything.
              </p>
              <p className="text-blue-700">
                <strong>Example:</strong> You could set up a cron job to send you a morning briefing 
                every day at 8 AM, or check for new emails every 15 minutes.
              </p>
              <p className="text-blue-700">
                Think of them as scheduled reminders that actually <em>do</em> something when the time comes.
              </p>
            </div>
          </details>
        </div>

        <CronJobsPanel />
      </main>
    </div>
  );
}
