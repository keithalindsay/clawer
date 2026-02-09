'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { StarterPrompts } from '@/components/StarterPrompts';
import { BotSettingsModal, BotSettingsData } from '@/components/BotSettingsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  routing?: {
    tier: string;
    model: string;
    confidence: number;
  };
}

// Tier badge config
function getTierBadge(tier: string) {
  const badges: Record<string, { emoji: string; label: string; color: string }> = {
    SIMPLE: { emoji: '⚡', label: 'SIMPLE', color: 'text-green-500' },
    MEDIUM: { emoji: '🔧', label: 'MEDIUM', color: 'text-blue-500' },
    COMPLEX: { emoji: '🧠', label: 'COMPLEX', color: 'text-purple-500' },
    REASONING: { emoji: '🎯', label: 'REASONING', color: 'text-orange-500' },
  };
  return badges[tier] || badges.MEDIUM;
}

// Copy button for code blocks
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
      title="Copy code"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// Markdown renderer for AI messages
function MarkdownContent({ content }: { content: string }) {
  return (
    <Markdown
      components={{
        // Code blocks with copy button
        pre({ children }) {
          // Extract text content from children for copy
          const extractText = (node: unknown): string => {
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (Array.isArray(node)) return node.map(extractText).join('');
            if (node && typeof node === 'object' && 'props' in node) {
              const el = node as { props: { children?: unknown } };
              return extractText(el.props.children);
            }
            return '';
          };
          const codeText = extractText(children);

          return (
            <div className="relative group my-3">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
                {children}
              </pre>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={codeText} />
              </div>
            </div>
          );
        },
        // Inline code
        code({ className, children, ...props }) {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className={`${className || ''} text-sm`} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        // Paragraphs
        p({ children }) {
          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
        },
        // Lists
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        // Headings
        h1({ children }) {
          return <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>;
        },
        // Blockquotes
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-blue-300 pl-3 my-2 text-gray-600 italic">
              {children}
            </blockquote>
          );
        },
        // Links
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
              {children}
            </a>
          );
        },
        // Horizontal rule
        hr() {
          return <hr className="border-gray-200 my-3" />;
        },
        // Strong / em
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
      }}
    >
      {content}
    </Markdown>
  );
}

// Typing indicator component
function TypingIndicator({ avatar }: { avatar: string }) {
  return (
    <div className="mb-4 flex justify-start items-end gap-2">
      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
        {avatar}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-duration:1.4s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-duration:1.4s] [animation-delay:0.2s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-duration:1.4s] [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [botSettings, setBotSettings] = useState<BotSettingsData>({
    botName: 'Assistant',
    botAvatar: '🤖',
    personality: 'helpful and friendly',
    customInstructions: '',
    communicationStyle: 'balanced',
    responseLength: 'balanced',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load messages and settings on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, messagesRes] = await Promise.all([
          fetch('/api/bot/settings'),
          fetch('/api/messages?limit=50'),
        ]);

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setBotSettings({
            botName: settings.botName || 'Assistant',
            botAvatar: settings.botAvatar || '🤖',
            personality: settings.personality || 'helpful and friendly',
            customInstructions: settings.customInstructions || '',
            communicationStyle: settings.communicationStyle || 'balanced',
            responseLength: settings.responseLength || 'balanced',
          });
        }

        if (messagesRes.ok) {
          const data = await messagesRes.json();
          setConversationId(data.conversationId);
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.timestamp),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, conversationId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!conversationId) {
          setConversationId(data.conversationId);
        }
        return data.id;
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
    return null;
  };

  const handleSaveSettings = async (settings: BotSettingsData) => {
    try {
      const res = await fetch('/api/bot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setBotSettings(settings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const clearHistory = async () => {
    if (!conversationId) return;
    if (!confirm('Clear all messages? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    saveMessage('user', text);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          settings: botSettings,
        }),
      });

      const data = await response.json();

      if (response.ok && data.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          routing: data.routing,
        };
        setMessages(prev => [...prev, assistantMessage]);
        saveMessage('assistant', data.content);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to connect. Please check your connection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  // Keyboard handler: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const charCount = input.length;
  const MAX_CHARS = 4000;

  if (initialLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* ─── Header ─── */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 -ml-1"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                  {botSettings.botAvatar}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-gray-900 text-sm">{botSettings.botName}</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Clear history"
                aria-label="Clear history"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
              aria-label="Bot settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Messages ─── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
          {messages.length === 0 && !loading && (
            <StarterPrompts onSelectPrompt={handleSelectPrompt} />
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } items-end gap-2`}
            >
              {/* AI avatar */}
              {message.role === 'assistant' && (
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {botSettings.botAvatar}
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose-sm max-w-none [&_pre]:!m-0">
                      <MarkdownContent content={message.content} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                  )}
                </div>

                {/* Meta line: timestamp + tier badge */}
                <div
                  className={`flex items-center gap-2 mt-1 px-1 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span className={`text-[11px] ${message.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.role === 'assistant' && message.routing && (
                    <span
                      className={`text-[11px] ${getTierBadge(message.routing.tier).color}`}
                      title={`Model: ${message.routing.model} · Confidence: ${(message.routing.confidence * 100).toFixed(0)}%`}
                    >
                      {getTierBadge(message.routing.tier).emoji} {getTierBadge(message.routing.tier).label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator avatar={botSettings.botAvatar} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Input Area ─── */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto px-4 py-3">
          <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setInput(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${botSettings.botName}...`}
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent px-4 py-3 resize-none focus:outline-none text-gray-900 placeholder:text-gray-400 disabled:text-gray-400 text-[15px] leading-relaxed max-h-40"
            />
            <div className="flex items-center gap-2 pr-2 pb-2">
              {charCount > 0 && (
                <span className={`text-[11px] tabular-nums ${charCount > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-gray-300'}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-300 mt-1.5">
            <kbd className="font-sans">Enter</kbd> to send · <kbd className="font-sans">Shift+Enter</kbd> for new line
          </p>
        </form>
      </div>

      {/* Settings Modal */}
      <BotSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialSettings={botSettings}
      />
    </div>
  );
}
