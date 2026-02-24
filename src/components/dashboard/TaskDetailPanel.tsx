'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Task } from '@/lib/db/schema/tasks';
import type { TeamMember } from '@/lib/teams';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task | null;
  member?: TeamMember;
  onClose: () => void;
  onExecute?: (id: string) => void;
  onDelete?: (id: string) => void;
  executing?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  backlog: { label: 'Backlog', color: '#6b7280', bg: '#f9fafb' },
  queued: { label: 'Queued', color: '#d97706', bg: '#fffbeb' },
  running: { label: 'Running', color: '#2563eb', bg: '#eff6ff' },
  done: { label: 'Done', color: '#16a34a', bg: '#f0fdf4' },
  failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', bg: '#fee2e2', color: '#dc2626' },
  high: { label: 'High', bg: '#ffedd5', color: '#ea580c' },
  medium: { label: 'Medium', bg: '#dbeafe', color: '#2563eb' },
  low: { label: 'Low', bg: '#f3f4f6', color: '#6b7280' },
};

function formatDateTime(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start: Date | string | null, end: Date | string | null): string | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content text-sm text-gray-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mt-3 mb-1.5">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{children}</h4>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className="block bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs font-mono my-3">
                  {children}
                </code>
              );
            }
            return <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
          },
          pre: ({ children }) => <pre className="my-3">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-gray-200 my-4" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-xs text-gray-600 border-b border-gray-100">{children}</td>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaskDetailPanel({
  task,
  member,
  onClose,
  onExecute,
  onDelete,
  executing = false,
}: TaskDetailPanelProps) {
  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (task) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [task]);

  const statusConfig = task ? STATUS_CONFIG[task.status] || STATUS_CONFIG.backlog : STATUS_CONFIG.backlog;
  const priorityConfig = task ? PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium : PRIORITY_CONFIG.medium;
  const canExecute = task && ['backlog', 'queued', 'failed'].includes(task.status) && !executing;
  const isRunning = task?.status === 'running' || executing;
  const duration = task ? formatDuration(task.startedAt, task.completedAt) : null;

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[90%] md:w-[60%] lg:w-[50%] xl:w-[45%] max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                    {task.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {/* Status */}
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full capitalize flex items-center gap-1.5"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      {task.status === 'running' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      )}
                      {statusConfig.label}
                    </span>

                    {/* Priority */}
                    <span
                      className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
                      style={{ background: priorityConfig.bg, color: priorityConfig.color }}
                    >
                      {priorityConfig.label}
                    </span>

                    {/* Agent */}
                    {member && (
                      <span className="text-xs text-gray-600 flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full">
                        <span>{member.emoji || '🤖'}</span>
                        <span>{member.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close (Esc)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">{formatDateTime(task.createdAt)}</span>
                </div>
                {task.startedAt && (
                  <div>
                    <span className="text-gray-500">Started:</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(task.startedAt)}</span>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(task.completedAt)}</span>
                  </div>
                )}
                {duration && (
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 text-gray-900">{duration}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>
              )}

              {/* Result (done) */}
              {task.status === 'done' && task.result && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Result
                  </h3>
                  <div className="bg-green-50/50 border border-green-100 rounded-lg p-4 overflow-x-auto">
                    <MarkdownContent content={task.result} />
                  </div>
                </div>
              )}

              {/* Error (failed) */}
              {task.status === 'failed' && task.error && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-red-600">✕</span>
                    Error
                  </h3>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700 whitespace-pre-wrap">
                    {task.error}
                  </div>
                </div>
              )}

              {/* Running indicator */}
              {isRunning && (
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Task is running...</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        {member?.emoji} {member?.name || 'Agent'} is working on this task
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state for backlog/queued */}
              {['backlog', 'queued'].includes(task.status) && !task.result && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-sm">
                    {task.status === 'backlog'
                      ? 'This task is in the backlog. Execute it to get results.'
                      : 'This task is queued. Execute it to get results.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this task?')) {
                          onDelete(task.id);
                          onClose();
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors"
                    >
                      Delete task
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Close
                  </button>

                  {canExecute && onExecute && (
                    <button
                      onClick={() => onExecute(task.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                    >
                      {task.status === 'failed' ? '🔄 Retry' : '▶️ Execute'}
                    </button>
                  )}

                  {isRunning && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Running…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
