'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardHeaderProps {
  userName?: string;
  stats: {
    totalAgents: number;
    activeAgents: number;
    messagesToday: number;
  };
  onNewEmployee?: () => void;
}

export function DashboardHeader({ userName, stats, onNewEmployee }: DashboardHeaderProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState('Hello');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  // Keyboard shortcut handler for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchFocused(true);
        document.getElementById('dashboard-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewEmployee = () => {
    if (onNewEmployee) {
      onNewEmployee();
    } else {
      router.push('/dashboard/employees/new');
    }
  };

  return (
    <div className="mb-8">
      {/* Title and greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#e0e1e3] tracking-tight mb-2">
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-[#9ca0a8] text-base sm:text-lg">
          Manage your AI employees and monitor their performance
        </p>
      </motion.div>

      {/* Quick stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        {/* Total Agents */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👥</span>
            <p className="text-xs text-[#565960] uppercase tracking-wide">Total</p>
          </div>
          <p className="text-2xl font-bold text-[#e0e1e3]">{stats.totalAgents}</p>
          <p className="text-xs text-[#9ca0a8] mt-1">
            {stats.totalAgents === 1 ? 'employee' : 'employees'}
          </p>
        </div>

        {/* Active Agents */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <motion.span 
              className="text-xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💚
            </motion.span>
            <p className="text-xs text-[#565960] uppercase tracking-wide">Active</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.activeAgents}</p>
          <p className="text-xs text-[#9ca0a8] mt-1">online now</p>
        </div>

        {/* Messages Today */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">💬</span>
            <p className="text-xs text-[#565960] uppercase tracking-wide">Today</p>
          </div>
          <p className="text-2xl font-bold text-[#e0e1e3]">{stats.messagesToday}</p>
          <p className="text-xs text-[#9ca0a8] mt-1">messages</p>
        </div>
      </motion.div>

      {/* Search bar and New Employee button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search bar */}
        <div className="flex-1 relative">
          <div className={`
            relative flex items-center
            bg-white/[0.02] border rounded-xl
            transition-all duration-200
            ${searchFocused 
              ? 'border-blue-500/50 bg-white/[0.04]' 
              : 'border-white/[0.06]'
            }
          `}>
            <svg 
              className="absolute left-4 w-5 h-5 text-[#565960]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            
            <input
              id="dashboard-search"
              type="text"
              placeholder="Search employees..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-transparent border-none outline-none pl-12 pr-20 py-3 text-[#e0e1e3] placeholder-[#565960]"
            />
            
            {/* Keyboard shortcut hint */}
            <div className="absolute right-4 flex items-center gap-1 text-xs text-[#565960]">
              <kbd className="px-2 py-1 bg-white/[0.05] border border-white/[0.06] rounded font-mono">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* New Employee button */}
        <motion.button
          onClick={handleNewEmployee}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold overflow-hidden group shadow-lg shadow-blue-500/25"
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
          
          <span className="relative flex items-center gap-2 whitespace-nowrap">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            <span className="hidden sm:inline">New Employee</span>
            <span className="sm:hidden">New</span>
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
