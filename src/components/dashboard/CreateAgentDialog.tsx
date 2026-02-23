/**
 * CreateAgentDialog Component
 * 
 * Modal/dialog for creating custom AI team members (Phase 4)
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { agentTemplates, getAllTemplates, type AgentTemplate } from '@/lib/agent-templates';

interface CreateAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMOJI_OPTIONS = [
  '💰', '💻', '✍️', '📚', '✈️', '🏥', '🔬', '⚖️', '📊', '👥',
  '🎨', '👨‍🍳', '🎯', '📈', '🛡️', '🎵', '🎬', '📷', '🎮', '🏃',
  '🧠', '🔧', '📞', '💡', '🌟', '🎓', '🏆', '🚀', '💎', '🔑',
  '🤖', '🦾', '🧬', '🔮', '📡', '🛰️', '⚡', '🔥', '💪', '🎪',
];

const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet' },
  { id: 'web_fetch', name: 'Web Fetch', description: 'Fetch webpage content' },
  { id: 'read', name: 'Read Files', description: 'Read files from workspace' },
  { id: 'write', name: 'Write Files', description: 'Write files to workspace' },
  { id: 'edit', name: 'Edit Files', description: 'Edit existing files' },
  { id: 'exec', name: 'Execute Commands', description: 'Run shell commands' },
  { id: 'memory_search', name: 'Memory Search', description: 'Search agent memory' },
  { id: 'message', name: 'Send Messages', description: 'Send external messages' },
];

export function CreateAgentDialog({ isOpen, onClose, onSuccess }: CreateAgentDialogProps) {
  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    emoji: '🤖',
    personality: '',
    description: '',
    triggers: [] as string[],
    quickPrompts: [] as string[],
    skills: ['web_search', 'read', 'write'] as string[],
    canDelegateTo: [] as string[],
    canReceiveFrom: [] as string[],
  });
  
  // Input fields for triggers and quick prompts
  const [triggerInput, setTriggerInput] = useState('');
  const [quickPromptInput, setQuickPromptInput] = useState('');
  
  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      role: template.role,
      emoji: template.emoji,
      personality: template.personality,
      description: template.description,
      triggers: template.triggers || [],
      quickPrompts: template.quickPrompts || [],
      skills: template.skills || ['web_search', 'read', 'write'],
      canDelegateTo: [],
      canReceiveFrom: [],
    });
    setStep('customize');
  };
  
  const handleCustomStart = () => {
    setSelectedTemplate(null);
    setFormData({
      id: '',
      name: '',
      role: '',
      emoji: '🤖',
      personality: '',
      description: '',
      triggers: [],
      quickPrompts: [],
      skills: ['web_search', 'read', 'write'],
      canDelegateTo: [],
      canReceiveFrom: [],
    });
    setStep('customize');
  };
  
  const handleAddTrigger = () => {
    if (triggerInput.trim() && !formData.triggers.includes(triggerInput.trim())) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, triggerInput.trim()],
      }));
      setTriggerInput('');
    }
  };
  
  const handleRemoveTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t !== trigger),
    }));
  };
  
  const handleAddQuickPrompt = () => {
    if (quickPromptInput.trim() && !formData.quickPrompts.includes(quickPromptInput.trim())) {
      setFormData(prev => ({
        ...prev,
        quickPrompts: [...prev.quickPrompts, quickPromptInput.trim()],
      }));
      setQuickPromptInput('');
    }
  };
  
  const handleRemoveQuickPrompt = (prompt: string) => {
    setFormData(prev => ({
      ...prev,
      quickPrompts: prev.quickPrompts.filter(p => p !== prompt),
    }));
  };
  
  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(toolId)
        ? prev.skills.filter(s => s !== toolId)
        : [...prev.skills, toolId],
    }));
  };
  
  const handleSubmit = async () => {
    setError(null);
    
    // Validation
    if (!formData.id || !formData.name || !formData.role) {
      setError('Please fill in all required fields (ID, Name, Role)');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/team/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent');
      }
      
      // Success!
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleClose = () => {
    setStep('template');
    setSelectedTemplate(null);
    setError(null);
    setTriggerInput('');
    setQuickPromptInput('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  const templates = getAllTemplates();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'template' ? 'Create Custom Agent' : `Customize ${formData.name || 'Agent'}`}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          {step === 'template' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose a Starting Point</h3>
                <p className="text-gray-600">Pick a template to customize or start from scratch</p>
              </div>
              
              {/* Start from scratch button */}
              <button
                onClick={handleCustomStart}
                className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl transition-all hover:bg-blue-50/50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">✨</div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Start from Scratch
                    </div>
                    <div className="text-sm text-gray-600">
                      Build a completely custom agent with your own configuration
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Template grid */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Or Choose a Template</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{template.emoji}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {template.name}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{template.role}</div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 'customize' && (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => setStep('template')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to templates
              </button>
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent ID *
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="e.g., finance-advisor"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique identifier (lowercase, no spaces)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Financial Advisor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                        className={cn(
                          'text-2xl p-2 rounded-lg border-2 transition-all',
                          formData.emoji === emoji
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-transparent hover:border-gray-300'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personality Description
                  </label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                    placeholder="e.g., Analytical, data-driven, cautious but opportunistic"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What does this agent specialize in?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Triggers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Triggers (Keywords)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={triggerInput}
                    onChange={(e) => setTriggerInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrigger())}
                    placeholder="e.g., budget, investment, finance"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddTrigger}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.triggers.map(trigger => (
                    <span
                      key={trigger}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {trigger}
                      <button
                        onClick={() => handleRemoveTrigger(trigger)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Quick Prompts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Prompts
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={quickPromptInput}
                    onChange={(e) => setQuickPromptInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQuickPrompt())}
                    placeholder="e.g., Show me my spending this month"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddQuickPrompt}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.quickPrompts.map(prompt => (
                    <div
                      key={prompt}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span>{prompt}</span>
                      <button
                        onClick={() => handleRemoveQuickPrompt(prompt)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tools/Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Tools
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AVAILABLE_TOOLS.map(tool => (
                    <label
                      key={tool.id}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(tool.id)}
                        onChange={() => handleToolToggle(tool.id)}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-sm">{tool.name}</div>
                        <div className="text-xs text-gray-500">{tool.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* SOUL Preview */}
              <div className="border-t pt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    SOUL.md Preview
                  </div>
                  <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                    {`# ${formData.name || '(Name)'} - ${formData.role || '(Role)'}

${formData.emoji} **Custom Agent**

${formData.personality ? `Personality: ${formData.personality}\n` : ''}
${formData.description ? `\n${formData.description}\n` : ''}
${formData.triggers.length > 0 ? `\nTriggers: ${formData.triggers.join(', ')}` : ''}
${formData.skills.length > 0 ? `\nTools: ${formData.skills.join(', ')}` : ''}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {step === 'customize' && (
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating || !formData.id || !formData.name || !formData.role}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <span>{formData.emoji}</span>
                  Create Agent
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
