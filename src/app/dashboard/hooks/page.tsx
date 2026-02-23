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
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm inline-block mb-2"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🪝</span>
            <h1 className="text-lg font-bold text-gray-900">Hooks</h1>
          </div>
          <p className="text-sm text-gray-600">
            Automatic reactions to events — "if this, then that" rules
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Help banner */}
        <div className="mb-6 bg-purple-50 border border-purple-100 rounded-xl p-4">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-purple-900">
              <span className="text-base">ℹ️</span>
              <span>What are hooks?</span>
              <span className="ml-auto text-purple-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 text-sm text-purple-800 space-y-2 pl-6">
              <p>
                <strong>Hooks are automatic reactions to events.</strong> When something happens 
                (like receiving a message or a file changing), your AI can automatically respond.
              </p>
              <p className="text-purple-700">
                <strong>Example:</strong> You could create a hook that automatically replies to 
                certain emails, or notifies you when an important file is updated.
              </p>
              <p className="text-purple-700">
                Think of them as "if this, then that" rules — when X happens, do Y automatically.
              </p>
            </div>
          </details>
        </div>

        <HooksPanel />
      </main>
    </div>
  );
}
