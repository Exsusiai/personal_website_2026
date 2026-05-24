import React from 'react';
import Image from 'next/image';
import { RichText, type RichTextItem } from './rich-text';
import type { NotionBlock } from '@/lib/cms/blocks';

// Forward-declare to avoid circular import at module evaluation time.
// NotionBlocks will be imported lazily via dynamic require in the render path.
let NotionBlocksComponent: React.ComponentType<{ blocks: NotionBlock[] }> | null = null;

export function setNotionBlocksComponent(
  c: React.ComponentType<{ blocks: NotionBlock[] }>,
): void {
  NotionBlocksComponent = c;
}

function ChildBlocks({ blocks }: { blocks: NotionBlock[] }): React.JSX.Element | null {
  if (!blocks.length) return null;
  if (!NotionBlocksComponent) return null;
  return <NotionBlocksComponent blocks={blocks} />;
}

// ---- Type helpers ----------------------------------------------------------------

type RichTextData = RichTextItem[];

function getRichText(block: NotionBlock, key: string): RichTextData {
  const section = (block as Record<string, unknown>)[key] as Record<string, unknown> | undefined;
  return (section?.rich_text as RichTextData | undefined) ?? [];
}

// ---- Block renderers -------------------------------------------------------------

function Paragraph({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <p className="my-4 leading-relaxed">
      <RichText spans={getRichText(block, 'paragraph')} />
      <ChildBlocks blocks={block.children ?? []} />
    </p>
  );
}

function Heading1({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <h2 className="mb-3 mt-8 font-[family-name:var(--font-tight)] text-2xl font-semibold tracking-tight">
      <RichText spans={getRichText(block, 'heading_1')} />
    </h2>
  );
}

function Heading2({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <h3 className="mb-2 mt-6 font-[family-name:var(--font-tight)] text-xl font-semibold tracking-tight">
      <RichText spans={getRichText(block, 'heading_2')} />
    </h3>
  );
}

function Heading3({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <h4 className="mb-2 mt-5 font-[family-name:var(--font-tight)] text-lg font-medium tracking-tight">
      <RichText spans={getRichText(block, 'heading_3')} />
    </h4>
  );
}

function BulletedListItem({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <li className="my-1 leading-relaxed">
      <RichText spans={getRichText(block, 'bulleted_list_item')} />
      {block.children && block.children.length > 0 && (
        <ChildBlocks blocks={block.children} />
      )}
    </li>
  );
}

function NumberedListItem({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <li className="my-1 leading-relaxed">
      <RichText spans={getRichText(block, 'numbered_list_item')} />
      {block.children && block.children.length > 0 && (
        <ChildBlocks blocks={block.children} />
      )}
    </li>
  );
}

function Quote({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <blockquote className="my-4 border-l-2 border-[var(--color-accent)] pl-4 italic text-[var(--color-text-2)]">
      <RichText spans={getRichText(block, 'quote')} />
    </blockquote>
  );
}

function Divider(): React.JSX.Element {
  return <hr className="my-8 border-t border-[var(--color-border)]" />;
}

function ToDo({ block }: { block: NotionBlock }): React.JSX.Element {
  const todo = (block as { to_do?: { checked?: boolean; rich_text?: RichTextItem[] } }).to_do;
  const checked = todo?.checked ?? false;
  const spans = (todo?.rich_text ?? []) as RichTextItem[];
  return (
    <div className="my-1 flex items-start gap-2">
      <input
        type="checkbox"
        disabled
        checked={checked}
        className="mt-1 cursor-not-allowed"
        readOnly
      />
      <span className={checked ? 'text-[var(--color-text-2)] line-through' : undefined}>
        <RichText spans={spans} />
      </span>
    </div>
  );
}

function BlockImage({ block }: { block: NotionBlock }): React.JSX.Element {
  const image = (block as {
    image?: {
      file?: { url?: string };
      external?: { url?: string };
      caption?: RichTextItem[];
    };
  }).image;
  const url = image?.file?.url ?? image?.external?.url ?? '';
  const captionSpans = image?.caption ?? [];
  const altText = captionSpans.map((s) => s.plain_text).join('') || 'Image';

  if (!url) {
    return <div className="my-4 text-sm text-[var(--color-text-2)]">[Image unavailable]</div>;
  }

  return (
    <figure className="my-6">
      <Image
        src={url}
        alt={altText}
        width={800}
        height={600}
        style={{ width: '100%', height: 'auto' }}
        className="rounded"
      />
      {captionSpans.length > 0 && (
        <figcaption className="mt-2 text-center text-sm text-[var(--color-text-2)]">
          <RichText spans={captionSpans} />
        </figcaption>
      )}
    </figure>
  );
}

