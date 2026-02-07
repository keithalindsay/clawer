'use client';

import { useState, useEffect } from 'react';
import { TelegramConnectModal } from './TelegramConnectModal';

interface TelegramCardProps {
  isSubscribed: boolean;
}

export function TelegramCard({ isSubscribed }: TelegramCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [connected, setConnected] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/telegram/status');
      const data = await response.json();
      setConnected(data.connected);
      setBotUsername(data.botUsername);
    } catch (error) {
      console.error('Failed to check Telegram status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (token: string) => {
    const response = await fetch('/api/telegram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken: token }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to connect');
    }

    const data = await response.json();
    setConnected(true);
    setBotUsername(data.botUsername);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram bot?')) {
      return;
    }

    try {
      const response = await fetch('/api/telegram/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setConnected(false);
      setBotUsername(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect bot');
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-50">
        <div className="text-2xl mb-2">✈️</div>
        <h3 className="font-semibold text-gray-900">Telegram</h3>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (connected && botUsername) {
    return (
      <>
        <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
          <div className="text-2xl mb-2">✈️</div>
          <h3 className="font-semibold text-gray-900">Telegram</h3>
          <p className="text-sm text-gray-600">@{botUsername}</p>
          <div className="mt-2 flex gap-2">
            <span className="inline-block text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Connected
            </span>
            <button
              onClick={handleDisconnect}
              className="text-xs font-medium text-red-600 hover:text-red-700 underline"
            >
              Disconnect
            </button>
          </div>
        </div>
        <TelegramConnectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConnect={handleConnect}
        />
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => isSubscribed && setShowModal(true)}
        className={`p-4 rounded-xl border-2 transition-all ${
          isSubscribed
            ? 'border-gray-200 hover:border-blue-300 cursor-pointer'
            : 'border-gray-200 bg-gray-50 opacity-50'
        }`}
      >
        <div className="text-2xl mb-2">✈️</div>
        <h3 className="font-semibold text-gray-900">Telegram</h3>
        <p className="text-sm text-gray-600">Fast and private</p>
        <span className="inline-block mt-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
          Click to setup
        </span>
      </div>
      <TelegramConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
    </>
  );
}
