'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/dashboard/chat', label: 'Chat' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/files', label: 'Files' },
  { href: '/dashboard/skills', label: 'Skills' },
  { href: '/dashboard/agent', label: 'Agent' },
  { href: '/dashboard/memory', label: 'Memory' },
  { href: '/dashboard/crons', label: 'Crons' },
  { href: '/dashboard/settings', label: 'Settings' },
];

interface DashboardNavProps {
  userEmail?: string;
}

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Logo + nav */}
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900 flex-shrink-0">
            🦞 Clawer.ai
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {NAV_ITEMS.map(({ href, label, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    isActive
                      ? 'text-orange-500 border-b-2 border-orange-500 font-semibold pb-0.5'
                      : 'text-gray-600 hover:text-gray-900 transition-colors'
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: user email + sign out */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {userEmail && (
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[160px]">
              {userEmail}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
