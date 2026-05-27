import React from 'react';
import { safeHref } from './safe-url';

export interface RichTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

export interface RichTextMention {
  type: 'page' | 'database' | 'date' | 'user' | 'link_preview' | 'template_mention';
  page?: { id: string };
  database?: { id: string };
  date?: { start: string; end?: string | null };
  user?: { id: string; name?: string };
  link_preview?: { url: string };
}

export interface RichTextItem {
  plain_text: string;
  href?: string | null;
  annotations: RichTextAnnotations;
  type: 'text' | 'mention' | 'equation';
  mention?: RichTextMention;
}

interface RichTextProps {
  spans: RichTextItem[];
}

function colorClass(color: string): string {
  switch (color) {
    case 'red':
      return 'text-[var(--color-accent)]';
    case 'gray':
      return 'text-[var(--color-text-2)]';
    default:
      return '';
  }
}

function mentionFallbackText(item: RichTextItem): string {
  // Notion API normally populates plain_text for every mention. Guard against
  // edge cases (deleted pages, sync glitches) where it comes back empty or as
  // the placeholder bullet character ('‣').
  if (item.type !== 'mention') return item.plain_text;
  if (item.plain_text && item.plain_text !== '‣') return item.plain_text;
  const m = item.mention;
  if (!m) return '[mention]';
  if (m.type === 'date' && m.date?.start) return m.date.start;
  if (m.type === 'user' && m.user?.name) return `@${m.user.name}`;
  if (m.type === 'link_preview' && m.link_preview?.url) return m.link_preview.url;
  return '[mention]';
}

function renderSpan(item: RichTextItem, index: number): React.ReactNode {
  const { annotations, href } = item;
  const plain_text = mentionFallbackText(item);

  let node: React.ReactNode = plain_text;

  if (annotations.code) {
    node = (
      <code
        key={`code-${index}`}
        className="font-[family-name:var(--font-mono)] rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 text-sm"
      >
        {node}
      </code>
    );
  }

  if (annotations.bold) {
    node = <strong key={`bold-${index}`}>{node}</strong>;
  }

  if (annotations.italic) {
    node = <em key={`italic-${index}`}>{node}</em>;
  }

  if (annotations.strikethrough) {
    node = <s key={`s-${index}`}>{node}</s>;
  }

  if (annotations.underline) {
    node = <u key={`u-${index}`}>{node}</u>;
  }

  const cls = colorClass(annotations.color);
  if (cls) {
    node = (
      <span key={`color-${index}`} className={cls}>
        {node}
      </span>
    );
  }

  const checkedHref = safeHref(href);
  if (checkedHref) {
    node = (
      <a
        key={`a-${index}`}
        href={checkedHref}
        className="underline underline-offset-2 hover:text-[var(--color-accent)]"
        target="_blank"
        rel="noopener noreferrer"
      >
        {node}
      </a>
    );
  }

  return <React.Fragment key={index}>{node}</React.Fragment>;
}

export function RichText({ spans }: RichTextProps): React.JSX.Element {
  return <>{spans.map((span, i) => renderSpan(span, i))}</>;
}
