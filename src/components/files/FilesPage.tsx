'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FolderTree } from './FolderTree';
import { ContentViewer } from './ContentViewer';
import type { FileInfo, Folder } from './FolderTree';
// ─── Types ────────────────────────────────────────────────────────────────────

interface FilesData {
  containerReady: boolean;
  totalFiles: number;
  totalSizeBytes: number;
  folders: Folder[];
  rootFiles: FileInfo[];
}

// ─── FilesPage ────────────────────────────────────────────────────────────────

export function FilesPage() {
  const [data, setData] = useState<FilesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  // Mobile: show content pane or file list pane
  const [mobileView, setMobileView] = useState<'list' | 'content'>('list');

  // ── Load file list ──────────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/files');
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load files');
      setData(json.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ── Handle file selection ───────────────────────────────────────────────────

  const handleSelectFile = (file: FileInfo) => {
    setSelectedFile(file);
    setMobileView('content');
  };

  // ── Handle delete (remove from local state) ─────────────────────────────────

  const handleDelete = (deletedPath: string) => {
    setSelectedFile(null);
    setMobileView('list');

    if (!data) return;
    const updatedFolders = data.folders.map((folder) => ({
      ...folder,
      files: folder.files.filter((f) => f.path !== deletedPath),
    }));
    const updatedRootFiles = data.rootFiles.filter((f) => f.path !== deletedPath);
    const deletedFile = [
      ...data.rootFiles,
      ...data.folders.flatMap((f) => f.files),
    ].find((f) => f.path === deletedPath);
    const deletedSize = deletedFile?.sizeBytes ?? 0;

    setData({
      ...data,
      folders: updatedFolders,
      rootFiles: updatedRootFiles,
      totalFiles: Math.max(0, data.totalFiles - 1),
      totalSizeBytes: Math.max(0, data.totalSizeBytes - deletedSize),
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📂 Agent Files</h1>
            <p className="text-sm text-gray-600 mt-1 mb-2">
              Your AI's workspace — browse and edit files your assistant has created
            </p>
            <p className="text-xs text-gray-500">
              When your AI researches topics, writes reports, or saves notes, they appear here automatically.
            </p>
          </div>
          <button
            onClick={loadFiles}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh file list"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Container offline banner */}
        {data && !data.containerReady && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <span className="text-base flex-shrink-0">💤</span>
            <span>
              Your agent is currently offline. Files shown are from your last session.{' '}
              <Link
                href="/dashboard/agent"
                className="underline text-amber-700 hover:text-amber-900 font-medium"
              >
                Restart agent →
              </Link>
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex animate-pulse">
              <div className="w-72 flex-shrink-0 border-r border-gray-100 p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded" />
                ))}
              </div>
              <div className="flex-1 p-6 space-y-3">
                <div className="h-5 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
                <div className="h-4 w-4/5 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load files</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadFiles}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.totalFiles === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your agent hasn&apos;t created any files yet.
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
              Ask your agent to research a topic, write a report, or save notes —
              they&apos;ll appear here automatically.
            </p>
            <Link
              href="/dashboard/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Chat with your agent →
            </Link>
          </div>
        )}

        {/* ── Main two-panel layout (desktop) ──────────────────────────────── */}
        {!loading && !error && data && data.totalFiles > 0 && (
          <>
            {/* Desktop: side-by-side */}
            <div className="hidden md:flex border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ minHeight: '600px' }}>
              {/* Sidebar */}
              <div className="w-72 flex-shrink-0 border-r border-gray-200">
                <FolderTree
                  folders={data.folders}
                  rootFiles={data.rootFiles}
                  selectedPath={selectedFile?.path ?? null}
                  totalFiles={data.totalFiles}
                  totalSizeBytes={data.totalSizeBytes}
                  onSelectFile={handleSelectFile}
                />
              </div>

              {/* Content panel */}
              <div className="flex-1 overflow-hidden">
                <ContentViewer
                  file={selectedFile}
                  onDelete={handleDelete}
                />
              </div>
            </div>

            {/* ── Mobile: switch between list and content ─────────────────── */}
            <div className="md:hidden border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ minHeight: '500px' }}>
              {mobileView === 'list' ? (
                <FolderTree
                  folders={data.folders}
                  rootFiles={data.rootFiles}
                  selectedPath={selectedFile?.path ?? null}
                  totalFiles={data.totalFiles}
                  totalSizeBytes={data.totalSizeBytes}
                  onSelectFile={handleSelectFile}
                />
              ) : (
                <div className="flex flex-col h-full">
                  {/* Back button */}
                  <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
                    <button
                      onClick={() => setMobileView('list')}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Back to files
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ContentViewer
                      file={selectedFile}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
