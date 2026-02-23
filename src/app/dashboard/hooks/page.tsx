import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HooksPanel } from '@/components/dashboard/HooksPanel';

export const metadata = {
  title: 'Hooks — Clawer.ai',
  description: 'Manage your event hooks and automation triggers',
};

export default async function HooksPage() {
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
            <span className="text-lg">🪝</span>
            <h1 className="text-lg font-bold text-gray-900">Hooks</h1>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <HooksPanel />
      </main>
    </div>
  );
}
