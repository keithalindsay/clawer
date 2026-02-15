'use client';

import { motion } from 'framer-motion';
import { shimmer } from '@/lib/design-system';

interface SkeletonProps {
  /**
   * Width of the skeleton (CSS value)
   * @example "100%", "200px", "w-full"
   */
  width?: string;
  
  /**
   * Height of the skeleton (CSS value)
   * @example "20px", "h-10"
   */
  height?: string;
  
  /**
   * Shape variant
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Animation type
   */
  animation?: 'shimmer' | 'pulse' | 'none';
}

/**
 * Skeleton - Loading placeholder component with shimmer animation
 * 
 * Creates skeleton screens that match your content structure while loading.
 * Supports shimmer and pulse animations for visual feedback.
 * 
 * @example
 * ```tsx
 * // Text line
 * <Skeleton width="60%" height="20px" />
 * 
 * // Avatar
 * <Skeleton variant="circular" width="40px" height="40px" />
 * 
 * // Card
 * <Skeleton variant="rounded" width="100%" height="200px" />
 * 
 * // Custom
 * <Skeleton className="w-full h-32 rounded-xl" />
 * ```
 */
export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className = '',
  animation = 'shimmer',
}: SkeletonProps) {
  const baseClasses = 'bg-[var(--bg-elevated-2)] relative overflow-hidden';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  const animationClasses = {
    shimmer: 'shimmer',
    pulse: 'animate-pulse',
    none: '',
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
      role="status"
      aria-label="Loading..."
    >
      {animation === 'shimmer' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

/**
 * Preset skeleton components for common patterns
 */

export function SkeletonText({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '70%' : '100%'}
          variant="text"
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <Skeleton
      variant="circular"
      className={`${sizes[size]} ${className}`}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" height="20px" />
          <Skeleton width="60%" height="16px" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonEmployeeCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Avatar with status ring */}
        <div className="relative">
          <SkeletonAvatar />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--bg-elevated-3)]" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <Skeleton width="120px" height="18px" />
          <Skeleton width="80px" height="14px" />
        </div>

        {/* Channel icons */}
        <div className="flex gap-1.5">
          <Skeleton variant="circular" width="20px" height="20px" />
          <Skeleton variant="circular" width="20px" height="20px" />
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <Skeleton width="40px" height="16px" />
          <Skeleton width="60px" height="12px" />
        </div>
      </div>
    </div>
  );
}
