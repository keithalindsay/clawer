// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GettingStartedCard } from '../GettingStartedCard';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// next/link mock — render as plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

import { trackEvent } from '@/lib/analytics';

// ── Default props ──────────────────────────────────────────────────────────

const defaultProps = {
  teamTemplate: 'lifeos',
  whatsappConnected: false,
  telegramConnected: false,
  hasStartedChat: false,
  morningBriefingEnabled: false,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GettingStartedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Smoke tests ───────────────────────────────────────────────────────

  it('renders without crashing', () => {
    const { container } = render(<GettingStartedCard {...defaultProps} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('displays the "Getting Started" heading', () => {
    render(<GettingStartedCard {...defaultProps} />);
    expect(screen.getByText(/Getting Started/i)).toBeTruthy();
  });

  it('shows all 4 steps', () => {
    render(<GettingStartedCard {...defaultProps} />);
    expect(screen.getByText('Complete setup')).toBeTruthy();
    expect(screen.getByText('Start your first chat')).toBeTruthy();
    expect(screen.getByText('Connect WhatsApp or Telegram')).toBeTruthy();
    expect(screen.getByText('Set up your morning briefing')).toBeTruthy();
  });

  // ── Step 1: Complete setup (always done) ─────────────────────────────

  it('marks "Complete setup" as done', () => {
    render(<GettingStartedCard {...defaultProps} />);
    // Should show checkmark emoji for the done step
    const setupText = screen.getByText('Complete setup');
    expect(setupText.className).toContain('line-through');
  });

  // ── Step 2: First chat ────────────────────────────────────────────────

  it('shows "Start chatting" action link when chat not started', () => {
    render(<GettingStartedCard {...defaultProps} hasStartedChat={false} />);
    const link = screen.getByText(/Start chatting/i);
    expect(link).toBeTruthy();
  });

  it('does not show "Start chatting" link when chat already started', () => {
    render(<GettingStartedCard {...defaultProps} hasStartedChat={true} />);
    expect(screen.queryByText(/Start chatting/i)).toBeNull();
  });

  it('chat action link points to the chat page with a template-specific prompt', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="lifeos" hasStartedChat={false} />);
    const link = screen.getByText(/Start chatting/i) as HTMLAnchorElement;
    expect(link.href).toContain('/dashboard/chat');
    expect(link.href).toContain('prompt=');
  });

  // ── Step 3: Channel connection ────────────────────────────────────────

  it('shows "Connect" link when no channel is connected', () => {
    render(<GettingStartedCard {...defaultProps} whatsappConnected={false} telegramConnected={false} />);
    const link = screen.getByText(/^Connect →$/);
    expect(link).toBeTruthy();
  });

  it('does not show "Connect" link when WhatsApp is connected', () => {
    render(<GettingStartedCard {...defaultProps} whatsappConnected={true} />);
    expect(screen.queryByText(/^Connect →$/)).toBeNull();
  });

  it('does not show "Connect" link when Telegram is connected', () => {
    render(<GettingStartedCard {...defaultProps} telegramConnected={true} />);
    expect(screen.queryByText(/^Connect →$/)).toBeNull();
  });

  // ── Step 4: Morning briefing ──────────────────────────────────────────

  it('shows "Set up →" link when morning briefing is not enabled', () => {
    render(<GettingStartedCard {...defaultProps} morningBriefingEnabled={false} />);
    const link = screen.getByText(/^Set up →$/);
    expect(link).toBeTruthy();
  });

  it('does not show "Set up →" link when morning briefing is enabled', () => {
    render(<GettingStartedCard {...defaultProps} morningBriefingEnabled={true} />);
    expect(screen.queryByText(/^Set up →$/)).toBeNull();
  });

  // ── Progress bar ──────────────────────────────────────────────────────

  it('shows progress "1 of 4 steps complete" for a new user', () => {
    render(<GettingStartedCard {...defaultProps} />);
    expect(screen.getByText(/1 of 4 steps/i)).toBeTruthy();
  });

  it('shows "all set" progress text when everything is done', () => {
    render(
      <GettingStartedCard
        {...defaultProps}
        whatsappConnected={true}
        hasStartedChat={true}
        morningBriefingEnabled={true}
      />
    );
    // getAllByText because the "You're all set" phrase may appear in multiple places
    const allSetElements = screen.getAllByText(/You're all set/i);
    expect(allSetElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a progress bar with role="progressbar"', () => {
    render(<GettingStartedCard {...defaultProps} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeTruthy();
  });

  it('progress bar starts at 25% (1/4 steps = complete setup)', () => {
    render(<GettingStartedCard {...defaultProps} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
  });

  it('progress bar reaches 100% when all steps done', () => {
    render(
      <GettingStartedCard
        {...defaultProps}
        whatsappConnected={true}
        hasStartedChat={true}
        morningBriefingEnabled={true}
      />
    );
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  // ── Dismiss ───────────────────────────────────────────────────────────

  it('dismisses the card when the Dismiss button is clicked', () => {
    const { container } = render(<GettingStartedCard {...defaultProps} />);
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);
    // Card should disappear
    expect(container.firstChild).toBeNull();
  });

  it('calls trackEvent when dismissed', () => {
    render(<GettingStartedCard {...defaultProps} />);
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);
    expect(trackEvent).toHaveBeenCalledWith('funnel_onboard_banner_dismissed');
  });

  // ── Template-specific prompts ─────────────────────────────────────────

  it('uses a solopreneur-specific prompt in the chat link', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="solopreneur" hasStartedChat={false} />);
    const link = screen.getByText(/Start chatting/i) as HTMLAnchorElement;
    expect(link.href).toContain('prompt=');
    // The prompt should be encoded solopreneur-specific text
    expect(decodeURIComponent(link.href)).toContain('content');
  });

  it('uses a fitness-specific prompt in the chat link', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="fitness" hasStartedChat={false} />);
    const link = screen.getByText(/Start chatting/i) as HTMLAnchorElement;
    expect(decodeURIComponent(link.href)).toContain('workout');
  });

  it('uses a finance-specific prompt in the chat link', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="finance" hasStartedChat={false} />);
    const link = screen.getByText(/Start chatting/i) as HTMLAnchorElement;
    expect(decodeURIComponent(link.href)).toContain('financial');
  });

  // ── Deliverable label in step description ─────────────────────────────

  it('shows the lifeos deliverable name in step 1 description', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="lifeos" />);
    expect(screen.getByText(/Weekly Life Structure/i)).toBeTruthy();
  });

  it('shows the solopreneur deliverable name in step 1 description', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="solopreneur" />);
    // Use getAllByText since the deliverable label may appear in multiple places
    const matches = screen.getAllByText(/Content Ideas/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the fitness deliverable name in step 1 description', () => {
    render(<GettingStartedCard {...defaultProps} teamTemplate="fitness" />);
    // Use getAllByText since "Workout Plan" appears in step description and prompt text
    const matches = screen.getAllByText(/Workout Plan/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
