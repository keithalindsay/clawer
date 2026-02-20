'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WhatsAppStatus {
  linked: boolean;
  qrDataUrl?: string;
  message?: string;
  self?: {
    e164?: string;
    jid?: string;
  };
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch QR code
  const fetchQR = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/container/whatsapp/qr');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
        setError(null);
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
        // If now linked, update status
        if (data.linked) {
          setStatus({ linked: true, self: data.self });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to poll status:', err);
      return false;
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) {
      return;
    }
    
    setDisconnecting(true);
    try {
      const response = await fetch('/api/container/whatsapp/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setStatus({ linked: false });
        // Refresh QR for reconnection
        await fetchQR();
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

  // Copy link to clipboard
  const handleCopyLink = async () => {
    const url = window.location.origin + '/dashboard/whatsapp';
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      alert('Failed to copy. Please copy this URL manually: ' + url);
    }
  };

  // Send link via email (placeholder - would need backend implementation)
  const handleSendEmail = async () => {
    if (!email.trim()) return;
    
    // For now, just open mailto
    const url = window.location.origin + '/dashboard/whatsapp';
    const subject = encodeURIComponent('Connect WhatsApp to Clawer.ai');
    const body = encodeURIComponent(`Open this link on your computer to connect WhatsApp:\n\n${url}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    setShowEmailInput(false);
    setEmail('');
  };

  useEffect(() => {
    // Initial fetch
    fetchQR();

    let statusInterval: NodeJS.Timeout | null = null;
    let qrRefreshInterval: NodeJS.Timeout | null = null;

    // Poll status every 3 seconds (only if not connected)
    statusInterval = setInterval(async () => {
      if (!status?.linked) {
        const connected = await pollStatus();
        if (connected && statusInterval) {
          clearInterval(statusInterval);
          if (qrRefreshInterval) {
            clearInterval(qrRefreshInterval);
          }
        }
      }
    }, 3000);

    // Refresh QR every 30 seconds (only if not connected)
    qrRefreshInterval = setInterval(() => {
      if (!status?.linked) {
        fetchQR();
      }
    }, 30000);

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (qrRefreshInterval) clearInterval(qrRefreshInterval);
    };
  }, [status?.linked]);

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
            <div className="text-5xl mb-4">💬</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Connect WhatsApp
            </h1>
            <p className="mt-2 text-gray-600">
              {isMobile 
                ? "Access this page on your computer to connect WhatsApp"
                : "Scan the QR code with your phone to link your WhatsApp account"
              }
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

            {status?.linked && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-800">
                  Connected!
                </h2>
                <p className="mt-2 text-green-700">
                  Your WhatsApp is now linked
                  {status.self?.e164 && ` (${status.self.e164})`}
                </p>
                <p className="mt-4 text-gray-600">
                  You can now chat with your AI assistant via WhatsApp.
                </p>
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

            {/* Mobile Flow - Cannot scan QR on same device */}
            {!loading && !error && status && !status.linked && isMobile && (
              <div className="space-y-6">
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">📱</span>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">
                        You're on mobile
                      </h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        You can't scan a QR code on the same phone you want to connect WhatsApp on. 
                        To set up WhatsApp, you need to open this page on your computer.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Option 1: Open on your computer
                  </h3>
                  
                  {!showEmailInput ? (
                    <div className="space-y-3">
                      <button
                        onClick={handleCopyLink}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {linkCopied ? (
                          <>
                            <span>✓</span>
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            <span>Copy Setup Link</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setShowEmailInput(true)}
                        className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📧</span>
                        <span>Email Link to Myself</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendEmail}
                          disabled={!email.trim()}
                          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Send Email
                        </button>
                        <button
                          onClick={() => {
                            setShowEmailInput(false);
                            setEmail('');
                          }}
                          className="px-4 py-3 text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Once you have the link open on your computer, you'll see a QR code to scan with this phone.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Option 2: Use WhatsApp Web
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    If you already have WhatsApp Web set up on your computer:
                  </p>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Open WhatsApp Web on your computer</li>
                    <li>Look for the Clawer.ai bot in your chats</li>
                    <li>Start messaging to connect</li>
                  </ol>
                  <a
                    href="https://web.whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Open WhatsApp Web →
                  </a>
                </div>
              </div>
            )}

            {/* Desktop Flow - Show QR with improved instructions */}
            {!loading && !error && status && !status.linked && !isMobile && status.qrDataUrl && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-block bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm relative">
                    <img 
                      src={status.qrDataUrl} 
                      alt="WhatsApp QR Code" 
                      className="w-64 h-64"
                    />
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span>QR refreshes automatically every 30s</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    How to scan with your phone:
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Open WhatsApp on your phone</p>
                        <p className="text-sm text-blue-700 mt-1">Launch the WhatsApp app</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Go to Linked Devices</p>
                        <p className="text-sm text-blue-700 mt-1">
                          <span className="font-semibold">Android:</span> Tap Menu (⋮) → Linked Devices<br/>
                          <span className="font-semibold">iPhone:</span> Tap Settings → Linked Devices
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Link a Device</p>
                        <p className="text-sm text-blue-700 mt-1">Tap "Link a Device" button</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        4
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-blue-900 font-medium">Scan this QR code</p>
                        <p className="text-sm text-blue-700 mt-1">Point your camera at the QR code above</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                    Alternative: Already using WhatsApp Web?
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    If you have WhatsApp Web already set up, you can connect there too:
                  </p>
                  <a
                    href="https://web.whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Open WhatsApp Web
                    <span>→</span>
                  </a>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Waiting for connection...</span>
                </div>
              </div>
            )}

            {!loading && !error && status && !status.linked && !status.qrDataUrl && status.message && (
              <div className="text-center py-8">
                <p className="text-gray-600">{status.message}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    fetchQR();
                  }}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700"
                >
                  Refresh QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
