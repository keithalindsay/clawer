'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SlackStatus {
  configured: boolean;
  connected: boolean;
  running: boolean;
  teamName?: string | null;
  botName?: string | null;
  channel?: string | null;
}

export default function SlackPage() {
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState('');
  const [appToken, setAppToken] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [showTokens, setShowTokens] = useState({ bot: false, app: false, secret: false });

  // Fetch status from container
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/container/slack/status');
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

  // Connect Slack
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/container/slack/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          appToken: appToken.trim(),
          signingSecret: signingSecret.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBotToken('');
        setAppToken('');
        setSigningSecret('');
        // Refresh status after gateway restarts
        setTimeout(fetchStatus, 3000);
      } else {
        setError(data.error || 'Failed to connect Slack');
      }
    } catch (err) {
      setError('Failed to connect to container');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Slack
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Slack? Your bot will stop responding in your workspace.')) {
      return;
    }
    
    setDisconnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/container/slack/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus({ configured: false, connected: false, running: false, teamName: null, botName: null, channel: null });
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

  const isFormValid = botToken.trim().startsWith('xoxb-') && appToken.trim().startsWith('xapp-') && signingSecret.trim().length >= 10;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
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
            <div className="text-5xl mb-4">💼</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Connect Slack
            </h1>
            <p className="mt-2 text-gray-600">
              Create a Slack app and connect it to your AI assistant
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

            {/* Error (only show standalone when not configured) */}
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
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold text-green-800">
                    Connected!
                  </h2>

                  {/* Status details */}
                  <div className="mt-6 bg-white rounded-lg border border-green-200 divide-y divide-green-100 text-left max-w-md mx-auto">
                    {status.teamName && (
                      <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Workspace</span>
                        <span className="text-sm font-semibold text-gray-900">{status.teamName}</span>
                      </div>
                    )}
                    {status.botName && (
                      <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bot Name</span>
                        <span className="text-sm font-semibold text-gray-900">@{status.botName}</span>
                      </div>
                    )}
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bot Status</span>
                      <span className={`text-sm font-semibold flex items-center gap-1.5 ${status.running ? 'text-green-700' : 'text-amber-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${status.running ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        {status.running ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    {status.channel && (
                      <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Channel</span>
                        <span className="text-sm font-semibold text-gray-900">#{status.channel}</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-gray-600 text-sm">
                    Your Slack bot is active. Send it a DM or mention it in a channel to chat with your AI assistant.
                  </p>

                  {/* Error within connected state */}
                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
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
              </div>
            )}

            {/* Setup Flow */}
            {!loading && !status?.configured && (
              <>
                {/* Step 1: Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Step 1: Create a Slack App
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-3">
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">1.</span>
                      <span>
                        Go to{' '}
                        <a
                          href="https://api.slack.com/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline hover:text-blue-900"
                        >
                          api.slack.com/apps
                        </a>{' '}
                        and click <strong>&quot;Create New App&quot;</strong> → <strong>&quot;From scratch&quot;</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">2.</span>
                      <span>
                        Name it <strong>&quot;Clawer AI&quot;</strong> and select your workspace
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">3.</span>
                      <div>
                        <span>Go to <strong>&quot;OAuth &amp; Permissions&quot;</strong> and add these Bot Token Scopes:</span>
                        <ul className="mt-1.5 ml-1 space-y-0.5 font-mono text-xs bg-white/70 p-2 rounded border border-blue-200">
                          <li>• <strong>chat:write</strong> — Send messages</li>
                          <li>• <strong>im:history</strong> — Read DM history</li>
                          <li>• <strong>im:read</strong> — View direct messages</li>
                          <li>• <strong>im:write</strong> — Start direct messages</li>
                          <li>• <strong>app_mentions:read</strong> — Read @mentions</li>
                          <li>• <strong>channels:read</strong> — View channels</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">4.</span>
                      <span>
                        Click <strong>&quot;Install to Workspace&quot;</strong> and authorize — copy the <strong>Bot User OAuth Token</strong> (<code className="bg-white/70 px-1.5 py-0.5 rounded text-xs">xoxb-...</code>)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">5.</span>
                      <div>
                        <span>Go to <strong>&quot;Socket Mode&quot;</strong> and enable it:</span>
                        <ul className="mt-1 ml-1 space-y-0.5 text-xs">
                          <li>• Generate an <strong>App-Level Token</strong> with <code className="bg-white/70 px-1 rounded">connections:write</code> scope</li>
                          <li>• Copy the token (<code className="bg-white/70 px-1 rounded">xapp-...</code>)</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">6.</span>
                      <div>
                        <span>Go to <strong>&quot;Event Subscriptions&quot;</strong>:</span>
                        <ul className="mt-1 ml-1 space-y-0.5 text-xs">
                          <li>• Enable Events</li>
                          <li>• Subscribe to bot events: <strong>message.im</strong>, <strong>app_mention</strong></li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 shrink-0">7.</span>
                      <span>
                        Copy the <strong>Signing Secret</strong> from <strong>&quot;Basic Information&quot;</strong> → <strong>&quot;App Credentials&quot;</strong>
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Step 2: Token form */}
                <form onSubmit={handleConnect}>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Step 2: Paste Your Credentials
                    </h3>
                    
                    {/* Bot Token */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Bot User OAuth Token
                      </label>
                      <div className="relative">
                        <input
                          type={showTokens.bot ? 'text' : 'password'}
                          value={botToken}
                          onChange={(e) => {
                            setBotToken(e.target.value);
                            setError(null);
                          }}
                          placeholder="xoxb-your-bot-token"
                          className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          required
                          disabled={connecting}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          onClick={() => setShowTokens(s => ({ ...s, bot: !s.bot }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {showTokens.bot ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Found in OAuth &amp; Permissions after installing to workspace
                      </p>
                    </div>

                    {/* App Token */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        App-Level Token
                      </label>
                      <div className="relative">
                        <input
                          type={showTokens.app ? 'text' : 'password'}
                          value={appToken}
                          onChange={(e) => {
                            setAppToken(e.target.value);
                            setError(null);
                          }}
                          placeholder="xapp-your-app-token"
                          className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          required
                          disabled={connecting}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          onClick={() => setShowTokens(s => ({ ...s, app: !s.app }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {showTokens.app ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Generated in Socket Mode settings with connections:write scope
                      </p>
                    </div>

                    {/* Signing Secret */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Signing Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showTokens.secret ? 'text' : 'password'}
                          value={signingSecret}
                          onChange={(e) => {
                            setSigningSecret(e.target.value);
                            setError(null);
                          }}
                          placeholder="your-signing-secret"
                          className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          required
                          disabled={connecting}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          onClick={() => setShowTokens(s => ({ ...s, secret: !s.secret }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {showTokens.secret ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Found in Basic Information → App Credentials
                      </p>
                    </div>
                    
                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={connecting || !isFormValid}
                      className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {connecting ? 'Connecting...' : 'Connect Slack'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>💡 Tip:</strong> All credentials are stored securely in your private container.
                    Only you can access them. Socket Mode means no public URL is needed.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help section */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Token not working?</strong> Make sure you copied the <strong>Bot User OAuth Token</strong> (starts with <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">xoxb-</code>), not the user token.
            </p>
            <p>
              <strong>App Token missing?</strong> Go to your app&apos;s <strong>Socket Mode</strong> settings, enable it, and generate a token with <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">connections:write</code> scope.
            </p>
            <p>
              <strong>Bot not responding?</strong> Check that Event Subscriptions are enabled with <strong>message.im</strong> and <strong>app_mention</strong> events.
            </p>
            <p>
              <strong>Can&apos;t find the bot?</strong> In Slack, go to Apps → Browse Apps → search for your app name.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
