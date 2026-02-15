# Clawer.ai UI Component Library

Foundation components implementing the Clawer.ai design system.

## Components

### StatusBadge
Animated status indicators for agent states.

```tsx
import { StatusBadge } from '@/components/ui';

<StatusBadge status="active" />
<StatusBadge status="provisioning" showLabel size="lg" />
<StatusBadge status="error" />
<StatusBadge status="stopped" />
```

**Animations:**
- `active` — Breathing pulse effect
- `provisioning` — Spinning orbital animation
- `error` — Gentle shake
- `stopped` — Static (no animation)

### Skeleton
Loading placeholder components with shimmer animation.

```tsx
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard,
  SkeletonEmployeeCard 
} from '@/components/ui';

// Custom skeleton
<Skeleton width="60%" height="20px" variant="text" />

// Preset patterns
<SkeletonText lines={3} />
<SkeletonAvatar size="md" />
<SkeletonCard />
<SkeletonEmployeeCard />
```

**Variants:**
- `text` — Rounded corners for text lines
- `circular` — Circle shape (avatars)
- `rectangular` — Sharp corners
- `rounded` — Large rounded corners (cards)

### GlassCard
Glass morphism card with hover effects.

```tsx
import { 
  GlassCard, 
  FeatureCard, 
  EmployeeCard,
  GlassModal 
} from '@/components/ui';

// Basic card
<GlassCard hoverable padding="md">
  <h3>Card Title</h3>
  <p>Content</p>
</GlassCard>

// Glass morphism (backdrop blur)
<GlassCard glass padding="lg" rounded="xl">
  <div>Blurred background</div>
</GlassCard>

// Clickable with glow
<GlassCard hoverable showGlow onClick={() => {}}>
  <p>Click me!</p>
</GlassCard>

// Preset patterns
<FeatureCard 
  icon={<Icon />} 
  title="Feature" 
  description="Description" 
/>
```

## Design System

All components use CSS custom properties from `globals.css`:

```css
var(--bg-base)           /* Page background */
var(--bg-elevated-1)     /* Card background */
var(--text-primary)      /* Headings, important text */
var(--accent-primary)    /* Primary brand color */
var(--status-active)     /* Success/active state */
```

## Animation Variants

Import pre-built Framer Motion variants from the design system:

```tsx
import { 
  fadeIn, 
  fadeUp, 
  scaleIn,
  staggerContainer,
  cardHover,
  breathingPulse 
} from '@/lib/design-system';

<motion.div variants={fadeUp} initial="hidden" animate="visible">
  Content
</motion.div>
```

See `/src/lib/design-system.ts` for the full list.

## Usage Examples

### Loading State
```tsx
function EmployeeList({ loading, employees }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonEmployeeCard />
        <SkeletonEmployeeCard />
        <SkeletonEmployeeCard />
      </div>
    );
  }
  
  return employees.map(emp => (
    <GlassCard key={emp.id} hoverable>
      <div className="flex items-center gap-4">
        <img src={emp.avatar} className="w-12 h-12 rounded-full" />
        <div>
          <h3>{emp.name}</h3>
          <StatusBadge status={emp.status} />
        </div>
      </div>
    </GlassCard>
  ));
}
```

### Modal with Glass Effect
```tsx
import { GlassModal } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdrop, modalContent } from '@/lib/design-system';

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 flex items-center justify-center p-4"
          >
            <GlassModal>
              {children}
            </GlassModal>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

## Best Practices

1. **Always use CSS custom properties** for colors (enables theme switching)
2. **Prefer Framer Motion** for animations over CSS keyframes (better control)
3. **Use skeleton states** for loading instead of spinners
4. **Test hover states** on both mouse and touch devices
5. **Add status indicators** for agent states (active/provisioning/error)
6. **Keep animations subtle** — 60fps, <300ms duration for most transitions

## Next Steps

Other agents will build on this foundation:
- Form components (inputs, buttons, selects)
- Navigation components (sidebar, tabs, breadcrumbs)
- Data display (tables, lists, metrics)
- Overlays (modals, drawers, toasts)

This foundation provides the building blocks. Compose them into higher-level patterns as needed.
