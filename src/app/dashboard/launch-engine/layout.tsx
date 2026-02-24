'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/launch-engine', label: 'Dashboard', exact: true },
  { href: '/dashboard/launch-engine/tweets', label: 'Tweets' },
  { href: '/dashboard/launch-engine/blog', label: 'Blog' },
  { href: '/dashboard/launch-engine/calendar', label: 'Calendar' },
  { href: '/dashboard/launch-engine/campaigns', label: 'Campaigns' },
  { href: '/dashboard/launch-engine/analytics', label: 'Analytics' },
  { href: '/dashboard/launch-engine/brand-bible', label: 'Brand Bible' },
];

export default function LaunchEngineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Sub-header */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Brand bar */}
          <div className="flex items-center gap-2 pt-3 pb-1">
            <span className="text-xl">🚀</span>
            <h2 className="text-base font-semibold text-gray-900">Launch Engine</h2>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium">
              Phase 0
            </span>
          </div>

          {/* Tab nav */}
          <nav className="flex items-center gap-0 -mb-px overflow-x-auto">
            {TABS.map(({ href, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
