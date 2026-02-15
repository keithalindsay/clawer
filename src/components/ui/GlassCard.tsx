'use client';

import { motion } from 'framer-motion';
import { cardHover } from '@/lib/design-system';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  
  /**
   * Enable hover effects (scale + glow)
   */
  hoverable?: boolean;
  
  /**
   * Use glass morphism (backdrop blur) instead of solid background
   */
  glass?: boolean;
  
  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Border radius
   */
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show hover glow effect
   */
  showGlow?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const roundedClasses = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

/**
 * GlassCard - Glass morphism card component with hover effects
 * 
 * A versatile card component that supports both solid and glass morphism styles.
 * Features optional hover animations including scale, glow, and border color changes.
 * 
 * @example
 * ```tsx
 * // Solid card with hover
 * <GlassCard hoverable padding="md">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </GlassCard>
 * 
 * // Glass morphism card
 * <GlassCard glass padding="lg" rounded="xl">
 *   <div>Blurred background content</div>
 * </GlassCard>
 * 
 * // Clickable card with glow
 * <GlassCard hoverable showGlow onClick={() => console.log('clicked')}>
 *   <p>Click me!</p>
 * </GlassCard>
 * ```
 */
export function GlassCard({
  children,
  hoverable = false,
  glass = false,
  padding = 'md',
  rounded = 'lg',
  onClick,
  className = '',
  showGlow = false,
}: GlassCardProps) {
  const isInteractive = hoverable || !!onClick;

  const baseClasses = `
    border border-[var(--border-subtle)]
    transition-all duration-200
    ${paddingClasses[padding]}
    ${roundedClasses[rounded]}
    ${isInteractive ? 'cursor-pointer' : ''}
    ${className}
  `;

  const solidClasses = `
    bg-[var(--bg-elevated-1)]
    hover:border-[var(--border-default)]
    hover:bg-gradient-to-br hover:from-[var(--bg-elevated-2)] hover:to-[var(--bg-elevated-1)]
  `;

  const glassClasses = `
    bg-[rgba(15,17,21,0.8)]
    backdrop-blur-xl
    -webkit-backdrop-filter: blur(12px)
  `;

  if (isInteractive) {
    return (
      <motion.div
        className={`${baseClasses} ${glass ? glassClasses : solidClasses}`}
        variants={cardHover}
        initial="rest"
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
          position: 'relative',
        }}
      >
        {children}
        
        {/* Glow effect overlay */}
        {showGlow && hoverable && (
          <motion.div
            className="absolute inset-0 rounded-inherit pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            style={{
              background: 'radial-gradient(circle at center, var(--accent-primary-glow) 0%, transparent 70%)',
              zIndex: -1,
            }}
          />
        )}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${glass ? glassClasses : solidClasses}`}>
      {children}
    </div>
  );
}

/**
 * Preset variants for common card patterns
 */

export function FeatureCard({
  icon,
  title,
  description,
  className = '',
}: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <GlassCard hoverable padding="lg" rounded="xl" className={className}>
      <div className="space-y-3">
        <div className="w-12 h-12 rounded-lg bg-[var(--accent-primary-muted)] flex items-center justify-center text-[var(--accent-primary)]">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>
    </GlassCard>
  );
}

export function EmployeeCard({
  avatar,
  name,
  status,
  lastActive,
  onClick,
  className = '',
}: {
  avatar: ReactNode;
  name: string;
  status: ReactNode;
  lastActive: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <GlassCard
      hoverable
      padding="md"
      onClick={onClick}
      showGlow
      className={className}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatar}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            {status}
            <span>•</span>
            <span>{lastActive}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function GlassModal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard
      glass
      padding="lg"
      rounded="2xl"
      className={`max-w-2xl mx-auto ${className}`}
    >
      {children}
    </GlassCard>
  );
}
