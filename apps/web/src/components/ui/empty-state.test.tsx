import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders titles and hint', () => {
    render(<EmptyState titleEn="No items" titleZh="暂无内容" hint="add content" />);
    expect(screen.getByText('暂无内容')).toBeInTheDocument();
    expect(screen.getByText('add content')).toBeInTheDocument();
    // titleEn is a text node inside a div alongside other text nodes; match via regex
    expect(screen.getByText(/No items/)).toBeInTheDocument();
  });
});
