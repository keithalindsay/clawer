import Link from 'next/link';

interface Action {
  icon: string;
  label: string;
  href: string;
  description?: string;
}

const ACTIONS: Action[] = [
  { icon: '💬', label: 'Chat with team',  href: '/dashboard/chat',     description: 'Send a message to your agents' },
  { icon: '📋', label: 'View tasks',      href: '/dashboard/tasks',    description: 'Task board & kanban' },
  { icon: '📁', label: 'Browse files',    href: '/dashboard/files',    description: 'Files saved by your agents' },
  { icon: '⚙️', label: 'Settings',        href: '/dashboard/settings', description: 'Plan, integrations, billing' },
];

export function QuickActions() {
  return (
    <section aria-label="Quick actions">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
          >
            <span className="text-lg flex-shrink-0" aria-hidden="true">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 truncate">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
