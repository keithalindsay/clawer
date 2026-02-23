/**
 * Agent Management Page
 * 
 * Unified agent management: 
 * - Agent cards grid (Life OS + custom agents) with chat and configure buttons
 * - Advanced file editor section for workspace files (collapsible)
 * 
 * Merged from /dashboard/agents and /dashboard/agent
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CreateAgentDialog } from '@/components/dashboard/CreateAgentDialog';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  description: string;
  triggers?: string[];
  quickPrompts?: string[];
  skills?: string[];
  isCustom: boolean;
  isTemplate: boolean;
  dbId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

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

const FILE_TABS: { filename: string; label: string; emoji: string }[] = [
  { filename: 'SOUL.md',     label: 'Soul',     emoji: '🧬' },
  { filename: 'AGENTS.md',   label: 'Agents',   emoji: '🛠️' },
  { filename: 'USER.md',     label: 'User',     emoji: '👤' },
  { filename: 'IDENTITY.md', label: 'Identity', emoji: '✨' },
  { filename: 'MEMORY.md',   label: 'Memory',   emoji: '🧠' },
];

// ─── Toast Component ──────────────────────────────────────────────────────────

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

// ─── Agent Card Component ─────────────────────────────────────────────────────

function AgentCard({
  agent,
  onConfigure,
  onDelete,
  isDeleteConfirm,
}: {
  agent: Agent;
  onConfigure: () => void;
  onDelete?: () => void;
  isDeleteConfirm?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl">{agent.emoji}</div>
        {agent.isCustom && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Custom
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{agent.role}</p>
      
      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
        {agent.description}
      </p>
      
      {agent.triggers && agent.triggers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {agent.triggers.slice(0, 3).map(trigger => (
            <span
              key={trigger}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {trigger}
            </span>
          ))}
          {agent.triggers.length > 3 && (
            <span className="px-2 py-0.5 text-gray-400 text-xs">
              +{agent.triggers.length - 3} more
            </span>
          )}
        </div>
      )}
      
      {agent.skills && agent.skills.length > 0 && (
        <div className="text-xs text-gray-500 mb-4">
          🔧 {agent.skills.length} tool{agent.skills.length !== 1 ? 's' : ''}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <Link
          href={`/dashboard/chat?agent=${agent.id}`}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors text-center"
        >
          💬 Chat
        </Link>
        <button
          onClick={onConfigure}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          ⚙️ Configure
        </button>
      </div>
      
      {/* Delete button for custom agents */}
      {agent.isCustom && onDelete && (
        <div className="mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isDeleteConfirm
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
            )}
          >
            {isDeleteConfirm ? 'Click again to confirm' : 'Delete Agent'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Agent Details Sidebar ────────────────────────────────────────────────────

function AgentDetailsSidebar({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Agent Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="text-6xl mb-3">{agent.emoji}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{agent.name}</h3>
            <p className="text-gray-600 mb-2">{agent.role}</p>
            {agent.isCustom && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Custom Agent
              </span>
            )}
          </div>
          
          {/* Description */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 text-sm">{agent.description}</p>
          </div>
          
          {/* Triggers */}
          {agent.triggers && agent.triggers.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Triggers</h4>
              <div className="flex flex-wrap gap-2">
                {agent.triggers.map(trigger => (
                  <span
                    key={trigger}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Prompts */}
          {agent.quickPrompts && agent.quickPrompts.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Quick Prompts</h4>
              <div className="space-y-2">
                {agent.quickPrompts.map(prompt => (
                  <div
                    key={prompt}
                    className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    "{prompt}"
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Skills */}
          {agent.skills && agent.skills.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Available Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                {agent.skills.map(skill => (
                  <div
                    key={skill}
                    className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 font-mono"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Metadata */}
          {agent.isCustom && agent.createdAt && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Created: {new Date(agent.createdAt).toLocaleDateString()}</div>
                {agent.updatedAt && (
                  <div>Updated: {new Date(agent.updatedAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Chat button */}
          <Link
            href={`/dashboard/chat?agent=${agent.id}`}
            className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600 transition-colors"
          >
            💬 Start Chat with {agent.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  // Agent management state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // File editor state
  const [files, setFiles] = useState<Record<string, AgentFile>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [resetting, setResetting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState(FILE_TABS[0].filename);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [containerReady, setContainerReady] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastCounter = useRef(0);

  // ── Load agents ────────────────────────────────────────────────────────────

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const response = await fetch('/api/team/agents');
      const data = await response.json();
      
      if (response.ok) {
        setAgents(data.agents || []);
        setTeamName(data.teamName || 'AI Team');
      } else {
        console.error('Failed to load agents:', data.error);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  // ── Load files ─────────────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
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
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
    loadFiles();
  }, [loadAgents, loadFiles]);

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toastCounter.current += 1;
    setToast({ message, type, id: toastCounter.current });
  };

  // ── Delete agent ───────────────────────────────────────────────────────────

  const handleDeleteAgent = async (agentId: string) => {
    if (deleteConfirm !== agentId) {
      setDeleteConfirm(agentId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    
    try {
      const response = await fetch(`/api/team/agents?agentId=${agentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadAgents();
        setDeleteConfirm(null);
        showToast('Agent deleted successfully', 'success');
      } else {
        const data = await response.json();
        showToast(`Failed to delete agent: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      showToast('Failed to delete agent', 'error');
    }
  };

  // ── File editor: Tab switch with unsaved-changes guard ────────────────────

  const handleTabSwitch = (newTab: string) => {
    const current = files[activeTab];
    const edited = edits[activeTab];
    if (current && edited !== current.content) {
      const confirmed = window.confirm(
        `You have unsaved changes in ${activeTab}.\nDiscard changes and switch tabs?`
      );
      if (!confirmed) return;
      setEdits(prev => ({ ...prev, [activeTab]: current.content }));
    }
    setActiveTab(newTab);
  };

  // ── File editor: Save ──────────────────────────────────────────────────────

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

  // ── File editor: Reset to default ──────────────────────────────────────────

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
  const activeTabMeta = FILE_TABS.find(t => t.filename === activeTab)!;

  const templateAgents = agents.filter(a => a.isTemplate);
  const customAgents = agents.filter(a => a.isCustom);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Your AI Team</h1>
          <p className="text-gray-600 mb-3">
            Configure your AI's personality, behavior, and identity
          </p>
          
          {/* Help banner */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-green-900">
                <span className="text-base">ℹ️</span>
                <span>What can I do here?</span>
                <span className="ml-auto text-green-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 text-sm text-green-800 space-y-2 pl-6">
                <p>
                  <strong>Agent management:</strong> Create specialized team members with custom 
                  skills and personalities, or use pre-configured agents from your {teamName} template.
                </p>
                <p className="text-green-700">
                  <strong>Advanced configuration:</strong> For power users, you can manually edit 
                  your AI's core files (SOUL.md, AGENTS.md, etc.) to fine-tune behavior.
                </p>
                <p className="text-green-700">
                  💡 <strong>Most users don't need to touch the advanced section</strong> — the defaults work great!
                </p>
              </div>
            </details>
          </div>
        </div>

        {/* Loading skeleton for agents */}
        {loadingAgents && (
          <div className="animate-pulse space-y-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Agent cards */}
        {!loadingAgents && (
          <>
            {/* Create Agent Card */}
            <div className="mb-8">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="w-full p-8 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl transition-all hover:bg-blue-50/50 group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="text-6xl">✨</div>
                  <div className="text-center">
                    <div className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 mb-1">
                      Create Custom Agent
                    </div>
                    <div className="text-gray-600">
                      Build a specialized team member with custom skills and personality
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Custom Agents Section */}
            {customAgents.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Custom Agents</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {customAgents.length} {customAgents.length === 1 ? 'agent' : 'agents'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customAgents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onConfigure={() => setSelectedAgent(agent)}
                      onDelete={() => handleDeleteAgent(agent.id)}
                      isDeleteConfirm={deleteConfirm === agent.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Life OS / Template Agents Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{teamName} Agents</h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {templateAgents.length} {templateAgents.length === 1 ? 'agent' : 'agents'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templateAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onConfigure={() => setSelectedAgent(agent)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Advanced Configuration Section (Collapsible File Editors) */}
        {!loadingFiles && containerReady && (
          <div className="bg-white rounded-2xl border shadow-sm mb-8" style={{ borderColor: '#e2e8f0' }}>
            {/* Collapsible header */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">
                  🛠️ Advanced: Edit Agent Workspace Files
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manually edit SOUL.md, AGENTS.md, and other configuration files (for power users)
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* File editors (expanded) */}
            {showAdvanced && (
              <div className="border-t" style={{ borderColor: '#e2e8f0' }}>
                {/* Tab bar */}
                <div className="border-b px-4 pt-4 flex gap-1 overflow-x-auto" style={{ borderColor: '#e2e8f0' }}>
                  {FILE_TABS.map(tab => {
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
          </div>
        )}

        {/* No container message */}
        {!loadingFiles && !containerReady && (
          <div className="bg-white rounded-2xl border p-12 text-center mb-8" style={{ borderColor: '#e2e8f0' }}>
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

        {/* Agent Details Sidebar */}
        {selectedAgent && (
          <AgentDetailsSidebar
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
          />
        )}

        {/* Create Agent Dialog */}
        <CreateAgentDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadAgents();
          }}
        />

        {/* Toast */}
        {toast && (
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}
