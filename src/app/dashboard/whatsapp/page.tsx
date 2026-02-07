'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WhatsAppStatus {
  connected: boolean;
  qr?: string;
  phoneNumber?: string;
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch QR code
  const fetchQR = async () => {
    try {
      const response = await fetch('/api/container/whatsapp/qr');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to fetch QR code');
      }
    } catch (err) {
      setError('Failed to connect to container');
    } finally {
      setLoading(false);
    }
  };

  // Poll for connection status
  const pollStatus = async () => {
    try {
      const response = await fetch('/api/container/whatsapp/status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
        
        // Stop polling if connected
        if (data.connected) {
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to poll status:', err);
      return false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchQR();

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      const connected = await pollStatus();
      if (connected) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
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
            <div className="text-5xl mb-4">💬</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Connect WhatsApp
            </h1>
            <p className="mt-2 text-gray-600">
              Scan the QR code with your phone to link your WhatsApp account
            </p>
          </div>

          <div className="mt-8">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading QR code...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchQR();
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {status?.connected && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-800">
                  Connected!
                </h2>
                <p className="mt-2 text-green-700">
                  Your WhatsApp is now linked
                  {status.phoneNumber && ` (${status.phoneNumber})`}
                </p>
                <p className="mt-4 text-gray-600">
                  You can now chat with your AI assistant via WhatsApp.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            )}

            {!loading && !error && status && !status.connected && status.qr && (
              <div className="text-center">
                <div className="inline-block bg-white p-4 rounded-xl border-2 border-gray-200">
                  <img 
                    src={status.qr} 
                    alt="WhatsApp QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    How to connect:
                  </h3>
                  <ol className="text-left text-sm text-blue-800 space-y-2 max-w-md mx-auto">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Tap Menu (⋮) → Linked Devices</li>
                    <li>3. Tap "Link a Device"</li>
                    <li>4. Point your phone at this screen to scan the code</li>
                  </ol>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  Waiting for connection...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
