'use client';

import { useState } from 'react';

interface TelegramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string) => Promise<void>;
}

export function TelegramConnectModal({ isOpen, onClose, onConnect }: TelegramConnectModalProps) {
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onConnect(botToken);
      setBotToken('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Connect Telegram Bot</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">📱 How to get your bot token:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Open Telegram and search for <strong>@BotFather</strong></li>
            <li>Send <code>/newbot</code> and follow the instructions</li>
            <li>Copy the bot token (looks like <code>123456:ABC-DEF...</code>)</li>
            <li>Paste it below and click Connect</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-2">
              Bot Token
            </label>
            <input
              id="botToken"
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !botToken}
            >
              {loading ? 'Connecting...' : 'Connect Bot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
