'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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

// Helper to get tier badge
function getTierBadge(tier: string) {
  const badges: Record<string, { emoji: string; label: string; color: string }> = {
    SIMPLE: { emoji: '⚡', label: 'SIMPLE', color: 'bg-green-100 text-green-700' },
    MEDIUM: { emoji: '🔧', label: 'MEDIUM', color: 'bg-blue-100 text-blue-700' },
    COMPLEX: { emoji: '🧠', label: 'COMPLEX', color: 'bg-purple-100 text-purple-700' },
    REASONING: { emoji: '🎯', label: 'REASONING', color: 'bg-orange-100 text-orange-700' },
  };
  return badges[tier] || badges.MEDIUM;
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

  // Load messages and settings on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings
        const settingsRes = await fetch('/api/bot/settings');
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

        // Load messages
        const messagesRes = await fetch('/api/messages?limit=50');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const text = input.trim();
    if (!text || loading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Save user message
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
          routing: data.routing,  // Include routing metadata
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message
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
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to connect. Please check your connection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="text-gray-400 hover:text-gray-600"
            >
              ←
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                {botSettings.botAvatar}
              </div>
              <span className="font-medium text-gray-900">{botSettings.botName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-gray-400 hover:text-gray-600 p-2"
                title="Clear history"
              >
                🗑️
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-gray-600 p-2"
              title="Settings"
            >
              ⚙️
            </button>
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 && (
            <StarterPrompts onSelectPrompt={handleSelectPrompt} />
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg mr-2 flex-shrink-0">
                  {botSettings.botAvatar}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && message.routing && (
                  <div className="mb-2">
                    <span 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        getTierBadge(message.routing.tier).color
                      }`}
                      title={`Model: ${message.routing.model} | Confidence: ${(message.routing.confidence * 100).toFixed(0)}%`}
                    >
                      <span>{getTierBadge(message.routing.tier).emoji}</span>
                      <span>{getTierBadge(message.routing.tier).label}</span>
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="mb-4 flex justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg mr-2">
                {botSettings.botAvatar}
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${botSettings.botName}...`}
              disabled={loading}
              className="flex-1 rounded-full border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
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
