'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Task } from '@/lib/db/schema/tasks';
import type { TeamMember } from '@/lib/teams';
import { autoAssignAgent } from '@/lib/agent-matcher';
import { TaskDetailPanel } from './TaskDetailPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'backlog' | 'queued' | 'running' | 'done' | 'failed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'kanban' | 'list';

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

function statusBadge(status: string) {
  const col = COLUMNS.find(c => c.id === status);
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
      style={{ background: col?.bg ?? '#f9fafb', color: col?.color ?? '#6b7280' }}
    >
      {status}
    </span>
  );
}

function fmtDate(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateTime(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Execute button ───────────────────────────────────────────────────────────

function ExecuteButton({
  task,
  onExecute,
  executing,
}: {
  task: Task;
  onExecute: (id: string) => void;
  executing: boolean;
}) {
  const canExecute = ['backlog', 'queued', 'failed'].includes(task.status) && !executing;
  const isRunning = task.status === 'running' || executing;

  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Running…
      </span>
    );
  }

  if (!canExecute) return null;

  const label = task.status === 'failed' ? 'Retry' : 'Execute';
  const emoji = task.status === 'failed' ? '🔄' : '▶️';

  return (
    <button
      onClick={() => onExecute(task.id)}
      title={`${label}: send to agent`}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
    >
      {emoji} {label}
    </button>
  );
}

// ─── TaskCard (Kanban) - Compact version ──────────────────────────────────────

