/**
 * Clawer.ai Design System
 * Framer Motion variants, easing curves, and animation presets
 * Version: 1.0
 */

import type { Variant, Transition } from 'framer-motion';

/* ============================================================
   Easing Curves
   ============================================================ */

export const easings = {
  // Smooth, natural motion
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.65, 0, 0.35, 1],
  
  // Sharp, snappy motion
  sharp: [0.4, 0, 0.2, 1],
  
  // Bouncy, playful motion
  bounce: [0.68, -0.55, 0.265, 1.55],
  
  // Expo curves for dramatic effects
  expoOut: [0.19, 1, 0.22, 1],
  expoIn: [0.95, 0.05, 0.795, 0.035],
} as const;

/* ============================================================
   Duration Presets
   ============================================================ */

export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
  slowest: 0.8,
} as const;

/* ============================================================
   Spring Configurations
   ============================================================ */

export const springs = {
  // Smooth spring for general UI
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  
  // Snappy spring for interactive elements
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  
  // Bouncy spring for celebratory moments
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  },
  
  // Gentle spring for cards
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  },
} as const;

/* ============================================================
   Animation Variants
   ============================================================ */

/**
 * Fade in from invisible to visible
 */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Fade up with slide motion
 */
export const fadeUp = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Fade down with slide motion
 */
export const fadeDown = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Scale in from small to normal
 */
export const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Scale up with bounce
 */
export const scaleInBounce = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...springs.bouncy,
    },
  },
} as const;

/**
 * Slide in from left
 */
export const slideInLeft = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Slide in from right
 */
export const slideInRight = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Stagger container for animating children in sequence
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

/**
 * Stagger item (child of staggerContainer)
 */
export const staggerItem = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Card hover effect with scale and shadow
 */
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0 rgba(99, 102, 241, 0)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    transition: {
      ...springs.snappy,
    },
  },
} as const;

/**
 * Button hover with gentle scale
 */
export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: springs.snappy,
  },
} as const;

/**
 * Tab content transitions
 */
export const tabContent = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  }),
} as const;

/**
 * Toast notification entrance/exit
 */
export const toast = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springs.snappy,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: durations.fast,
    },
  },
} as const;

/**
 * Modal backdrop
 */
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
} as const;

/**
 * Modal content
 */
export const modalContent = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...springs.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: durations.fast,
    },
  },
} as const;

/**
 * Bottom sheet for mobile
 */
export const bottomSheet = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
} as const;

/* ============================================================
   Status Indicator Animations
   ============================================================ */

/**
 * Active status breathing pulse
 */
export const breathingPulse = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(34, 197, 94, 0.4)',
      '0 0 0 8px rgba(34, 197, 94, 0)',
    ],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
} as const;

/**
 * Provisioning spinner
 */
export const provisioningSpinner = {
  animate: { rotate: 360 },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
} as const;

/**
 * Error shake
 */
export const errorShake = {
  animate: {
    x: [0, -4, 4, -4, 4, 0],
  },
  transition: {
    duration: 0.5,
    ease: 'easeInOut',
  },
} as const;

/**
 * Success checkmark draw
 */
export const checkmarkDraw = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.3, ease: easings.easeOut },
      opacity: { duration: 0.1 },
    },
  },
} as const;

/* ============================================================
   Loading States
   ============================================================ */

/**
 * Thinking indicator (three dots)
 */
export const thinkingDot = (index: number) => ({
  animate: {
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
  },
  transition: {
    duration: 0.8,
    repeat: Infinity,
    delay: index * 0.15,
  },
});

/**
 * Shimmer for skeleton loading
 */
export const shimmer = {
  animate: {
    x: ['0%', '100%'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
} as const;

/* ============================================================
   Celebration Animations
   ============================================================ */

/**
 * Deploy success button transformation
 */
export const deploySuccess = {
  idle: { scale: 1 },
  loading: { scale: 0.98 },
  success: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.3 },
  },
} as const;

/**
 * Floating animation for hero illustrations
 */
export const floating = {
  animate: {
    y: [0, -10, 0],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
} as const;

/* ============================================================
   Utility Functions
   ============================================================ */

/**
 * Create a stagger delay for list items
 * @param index - Item index
 * @param baseDelay - Base delay in seconds (default: 0.05)
 */
export function staggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay;
}

/**
 * Create a custom transition
 */
export function customTransition(options: Partial<Transition>): Transition {
  return {
    duration: durations.normal,
    ease: easings.easeOut,
    ...options,
  };
}

/**
 * Magnetic cursor effect configuration
 * Use with onMouseMove on elements
 */
export const magneticCursor = {
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    e.currentTarget.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  },
} as const;

/**
 * Viewport animation variants (for scroll-triggered animations)
 */
export const viewportVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.easeOut,
    },
  },
} as const;

/**
 * Page transition variants
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: durations.fast,
    },
  },
} as const;
