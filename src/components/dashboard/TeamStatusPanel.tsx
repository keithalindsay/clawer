'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface TeamMemberStatus {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: 'active' | 'idle' | 'offline';
  lastActivityAt: string | null;
  lastActivitySummary: string | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_DOT: Record<string, string> = {
  active:  'bg-green-500',
  idle:    'bg-yellow-400',
  offline: 'bg-gray-300',
};

const STATUS_LABEL: Record<string, string> = {
  active:  'Active',
  idle:    'Idle',
  offline: 'Offline',
};

function MemberCard({ member }: { member: TeamMemberStatus }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3 hover:border-gray-300 hover:shadow-md transition-all">
      {/* Avatar row */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-2xl leading-none">
            {member.emoji}
          </div>
          {/* Status dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[member.status]}`}
            aria-label={STATUS_LABEL[member.status]}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{member.name}</div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 truncate">{member.role}</span>
            <VerifiedBadge size="sm" showText={false} />
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
          member.status === 'active'
            ? 'bg-green-100 text-green-700'
            : member.status === 'idle'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {STATUS_LABEL[member.status]}
        </span>
      </div>

      {/* Last activity */}
      {member.lastActivityAt && (
        <p className="text-[11px] text-gray-400 leading-snug">
          Last active {relativeTime(member.lastActivityAt)}
        </p>
      )}

      {/* Chat button */}
      <Link
        href={`/dashboard/chat?agent=${member.id}`}
        className="mt-auto block text-center text-xs font-medium text-gray-700 border border-gray-200 rounded-lg py-1.5 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
      >
        Chat with {member.name}
      </Link>
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-3" />
      <div className="h-7 bg-gray-100 rounded-lg w-full" />
    </div>
  );
}

export function TeamStatusPanel() {
  const [members, setMembers] = useState<TeamMemberStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/team-status');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
    const id = setInterval(fetchTeam, 30_000);
    return () => clearInterval(id);
  }, [fetchTeam]);

  return (
    <section aria-label="Team status">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Team Status</h2>
        <Link
          href="/dashboard/chat"
          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
        >
          Chat with team →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          {[...Array(3)].map((_, i) => <MemberCardSkeleton key={i} />)}
        </div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">No team members configured</p>
        </div>
      ) : (
        /* Mobile: horizontal scroll — Desktop right column: stacked */
        <div className="flex gap-3 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible xl:pb-0">
          {members.map(member => (
            <div key={member.id} className="flex-shrink-0 w-52 xl:w-auto">
              <MemberCard member={member} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
