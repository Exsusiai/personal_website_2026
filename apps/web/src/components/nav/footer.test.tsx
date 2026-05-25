import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

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

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current year', async () => {
    render(await Footer());
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('renders the author name', async () => {
    render(await Footer());
    expect(screen.getByText(/陈敬升/)).toBeInTheDocument();
  });

  it('renders Email, GitHub, Uses links', async () => {
    render(await Footer());
    for (const label of ['Email', 'GitHub', 'Uses']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('hides Uses when uses visibility is false', async () => {
    const { getSiteVisibility } = await import('@/lib/cms/site-visibility');
    vi.mocked(getSiteVisibility).mockResolvedValueOnce({
      projects: true,
      resume: true,
      thinking: true,
      uses: false,
      timeline: true,
      contact: true,
    });
    render(await Footer());
    expect(screen.queryByText('Uses')).not.toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
