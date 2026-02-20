'use client';

import { useState, useEffect } from 'react';
import { MarkdownViewer } from './MarkdownViewer';
import { CsvViewer } from './CsvViewer';
import type { FileInfo } from './FolderTree';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileContent {
  path: string;
  name: string;
  type: string;
  content: string | null;
  sizeBytes: number;
  modifiedAt: string;
  truncated: boolean;
  truncatedAt?: number;
}

interface ContentViewerProps {
  file: FileInfo | null;
  onDelete: (path: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── JSON viewer (pretty-print, no external dep) ──────────────────────────────

function JsonViewer({ content }: { content: string }) {
  let pretty = content;
  try {
    pretty = JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    // show raw if parse fails
  }
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre">
      {pretty}
    </pre>
  );
}

// ─── Plain text viewer ────────────────────────────────────────────────────────

function TextViewer({ content }: { content: string }) {
  return (
    <pre className="bg-gray-50 text-gray-800 rounded-xl p-4 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre-wrap border border-gray-200">
      {content}
    </pre>
  );
}

// ─── Unsupported type ─────────────────────────────────────────────────────────

function UnsupportedViewer({ file }: { file: FileContent }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">📁</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{file.name}</h3>
      <p className="text-sm text-gray-500 mb-1">
        {formatSize(file.sizeBytes)}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Preview not available for this file type.
        <br />
        Binary or unknown format.
      </p>
    </div>
  );
}

// ─── Content body dispatcher ──────────────────────────────────────────────────

function ContentBody({ fileContent }: { fileContent: FileContent }) {
  const { type, content } = fileContent;

  if (content === null || type === 'unsupported') {
    return <UnsupportedViewer file={fileContent} />;
  }

  switch (type) {
    case 'md':
      return <MarkdownViewer content={content} />;
    case 'csv':
      return <CsvViewer content={content} />;
    case 'json':
      return <JsonViewer content={content} />;
    case 'txt':
    default:
      return <TextViewer content={content} />;
  }
}

// ─── Main ContentViewer ───────────────────────────────────────────────────────

export function ContentViewer({ file, onDelete }: ContentViewerProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load file content whenever selected file changes
  useEffect(() => {
    if (!file) {
      setFileContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setFileContent(null);
    setDeleteConfirm(false);

    fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to load file');
        }
        setFileContent(data.data);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load file');
      })
      .finally(() => setLoading(false));
  }, [file]);

  // Handle delete
  const handleDelete = async () => {
    if (!file) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Delete failed');
      }
      onDelete(file.path);
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  // ── Empty state (no file selected) ─────────────────────────────────────────

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a file to view</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Choose a file from the sidebar to preview its contents.
        </p>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 mt-4">
          <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load file</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => {
            if (!file) return;
            setLoading(true);
            setError(null);
            fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`)
              .then((r) => r.json())
              .then((d) => {
                if (!d.success) throw new Error(d.error?.message || 'Failed');
                setFileContent(d.data);
              })
              .catch((e: Error) => setError(e.message))
              .finally(() => setLoading(false));
          }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!fileContent) return null;

  // ── Main content ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-200 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate" title={fileContent.name}>
            {fileContent.name}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatSize(fileContent.sizeBytes)} · Modified {formatDate(fileContent.modifiedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download button */}
          <a
            href={`/api/files/content?path=${encodeURIComponent(file.path)}&download=true`}
            download={fileContent.name}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </a>

          {/* Delete button */}
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete file"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-600 font-medium">Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Truncation banner */}
      {fileContent.truncated && (
        <div className="mx-6 mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="text-base">⚠️</span>
          <span>
            <strong>Large file ({formatSize(fileContent.sizeBytes)})</strong> — showing first{' '}
            {fileContent.truncatedAt ? formatSize(fileContent.truncatedAt) : '512 KB'}.{' '}
            <a
              href={`/api/files/content?path=${encodeURIComponent(file.path)}&download=true`}
              download={fileContent.name}
              className="underline text-amber-700 hover:text-amber-900"
            >
              Download full file
            </a>
          </span>
        </div>
      )}

      {/* Content body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <ContentBody fileContent={fileContent} />
      </div>
    </div>
  );
}
