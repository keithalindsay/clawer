'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface Skill {
  skill_id: string;
  name: string;
  description: string;
  category: string;
  icon_emoji: string;
  version: string;
  author: string;
  enabled: boolean;
}

const CATEGORIES = [
  'All',
  'Development',
  'Productivity',
  'Communication',
  'Research',
  'Creative',
  'Knowledge'
];

export default function SkillsPage() {
  const { user } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      // In production, this would proxy to the user's container
      // For now, we'll use a placeholder
      const res = await fetch('/api/container/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(data.available || []);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      // Fallback to mock data for development
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = async (skillId: string, currentlyEnabled: boolean) => {
    try {
      setUpdatingSkill(skillId);
      
      const action = currentlyEnabled ? 'disable' : 'enable';
      const res = await fetch(`/api/container/skills/${skillId}/${action}`, {
        method: 'POST',
      });

      if (res.ok) {
        // Update local state
        setSkills(skills.map(skill => 
          skill.skill_id === skillId 
            ? { ...skill, enabled: !currentlyEnabled }
            : skill
        ));
      } else {
        alert('Failed to toggle skill. Please try again.');
      }
    } catch (error) {
      console.error('Failed to toggle skill:', error);
      alert('Failed to toggle skill. Please try again.');
    } finally {
      setUpdatingSkill(null);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = selectedCategory === 'All' || 
      skill.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const skillsByCategory = CATEGORIES.slice(1).map(cat => ({
    category: cat,
    skills: skills.filter(s => s.category.toLowerCase() === cat.toLowerCase())
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Library</h1>
          <p className="text-gray-600">
            Extend your agent's capabilities with curated skills
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No skills found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <div
                key={skill.skill_id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{skill.icon_emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                      <p className="text-xs text-gray-500">
                        {skill.category} • v{skill.version}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {skill.description}
                </p>

                {/* Toggle Button */}
                <button
                  onClick={() => toggleSkill(skill.skill_id, skill.enabled)}
                  disabled={updatingSkill === skill.skill_id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    skill.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  } ${
                    updatingSkill === skill.skill_id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {updatingSkill === skill.skill_id
                    ? 'Updating...'
                    : skill.enabled
                    ? '✓ Enabled'
                    : 'Enable'
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Category Overview (when All is selected) */}
        {selectedCategory === 'All' && !searchQuery && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillsByCategory.map(({ category, skills: catSkills }) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                  <p className="text-sm text-gray-600">
                    {catSkills.length} {catSkills.length === 1 ? 'skill' : 'skills'} available
                  </p>
                  <div className="flex gap-2 mt-3">
                    {catSkills.slice(0, 3).map(skill => (
                      <span key={skill.skill_id} className="text-2xl">
                        {skill.icon_emoji}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
