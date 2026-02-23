'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Skill {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  enabled: boolean;
}

interface SkillsLibraryProps {
  initialSkills: Skill[];
}

const CATEGORIES = ['All', 'Development', 'Productivity', 'Communication', 'Research', 'Creative', 'Knowledge'];

const CATEGORY_COLORS: Record<string, string> = {
  Development: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Productivity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Communication: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Research: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Creative: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Knowledge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export function SkillsLibrary({ initialSkills }: SkillsLibraryProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter skills based on category and search
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [skills, selectedCategory, searchQuery]);

  const handleToggleSkill = async (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/skills/${skillId}/${skill.enabled ? 'disable' : 'enable'}`, { method: 'POST' });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSkills(prev => prev.map(s => 
        s.id === skillId ? { ...s, enabled: !s.enabled } : s
      ));
      
      setToast({
        message: skill.enabled ? `${skill.name} disabled` : `${skill.name} enabled`,
        type: 'success'
      });
      
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({
        message: 'Failed to update skill. Please try again.',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const enabledCount = skills.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Skills Library</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
                Plugins that give your AI new abilities • {enabledCount} enabled
              </p>
              
              {/* Inline help */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg p-3 max-w-2xl">
                <p className="text-xs text-orange-900 dark:text-orange-200 leading-relaxed">
                  <strong>💡 What are skills?</strong> Skills are like apps for your AI — 
                  they let your assistant search the web, check the weather, manage files, 
                  or connect to other services. Enable the ones you need!
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Category filter bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading && (
          <div className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Updating skills...
          </div>
        )}

        {filteredSkills.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No skills found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'No skills available in this category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map(skill => (
              <SkillCard 
                key={skill.id} 
                skill={skill} 
                onToggle={handleToggleSkill}
                disabled={isLoading}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface SkillCardProps {
  skill: Skill;
  onToggle: (id: string) => void;
  disabled: boolean;
}

function SkillCard({ skill, onToggle, disabled }: SkillCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 
                    hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Icon and name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-4xl flex-shrink-0">{skill.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{skill.name}</h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            CATEGORY_COLORS[skill.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {skill.category}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1 line-clamp-2">
        {skill.description}
      </p>

      {/* Toggle button */}
      <button
        onClick={() => onToggle(skill.id)}
        disabled={disabled}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
          skill.enabled
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        }`}
      >
        {skill.enabled ? '✓ Enabled' : 'Enable'}
      </button>
    </div>
  );
}
