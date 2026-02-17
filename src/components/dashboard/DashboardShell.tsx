'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { TeamMember, TeamConfig } from '@/lib/teams';
import { trackEvent } from '@/lib/analytics';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DashboardShellProps {
  userName?: string;
  userEmail?: string;
  teamConfig: TeamConfig;
  teamTemplate: string;
  containerStatus: string;
  isSubscribed: boolean;
  freeMessagesUsed: number;
  freeMessageLimit: number;
  whatsappConnected?: boolean;
  telegramConnected?: boolean;
}

export function DashboardShell({
  userName,
  userEmail,
  teamConfig,
  teamTemplate,
  containerStatus,
  isSubscribed,
  freeMessagesUsed,
  freeMessageLimit,
  whatsappConnected,
  telegramConnected,
}: DashboardShellProps) {
  const members = teamConfig.members;
  const [selectedId, setSelectedId] = useState(members[0]?.id || '');
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedMember = members.find(m => m.id === selectedId) || members[0];
  const messages = chatHistories[selectedId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const msgCount = Object.values(chatHistories).flat().filter(m => m.role === 'user').length;
    if (msgCount === 0) trackEvent('funnel_first_message');
    trackEvent('chat_message_sent', { agent: selectedId });

    setInput('');
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setChatHistories(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), userMsg],
    }));
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: selectedId,
          teamTemplate,
        }),
      });
      const data = await res.json();
      const botMsg: Message = {
        role: 'assistant',
        content: data.content || data.error || 'No response',
        timestamp: new Date(),
      };
      setChatHistories(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), botMsg],
      }));
    } catch {
      setChatHistories(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), {
          role: 'assistant' as const,
          content: 'Failed to connect. Please try again.',
          timestamp: new Date(),
        }],
      }));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const isFreeTrial = !isSubscribed;
  const hasAccess = isSubscribed || (isFreeTrial && freeMessagesUsed < freeMessageLimit);

  return (
    <div className="flex h-screen" style={{ background: '#f8fafc' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-[280px] flex flex-col border-r
          transform transition-transform duration-200 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
      >
        {/* Sidebar header */}
        <div className="h-14 px-4 flex items-center justify-between border-b" style={{ borderColor: '#e2e8f0' }}>
          <Link href="/dashboard" className="text-base font-bold" style={{ color: '#0f172a' }}>
            🦞 CLAWER<span style={{ color: '#2563eb' }}>.AI</span>
          </Link>
          <button
            className="lg:hidden p-1 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Team name */}
        <div className="px-4 py-3 border-b" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#0f172a' }}>{teamConfig.name}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
            <span className="text-xs" style={{ color: '#16a34a' }}>Online — MiniMax M2.5</span>
          </div>
        </div>

        {/* Team members list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
              Team Members
            </span>
          </div>
          {members.map(member => {
            const isActive = member.id === selectedId;
            const memberMessages = chatHistories[member.id] || [];
            const lastMsg = memberMessages[memberMessages.length - 1];
            return (
              <button
                key={member.id}
                onClick={() => { setSelectedId(member.id); setSidebarOpen(false); }}
                className={`
                  w-full text-left px-3 py-2.5 mx-1 rounded-lg transition-colors
                  flex items-center gap-3
                `}
                style={{
                  width: 'calc(100% - 8px)',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1e40af' : '#334155',
                }}
              >
                <span className="text-xl flex-shrink-0">{member.emoji || '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {member.name}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: '#16a34a' }}
                    />
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#94a3b8' }}>
                    {lastMsg
                      ? (lastMsg.role === 'user' ? 'You: ' : '') + lastMsg.content.slice(0, 40)
                      : member.role
                    }
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar footer - connections & settings */}
        <div className="border-t p-3 space-y-1" style={{ borderColor: '#e2e8f0' }}>
          <Link
            href="/dashboard/tasks"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
            style={{ color: '#475569' }}
          >
            <span>📋</span>
            <span>Tasks</span>
          </Link>
          <Link
            href="/dashboard/whatsapp"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
            style={{ color: '#475569' }}
          >
            <span>📱</span>
            <span>WhatsApp</span>
            {whatsappConnected && (
              <span className="ml-auto text-xs" style={{ color: '#16a34a' }}>✓</span>
            )}
          </Link>
          <Link
            href="/dashboard/telegram"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
            style={{ color: '#475569' }}
          >
            <span>✈️</span>
            <span>Telegram</span>
            {telegramConnected && (
              <span className="ml-auto text-xs" style={{ color: '#16a34a' }}>✓</span>
            )}
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
            style={{ color: '#475569' }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        {/* User info */}
        <div className="border-t px-4 py-3 flex items-center gap-3" style={{ borderColor: '#e2e8f0' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ background: '#e2e8f0', color: '#475569' }}
          >
            {(userName || userEmail || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>
              {userName || 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: '#94a3b8' }}>
              {userEmail}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div
          className="h-14 px-4 sm:px-6 flex items-center gap-3 border-b flex-shrink-0"
          style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
        >
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" style={{ color: '#475569' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span className="text-2xl">{selectedMember?.emoji || '🤖'}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold" style={{ color: '#0f172a' }}>
              {selectedMember?.name}
            </h2>
            <p className="text-xs" style={{ color: '#475569' }}>
              {selectedMember?.role}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
            <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Online</span>
          </div>
        </div>

        {/* Messages area */}
        {!hasAccess ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#0f172a' }}>Free trial ended</h3>
              <p className="mb-4" style={{ color: '#475569' }}>Subscribe to continue chatting with your team.</p>
              <Link
                href="/pricing"
                className="inline-flex px-6 py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ background: '#2563eb' }}
              >
                View Plans
              </Link>
            </div>
          </div>
        ) : containerStatus !== 'running' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#0f172a' }}>Container Not Running</h3>
              <p style={{ color: '#475569' }}>Your AI container needs to be started before you can chat.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: '#f8fafc' }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="text-6xl mb-4">{selectedMember?.emoji || '🤖'}</div>
                <h3 className="text-xl font-semibold mb-1" style={{ color: '#0f172a' }}>
                  Chat with {selectedMember?.name}
                </h3>
                <p className="text-sm mb-6 max-w-md" style={{ color: '#475569' }}>
                  {selectedMember?.description || `Your ${selectedMember?.role}`}
                </p>

                {/* Quick prompts */}
                {selectedMember?.triggers && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {selectedMember.triggers.slice(0, 4).map(trigger => (
                      <button
                        key={trigger}
                        onClick={() => {
                          setInput(trigger.charAt(0).toUpperCase() + trigger.slice(1));
                          inputRef.current?.focus();
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:bg-blue-50"
                        style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#ffffff' }}
                      >
                        {trigger}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mr-2 mt-1"
                        style={{ background: '#f1f5f9' }}
                      >
                        {selectedMember?.emoji || '🤖'}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { background: '#2563eb', color: '#ffffff' }
                          : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mr-2"
                      style={{ background: '#f1f5f9' }}
                    >
                      {selectedMember?.emoji || '🤖'}
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Input area */}
        {hasAccess && containerStatus === 'running' && (
          <div className="px-4 sm:px-6 py-3 border-t flex-shrink-0" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${selectedMember?.name}...`}
                rows={1}
                className="flex-1 resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ borderColor: '#e2e8f0', color: '#0f172a', background: '#f8fafc' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#2563eb' }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
