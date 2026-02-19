'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EmployeeCardProps {
  employee: {
    id: string;
    name: string;
    avatar?: string;
    status: 'active' | 'provisioning' | 'error' | 'stopped';
    tier?: string;
    lastActive: Date;
    messageCount: number;
    channels?: Array<'telegram' | 'whatsapp' | 'slack'>;
  };
  index?: number;
}

const statusConfig = {
  active: {
    color: 'bg-green-500',
    label: 'Active',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.08)]',
    animate: true,
  },
  provisioning: {
    color: 'bg-purple-500',
    label: 'Provisioning',
    glow: '',
    animate: true,
  },
  error: {
    color: 'bg-red-500',
    label: 'Error',
    glow: '',
    animate: false,
  },
  stopped: {
    color: 'bg-gray-500',
    label: 'Stopped',
    glow: '',
    animate: false,
  },
};

const channelIcons = {
  telegram: '✈️',
  whatsapp: '📱',
  slack: '💼',
};

export function EmployeeCard({ employee, index = 0 }: EmployeeCardProps) {
  const router = useRouter();
  const config = statusConfig[employee.status];
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const cardVariants: any = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
      className={`
        bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 
        cursor-pointer group transition-all duration-200
        hover:border-white/[0.12] hover:bg-white/[0.04]
        ${employee.status === 'active' ? config.glow : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Avatar with status ring */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
            {employee.avatar || employee.name.charAt(0).toUpperCase()}
          </div>
          
          {/* Status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {employee.status === 'active' && (
              <motion.div
                className={`w-4 h-4 ${config.color} rounded-full border-2 border-[#fafbfc]`}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0.4)',
                    '0 0 0 6px rgba(34, 197, 94, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            {employee.status === 'provisioning' && (
              <motion.div
                className={`w-4 h-4 ${config.color} rounded-full border-2 border-[#fafbfc]`}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}
            {(employee.status === 'error' || employee.status === 'stopped') && (
              <div className={`w-4 h-4 ${config.color} rounded-full border-2 border-[#fafbfc]`} />
            )}
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#111827] truncate group-hover:text-blue-400 transition-colors">
            {employee.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <span className={`capitalize ${
              employee.status === 'active' ? 'text-green-400' :
              employee.status === 'error' ? 'text-red-400' :
              employee.status === 'provisioning' ? 'text-purple-400' :
              'text-gray-400'
            }`}>
              {config.label}
            </span>
            <span>•</span>
            <span>{formatRelativeTime(employee.lastActive)}</span>
          </div>
          {employee.tier && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/[0.05] text-[#6b7280] border border-white/[0.06]">
                {employee.tier}
              </span>
            </div>
          )}
        </div>
        
        {/* Channels */}
        {employee.channels && employee.channels.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            {employee.channels.map((channel) => (
              <div
                key={channel}
                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-base"
                title={channel}
              >
                {channelIcons[channel]}
              </div>
            ))}
          </div>
        )}
        
        {/* Stats */}
        <div className="hidden md:block text-right">
          <p className="font-mono text-sm text-[#111827]">
            {employee.messageCount.toLocaleString()}
          </p>
          <p className="text-xs text-[#565960]">messages</p>
        </div>
        
        {/* Arrow (appears on hover) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="text-[#565960] group-hover:text-[#111827] transition-colors"
        >
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
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
