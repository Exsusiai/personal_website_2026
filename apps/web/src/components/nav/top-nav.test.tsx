import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopNav } from './top-nav';

describe('TopNav', () => {
  it('renders the logo monogram', () => {
    render(<TopNav />);
    expect(screen.getByText('CJS')).toBeInTheDocument();
  });

  it('renders all primary nav links', () => {
    render(<TopNav />);
    const expected = ['About', 'Resume', 'Projects', 'Thinking', 'Timeline', 'Tokens', 'Now'];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('has an accessible label', () => {
    render(<TopNav />);
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
  });
});
