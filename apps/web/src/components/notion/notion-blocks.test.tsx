import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotionBlocks } from './notion-blocks';
import type { NotionBlock } from '@/lib/cms/blocks';

function makeRichText(text: string) {
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

function bulletBlock(text: string, id: string, children?: NotionBlock[]): NotionBlock {
  return {
    id,
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: makeRichText(text) },
    children,
  };
}

function numberedBlock(text: string, id: string): NotionBlock {
  return {
    id,
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: makeRichText(text) },
  };
}

function paragraphBlock(text: string, id: string): NotionBlock {
  return {
    id,
    type: 'paragraph',
    paragraph: { rich_text: makeRichText(text) },
  };
}

describe('NotionBlocks', () => {
  it('wraps consecutive bulleted items in a single <ul>', () => {
    const blocks = [
      bulletBlock('Item A', 'b1'),
      bulletBlock('Item B', 'b2'),
      bulletBlock('Item C', 'b3'),
    ];
    const { container } = render(<NotionBlocks blocks={blocks} />);
    const uls = container.querySelectorAll('ul');
    expect(uls).toHaveLength(1);
    expect(uls[0].querySelectorAll('li')).toHaveLength(3);
  });

  it('mixes paragraphs, ul groups, and ol groups correctly', () => {
    const blocks = [
      paragraphBlock('Intro', 'p1'),
      bulletBlock('Bullet 1', 'b1'),
      bulletBlock('Bullet 2', 'b2'),
      paragraphBlock('Middle', 'p2'),
      numberedBlock('Num 1', 'n1'),
      numberedBlock('Num 2', 'n2'),
    ];
    const { container } = render(<NotionBlocks blocks={blocks} />);

    // 1 paragraph, then a <ul> with 2 items, then another paragraph, then <ol> with 2 items
    const uls = container.querySelectorAll('ul');
    const ols = container.querySelectorAll('ol');
    expect(uls).toHaveLength(1);
    expect(uls[0].querySelectorAll('li')).toHaveLength(2);
    expect(ols).toHaveLength(1);
    expect(ols[0].querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('Middle')).toBeInTheDocument();
  });

  it('renders nested child blocks inside list items', () => {
    const blocks = [
      bulletBlock('Parent item', 'b1', [
        paragraphBlock('Nested paragraph', 'child-p'),
      ]),
    ];
    render(<NotionBlocks blocks={blocks} />);
    expect(screen.getByText('Parent item')).toBeInTheDocument();
    expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
  });
});
