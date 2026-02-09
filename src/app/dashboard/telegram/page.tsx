'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  running: boolean;
  botUsername?: string | null;
}

export default function TelegramPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');

  // Fetch status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/container/telegram/status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to connect to your container');
    } finally {
      setLoading(false);
    }
  };

  // Connect bot
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/container/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken('');
        // Refresh status after gateway restarts
        setTimeout(fetchStatus, 3000);
      } else {
        setError(data.error || 'Failed to connect bot');
      }
    } catch (err) {
      setError('Failed to connect to container');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect bot
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram bot?')) {
      return;
    }
    
    setDisconnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/container/telegram/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus({ configured: false, connected: false, running: false, botUsername: null });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <Link 
            href="/dashboard" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-5xl mb-4">✈️</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Connect Telegram
            </h1>
            <p className="mt-2 text-gray-600">
              Create a bot with BotFather and connect it to your AI assistant
            </p>
          </div>

          <div className="mt-8">
            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Checking connection status...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && !status?.configured && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchStatus();
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Connected State */}
            {!loading && status?.configured && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-800">
                  Connected!
                </h2>
                {status.botUsername && (
                  <p className="mt-2 text-green-700 text-lg">
                    <a 
                      href={`https://t.me/${status.botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-900"
                    >
                      @{status.botUsername}
                    </a>
                  </p>
                )}
                <p className="mt-3 text-gray-600">
                  Your Telegram bot is active. Send it a message to chat with your AI assistant.
                </p>
                
                {status.botUsername && (
                  <a
                    href={`https://t.me/${status.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Open in Telegram →
                  </a>
                )}

                <div className="mt-6 flex gap-3 justify-center">
                  <Link
                    href="/dashboard"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
                  >
                    Return to Dashboard
                  </Link>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="bg-red-50 text-red-600 border-2 border-red-200 px-6 py-3 rounded-full font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            )}

            {/* Setup Flow */}
            {!loading && !status?.configured && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    Step 1: Create a Bot on Telegram
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Open BotFather</p>
                        <p className="text-sm text-blue-700 mt-1">
                          In Telegram, search for{' '}
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline hover:text-blue-900"
                          >
                            @BotFather
                          </a>
                          {' '}or tap this link
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Create your bot</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Send the command:{' '}
                          <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">/newbot</code>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Choose a name</p>
                        <p className="text-sm text-blue-700 mt-1">
                          BotFather will ask for a display name (e.g., "My AI Assistant")
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        4
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Choose a username</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Must end in "bot" (e.g., "myassistant_bot")
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        5
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Copy your token</p>
                        <p className="text-sm text-blue-700 mt-1">
                          BotFather will send you a <strong>bot token</strong> — it looks like:<br/>
                          <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs mt-1 inline-block">
                            123456789:ABCdefGHIjklMNOpqrsTUVwxyz
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConnect}>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Step 2: Paste Your Bot Token
                    </h3>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bot Token from BotFather
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        setError(null);
                      }}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      required
                      disabled={connecting}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    
                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={connecting || !token.trim()}
                      className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {connecting ? 'Connecting...' : 'Connect Bot'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>💡 Tip:</strong> Your bot token is stored securely in your private container. 
                    Only you can access it.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
