'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TelegramStatus {
  connected: boolean;
  botUsername?: string;
}

export default function TelegramPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');

  // Fetch initial status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/container/telegram/status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({ connected: true, botUsername: data.botUsername });
        setToken('');
      } else {
        setError(data.error || 'Failed to connect bot');
      }
    } catch (err) {
      setError('Failed to connect to container');
    } finally {
      setConnecting(false);
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
              Create a bot and connect it to your AI assistant
            </p>
          </div>

          <div className="mt-8">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            )}

            {!loading && status?.connected && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-800">
                  Connected!
                </h2>
                <p className="mt-2 text-green-700">
                  Your Telegram bot is active
                  {status.botUsername && ` (@${status.botUsername})`}
                </p>
                <p className="mt-4 text-gray-600">
                  You can now chat with your AI assistant via Telegram.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            )}

            {!loading && !status?.connected && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Step 1: Create a Bot
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-2">
                    <li>1. Open Telegram and search for <strong>@BotFather</strong></li>
                    <li>2. Start a chat and send <code className="bg-blue-100 px-2 py-1 rounded">/newbot</code></li>
                    <li>3. Follow the instructions to name your bot</li>
                    <li>4. BotFather will give you a <strong>token</strong> — copy it</li>
                  </ol>
                </div>

                <form onSubmit={handleConnect}>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Step 2: Connect Your Bot
                    </h3>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bot Token
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={connecting}
                    />
                    
                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={connecting || !token}
                      className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {connecting ? 'Connecting...' : 'Connect Bot'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your bot token is stored securely and only used to connect your Telegram account to your AI assistant.
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
