'use client';

/**
 * API Keys Management Page
 * 
 * Users manage their own API keys (BYOK) for AI model providers.
 * Each provider has a card showing key status, with add/update/remove/test actions.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';

// Provider icons as SVG components
const ProviderIcon = ({ provider }: { provider: string }) => {
  const icons: Record<string, ReactNode> = {
    openai: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
    anthropic: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm1.21 4.579L5.57 13.985h4.418L7.78 8.098z" />
      </svg>
    ),
    google: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm-.001 4.795c1.67 0 3.003.558 4.086 1.487l-1.754 1.754C13.639 7.41 12.9 7.08 12 7.08c-2.28 0-4.13 1.84-4.13 4.11 0 2.27 1.85 4.11 4.13 4.11 1.77 0 2.97-.77 3.47-2.09h-3.47v-2.29h5.89c.07.41.11.83.11 1.28 0 3.81-2.55 6.52-6.01 6.52-3.47 0-6.28-2.81-6.28-6.28s2.81-6.37 6.28-6.37z" />
      </svg>
    ),
    deepseek: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-2.14c-1.72-.45-3-2-3-3.86 0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.86-1.28 3.41-3 3.86v2.14c3.07-.5 5.44-3.04 5.44-6.14A6.16 6.16 0 0 0 12.28 5.2 6.16 6.16 0 0 0 5.56 11.5c0 3.1 2.37 5.64 5.44 6zm1-4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
  };
  return icons[provider] || <div className="w-8 h-8 bg-gray-200 rounded-full" />;
};

// Provider brand colors
const providerColors: Record<string, { bg: string; text: string; border: string }> = {
  openai: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  anthropic: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  google: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  deepseek: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

interface ProviderKeyInfo {
  provider: string;
  name: string;
  description: string;
  keyPrefix: string;
  docsUrl: string;
  configured: boolean;
  id: string | null;
  maskedKey: string | null;
  isValid: boolean | null;
  lastValidated: string | null;
}

function ValidationBadge({ isValid }: { isValid: boolean | null }) {
  if (isValid === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Untested
      </span>
    );
  }
  if (isValid) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Valid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Invalid
    </span>
  );
}

// ─── Key Input Modal ───────────────────────────────────────────
interface KeyModalProps {
  provider: ProviderKeyInfo;
  onClose: () => void;
  onSave: (provider: string, key: string) => Promise<void>;
  onTest: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
}

function KeyModal({ provider, onClose, onSave, onTest }: KeyModalProps) {
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [error, setError] = useState('');

  const handleTest = async () => {
    if (!key.trim()) return;
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const result = await onTest(provider.provider, key.trim());
      setTestResult(result);
    } catch (e: any) {
      setError(e.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(provider.provider, key.trim());
      onClose();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${providerColors[provider.provider]?.bg || 'bg-gray-50'}`}>
              <ProviderIcon provider={provider.provider} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {provider.configured ? 'Update' : 'Add'} {provider.name} Key
              </h2>
              <p className="text-sm text-gray-500">{provider.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={saving}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p>
            Get your API key from{' '}
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-blue-900"
            >
              {provider.name} dashboard →
            </a>
          </p>
          {provider.keyPrefix && (
            <p className="mt-1 text-blue-600">
              Keys typically start with <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">{provider.keyPrefix}</code>
            </p>
          )}
        </div>

        {/* Key Input */}
        <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setTestResult(null);
              setError('');
            }}
            placeholder={`${provider.keyPrefix}...`}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            autoFocus
            disabled={saving}
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mb-4 rounded-xl p-3 text-sm ${
              testResult.valid
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {testResult.valid ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Key is valid! You can save it.
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {testResult.error || 'Key validation failed'}
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleTest}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            disabled={!key.trim() || testing || saving}
          >
            {testing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Testing...
              </span>
            ) : (
              'Test Key'
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            disabled={!key.trim() || saving}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Remove Confirmation Modal ────────────────────────────────
interface RemoveModalProps {
  provider: ProviderKeyInfo;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function RemoveModal({ provider, onClose, onConfirm }: RemoveModalProps) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove API Key</h2>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to remove your <strong>{provider.name}</strong> API key?
          Models from this provider will no longer be available in your container.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
            disabled={removing}
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
            disabled={removing}
          >
            {removing ? 'Removing...' : 'Remove Key'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Card ─────────────────────────────────────────────
interface ProviderCardProps {
  provider: ProviderKeyInfo;
  onAdd: (provider: ProviderKeyInfo) => void;
  onRemove: (provider: ProviderKeyInfo) => void;
}

function ProviderCard({ provider, onAdd, onRemove }: ProviderCardProps) {
  const colors = providerColors[provider.provider] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors.bg}`}>
            <ProviderIcon provider={provider.provider} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            <p className="text-sm text-gray-500">{provider.description}</p>
          </div>
        </div>
        {provider.configured && <ValidationBadge isValid={provider.isValid} />}
      </div>

      {provider.configured ? (
        <>
          {/* Key display */}
          <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-xl font-mono text-sm text-gray-600">
            {provider.maskedKey}
          </div>

          {/* Last validated */}
          {provider.lastValidated && (
            <p className="text-xs text-gray-400 mb-4">
              Last tested: {new Date(provider.lastValidated).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onAdd(provider)}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              Update Key
            </button>
            <button
              onClick={() => onRemove(provider)}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Empty state */}
          <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-400 text-center">
            No key configured
          </div>
          <button
            onClick={() => onAdd(provider)}
            className="w-full px-3 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            Add Key
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [providers, setProviders] = useState<ProviderKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProvider, setEditingProvider] = useState<ProviderKeyInfo | null>(null);
  const [removingProvider, setRemovingProvider] = useState<ProviderKeyInfo | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-keys');
      const json = await res.json();
      if (json.success) {
        setProviders(json.data);
      } else {
        setError(json.error?.message || 'Failed to load API keys');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleSave = async (provider: string, key: string) => {
    const res = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to save key');
    await fetchKeys();
  };

  const handleTest = async (provider: string, key: string) => {
    const res = await fetch('/api/user/api-keys/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Test failed');
    return { valid: json.data.valid, error: json.data.error };
  };

  const handleRemove = async (provider: string) => {
    const res = await fetch('/api/user/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to remove key');
    await fetchKeys();
  };

  const configuredCount = providers.filter((p) => p.configured).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          </div>
          <p className="text-gray-600">
            Add your own API keys to use premium AI models in your container.
            Keys are stored securely and pushed to your container configuration.
          </p>
          {configuredCount > 0 && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              {configuredCount} of {providers.length} providers configured
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid sm:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                </div>
                <div className="h-10 bg-gray-100 rounded-xl mb-4" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-800 mb-3">{error}</p>
            <button
              onClick={() => { setError(''); setLoading(true); fetchKeys(); }}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Provider Cards Grid */}
        {!loading && !error && (
          <div className="grid sm:grid-cols-2 gap-5">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.provider}
                provider={provider}
                onAdd={setEditingProvider}
                onRemove={setRemovingProvider}
              />
            ))}
          </div>
        )}

        {/* Info Box */}
        {!loading && !error && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How it works</h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>• Your API keys are stored securely and never shared</li>
              <li>• Keys are pushed to your container so your AI agent can use them</li>
              <li>• Use "Test Key" to verify your key works before saving</li>
              <li>• You&apos;re billed directly by each provider — we don&apos;t markup costs</li>
            </ul>
          </div>
        )}
      </main>

      {/* Key Input Modal */}
      {editingProvider && (
        <KeyModal
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={handleSave}
          onTest={handleTest}
        />
      )}

      {/* Remove Confirmation Modal */}
      {removingProvider && (
        <RemoveModal
          provider={removingProvider}
          onClose={() => setRemovingProvider(null)}
          onConfirm={async () => {
            await handleRemove(removingProvider.provider);
          }}
        />
      )}
    </div>
  );
}
