'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  emoji?: string;
  description?: string;
  triggers?: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DashboardWorkspaceProps {
  userName?: string;
  userEmail?: string;
  teamName: string;
  teamDescription?: string;
  teamMembers: TeamMember[];
  whatsappConnected?: boolean;
  telegramConnected?: boolean;
  isSubscribed: boolean;
  freeMessagesUsed: number;
  freeMessageLimit: number;
  initialAgentId?: string;
  initialPrompt?: string;
}

export function DashboardWorkspace({
  userName,
  userEmail,
  teamName,
  teamDescription,
  teamMembers,
  whatsappConnected,
  telegramConnected,
  isSubscribed,
  freeMessagesUsed,
  freeMessageLimit,
  initialAgentId,
  initialPrompt,
}: DashboardWorkspaceProps) {
  const initAgent = initialAgentId ? teamMembers.find(m => m.id === initialAgentId) || teamMembers[0] : teamMembers[0];
  const [selectedAgent, setSelectedAgent] = useState<TeamMember | null>(initAgent || null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [historyLoaded, setHistoryLoaded] = useState<Record<string, boolean>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = selectedAgent ? (chatHistory[selectedAgent.id] || []) : [];

  const [autoSent, setAutoSent] = useState(false);

  // Load message history when switching agents
  useEffect(() => {
    if (!selectedAgent || historyLoaded[selectedAgent.id]) return;

    setHistoryLoading(true);
    fetch(`/api/messages?agentId=${encodeURIComponent(selectedAgent.id)}`)
      .then(res => res.json())
      .then(data => {
        const loaded: Message[] = (data.messages || []).map((m: { role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }));
        setChatHistory(prev => ({ ...prev, [selectedAgent.id]: loaded }));
        setHistoryLoaded(prev => ({ ...prev, [selectedAgent.id]: true }));
      })
      .catch(() => {
        setHistoryLoaded(prev => ({ ...prev, [selectedAgent.id]: true }));
      })
      .finally(() => setHistoryLoading(false));
  }, [selectedAgent, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-send initial prompt from query params
  useEffect(() => {
    if (initialPrompt && selectedAgent && !autoSent && messages.length === 0) {
      setAutoSent(true);
      setInput(initialPrompt);
      // Trigger send after a tick so the input is set
      setTimeout(() => {
        const userMsg: Message = { role: 'user', content: initialPrompt, timestamp: new Date() };
        setChatHistory(prev => ({
          ...prev,
          [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMsg],
        }));
        setLoading(true);
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: initialPrompt, agentId: selectedAgent.id }),
        })
          .then(res => res.json())
          .then(data => {
            setChatHistory(prev => ({
              ...prev,
              [selectedAgent.id]: [...(prev[selectedAgent.id] || []), {
                role: 'assistant' as const,
                content: data.content || data.error || 'No response',
                timestamp: new Date(),
              }],
            }));
          })
          .catch(() => {
            setChatHistory(prev => ({
              ...prev,
              [selectedAgent.id]: [...(prev[selectedAgent.id] || []), {
                role: 'assistant' as const,
                content: 'Failed to connect. Please try again.',
                timestamp: new Date(),
              }],
            }));
          })
          .finally(() => {
            setLoading(false);
            setInput('');
          });
      }, 100);
    }
  }, [initialPrompt, selectedAgent, autoSent, messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedAgent]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !selectedAgent) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setChatHistory(prev => ({
      ...prev,
      [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMsg],
    }));
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, agentId: selectedAgent.id }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.content || data.error || 'No response',
        timestamp: new Date(),
      };
      setChatHistory(prev => ({
        ...prev,
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), assistantMsg],
      }));
    } catch {
      setChatHistory(prev => ({
        ...prev,
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), {
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
  const hasFreeTrial = isFreeTrial && freeMessagesUsed < freeMessageLimit;

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 sm:px-6" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm hover:text-white transition-colors" style={{ color: '#94a3b8' }}>← Dashboard</Link>
          <span className="text-base font-bold text-white">🦞 Clawer.ai</span>
          <span className="hidden sm:inline text-sm" style={{ color: '#94a3b8' }}>Team: {teamName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm" style={{ color: '#94a3b8' }}>{userEmail}</span>
          <Link href="/dashboard/settings" className="p-1.5 rounded transition-colors hover:bg-white/10" style={{ color: '#94a3b8' }} title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </Link>
          {/* API Keys hidden until post-launch */}
          <LogoutButton />
        </div>
      </header>

      {/* Free trial banner */}
      {isFreeTrial && (
        <div className="flex-shrink-0 px-4 py-2 text-center text-sm" style={{ background: '#eff6ff', color: '#1e40af', borderBottom: '1px solid #bfdbfe' }}>
          {hasFreeTrial
            ? `Free trial: ${freeMessagesUsed}/${freeMessageLimit} messages used`
            : 'Free trial ended — '}
          {!hasFreeTrial && <Link href="/pricing" className="underline font-medium">Upgrade now</Link>}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="flex-shrink-0 w-[280px] hidden md:flex flex-col overflow-y-auto" style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
          {/* Team section */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Team</h3>
          </div>
          <nav className="px-2 space-y-0.5">
            {teamMembers.map(member => {
              const isSelected = selectedAgent?.id === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedAgent(member)}
                  className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors"
                  style={isSelected
                    ? { background: '#eff6ff', borderLeft: '3px solid #2563eb' }
                    : { borderLeft: '3px solid transparent' }}
                >
                  <span className="text-lg flex-shrink-0">{member.emoji || '🤖'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>{member.name}</span>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#16a34a' }} />
                    </div>
                    <span className="text-xs truncate block" style={{ color: '#475569' }}>{member.role}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-3" style={{ borderTop: '1px solid #e2e8f0' }} />

          {/* General section */}
          <div className="px-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>General</h3>
          </div>
          <nav className="px-2 space-y-0.5">
            <Link href="/dashboard/files" className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors hover:bg-gray-50" style={{ borderLeft: '3px solid transparent' }}>
              <span className="text-lg">📂</span>
              <span className="text-sm" style={{ color: '#0f172a' }}>Files</span>
            </Link>
            <Link href="/dashboard/settings" className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors hover:bg-gray-50" style={{ borderLeft: '3px solid transparent' }}>
              <span className="text-lg">⚙️</span>
              <span className="text-sm" style={{ color: '#0f172a' }}>Settings</span>
            </Link>
          </nav>

          {/* Divider */}
          <div className="mx-4 my-3" style={{ borderTop: '1px solid #e2e8f0' }} />

          {/* Platforms */}
          <div className="px-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Platforms</h3>
          </div>
          <nav className="px-2 space-y-0.5 pb-4">
            <Link href="/dashboard/whatsapp" className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors hover:bg-gray-50" style={{ borderLeft: '3px solid transparent' }}>
              <span className="text-lg">📱</span>
              <div className="min-w-0 flex-1">
                <span className="text-sm block" style={{ color: '#0f172a' }}>WhatsApp</span>
              </div>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: whatsappConnected ? '#16a34a' : '#cbd5e1' }} />
            </Link>
            <Link href="/dashboard/telegram" className="w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors hover:bg-gray-50" style={{ borderLeft: '3px solid transparent' }}>
              <span className="text-lg">✈️</span>
              <div className="min-w-0 flex-1">
                <span className="text-sm block" style={{ color: '#0f172a' }}>Telegram</span>
              </div>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: telegramConnected ? '#16a34a' : '#cbd5e1' }} />
            </Link>
          </nav>
        </aside>

        {/* Main chat panel */}
        <main className="flex-1 flex flex-col min-h-0" style={{ background: '#f8fafc' }}>
          {selectedAgent ? (
            <>
              {/* Agent header */}
              <div className="flex-shrink-0 px-6 py-3 flex items-center gap-3" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <span className="text-xl">{selectedAgent.emoji || '🤖'}</span>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: '#0f172a' }}>{selectedAgent.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
                    <span className="text-xs" style={{ color: '#475569' }}>{selectedAgent.role}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center mt-20 gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>Loading history…</p>
                  </div>
                ) : messages.length === 0 && (
                  <div className="text-center mt-20">
                    <div className="text-5xl mb-4">{selectedAgent.emoji || '🤖'}</div>
                    <p className="text-lg font-medium" style={{ color: '#0f172a' }}>Start chatting with {selectedAgent.name}</p>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>{selectedAgent.description || selectedAgent.role}</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                      style={msg.role === 'user'
                        ? { background: '#2563eb', color: '#ffffff' }
                        : { background: '#f1f5f9', color: '#0f172a' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: '#f1f5f9' }}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 px-6 py-4" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Message ${selectedAgent.name}...`}
                    rows={1}
                    className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#2563eb' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: '#94a3b8' }}>Select a team member to start chatting</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