function BlockCode({ block }: { block: NotionBlock }): React.JSX.Element {
  // Lazily import CodeBlock to avoid SSR bundling issues; this is a server component.
  // We render a placeholder that gets replaced by CodeBlock in B16.
  const code = (block as { code?: { rich_text?: RichTextItem[]; language?: string } }).code;
  const codeText = (code?.rich_text ?? []).map((r) => r.plain_text).join('');
  const language = code?.language ?? 'text';

  // CodeBlock is async — rendered by the parent server component calling it directly.
  // We export the data so callers can use <CodeBlock code={...} language={...} />.
  // For now, fall back to <pre> so tests don't need shiki.
  return (
    <pre
      data-code-block
      data-language={language}
      className="font-[family-name:var(--font-mono)] my-4 overflow-x-auto rounded border border-[var(--color-border)] p-4 text-sm"
    >
      <code>{codeText}</code>
    </pre>
  );
}

function Bookmark({ block }: { block: NotionBlock }): React.JSX.Element {
  const bm = (block as { bookmark?: { url?: string; caption?: RichTextItem[] } }).bookmark;
  const url = bm?.url ?? '';
  const captionSpans = bm?.caption ?? [];
  const label = captionSpans.length > 0 ? captionSpans.map((s) => s.plain_text).join('') : url;

  return (
    <div className="my-4 rounded border border-[var(--color-border)] p-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline underline-offset-2 hover:text-[var(--color-accent)]"
      >
        {label}
      </a>
    </div>
  );
}

function BlockTable({ block }: { block: NotionBlock }): React.JSX.Element {
  const table = (block as { table?: { has_column_header?: boolean } }).table;
  const hasHeader = table?.has_column_header ?? false;
  const rows = block.children ?? [];

  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, rowIdx) => {
            const tr = (row as { table_row?: { cells?: RichTextItem[][] } }).table_row;
            const cells = tr?.cells ?? [];
            const isHeader = hasHeader && rowIdx === 0;
            return (
              <tr key={row.id ?? rowIdx} className={isHeader ? 'font-semibold' : undefined}>
                {cells.map((cellSpans, cellIdx) =>
                  isHeader ? (
                    <th
                      key={cellIdx}
                      className="border border-[var(--color-border)] px-3 py-2 text-left"
                    >
                      <RichText spans={cellSpans} />
                    </th>
                  ) : (
                    <td
                      key={cellIdx}
                      className="border border-[var(--color-border)] px-3 py-2"
                    >
                      <RichText spans={cellSpans} />
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BlockCallout({ block }: { block: NotionBlock }): React.JSX.Element {
  // Delegate to Callout component (B17). Inline here to avoid circular dep.
  const callout = (block as {
    callout?: { rich_text?: RichTextItem[]; icon?: { type: 'emoji'; emoji: string } };
  }).callout;
  const spans = (callout?.rich_text ?? []) as RichTextItem[];
  const emoji = callout?.icon?.type === 'emoji' ? callout.icon.emoji : '💡';
  return (
    <aside className="my-4 flex gap-3 rounded border-l-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-4">
      <span className="text-lg leading-tight">{emoji}</span>
      <div className="flex-1">
        <RichText spans={spans} />
      </div>
    </aside>
  );
}

function Unsupported({ block }: { block: NotionBlock }): React.JSX.Element {
  return (
    <pre className="text-xs text-[var(--color-text-2)]">
      [unsupported block: {block.type}]
    </pre>
  );
}

// ---- Main dispatcher ------------------------------------------------------------

interface NotionBlockProps {
  block: NotionBlock;
}

export function NotionBlockRenderer({ block }: NotionBlockProps): React.JSX.Element | null {
  switch (block.type) {
    case 'paragraph':
      return <Paragraph block={block} />;
    case 'heading_1':
      return <Heading1 block={block} />;
    case 'heading_2':
      return <Heading2 block={block} />;
    case 'heading_3':
      return <Heading3 block={block} />;
    case 'bulleted_list_item':
      return <BulletedListItem block={block} />;
    case 'numbered_list_item':
      return <NumberedListItem block={block} />;
    case 'quote':
      return <Quote block={block} />;
    case 'divider':
      return <Divider />;
    case 'to_do':
      return <ToDo block={block} />;
    case 'image':
      return <BlockImage block={block} />;
    case 'code':
      return <BlockCode block={block} />;
    case 'callout':
      return <BlockCallout block={block} />;
    case 'bookmark':
      return <Bookmark block={block} />;
    case 'table':
      return <BlockTable block={block} />;
    case 'table_row':
      // Rendered by BlockTable — skip at top level
      return null;
    default:
      return <Unsupported block={block} />;
  }
}
