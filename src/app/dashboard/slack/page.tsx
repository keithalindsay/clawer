/**
 * Slack Integration Setup Page
 * 
 * Allows users to connect their Slack workspace with Clawer AI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SlackSetupPage() {
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [connected, setConnected] = useState(false);
  const [teamName, setTeamName] = useState('');

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await fetch('/api/slack/connect');
      const data = await res.json();
      setConnected(data.connected);
      setTeamName(data.teamName || '');
    } catch (err) {
      console.error('Failed to check Slack connection:', err);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/slack/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to connect');
        return;
      }

      setSuccess(true);
      setConnected(true);
      setTeamName(data.teamName || '');
      setBotToken('');
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Slack?')) {
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/slack/connect', { method: 'DELETE' });
      setConnected(false);
      setTeamName('');
      setSuccess(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-4xl mb-4">💼</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Slack
          </h1>
          <p className="text-gray-600 mb-8">
            Chat with Clawer AI directly in your Slack workspace.
          </p>

          {connected ? (
            // Connected state
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    ✓ Connected to {teamName}
                  </h3>
                  <p className="mt-2 text-green-700">
                    Your Slack bot is active! Send a direct message to your bot to start chatting.
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-green-700">
                    <p><strong>How to use:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Open Slack and find your bot in the Apps section</li>
                      <li>Send it a direct message</li>
                      <li>The bot will respond with AI-powered answers</li>
                      <li>You can also mention the bot in channels (if configured)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="mt-6 text-red-600 hover:text-red-700 text-sm font-medium underline disabled:opacity-50"
              >
                Disconnect Slack
              </button>
            </div>
          ) : (
            // Setup instructions
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Setup Instructions
                </h3>
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">1.</span>
                    <span>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener" className="underline">https://api.slack.com/apps</a></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">2.</span>
                    <span>Click <strong>"Create New App"</strong> → <strong>"From scratch"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">3.</span>
                    <span>Name it <strong>"Clawer AI"</strong> and select your workspace</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">4.</span>
                    <div>
                      <div className="font-medium mb-1">Go to <strong>"OAuth & Permissions"</strong> and add these Bot Token Scopes:</div>
                      <ul className="ml-4 mt-1 space-y-1 font-mono text-xs bg-white p-2 rounded border border-blue-300">
                        <li>• <strong>chat:write</strong> — Send messages</li>
                        <li>• <strong>im:history</strong> — Read DM history</li>
                        <li>• <strong>im:read</strong> — View DMs</li>
                        <li>• <strong>im:write</strong> — Send DMs</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">5.</span>
                    <span>Click <strong>"Install to Workspace"</strong> and authorize</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">6.</span>
                    <span>Copy the <strong>Bot User OAuth Token</strong> (starts with <code className="bg-white px-1 rounded">xoxb-</code>)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">7.</span>
                    <div>
                      <div className="font-medium mb-1">Go to <strong>"Event Subscriptions"</strong>:</div>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Enable Events</li>
                        <li>• Request URL: <code className="bg-white px-1 rounded text-xs">https://clawer.ai/api/slack/events</code></li>
                        <li>• Subscribe to bot events: <strong>message.im</strong></li>
                        <li>• Save Changes</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold min-w-[24px]">8.</span>
                    <span>Paste your bot token below to complete the connection</span>
                  </li>
                </ol>
              </div>

              {/* Connection form */}
              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-2">
                    Slack Bot Token
                  </label>
                  <input
                    id="botToken"
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="xoxb-your-bot-token-here"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your token is stored securely and never shared.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                    ✓ Successfully connected! Your Slack bot is now active.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !botToken}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect Slack'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Help section */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Token not working?</strong> Make sure you copied the <strong>Bot User OAuth Token</strong> (starts with xoxb-), not the signing secret or app token.
            </p>
            <p>
              <strong>Bot not responding?</strong> Check that Event Subscriptions are enabled and the Request URL shows a green checkmark.
            </p>
            <p>
              <strong>Can't find the bot?</strong> In Slack, go to Apps → Browse Apps → Find your app name (Clawer AI).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
