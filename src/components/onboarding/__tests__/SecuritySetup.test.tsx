import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecuritySetup } from '../SecuritySetup';

// Mock fetch
global.fetch = vi.fn();

describe('SecuritySetup', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render all 3 alert categories', () => {
    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    expect(screen.getByText('Intrusion Detection')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('Daily Security Audit')).toBeInTheDocument();
  });

  it('should have all alerts enabled by default', () => {
    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    // Check that all toggles are in enabled state (green backgrounds)
    const alertCards = screen.getAllByRole('button');
    const enabledCards = alertCards.filter(card => 
      card.className.includes('border-green-500')
    );
    
    expect(enabledCards.length).toBe(3);
  });

  it('should toggle alert state when clicked', () => {
    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const intrusionCard = screen.getByText('Intrusion Detection').closest('button');
    expect(intrusionCard?.className).toContain('border-green-500');

    fireEvent.click(intrusionCard!);
    
    expect(intrusionCard?.className).toContain('border-gray-200');
  });

  it('should call skip callback when skip button clicked', () => {
    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const skipButton = screen.getByText('Skip for now');
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('should call setup API when enable protection clicked', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, alertsEnabled: 5 }),
    } as Response);

    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const enableButton = screen.getByRole('button', { name: /Enable Protection/i });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboard/alerts/setup',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should show success state after successful setup', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, alertsEnabled: 5 }),
    } as Response);

    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const enableButton = screen.getByRole('button', { name: /Enable Protection/i });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText('Protection Enabled!')).toBeInTheDocument();
      expect(screen.getByText('Your instance is now being monitored 24/7')).toBeInTheDocument();
    });
  });

  it('should auto-advance after successful setup', async () => {
    vi.useFakeTimers();
    
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, alertsEnabled: 5 }),
    } as Response);

    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const enableButton = screen.getByRole('button', { name: /Enable Protection/i });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText('Protection Enabled!')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });

  it('should show error message on setup failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Database connection failed' }),
    } as Response);

    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const enableButton = screen.getByRole('button', { name: /Enable Protection/i });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText('Setup failed')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });

  it('should disable enable button if all alerts are toggled off', () => {
    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    // Toggle all alerts off
    const alertCards = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('border-green-500')
    );
    
    alertCards.forEach(card => fireEvent.click(card));

    const enableButton = screen.getByRole('button', { name: /Enable Protection/i });
    expect(enableButton).toBeDisabled();
  });

  it('should show example notifications for each alert type', () => {
    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    expect(screen.getByText(/5 failed SSH login attempts/i)).toBeInTheDocument();
    expect(screen.getByText(/Disk usage at 85%/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily audit complete/i)).toBeInTheDocument();
  });

  it('should disable toggles after successful setup', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, alertsEnabled: 5 }),
    } as Response);

    render(<SecuritySetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const intrusionCard = screen.getByText('Intrusion Detection').closest('button');
    const enableButton = screen.getByRole('button', { name: /Enable Protection/i });
    
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText('Protection Enabled!')).toBeInTheDocument();
    });

    // Toggles should be disabled after setup
    expect(intrusionCard).toBeDisabled();
  });
});
