'use client';

import { useEffect, useState } from 'react';

interface DashboardHeaderProps {
  userName?: string;
  teamName: string;
  teamDescription?: string;
  memberCount: number;
  stats: {
    messagesToday: number;
  };
}

export function DashboardHeader({ userName, teamName, teamDescription, memberCount, stats }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{ color: '#0f172a' }}>
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>
        <p style={{ color: '#475569' }} className="text-base sm:text-lg">
          Your AI Team — <span className="font-medium">{teamName}</span>
        </p>
        {teamDescription && (
          <p style={{ color: '#94a3b8' }} className="text-sm mt-1 max-w-2xl">
            {teamDescription}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div style={{ background: '#ffffff', borderColor: '#e2e8f0', borderLeftColor: '#2563eb' }} className="border border-l-4 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👥</span>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#94a3b8' }}>Team Size</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>{memberCount}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>
            {memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        <div style={{ background: '#ffffff', borderColor: '#e2e8f0', borderLeftColor: '#16a34a' }} className="border border-l-4 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">💚</span>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#94a3b8' }}>Status</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>Online</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>all members ready</p>
        </div>

        <div style={{ background: '#ffffff', borderColor: '#e2e8f0', borderLeftColor: '#7c3aed' }} className="border border-l-4 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">💬</span>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#94a3b8' }}>Today</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>{stats.messagesToday}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>messages</p>
        </div>
      </div>
    </div>
  );
}
