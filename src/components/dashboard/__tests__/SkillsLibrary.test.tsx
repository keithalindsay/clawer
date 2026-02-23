/**
 * Tests for SkillsLibrary component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillsLibrary } from '../SkillsLibrary';

const mockSkills = [
  {
    id: 'github',
    name: 'GitHub',
    emoji: '🐙',
    category: 'Development',
    description: 'GitHub operations — issues, PRs, CI runs, code review, API queries.',
    enabled: false,
  },
  {
    id: 'docker-sandbox',
    name: 'Docker Sandbox',
    emoji: '🐳',
    category: 'Development',
    description: 'Create and manage sandboxed environments for safe code execution.',
    enabled: true,
  },
  {
    id: 'agentmail',
    name: 'AgentMail',
    emoji: '📧',
    category: 'Communication',
    description: 'Email infrastructure for agents — create inboxes, send/receive programmatically.',
    enabled: true,
  },
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    emoji: '🕷️',
    category: 'Research',
    description: 'Configurable web scraping — extract structured data from any website.',
    enabled: false,
  },
];

describe('SkillsLibrary', () => {
  it('renders all skills', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('Docker Sandbox')).toBeTruthy();
    expect(screen.getByText('AgentMail')).toBeTruthy();
    expect(screen.getByText('Web Scraper')).toBeTruthy();
  });

  it('shows enabled count in header', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    expect(screen.getByText(/2 enabled/i)).toBeTruthy();
  });

  it('filters skills by category', async () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    // Click Development category
    const developmentButton = screen.getByRole('button', { name: 'Development' });
    fireEvent.click(developmentButton);
    
    // Should show only Development skills
    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('Docker Sandbox')).toBeTruthy();
    expect(screen.queryByText('AgentMail')).toBeNull();
    expect(screen.queryByText('Web Scraper')).toBeNull();
  });

  it('filters skills by search query', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    const searchInput = screen.getByPlaceholderText('Search skills...');
    fireEvent.change(searchInput, { target: { value: 'github' } });
    
    // Should show only GitHub
    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.queryByText('Docker Sandbox')).toBeNull();
    expect(screen.queryByText('AgentMail')).toBeNull();
  });

  it('searches in both name and description', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    const searchInput = screen.getByPlaceholderText('Search skills...');
    fireEvent.change(searchInput, { target: { value: 'scraping' } });
    
    // Should find Web Scraper by description
    expect(screen.getByText('Web Scraper')).toBeTruthy();
    expect(screen.queryByText('GitHub')).toBeNull();
  });

  it('shows empty state when no skills match', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    const searchInput = screen.getByPlaceholderText('Search skills...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No skills found')).toBeTruthy();
    expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
  });

  it('toggles skill enabled state', async () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    // Find all Enable buttons
    const buttons = screen.getAllByRole('button');
    const enableButton = buttons.find(btn => btn.textContent === 'Enable');
    expect(enableButton).toBeTruthy();
    
    // Click to enable
    if (enableButton) {
      fireEvent.click(enableButton);
      
      await waitFor(() => {
        const enabledButtons = screen.getAllByRole('button');
        const updatedButton = enabledButtons.find(btn => btn.textContent === '✓ Enabled');
        expect(updatedButton).toBeTruthy();
      });
      
      // Check toast message appears (specific text)
      await waitFor(() => {
        const toast = screen.queryByText('GitHub enabled');
        expect(toast).toBeTruthy();
      });
    }
  });

  it('shows correct button states for enabled vs disabled skills', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    const buttons = screen.getAllByRole('button');
    
    // Should have enabled buttons (Docker Sandbox and AgentMail are enabled)
    const enabledButtons = buttons.filter(btn => btn.textContent === '✓ Enabled');
    expect(enabledButtons.length).toBe(2);
    
    // Should have disabled buttons
    const disabledButtons = buttons.filter(btn => btn.textContent === 'Enable');
    expect(disabledButtons.length).toBe(2);
  });

  it('applies correct category colors', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    const developmentBadge = screen.getByText('GitHub').closest('div')?.querySelector('.bg-blue-100, .dark\\:bg-blue-900\\/30');
    expect(developmentBadge).toBeTruthy();
    
    const communicationBadge = screen.getByText('AgentMail').closest('div')?.querySelector('.bg-purple-100, .dark\\:bg-purple-900\\/30');
    expect(communicationBadge).toBeTruthy();
  });

  it('combines category and search filters', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    // Select Development category
    const developmentButton = screen.getByRole('button', { name: 'Development' });
    fireEvent.click(developmentButton);
    
    // Search for "docker"
    const searchInput = screen.getByPlaceholderText('Search skills...');
    fireEvent.change(searchInput, { target: { value: 'docker' } });
    
    // Should show only Docker Sandbox
    expect(screen.getByText('Docker Sandbox')).toBeTruthy();
    expect(screen.queryByText('GitHub')).toBeNull();
    expect(screen.queryByText('AgentMail')).toBeNull();
  });

  it('resets to All category shows all skills', () => {
    render(<SkillsLibrary initialSkills={mockSkills} />);
    
    // Select Development category
    const developmentButton = screen.getByRole('button', { name: 'Development' });
    fireEvent.click(developmentButton);
    
    // Should only show 2 Development skills
    expect(screen.queryByText('AgentMail')).toBeNull();
    
    // Click All
    const allButton = screen.getByRole('button', { name: 'All' });
    fireEvent.click(allButton);
    
    // Should show all skills again
    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('AgentMail')).toBeTruthy();
    expect(screen.getByText('Web Scraper')).toBeTruthy();
  });
});
