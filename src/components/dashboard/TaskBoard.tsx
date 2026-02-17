'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import type { Task } from '@/lib/db/schema/tasks';
import type { TeamMember } from '@/lib/teams';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'backlog' | 'queued' | 'running' | 'done' | 'failed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface TaskBoardProps {
  initialTasks: Task[];
  teamMembers: TeamMember[];
  userName?: string;
}

interface AddTaskForm {
  title: string;
  description: string;
  priority: Priority;
  assigned_to: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLUMNS: { id: Status; label: string; color: string; bg: string }[] = [
  { id: 'backlog',  label: 'Backlog',  color: '#6b7280', bg: '#f9fafb' },
  { id: 'queued',   label: 'Queued',   color: '#d97706', bg: '#fffbeb' },
  { id: 'running',  label: 'Running',  color: '#2563eb', bg: '#eff6ff' },
  { id: 'done',     label: 'Done',     color: '#16a34a', bg: '#f0fdf4' },
  { id: 'failed',   label: 'Failed',   color: '#dc2626', bg: '#fef2f2' },
];

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function sortTasks(arr: Task[]): Task[] {
  return [...arr].sort((a, b) => {
    const pa = PRIORITY_ORDER[(a.priority as Priority)] ?? 2;
    const pb = PRIORITY_ORDER[(b.priority as Priority)] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function priorityBadge(priority: string) {
  const map: Record<string, { bg: string; color: string }> = {
    urgent: { bg: '#fee2e2', color: '#dc2626' },
    high:   { bg: '#ffedd5', color: '#ea580c' },
    medium: { bg: '#dbeafe', color: '#2563eb' },
    low:    { bg: '#f3f4f6', color: '#6b7280' },
  };
  const style = map[priority] || map.medium;
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{ background: style.bg, color: style.color }}
    >
      {priority}
    </span>
  );
}

function fmtDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  member,
  onDragStart,
  onRun,
  onDelete,
  onRetry,
  onMove,
}: {
  task: Task;
  member?: TeamMember;
  onDragStart: (id: string) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  onMove: (id: string, status: Status) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const running = task.status === 'running';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing select-none hover:border-gray-300 hover:shadow-sm transition-all"
      style={running ? { borderColor: '#93c5fd', boxShadow: '0 0 0 2px #bfdbfe' } : {}}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.status === 'queued' && (
            <button
              onClick={() => onRun(task.id)}
              title="Execute task"
              className="p-1 rounded hover:bg-blue-50 transition-colors"
            >
              ▶️
            </button>
          )}
          {task.status === 'failed' && (
            <button
              onClick={() => onRetry(task.id)}
              title="Retry task"
              className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {priorityBadge(task.priority)}
        {member && (
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <span>{member.emoji || '🤖'}</span>
            <span>{member.name}</span>
          </span>
        )}
        {running && (
          <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Running
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Result (done) */}
      {task.status === 'done' && task.result && (
        <div className="mt-2">
          <p className={`text-xs text-gray-700 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {task.result}
          </p>
          {task.result.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Error (failed) */}
      {task.status === 'failed' && task.error && (
        <p className="text-xs text-red-600 mt-2 leading-relaxed line-clamp-2">{task.error}</p>
      )}

      {/* Timestamps */}
      <div className="mt-2 text-[10px] text-gray-400 space-y-0.5">
        {task.createdAt && <div>Created {fmtDate(task.createdAt)}</div>}
        {task.completedAt && <div>Completed {fmtDate(task.completedAt)}</div>}
      </div>

      {/* Quick-move buttons (shown on hover via group) */}
      <div className="mt-2 flex gap-1 flex-wrap">
        {(['backlog', 'queued', 'running', 'done', 'failed'] as Status[]).map(s => {
          if (s === task.status) return null;
          const col = COLUMNS.find(c => c.id === s)!;
          return (
            <button
              key={s}
              onClick={() => onMove(task.id, s)}
              className="text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:opacity-80"
              style={{ borderColor: col.color, color: col.color, background: col.bg }}
            >
              → {col.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── AddTaskModal ─────────────────────────────────────────────────────────────

function AddTaskModal({
  teamMembers,
  onClose,
  onCreate,
}: {
  teamMembers: TeamMember[];
  onClose: () => void;
  onCreate: (form: AddTaskForm) => Promise<void>;
}) {
  const [form, setForm] = useState<AddTaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onCreate(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What needs to be done?"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Provide detailed instructions for the agent..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assign to</label>
              <select
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.emoji || '🤖'} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main TaskBoard ───────────────────────────────────────────────────────────

export function TaskBoard({ initialTasks, teamMembers }: TaskBoardProps) {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const dragIdRef = useRef<string | null>(null);

  // ── Drag & Drop ──
  const handleDragStart = useCallback((id: string) => {
    dragIdRef.current = id;
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(async (targetStatus: Status) => {
    const id = dragIdRef.current;
    if (!id) return;
    dragIdRef.current = null;

    const task = taskList.find(t => t.id === id);
    if (!task || task.status === targetStatus) return;

    // Optimistic update
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, status: targetStatus, updatedAt: new Date() } : t));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch {
      // Rollback
      setTaskList(prev => prev.map(t => t.id === id ? task : t));
    }
  }, [taskList]);

  // ── Move task via quick-move buttons ──
  const handleMove = useCallback(async (id: string, status: Status) => {
    const task = taskList.find(t => t.id === id);
    if (!task) return;

    setTaskList(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date() } : t));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      setTaskList(prev => prev.map(t => t.id === id ? task : t));
    }
  }, [taskList]);

  // ── Create task ──
  const handleCreate = useCallback(async (form: AddTaskForm) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create task');
    }
    const { task } = await res.json();
    setTaskList(prev => [task, ...prev]);
  }, []);

  // ── Delete task ──
  const handleDelete = useCallback(async (id: string) => {
    const task = taskList.find(t => t.id === id);
    if (!task) return;
    setTaskList(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch {
      setTaskList(prev => [task, ...prev]);
    }
  }, [taskList]);

  // ── Run task ──
  const handleRun = useCallback(async (id: string) => {
    if (runningIds.has(id)) return;
    setRunningIds(prev => new Set([...prev, id]));
    // Optimistic: mark as running
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, status: 'running' as Status, startedAt: new Date(), updatedAt: new Date() } : t));

    try {
      const res = await fetch(`/api/tasks/${id}/run`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.task) {
        setTaskList(prev => prev.map(t => t.id === id ? data.task : t));
      } else {
        // Mark failed
        setTaskList(prev => prev.map(t =>
          t.id === id ? { ...t, status: 'failed' as Status, error: data.error || 'Execution failed', completedAt: new Date(), updatedAt: new Date() } : t
        ));
      }
    } catch {
      setTaskList(prev => prev.map(t =>
        t.id === id ? { ...t, status: 'failed' as Status, error: 'Network error', completedAt: new Date(), updatedAt: new Date() } : t
      ));
    } finally {
      setRunningIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [runningIds]);

  // ── Retry failed task ──
  const handleRetry = useCallback(async (id: string) => {
    // Move to queued first
    await handleMove(id, 'queued');
  }, [handleMove]);

  // ── Lookup helper ──
  const getMember = (assignedTo: string | null) =>
    assignedTo ? teamMembers.find(m => m.id === assignedTo) : undefined;

  const columnCounts = COLUMNS.reduce<Record<string, number>>((acc, col) => {
    acc[col.id] = taskList.filter(t => t.status === col.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-gray-900">
              🦞 CLAWER
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
              <Link href="/dashboard/tasks" className="text-blue-600 font-medium">Tasks</Link>
              <Link href="/dashboard/chat" className="text-gray-500 hover:text-gray-900">Chat</Link>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {taskList.length} task{taskList.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Task
          </button>
        </div>

        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {COLUMNS.map(col => {
            const colTasks = sortTasks(taskList.filter(t => t.status === col.id));
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-64 flex flex-col rounded-xl border border-gray-200 overflow-hidden"
                style={{ background: col.bg }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column header */}
                <div
                  className="px-4 py-3 flex items-center justify-between border-b border-gray-200"
                  style={{ background: '#ffffff' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold text-gray-900">{col.label}</span>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: col.bg, color: col.color }}
                  >
                    {columnCounts[col.id] || 0}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">
                      {col.id === 'backlog' ? 'Add tasks to get started' : 'No tasks here'}
                    </div>
                  )}
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      member={getMember(task.assignedTo)}
                      onDragStart={handleDragStart}
                      onRun={handleRun}
                      onDelete={handleDelete}
                      onRetry={handleRetry}
                      onMove={handleMove}
                    />
                  ))}

                  {/* Drop zone hint */}
                  <div
                    className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-gray-300 transition-colors"
                    style={{ borderColor: col.color + '40' }}
                  >
                    Drop here
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          teamMembers={teamMembers}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
