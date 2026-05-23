import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

describe('Footer', () => {
  it('renders current year', () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('renders the author name', () => {
    render(<Footer />);
    expect(screen.getByText(/陈敬升/)).toBeInTheDocument();
  });

  it('renders Email, GitHub, Hire me, Uses links', () => {
    render(<Footer />);
    for (const label of ['Email', 'GitHub', 'Hire me', 'Uses']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
