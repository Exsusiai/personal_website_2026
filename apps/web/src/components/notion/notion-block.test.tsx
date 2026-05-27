import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotionBlockRenderer } from './notion-block';
import type { NotionBlock } from '@/lib/cms/blocks';

function makeBlock(type: string, extra: Record<string, unknown> = {}): NotionBlock {
  return { id: `test-${type}`, type, ...extra };
}

function richText(text: string) {
  return [
    {
      plain_text: text,
      href: null,
      type: 'text' as const,
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
    },
  ];
}

describe('NotionBlockRenderer', () => {
  it('renders paragraph text', () => {
    const block = makeBlock('paragraph', { paragraph: { rich_text: richText('Hello world') } });
    render(<NotionBlockRenderer block={block} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders heading_1 as h2', () => {
    const block = makeBlock('heading_1', { heading_1: { rich_text: richText('Big Heading') } });
    const { container } = render(<NotionBlockRenderer block={block} />);
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2?.textContent).toBe('Big Heading');
  });

  it('renders heading_2 as h3', () => {
    const block = makeBlock('heading_2', { heading_2: { rich_text: richText('Sub Heading') } });
    const { container } = render(<NotionBlockRenderer block={block} />);
    expect(container.querySelector('h3')).toBeInTheDocument();
  });

  it('renders heading_3 as h4', () => {
    const block = makeBlock('heading_3', { heading_3: { rich_text: richText('Sub Sub') } });
    const { container } = render(<NotionBlockRenderer block={block} />);
    expect(container.querySelector('h4')).toBeInTheDocument();
  });

  it('renders bulleted_list_item as li', () => {
    const block = makeBlock('bulleted_list_item', {
      bulleted_list_item: { rich_text: richText('Bullet item') },
    });
    const { container } = render(<NotionBlockRenderer block={block} />);
    expect(container.querySelector('li')).toBeInTheDocument();
    expect(screen.getByText('Bullet item')).toBeInTheDocument();
  });

  it('renders quote with blockquote', () => {
    const block = makeBlock('quote', { quote: { rich_text: richText('A wise quote') } });
    const { container } = render(<NotionBlockRenderer block={block} />);
    expect(container.querySelector('blockquote')).toBeInTheDocument();
    expect(screen.getByText('A wise quote')).toBeInTheDocument();
  });

  it('renders divider as hr', () => {
    const block = makeBlock('divider');
    const { container } = render(<NotionBlockRenderer block={block} />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('renders to_do with checkbox unchecked', () => {
    const block = makeBlock('to_do', {
      to_do: { checked: false, rich_text: richText('Do something') },
    });
    const { container } = render(<NotionBlockRenderer block={block} />);
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox?.checked).toBe(false);
    expect(screen.getByText('Do something')).toBeInTheDocument();
  });

  it('renders to_do with checkbox checked', () => {
    const block = makeBlock('to_do', {
      to_do: { checked: true, rich_text: richText('Done item') },
    });
    const { container } = render(<NotionBlockRenderer block={block} />);
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox?.checked).toBe(true);
  });

  it('renders unknown block type as fallback pre', () => {
    const block = makeBlock('fancy_future_block');
    const { container } = render(<NotionBlockRenderer block={block} />);
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('fancy_future_block');
  });

  describe('column_list / column', () => {
    it('renders a column_list as a flex container with two columns', async () => {
      // Need NotionBlocks wired so ColumnList can descend into column children.
      await import('./notion-blocks');
      const block = makeBlock('column_list', {
        children: [
          {
            id: 'col-a',
            type: 'column',
            column: { width_ratio: 0.6 },
            children: [makeBlock('paragraph', { paragraph: { rich_text: richText('Left side') } })],
          },
          {
            id: 'col-b',
            type: 'column',
            column: { width_ratio: 0.4 },
            children: [makeBlock('paragraph', { paragraph: { rich_text: richText('Right side') } })],
          },
        ],
      });
      const { container } = render(<NotionBlockRenderer block={block} />);
      expect(screen.getByText('Left side')).toBeInTheDocument();
      expect(screen.getByText('Right side')).toBeInTheDocument();
      // Two direct children div under the flex container
      const flexChildren = container.querySelectorAll(':scope > div > div');
      expect(flexChildren.length).toBe(2);
      // Width ratio 0.6 / 0.4 → 60% / 40% (jsdom strips trailing zeros from CSS values)
      expect((flexChildren[0] as HTMLElement).style.flexBasis).toMatch(/^60(\.0+)?%$/);
      expect((flexChildren[1] as HTMLElement).style.flexBasis).toMatch(/^40(\.0+)?%$/);
    });

    it('falls back to equal split when width_ratio is missing', async () => {
      await import('./notion-blocks');
      const block = makeBlock('column_list', {
        children: [
          { id: 'a', type: 'column', children: [] },
          { id: 'b', type: 'column', children: [] },
          { id: 'c', type: 'column', children: [] },
        ],
      });
      const { container } = render(<NotionBlockRenderer block={block} />);
      const cols = container.querySelectorAll(':scope > div > div');
      expect(cols.length).toBe(3);
      // 1/3 of 100 = 33.33%
      cols.forEach((c) => expect((c as HTMLElement).style.flexBasis).toMatch(/^33\.33%$/));
    });

    it('renders nothing for an empty column_list', () => {
      const block = makeBlock('column_list', { children: [] });
      const { container } = render(<NotionBlockRenderer block={block} />);
      expect(container.children.length).toBe(0);
    });
  });

  describe('child_page', () => {
    it('renders subpage title and inline child blocks', async () => {
      await import('./notion-blocks');
      const block = makeBlock('child_page', {
        child_page: { title: 'Resume programmer version' },
        children: [
          makeBlock('paragraph', { paragraph: { rich_text: richText('Inside subpage') } }),
        ],
      });
      render(<NotionBlockRenderer block={block} />);
      expect(screen.getByText('Resume programmer version')).toBeInTheDocument();
      expect(screen.getByText('Inside subpage')).toBeInTheDocument();
    });

    it('shows an empty marker when subpage has no fetched children', () => {
      const block = makeBlock('child_page', {
        child_page: { title: 'Bare page' },
        children: [],
      });
      render(<NotionBlockRenderer block={block} />);
      expect(screen.getByText('Bare page')).toBeInTheDocument();
      expect(screen.getByText('[empty subpage]')).toBeInTheDocument();
    });
  });
});
