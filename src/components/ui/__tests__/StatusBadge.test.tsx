// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusBadge, StatusIndicator } from '@/components/ui/StatusBadge';

// Mock framer-motion — replace <motion.span> with a plain <span>
// so tests don't depend on animation internals or browser animation APIs.
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, className, style, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span className={className} style={style} data-testid="motion-span">
        {children}
      </span>
    ),
    div: ({ children, className, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
}));

// Mock design-system animation exports (not needed for rendering logic)
vi.mock('@/lib/design-system', () => ({
  breathingPulse: {},
  provisioningSpinner: {},
  errorShake: {},
}));

describe('StatusBadge', () => {
  // ── Smoke tests: all four statuses render without crashing ────────────────

  it('renders "active" status without crashing', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  it('renders "provisioning" status without crashing', () => {
    const { container } = render(<StatusBadge status="provisioning" />);
    expect(container).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  it('renders "error" status without crashing', () => {
    const { container } = render(<StatusBadge status="error" />);
    expect(container).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  it('renders "stopped" status without crashing', () => {
    const { container } = render(<StatusBadge status="stopped" />);
    expect(container).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  // ── Label text ────────────────────────────────────────────────────────────

  it('shows "Active" label for active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows "Provisioning" label for provisioning status', () => {
    render(<StatusBadge status="provisioning" />);
    expect(screen.getByText('Provisioning')).toBeTruthy();
  });

  it('shows "Error" label for error status', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeTruthy();
  });

  it('shows "Stopped" label for stopped status', () => {
    render(<StatusBadge status="stopped" />);
    expect(screen.getByText('Stopped')).toBeTruthy();
  });

  // ── Different colour styling per status ──────────────────────────────────

  it('uses a green indicator color for "active" status', () => {
    const { container } = render(<StatusBadge status="active" />);
    // The outer badge gets bgColor via inline style; color applied to text + dot
    const badge = container.firstChild as HTMLElement;
    // Active bgColor contains green (rgba(34, 197, 94, 0.1))
    expect(badge.style.backgroundColor).toContain('34, 197, 94');
  });

  it('uses a red indicator color for "error" status', () => {
    const { container } = render(<StatusBadge status="error" />);
    const badge = container.firstChild as HTMLElement;
    // Error bgColor: rgba(239, 68, 68, 0.1)
    expect(badge.style.backgroundColor).toContain('239, 68, 68');
  });

  it('uses a purple indicator color for "provisioning" status', () => {
    const { container } = render(<StatusBadge status="provisioning" />);
    const badge = container.firstChild as HTMLElement;
    // Provisioning bgColor: rgba(139, 92, 246, 0.1)
    expect(badge.style.backgroundColor).toContain('139, 92, 246');
  });

  it('uses a grey indicator color for "stopped" status', () => {
    const { container } = render(<StatusBadge status="stopped" />);
    const badge = container.firstChild as HTMLElement;
    // Stopped bgColor: rgba(107, 114, 128, 0.1)
    expect(badge.style.backgroundColor).toContain('107, 114, 128');
  });

  // ── showLabel prop ────────────────────────────────────────────────────────

  it('hides the text label when showLabel = false', () => {
    render(<StatusBadge status="active" showLabel={false} />);
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('shows the text label when showLabel = true (default)', () => {
    render(<StatusBadge status="active" showLabel />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  // ── size prop ─────────────────────────────────────────────────────────────

  it('accepts size="sm" without crashing', () => {
    const { container } = render(<StatusBadge status="active" size="sm" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('accepts size="lg" without crashing', () => {
    const { container } = render(<StatusBadge status="active" size="lg" />);
    expect(container.firstChild).not.toBeNull();
  });

  // ── custom className ──────────────────────────────────────────────────────

  it('applies a custom className to the badge', () => {
    const { container } = render(
      <StatusBadge status="active" className="my-custom-class" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('my-custom-class');
  });

  it('applies a custom className in dot-only mode (showLabel=false)', () => {
    const { container } = render(
      <StatusBadge status="stopped" showLabel={false} className="dot-only-custom" />
    );
    // In dot-only mode the root element is the motion.span (mocked to plain span)
    const dot = container.querySelector('[data-testid="motion-span"]') as HTMLElement;
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('dot-only-custom');
  });

  // ── StatusIndicator convenience component ─────────────────────────────────

  it('StatusIndicator renders a dot without a label', () => {
    render(<StatusIndicator status="active" />);
    // No text label in the output
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('StatusIndicator accepts a custom className', () => {
    const { container } = render(
      <StatusIndicator status="error" className="indicator-custom" />
    );
    const dot = container.querySelector('[data-testid="motion-span"]') as HTMLElement;
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('indicator-custom');
  });
});
