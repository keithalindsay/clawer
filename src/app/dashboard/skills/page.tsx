'use client';

import { SkillsLibrary } from '@/components/dashboard/SkillsLibrary';

// Hardcoded skills data until container API is ready
const INITIAL_SKILLS = [
  {
    id: 'web-search',
    name: 'Web Search',
    emoji: '🔍',
    category: 'Research',
    description: 'Search the web for real-time information and answers',
    enabled: true,
  },
  {
    id: 'code-execution',
    name: 'Code Execution',
    emoji: '💻',
    category: 'Development',
    description: 'Execute code snippets and scripts in various languages',
    enabled: true,
  },
  {
    id: 'file-operations',
    name: 'File Operations',
    emoji: '📁',
    category: 'Productivity',
    description: 'Read, write, and manage files in your workspace',
    enabled: true,
  },
  {
    id: 'image-analysis',
    name: 'Image Analysis',
    emoji: '🖼️',
    category: 'Creative',
    description: 'Analyze and understand images with AI vision',
    enabled: false,
  },
  {
    id: 'data-visualization',
    name: 'Data Visualization',
    emoji: '📊',
    category: 'Productivity',
    description: 'Create charts and visualizations from data',
    enabled: false,
  },
  {
    id: 'email-integration',
    name: 'Email Integration',
    emoji: '📧',
    category: 'Communication',
    description: 'Send and manage emails on your behalf',
    enabled: false,
  },
  {
    id: 'calendar-sync',
    name: 'Calendar Sync',
    emoji: '📅',
    category: 'Productivity',
    description: 'Manage your calendar and schedule meetings',
    enabled: false,
  },
  {
    id: 'document-generation',
    name: 'Document Generation',
    emoji: '📝',
    category: 'Productivity',
    description: 'Create professional documents and reports',
    enabled: true,
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    emoji: '🔌',
    category: 'Development',
    description: 'Connect to external APIs and services',
    enabled: false,
  },
  {
    id: 'text-to-speech',
    name: 'Text to Speech',
    emoji: '🔊',
    category: 'Communication',
    description: 'Convert text to natural-sounding speech',
    enabled: false,
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    emoji: '🧠',
    category: 'Knowledge',
    description: 'Store and retrieve information from your knowledge base',
    enabled: true,
  },
  {
    id: 'translation',
    name: 'Translation',
    emoji: '🌐',
    category: 'Communication',
    description: 'Translate text between multiple languages',
    enabled: false,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    emoji: '👀',
    category: 'Development',
    description: 'Review code for bugs, style, and best practices',
    enabled: false,
  },
  {
    id: 'browser-automation',
    name: 'Browser Automation',
    emoji: '🌐',
    category: 'Productivity',
    description: 'Automate web browsing and data extraction',
    enabled: false,
  },
  {
    id: 'task-scheduling',
    name: 'Task Scheduling',
    emoji: '⏰',
    category: 'Productivity',
    description: 'Schedule and automate recurring tasks',
    enabled: false,
  },
];

export default function SkillsPage() {
  return <SkillsLibrary initialSkills={INITIAL_SKILLS} />;
}
