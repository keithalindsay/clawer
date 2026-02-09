'use client';

import Link from 'next/link';

interface QuickActionsProps {
  whatsappConnected?: boolean;
  telegramConnected?: boolean;
  containerRunning?: boolean;
}

export function QuickActions({ whatsappConnected, telegramConnected, containerRunning }: QuickActionsProps) {
  const actions = [
    {
      emoji: '💬',
      label: 'Chat Now',
      description: 'Talk to your AI assistant',
      href: '/chat/assistant',
      primary: true,
      disabled: !containerRunning,
    },
    {
      emoji: '📱',
      label: whatsappConnected ? 'WhatsApp Connected' : 'Connect WhatsApp',
      description: whatsappConnected ? 'Linked and active' : 'Chat from your phone',
      href: '/dashboard/whatsapp',
      primary: false,
      disabled: !containerRunning,
    },
    {
      emoji: '✈️',
      label: telegramConnected ? 'Telegram Connected' : 'Connect Telegram',
      description: telegramConnected ? 'Bot is active' : 'Set up your bot',
      href: '/dashboard/telegram',
      primary: false,
      disabled: !containerRunning,
    },
    {
      emoji: '⚙️',
      label: 'Bot Settings',
      description: 'Customize your assistant',
      href: '/chat/assistant?settings=true',
      primary: false,
      disabled: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.disabled ? '#' : action.href}
          className={`rounded-2xl p-5 border transition-all ${
            action.disabled 
              ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
              : action.primary
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="text-2xl mb-2">{action.emoji}</div>
          <h3 className={`font-semibold text-sm ${action.primary ? 'text-white' : 'text-gray-900'}`}>
            {action.label}
          </h3>
          <p className={`text-xs mt-1 ${action.primary ? 'text-blue-100' : 'text-gray-500'}`}>
            {action.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