function TaskCard({
  task,
  member,
  onDragStart,
  onClick,
  executing,
}: {
  task: Task;
  member?: TeamMember;
  onDragStart: (id: string) => void;
  onClick: () => void;
  executing: boolean;
}) {
  const running = task.status === 'running' || executing;
  const isDone = task.status === 'done';
  const isFailed = task.status === 'failed';
  
  // Truncate title to ~60 chars
  const truncatedTitle = task.title.length > 60 
    ? task.title.slice(0, 57) + '…' 
    : task.title;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(task.id);
      }}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer select-none hover:border-gray-300 hover:shadow-md transition-all group"
      style={running ? { borderColor: '#93c5fd', boxShadow: '0 0 0 2px #bfdbfe' } : {}}
    >
      {/* Top row: Priority + Status indicator */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {priorityBadge(task.priority)}
        
        {/* Status indicator */}
        {running && (
          <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Running
          </span>
        )}
        {isDone && (
          <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
            <span className="text-green-500">✓</span>
            Done
          </span>
        )}
        {isFailed && (
          <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
            <span className="text-red-500">✕</span>
            Failed
          </span>
        )}
      </div>

      {/* Agent row */}
      <div className="flex items-center gap-1.5 mb-2 text-[11px] text-gray-600">
        <span className="text-base">{member?.emoji || '🤖'}</span>
        <span className="truncate">{member?.name || 'Unassigned'}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 leading-snug mb-2">
        {truncatedTitle}
      </p>

      {/* Result preview (done tasks only) */}
      {isDone && task.result && (
        <div className="bg-green-50 rounded px-2 py-1.5 mb-2">
          <p className="text-[11px] text-green-700 line-clamp-2 leading-relaxed">
            {task.result.slice(0, 100)}{task.result.length > 100 ? '…' : ''}
          </p>
        </div>
      )}

      {/* Error preview (failed tasks only) */}
      {isFailed && task.error && (
        <div className="bg-red-50 rounded px-2 py-1.5 mb-2">
          <p className="text-[11px] text-red-600 line-clamp-1 leading-relaxed">
            {task.error.slice(0, 80)}{task.error.length > 80 ? '…' : ''}
          </p>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-[10px] text-gray-400">
        {task.completedAt ? (
          <span>Completed {fmtDateTime(task.completedAt)}</span>
        ) : (
          <span>Created {fmtDateTime(task.createdAt)}</span>
        )}
      </div>

      {/* Hover hint */}
      <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-gray-400">Click to view details →</span>
      </div>
    </div>
  );
}

// ─── List View Row ────────────────────────────────────────────────────────────

function ListRow({
  task,
  member,
  teamMembers,
  onExecute,
  onDelete,
  onMove,
  onAssignAgent,
  onClick,
  executing,
}: {
  task: Task;
  member?: TeamMember;
  teamMembers: TeamMember[];
  onExecute: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  onAssignAgent: (id: string, agentId: string) => void;
  onClick: () => void;
  executing: boolean;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={onClick}>
      {/* Task title + description */}
      <td className="px-4 py-3 max-w-xs">
        <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
        {task.description && (
          <div className="text-xs text-gray-400 truncate mt-0.5">{task.description}</div>
        )}
      </td>

      {/* Agent */}
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block">
          <button
            onClick={() => setShowAgentMenu(v => !v)}
            className="text-sm text-gray-700 flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded transition-colors border border-transparent hover:border-gray-200"
            title={member ? 'Change agent' : 'Assign agent'}
          >
            <span>{member?.emoji || '🤖'}</span>
            <span>{member ? member.name : 'Auto-assign'}</span>
            <span className="text-[10px] opacity-50 ml-0.5">▼</span>
          </button>
          
          {showAgentMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAgentMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                  Assign to:
                </div>
                {teamMembers.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onAssignAgent(task.id, agent.id);
                      setShowAgentMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                      member?.id === agent.id ? 'bg-orange-50 text-orange-700 font-medium' : ''
                    }`}
                  >
                    <span>{agent.emoji || '🤖'}</span>
                    <span>{agent.name}</span>
                    {member?.id === agent.id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>

      {/* Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        {priorityBadge(task.priority)}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block">
          <button
            onClick={() => setShowMoveMenu(v => !v)}
            title="Change status"
            className="focus:outline-none"
          >
            {statusBadge(task.status)}
          </button>
          {showMoveMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMoveMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-md py-1 min-w-[120px]">
                {(['backlog', 'queued', 'running', 'done', 'failed'] as Status[]).map(s => {
                  if (s === task.status) return null;
                  const col = COLUMNS.find(c => c.id === s)!;
                  return (
                    <button
                      key={s}
                      onClick={() => { onMove(task.id, s); setShowMoveMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 capitalize"
                      style={{ color: col.color }}
                    >
                      → {col.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </td>

      {/* Created */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
        {fmtDate(task.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <ExecuteButton task={task} onExecute={onExecute} executing={executing} />
          <button
            onClick={() => onDelete(task.id)}
            title="Delete"
            className="text-gray-300 hover:text-red-500 transition-colors text-sm px-1.5 opacity-0 group-hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
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
  const [suggestedAgent, setSuggestedAgent] = useState<TeamMember | null>(null);

  // Auto-suggest agent based on title + description
  const updateSuggestion = (title: string, description: string) => {
    if (!title.trim() && !description.trim()) {
      setSuggestedAgent(null);
      return;
    }
    
    const suggestedId = autoAssignAgent(title, description, teamMembers);
    const agent = teamMembers.find(m => m.id === suggestedId);
    setSuggestedAgent(agent || null);
  };

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
              onChange={e => {
                const newTitle = e.target.value;
                setForm(f => ({ ...f, title: newTitle }));
                updateSuggestion(newTitle, form.description);
              }}
              placeholder="What needs to be done?"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Instructions for agent
            </label>
            <textarea
              value={form.description}
              onChange={e => {
                const newDesc = e.target.value;
                setForm(f => ({ ...f, description: newDesc }));
                updateSuggestion(form.title, newDesc);
              }}
              placeholder="Describe what the agent should do in detail..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Suggested agent */}
          {suggestedAgent && !form.assigned_to && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-600">💡</span>
                <span className="text-gray-700">
                  Suggested: <strong>{suggestedAgent.emoji || '🤖'} {suggestedAgent.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, assigned_to: suggestedAgent.id }))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-100 rounded transition-colors"
              >
                Use →
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-full transition-colors disabled:opacity-50"
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
  const [executingIds, setExecutingIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const dragIdRef = useRef<string | null>(null);

  // Keep selected task in sync with latest data
  useEffect(() => {
    if (selectedTask) {
      const updated = taskList.find(t => t.id === selectedTask.id);
      if (updated && updated !== selectedTask) {
        setSelectedTask(updated);
      } else if (!updated) {
        setSelectedTask(null);
      }
    }
  }, [taskList, selectedTask]);

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
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, status: targetStatus, updatedAt: new Date() } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch {
      setTaskList(prev => prev.map(t => t.id === id ? task : t));
    }
  }, [taskList]);

  // ── Move task ──
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

  // ── Assign agent ──
  const handleAssignAgent = useCallback(async (id: string, agentId: string) => {
    const task = taskList.find(t => t.id === id);
    if (!task) return;
    const oldAgent = task.assignedTo;
    
    // Optimistic update
    setTaskList(prev => prev.map(t => (t.id === id ? { ...t, assignedTo: agentId, updatedAt: new Date() } : t)));
    
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: agentId }),
      });
    } catch {
      // Revert on error
      setTaskList(prev => prev.map(t => (t.id === id ? { ...t, assignedTo: oldAgent } : t)));
    }
  }, [taskList]);

  // ── Execute task → /api/tasks/execute ──
  const handleExecute = useCallback(async (id: string) => {
    if (executingIds.has(id)) return;

    const task = taskList.find(t => t.id === id);
    if (!task) return;

    // Auto-assign agent if not assigned
    let assignedAgentId = task.assignedTo;
    if (!assignedAgentId) {
      // Find best match based on task content
      assignedAgentId = autoAssignAgent(
        task.title,
        task.description,
        teamMembers,
        teamMembers.find(m => m.id === 'executive-assistant' || m.id === 'chief-of-staff')?.id
      );

      if (!assignedAgentId) {
        alert('No agents available to execute this task.');
        return;
      }

      // Update task with assigned agent
      try {
        await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: assignedAgentId }),
        });

        // Update local state
        setTaskList(prev =>
          prev.map(t => (t.id === id ? { ...t, assignedTo: assignedAgentId } : t))
        );

        // Show which agent was assigned
        const assignedAgent = teamMembers.find(m => m.id === assignedAgentId);
        if (assignedAgent) {
          // Brief notification (you can replace with a toast if you have one)
          const notification = document.createElement('div');
          notification.textContent = `✓ Assigned to ${assignedAgent.emoji || '🤖'} ${assignedAgent.name}`;
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          `;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      } catch (error) {
        console.error('Failed to assign agent:', error);
        alert('Failed to assign agent. Please try again.');
        return;
      }
    }

    setExecutingIds(prev => new Set([...prev, id]));
    // Optimistic: mark running
    setTaskList(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: 'running' as Status, startedAt: new Date(), updatedAt: new Date() }
          : t
      )
    );

    try {
      const res = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
      const data = await res.json();

      if (res.ok && data.task) {
        setTaskList(prev => prev.map(t => t.id === id ? data.task : t));
      } else {
        setTaskList(prev =>
          prev.map(t =>
            t.id === id
              ? {
                  ...t,
                  status: 'failed' as Status,
                  error: data.error || 'Execution failed',
                  completedAt: new Date(),
                  updatedAt: new Date(),
                }
              : t
          )
        );
      }
    } catch {
      setTaskList(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                status: 'failed' as Status,
                error: 'Network error — try again',
                completedAt: new Date(),
                updatedAt: new Date(),
              }
            : t
        )
      );
    } finally {
      setExecutingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [executingIds, taskList]);

  const getMember = (assignedTo: string | null) =>
    assignedTo ? teamMembers.find(m => m.id === assignedTo) : undefined;

  const sortedAll = sortTasks(taskList);

  const columnCounts = COLUMNS.reduce<Record<string, number>>((acc, col) => {
    acc[col.id] = taskList.filter(t => t.status === col.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
            <p className="text-sm text-gray-600 mt-1 mb-1">
              Organize and delegate work to your AI agents
            </p>
            <p className="text-xs text-gray-500">
              {taskList.length} task{taskList.length !== 1 ? 's' : ''} total
              {executingIds.size > 0 && (
                <span className="ml-2 text-blue-600">
                  · {executingIds.size} executing…
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-1.5 transition-colors ${
                  view === 'kanban'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Kanban view"
              >
                ▦ Kanban
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${
                  view === 'list'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="List view"
              >
                ≡ List
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
            >
              <span className="text-base leading-none">+</span>
              Add Task
            </button>
          </div>
        </div>

        {/* ── Kanban View ─────────────────────────────────────────────── */}
        {view === 'kanban' && (
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
                    className="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-white"
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
                        {col.id === 'backlog' 
                          ? 'Create tasks to delegate work to your AI agents' 
                          : 'No tasks here'}
                      </div>
                    )}
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        member={getMember(task.assignedTo)}
                        onDragStart={handleDragStart}
                        onClick={() => setSelectedTask(task)}
                        executing={executingIds.has(task.id)}
                      />
                    ))}
                    {/* Drop zone hint */}
                    <div
                      className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-gray-300"
                      style={{ borderColor: col.color + '40' }}
                    >
                      Drop here
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── List View ───────────────────────────────────────────────── */}
        {view === 'list' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {sortedAll.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-lg font-semibold text-gray-700 mb-2">No tasks yet</p>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-1 leading-relaxed">
                  Tasks let you organize and track work for your AI agents. Assign tasks to specific 
                  team members and watch them get completed automatically.
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  Think of it as a to-do list that your AI can actually <em>do</em>.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
                >
                  + Create Your First Task
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAll.map(task => (
                      <ListRow
                        key={task.id}
                        task={task}
                        member={getMember(task.assignedTo)}
                        teamMembers={teamMembers}
                        onExecute={handleExecute}
                        onDelete={handleDelete}
                        onMove={handleMove}
                        onAssignAgent={handleAssignAgent}
                        onClick={() => setSelectedTask(task)}
                        executing={executingIds.has(task.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          teamMembers={teamMembers}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        member={selectedTask ? getMember(selectedTask.assignedTo) : undefined}
        onClose={() => setSelectedTask(null)}
        onExecute={(id) => {
          handleExecute(id);
          // Keep panel open to show running state
        }}
        onDelete={(id) => {
          handleDelete(id);
          setSelectedTask(null);
        }}
        executing={selectedTask ? executingIds.has(selectedTask.id) : false}
      />
    </div>
  );
}
