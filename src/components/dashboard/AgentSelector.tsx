'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TeamMemberInfo {
  id: string;
  name: string;
  role: string;
  emoji: string;
  description: string;
  isDefault: boolean;
  provisioned: boolean;
  lastActive?: Date;
  hasUnread?: boolean;
}

interface AgentSelectorProps {
  currentAgentId: string;
  onAgentChange: (agentId: string) => void;
  className?: string;
}

export function AgentSelector({ currentAgentId, onAgentChange, className }: AgentSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch team configuration from API
    fetch('/api/team/members')
      .then(res => res.json())
      .then(data => {
        setTeamMembers(data.members || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load team members:', error);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return (
      <div className={cn('flex gap-2 p-3 border-b bg-gray-50/50', className)}>
        <div className="animate-pulse flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-24 h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (teamMembers.length === 0) {
    return null;
  }
  
  return (
    <div className={cn('border-b bg-gradient-to-r from-gray-50 to-gray-100/50', className)}>
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {teamMembers.map(member => (
          <button
            key={member.id}
            onClick={() => onAgentChange(member.id)}
            disabled={!member.provisioned}
            className={cn(
              'flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all duration-200 min-w-[100px] relative group',
              currentAgentId === member.id
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : member.provisioned
                ? 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md border border-gray-200 hover:border-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60',
              !member.provisioned && 'cursor-not-allowed'
            )}
            title={`${member.name} - ${member.role}`}
          >
            {/* Activity indicator */}
            {member.hasUnread && currentAgentId !== member.id && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
            
            {/* Emoji avatar */}
            <span className="text-2xl leading-none">{member.emoji}</span>
            
            {/* Name */}
            <div className="flex flex-col items-center gap-0.5">
              <span className={cn(
                'font-semibold text-sm leading-none',
                currentAgentId === member.id ? 'text-white' : 'text-gray-900'
              )}>
                {member.name}
              </span>
              
              {/* Role */}
              <span className={cn(
                'text-xs leading-none',
                currentAgentId === member.id ? 'text-blue-100' : 'text-gray-500'
              )}>
                {member.role}
              </span>
            </div>
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
              <div className="font-semibold mb-1">{member.name}</div>
              <div className="text-gray-300">{member.description}</div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact version for mobile
 */
export function AgentSelectorCompact({ currentAgentId, onAgentChange, className }: AgentSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    fetch('/api/team/members')
      .then(res => res.json())
      .then(data => setTeamMembers(data.members || []))
      .catch(console.error);
  }, []);
  
  const currentMember = teamMembers.find(m => m.id === currentAgentId);
  
  if (!currentMember) {
    return null;
  }
  
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full"
      >
        <span className="text-xl">{currentMember.emoji}</span>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">{currentMember.name}</div>
          <div className="text-xs text-gray-500">{currentMember.role}</div>
        </div>
        <svg className={cn('w-4 h-4 transition-transform', showDropdown && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-[400px] overflow-y-auto">
            {teamMembers.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onAgentChange(member.id);
                  setShowDropdown(false);
                }}
                disabled={!member.provisioned}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0',
                  currentAgentId === member.id && 'bg-blue-50',
                  !member.provisioned && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-2xl">{member.emoji}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.role}</div>
                </div>
                {member.hasUnread && currentAgentId !== member.id && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
