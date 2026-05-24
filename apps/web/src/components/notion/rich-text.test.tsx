import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichText, type RichTextItem } from './rich-text';

function makeSpan(overrides: Partial<RichTextItem> = {}): RichTextItem {
  return {
    plain_text: 'hello',
    href: null,
    type: 'text',
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: 'default',
    },
    ...overrides,
  };
}

describe('RichText', () => {
  it('renders plain text', () => {
    render(<RichText spans={[makeSpan({ plain_text: 'hello' })]} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('wraps bold text in <strong>', () => {
    const { container } = render(
      <RichText spans={[makeSpan({ plain_text: 'bold text', annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' } })]} />,
    );
    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('bold text');
  });

  it('wraps href in <a> element', () => {
    const { container } = render(
      <RichText spans={[makeSpan({ plain_text: 'link text', href: 'https://x.com' })]} />,
    );
    const anchor = container.querySelector('a');
    expect(anchor).toBeInTheDocument();
    expect(anchor?.getAttribute('href')).toBe('https://x.com');
    expect(anchor?.textContent).toBe('link text');
  });

  it('nests bold + italic + link correctly', () => {
    const { container } = render(
      <RichText
        spans={[
          makeSpan({
            plain_text: 'combo',
            href: 'https://example.com',
            annotations: {
              bold: true,
              italic: true,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
          }),
        ]}
      />,
    );
    const anchor = container.querySelector('a');
    expect(anchor).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('em')).toBeInTheDocument();
    expect(anchor?.textContent).toBe('combo');
  });

  it('renders empty fragment for empty spans array', () => {
    const { container } = render(<RichText spans={[]} />);
    expect(container.textContent).toBe('');
  });

  it('applies code styling', () => {
    const { container } = render(
      <RichText
        spans={[
          makeSpan({
            plain_text: 'some code',
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: true,
              color: 'default',
            },
          }),
        ]}
      />,
    );
    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code?.textContent).toBe('some code');
  });
});
