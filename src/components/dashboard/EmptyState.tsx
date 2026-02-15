'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface EmptyStateProps {
  onCreateEmployee?: () => void;
}

export function EmptyState({ onCreateEmployee }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      {/* Animated illustration */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="mb-8"
      >
        <div className="relative">
          {/* Main robot icon */}
          <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="text-6xl sm:text-8xl"
            >
              🤖
            </motion.div>
          </div>
          
          {/* Floating sparkles */}
          <motion.div
            animate={{ 
              y: [-5, 5, -5],
              x: [-5, 5, -5],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="absolute -top-2 -right-2 text-2xl"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ 
              y: [5, -5, 5],
              x: [5, -5, 5],
            }}
            transition={{ 
              duration: 3.5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0.7,
            }}
            className="absolute -bottom-2 -left-2 text-2xl"
          >
            💡
          </motion.div>
        </div>
      </motion.div>
      
      {/* Heading */}
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl sm:text-3xl font-semibold text-[#e0e1e3] mb-3 text-center"
      >
        Deploy your first AI employee
      </motion.h3>
      
      {/* Value prop */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[#9ca0a8] mb-8 text-center max-w-md text-base sm:text-lg"
      >
        Create an AI agent that works around the clock on Telegram, WhatsApp, 
        and more. Handle messages, automate tasks, and scale your operations.
      </motion.p>
      
      {/* Feature bullets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid sm:grid-cols-3 gap-4 mb-8 w-full max-w-2xl"
      >
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="font-medium text-[#e0e1e3] text-sm">Instant Responses</h4>
            <p className="text-xs text-[#565960] mt-1">Reply to messages 24/7</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <span className="text-2xl">🌍</span>
          <div>
            <h4 className="font-medium text-[#e0e1e3] text-sm">Multi-Platform</h4>
            <p className="text-xs text-[#565960] mt-1">Works everywhere</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <span className="text-2xl">🎯</span>
          <div>
            <h4 className="font-medium text-[#e0e1e3] text-sm">Smart Actions</h4>
            <p className="text-xs text-[#565960] mt-1">Automate workflows</p>
          </div>
        </div>
      </motion.div>
      
      {/* CTA button with animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        {onCreateEmployee ? (
          <motion.button
            onClick={onCreateEmployee}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="relative px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base sm:text-lg overflow-hidden group shadow-lg shadow-blue-500/25"
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
            
            <span className="relative flex items-center gap-2">
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
              Create Your First Employee
            </span>
          </motion.button>
        ) : (
          <Link href="/dashboard/employees/new">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base sm:text-lg overflow-hidden group shadow-lg shadow-blue-500/25"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              
              <span className="relative flex items-center gap-2">
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
                Create Your First Employee
              </span>
            </motion.button>
          </Link>
        )}
      </motion.div>
      
      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 text-sm text-[#565960]"
      >
        No credit card required • Setup in 2 minutes
      </motion.p>
    </motion.div>
  );
}
