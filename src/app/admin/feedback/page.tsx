import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FeedbackTable } from './components/FeedbackTable';

import { isAdmin } from '@/lib/admin';

export default async function AdminFeedbackPage() {
  const { userId } = await auth();
  
  // Auth gate: Only allow Keith
  if (!userId || !(await isAdmin(userId))) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              🦞 CLAWER<span className="text-blue-400">.AI</span>
            </Link>
            <span className="text-xs bg-red-600 px-2 py-1 rounded font-medium text-white">
              ADMIN
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-gray-400 hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-gray-400 hover:text-white transition">
              Users
            </Link>
            <Link href="/admin/feedback" className="text-white font-medium">
              Feedback
            </Link>
            <Link href="/admin/settings" className="text-gray-400 hover:text-white transition">
              Settings
            </Link>
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition">
              Exit Admin →
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Feedback</h1>
          <p className="text-gray-600 mt-2">Review and manage feedback submissions</p>
        </div>
        
        <FeedbackTable />
      </main>
    </div>
  );
}
