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
});
