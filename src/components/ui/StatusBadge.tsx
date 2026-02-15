'use client';

import { motion } from 'framer-motion';
import { breathingPulse, provisioningSpinner, errorShake } from '@/lib/design-system';

export type StatusType = 'active' | 'provisioning' | 'error' | 'stopped';

interface StatusBadgeProps {
  status: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface StatusConfig {
  color: string;
  bgColor: string;
  label: string;
  animation?: 'breathing' | 'spinning' | 'shaking' | null;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  active: {
    color: 'var(--status-active)',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    label: 'Active',
    animation: 'breathing',
  },
  provisioning: {
    color: 'var(--status-provisioning)',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    label: 'Provisioning',
    animation: 'spinning',
  },
  error: {
    color: 'var(--status-error)',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    label: 'Error',
    animation: 'shaking',
  },
  stopped: {
    color: 'var(--status-stopped)',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    label: 'Stopped',
    animation: null,
  },
};

const sizeConfig = {
  sm: {
    dot: 'w-1.5 h-1.5',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
  },
  md: {
    dot: 'w-2 h-2',
    text: 'text-xs',
    padding: 'px-2 py-1',
  },
  lg: {
    dot: 'w-2.5 h-2.5',
    text: 'text-sm',
    padding: 'px-3 py-1.5',
  },
};

/**
 * StatusBadge - Animated status indicator component
 * 
 * Displays agent status with appropriate animations:
 * - Active: Breathing pulse effect
 * - Provisioning: Spinning orbital animation
 * - Error: Gentle shake
 * - Stopped: Static indicator
 * 
 * @example
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="provisioning" showLabel size="lg" />
 * ```
 */
export function StatusBadge({ 
  status, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  // Get animation props based on status
  const getAnimationProps = () => {
    switch (config.animation) {
      case 'breathing':
        return breathingPulse;
      case 'spinning':
        return provisioningSpinner;
      case 'shaking':
        return errorShake;
      default:
        return {};
    }
  };

  if (!showLabel) {
    // Dot-only mode
    return (
      <motion.span
        className={`inline-block rounded-full ${sizes.dot} ${className}`}
        style={{ backgroundColor: config.color }}
        {...getAnimationProps()}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizes.padding} ${sizes.text} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {/* Animated indicator dot */}
      <motion.span
        className={`inline-block rounded-full ${sizes.dot}`}
        style={{ backgroundColor: config.color }}
        {...getAnimationProps()}
      />

      {/* Status label */}
      <span className="capitalize">{config.label}</span>
    </span>
  );
}

/**
 * StatusIndicator - Minimal dot-only version (convenience component)
 */
export function StatusIndicator({ status, className = '' }: { status: StatusType; className?: string }) {
  return <StatusBadge status={status} showLabel={false} className={className} />;
}
