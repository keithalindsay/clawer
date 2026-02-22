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
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱</span>
            <h1 className="text-lg font-bold text-gray-900">Cron Jobs</h1>
          </div>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Read-only · Phase 1
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <CronJobsPanel />
      </main>
    </div>
  );
}
