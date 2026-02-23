/**
 * Agent Management Page
 * 
 * View all team agents (template + custom), create new agents, manage existing ones.
 * Phase 4: Custom Agent Creation
 */

'use client';

import { useState, useEffect } from 'react';
import { CreateAgentDialog } from '@/components/dashboard/CreateAgentDialog';
import { cn } from '@/lib/utils';

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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const loadAgents = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAgents();
  }, []);
  
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
      } else {
        const data = await response.json();
        alert(`Failed to delete agent: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent');
    }
  };
  
  const templateAgents = agents.filter(a => a.isTemplate);
  const customAgents = agents.filter(a => a.isCustom);
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your AI Team</h1>
        <p className="text-gray-600">
          Manage your {teamName} agents and create custom specialists
        </p>
      </div>
      
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
                onSelect={() => setSelectedAgent(agent)}
                onDelete={() => handleDeleteAgent(agent.id)}
                isDeleteConfirm={deleteConfirm === agent.id}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Template Agents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Team Template Agents</h2>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {templateAgents.length} {templateAgents.length === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      </div>
      
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
    </div>
  );
}

function AgentCard({
  agent,
  onSelect,
  onDelete,
  isDeleteConfirm,
}: {
  agent: Agent;
  onSelect: () => void;
  onDelete?: () => void;
  isDeleteConfirm?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all group cursor-pointer">
      <div onClick={onSelect}>
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
          <div className="text-xs text-gray-500">
            🔧 {agent.skills.length} tool{agent.skills.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {agent.isCustom && onDelete && (
        <div className="mt-4 pt-4 border-t border-gray-100">
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
        </div>
      </div>
    </div>
  );
}
