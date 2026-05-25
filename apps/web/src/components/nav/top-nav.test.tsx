import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopNav } from './top-nav';

vi.mock('@/lib/cms/site-visibility', () => ({
  getSiteVisibility: vi.fn().mockResolvedValue({
    projects: true,
    resume: true,
    thinking: true,
    uses: true,
    timeline: true,
    contact: true,
  }),
}));

describe('TopNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the logo monogram', async () => {
    render(await TopNav());
    expect(screen.getByText('CJS')).toBeInTheDocument();
  });

  it('renders primary nav links including Home and without Now', async () => {
    render(await TopNav());
    const expected = ['Home', 'About', 'Resume', 'Projects', 'Thinking', 'Contact'];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText('Now')).not.toBeInTheDocument();
  });

  it('has an accessible label', async () => {
    render(await TopNav());
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
  });

  it('hides nav items when visibility is false', async () => {
    const { getSiteVisibility } = await import('@/lib/cms/site-visibility');
    vi.mocked(getSiteVisibility).mockResolvedValueOnce({
      projects: false,
      resume: true,
      thinking: false,
      uses: true,
      timeline: true,
      contact: true,
    });
    render(await TopNav());
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    expect(screen.queryByText('Thinking')).not.toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });
});
