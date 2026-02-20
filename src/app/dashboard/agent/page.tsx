'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentFile {
  filename: string;
  description: string;
  content: string;
  lastModified: string | null;
  exists: boolean;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
  id: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { filename: string; label: string; emoji: string }[] = [
  { filename: 'SOUL.md',     label: 'Soul',     emoji: '🧬' },
  { filename: 'AGENTS.md',   label: 'Agents',   emoji: '🛠️' },
  { filename: 'USER.md',     label: 'User',     emoji: '👤' },
  { filename: 'IDENTITY.md', label: 'Identity', emoji: '✨' },
  { filename: 'MEMORY.md',   label: 'Memory',   emoji: '🧠' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
        ${toast.type === 'success'
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-red-50 text-red-800 border border-red-200'
        }`}
    >
      <span>{toast.type === 'success' ? '✓' : '✕'}</span>
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">×</button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const [files, setFiles] = useState<Record<string, AgentFile>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [resetting, setResetting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState(TABS[0].filename);
  const [loading, setLoading] = useState(true);
  const [containerReady, setContainerReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastCounter = useRef(0);

  // ── Load files ─────────────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/files');
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load files');
      setContainerReady(json.data.containerReady);
      const fileMap: Record<string, AgentFile> = {};
      const editMap: Record<string, string> = {};
      for (const f of json.data.files as AgentFile[]) {
        fileMap[f.filename] = f;
        editMap[f.filename] = f.content;
      }
      setFiles(fileMap);
      setEdits(editMap);
    } catch (err) {
      showToast((err as Error).message || 'Failed to load agent files', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toastCounter.current += 1;
    setToast({ message, type, id: toastCounter.current });
  };

  // ── Tab switch with unsaved-changes guard ──────────────────────────────────

  const handleTabSwitch = (newTab: string) => {
    const current = files[activeTab];
    const edited = edits[activeTab];
    if (current && edited !== current.content) {
      const confirmed = window.confirm(
        `You have unsaved changes in ${activeTab}.\nDiscard changes and switch tabs?`
      );
      if (!confirmed) return;
      // Revert the current tab's edit
      setEdits(prev => ({ ...prev, [activeTab]: current.content }));
    }
    setActiveTab(newTab);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (filename: string) => {
    setSaving(prev => ({ ...prev, [filename]: true }));
    try {
      const res = await fetch('/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: edits[filename] }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Save failed');
      setFiles(prev => ({
        ...prev,
        [filename]: {
          ...prev[filename],
          content: edits[filename],
          lastModified: json.data.lastModified,
          exists: true,
        },
      }));
      showToast(`${filename} saved successfully`, 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to save', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [filename]: false }));
    }
  };

  // ── Reset to default ───────────────────────────────────────────────────────

  const handleReset = async (filename: string) => {
    const confirmed = window.confirm(
      `Reset ${filename} to default?\nThis will overwrite your current content.`
    );
    if (!confirmed) return;

    setResetting(prev => ({ ...prev, [filename]: true }));
    try {
      const res = await fetch('/api/agent/files/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Reset failed');
      const { content, lastModified } = json.data;
      setFiles(prev => ({
        ...prev,
        [filename]: {
          ...prev[filename],
          content,
          lastModified,
          exists: true,
        },
      }));
      setEdits(prev => ({ ...prev, [filename]: content }));
      showToast(`${filename} reset to default`, 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to reset', 'error');
    } finally {
      setResetting(prev => ({ ...prev, [filename]: false }));
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const activeFile = files[activeTab];
  const activeEdit = edits[activeTab] ?? '';
  const hasUnsaved = activeFile && activeEdit !== activeFile.content;
  const activeTabMeta = TABS.find(t => t.filename === activeTab)!;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* Header */}
      <header className="bg-white border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-lg font-bold" style={{ color: '#0f172a' }}>
              🦞 Clawer.ai
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="hover:text-gray-900 transition-colors" style={{ color: '#94a3b8' }}>Dashboard</Link>
              <Link href="/dashboard/chat" className="hover:text-gray-900 transition-colors" style={{ color: '#94a3b8' }}>Chat</Link>
              <Link href="/dashboard/tasks" className="hover:text-gray-900 transition-colors" style={{ color: '#94a3b8' }}>Tasks</Link>
              <span className="font-semibold" style={{ color: '#2563eb' }}>Agent</span>
              <Link href="/dashboard/settings" className="hover:text-gray-900 transition-colors" style={{ color: '#94a3b8' }}>Settings</Link>
            </nav>
          </div>
          <Link
            href="/dashboard"
            className="text-sm transition-colors hover:text-gray-900"
            style={{ color: '#94a3b8' }}
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>🤖 Agent Configuration</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Edit your agent's personality, memory, and behavior files directly.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="flex gap-2">
              {TABS.map(t => (
                <div key={t.filename} className="h-9 w-20 rounded-lg bg-gray-200" />
              ))}
            </div>
            <div className="h-96 rounded-2xl bg-gray-100" />
          </div>
        )}

        {/* No container */}
        {!loading && !containerReady && (
          <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#e2e8f0' }}>
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0f172a' }}>Set up your agent first</h2>
            <p className="mb-6 text-sm" style={{ color: '#64748b' }}>
              Your agent container isn't provisioned yet. Complete onboarding to get started.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: '#2563eb' }}
            >
              Start Onboarding →
            </Link>
          </div>
        )}

        {/* Editor */}
        {!loading && containerReady && (
          <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: '#e2e8f0' }}>

            {/* Tab bar */}
            <div className="border-b px-4 pt-4 flex gap-1 overflow-x-auto" style={{ borderColor: '#e2e8f0' }}>
              {TABS.map(tab => {
                const isActive = tab.filename === activeTab;
                const fileState = files[tab.filename];
                const edited = edits[tab.filename];
                const isDirty = fileState && edited !== fileState.content;

                return (
                  <button
                    key={tab.filename}
                    onClick={() => handleTabSwitch(tab.filename)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
                    style={{
                      borderBottomColor: isActive ? '#2563eb' : 'transparent',
                      color: isActive ? '#2563eb' : '#64748b',
                      background: isActive ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    {isDirty && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#f59e0b' }}
                        title="Unsaved changes"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Editor body */}
            <div className="p-6">
              {/* File info bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold font-mono" style={{ color: '#0f172a' }}>
                      {activeTabMeta?.emoji} {activeTab}
                    </span>
                    {hasUnsaved && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#fef3c7', color: '#92400e' }}
                      >
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  {activeFile?.description && (
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      {activeFile.description}
                    </p>
                  )}
                  {activeFile?.lastModified && (
                    <p className="text-xs mt-0.5" style={{ color: '#cbd5e1' }}>
                      Last modified: {new Date(activeFile.lastModified).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleReset(activeTab)}
                    disabled={resetting[activeTab]}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                      background: '#ffffff',
                    }}
                  >
                    {resetting[activeTab] ? 'Resetting…' : '↺ Reset to default'}
                  </button>
                  <button
                    onClick={() => handleSave(activeTab)}
                    disabled={saving[activeTab] || !hasUnsaved}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#2563eb' }}
                  >
                    {saving[activeTab] ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={activeEdit}
                onChange={e => setEdits(prev => ({ ...prev, [activeTab]: e.target.value }))}
                rows={22}
                spellCheck={false}
                className="w-full resize-y rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  borderColor: '#e2e8f0',
                  color: '#1e293b',
                  background: '#f8fafc',
                  minHeight: '420px',
                }}
                placeholder={`Start writing ${activeTab} here…`}
              />

              {/* Footer hint */}
              <p className="mt-2 text-xs" style={{ color: '#cbd5e1' }}>
                Changes are only applied to your agent when you click <strong>Save</strong>.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
