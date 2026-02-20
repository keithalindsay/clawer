// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FreeTrialBanner } from '@/components/FreeTrialBanner';

// Mock next/link — renders a plain <a> in tests
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// FreeTrialBanner renders null when freeMessagesUsed < 30 (60% threshold).
// The free limit used in the component is passed via props (freeMessageLimit).
// To trigger visible output we need freeMessagesUsed >= 30.

const FREE_LIMIT = 100;

describe('FreeTrialBanner', () => {
  it('renders without crashing when freeMessagesUsed = 0', () => {
    // Component returns null at low usage — container still mounts cleanly
    const { container } = render(
      <FreeTrialBanner freeMessagesUsed={0} freeMessageLimit={FREE_LIMIT} />
    );
    expect(container).toBeTruthy();
  });

  it('renders nothing below the 60% threshold (freeMessagesUsed < 30)', () => {
    const { container } = render(
      <FreeTrialBanner freeMessagesUsed={20} freeMessageLimit={FREE_LIMIT} />
    );
    // Component explicitly returns null — container should be empty
    expect(container.firstChild).toBeNull();
  });

  it('shows the banner once threshold is crossed (freeMessagesUsed = 30)', () => {
    const { container } = render(
      <FreeTrialBanner freeMessagesUsed={30} freeMessageLimit={FREE_LIMIT} />
    );
    // Something should be rendered at exactly the threshold
    expect(container.firstChild).not.toBeNull();
  });

  it('shows the correct message count in the low-usage banner', () => {
    // At 30 used / 100 limit → 70 remaining → "low" state
    // The "low" state config shows: "${freeMessagesUsed} of ${freeMessageLimit} free messages used"
    render(
      <FreeTrialBanner freeMessagesUsed={30} freeMessageLimit={FREE_LIMIT} />
    );
    expect(screen.getByText(/30 of 100 free messages used/i)).toBeTruthy();
  });

  it('has a link pointing to /pricing', () => {
    render(
      <FreeTrialBanner freeMessagesUsed={30} freeMessageLimit={FREE_LIMIT} />
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/pricing');
  });

  it('shows the "medium" state banner (freeMessagesUsed = 185, ~20 remaining)', () => {
    render(
      <FreeTrialBanner freeMessagesUsed={185} freeMessageLimit={FREE_LIMIT} />
    );
    // The medium state title shows remaining count
    expect(screen.getByText(/15 free messages remaining/i)).toBeTruthy();
  });

  it('shows the "critical" state banner when only 5 or fewer remain', () => {
    render(
      <FreeTrialBanner freeMessagesUsed={196} freeMessageLimit={FREE_LIMIT} />
    );
    // critical state: "Only 5 messages left!" (or similar — remaining = 4)
    // The critical config title is static "Only 5 messages left!" but remaining ≤ 5 triggers it
    expect(screen.getByText(/messages remaining|messages left/i)).toBeTruthy();
  });

  it('shows limit-reached (exhausted) state when freeMessagesUsed >= freeMessageLimit', () => {
    render(
      <FreeTrialBanner freeMessagesUsed={100} freeMessageLimit={FREE_LIMIT} />
    );
    // At exhaustion the modal appears: "Your free trial is complete!"
    expect(screen.getByText(/free trial is complete/i)).toBeTruthy();
  });

  it('shows upgrade link in the exhausted modal', () => {
    render(
      <FreeTrialBanner freeMessagesUsed={100} freeMessageLimit={FREE_LIMIT} />
    );
    // Modal has "Upgrade Now →" link to /pricing
    const upgradeLinks = screen.getAllByRole('link');
    const pricingLink = upgradeLinks.find(
      (el) => el.getAttribute('href') === '/pricing'
    );
    expect(pricingLink).toBeTruthy();
  });

  it('shows the message count sent in the exhausted modal', () => {
    render(
      <FreeTrialBanner freeMessagesUsed={100} freeMessageLimit={FREE_LIMIT} />
    );
    // "You've sent 100 messages with your AI assistant"
    expect(screen.getByText(/100 messages/i)).toBeTruthy();
  });
});
