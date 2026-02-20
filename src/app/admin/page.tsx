import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminDashboard } from './components/AdminDashboard';
import { isAdmin } from '@/lib/admin';

export default async function AdminPage() {
  const { userId } = await auth();
  
  // Auth gate: Only allow admins
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
              🦞 Clawer.ai
            </Link>
            <span className="text-xs bg-red-600 px-2 py-1 rounded font-medium text-white">
              ADMIN
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-white font-medium">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-gray-400 hover:text-white transition">
              Users
            </Link>
            <Link href="/admin/feedback" className="text-gray-400 hover:text-white transition">
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
        <AdminDashboard />
      </main>
    </div>
  );
}
