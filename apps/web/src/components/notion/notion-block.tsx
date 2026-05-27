import React from 'react';
import Image from 'next/image';
import { RichText, type RichTextItem } from './rich-text';
import { CodeBlock } from './code-block';
import { Callout } from './callout';
import { safeHref, isAllowedImageHost } from './safe-url';
import type { NotionBlock } from '@/lib/cms/blocks';
import { getNotionClient, withRetry } from '@/lib/cms/notion-client';

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

  // External Notion images can use arbitrary hosts. next/image throws at render
  // time if the host isn't on `images.remotePatterns`. Fall back to a plain link
  // so the page still renders for unrecognized hosts.
  if (!isAllowedImageHost(url)) {
    const href = safeHref(url);
    return (
      <figure className="my-6">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline underline-offset-2 hover:text-[var(--color-accent)]"
          >
            [External image: {altText}]
          </a>
        ) : (
          <span className="text-sm text-[var(--color-text-2)]">[External image: {altText}]</span>
        )}
      </figure>
    );
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
  const code = (block as { code?: { rich_text?: RichTextItem[]; language?: string } }).code;
  const codeText = (code?.rich_text ?? []).map((r) => r.plain_text).join('');
  const language = code?.language ?? 'text';

  // CodeBlock is an async Server Component. Next.js resolves async components at render
  // time on the server; TypeScript 5 + React 19 types accept this natively.
  return (
    <CodeBlock code={codeText} language={language} />
  );
}

function Bookmark({ block }: { block: NotionBlock }): React.JSX.Element {
  const bm = (block as { bookmark?: { url?: string; caption?: RichTextItem[] } }).bookmark;
  const url = bm?.url ?? '';
  const captionSpans = bm?.caption ?? [];
  const label = captionSpans.length > 0 ? captionSpans.map((s) => s.plain_text).join('') : url;
  const href = safeHref(url);

  return (
    <div className="my-4 rounded border border-[var(--color-border)] p-3">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-2 hover:text-[var(--color-accent)]"
        >
          {label}
        </a>
      ) : (
        <span className="text-sm text-[var(--color-text-2)]">{label}</span>
      )}
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
  return <Callout block={block} />;
}

function ColumnList({ block }: { block: NotionBlock }): React.JSX.Element | null {
  const children = block.children ?? [];
  if (children.length === 0) return null;
  // Per-column width. Notion exposes `column.width_ratio` in the official API;
  // older SPA payloads use `column_ratio`. Missing / zero → fall back to equal
  // split so we never produce a 0-width flex item.
  const ratios = children.map((c) => {
    const col = (c as { column?: { width_ratio?: number; column_ratio?: number } }).column;
    return col?.width_ratio ?? col?.column_ratio ?? 0;
  });
  const total = ratios.reduce((a, b) => a + b, 0);
  const fractions =
    total > 0
      ? ratios.map((r) => (r > 0 ? r / total : 1 / children.length))
      : ratios.map(() => 1 / children.length);

  return (
    <div className="my-6 flex flex-col gap-6 md:flex-row md:gap-8">
      {children.map((col, i) => (
        <div
          key={col.id}
          className="min-w-0 md:flex-initial"
          style={{ flexBasis: `${(fractions[i] * 100).toFixed(2)}%` }}
        >
          <ChildBlocks blocks={col.children ?? []} />
        </div>
      ))}
    </div>
  );
}

function ColumnFallback({ block }: { block: NotionBlock }): React.JSX.Element | null {
  // `column` should always be nested inside `column_list` (handled by ColumnList).
  // If we encounter it bare, just render its children inline as a defensive fallback.
  return <ChildBlocks blocks={block.children ?? []} />;
}

function ChildPage({ block }: { block: NotionBlock }): React.JSX.Element {
  const title = (block as { child_page?: { title?: string } }).child_page?.title ?? 'Untitled subpage';
  const children = block.children ?? [];
  return (
    <section className="my-8 border-l-2 border-[var(--color-border)] pl-5">
      <h3 className="mb-4 font-[family-name:var(--font-tight)] text-xl font-semibold tracking-tight">
        <span className="mr-2 text-[var(--color-text-2)]" aria-hidden>
          📄
        </span>
        {title}
      </h3>
      {children.length > 0 ? (
        <ChildBlocks blocks={children} />
      ) : (
        <p className="text-sm text-[var(--color-text-2)]">[empty subpage]</p>
      )}
    </section>
  );
}

// --- ChildDatabase (inline DB) -----------------------------------------------

interface NotionRowProps {
  type?: string;
  [k: string]: unknown;
}

function renderProperty(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return '';
  const p = prop as NotionRowProps;
  switch (p.type) {
    case 'title':
      return ((p.title as { plain_text: string }[] | undefined) ?? []).map((s) => s.plain_text).join('');
    case 'rich_text':
      return ((p.rich_text as { plain_text: string }[] | undefined) ?? []).map((s) => s.plain_text).join('');
    case 'select': {
      const s = p.select as { name?: string } | null | undefined;
      return s?.name ?? '';
    }
    case 'multi_select':
      return ((p.multi_select as { name: string }[] | undefined) ?? []).map((s) => s.name).join(', ');
    case 'number':
      return p.number == null ? '' : String(p.number);
    case 'checkbox':
      return p.checkbox ? '✓' : '';
    case 'date': {
      const d = p.date as { start?: string } | null | undefined;
      return d?.start ?? '';
    }
    case 'url':
      return (p.url as string | null | undefined) ?? '';
    case 'email':
      return (p.email as string | null | undefined) ?? '';
    case 'phone_number':
      return (p.phone_number as string | null | undefined) ?? '';
    default:
      return '';
  }
}

function DbFallback({ title, note }: { title: string; note: string }): React.JSX.Element {
  return (
    <div className="my-4 rounded border border-[var(--color-border)] p-3 text-sm">
      <strong>{title}</strong>{' '}
      <span className="text-[var(--color-text-2)]">({note})</span>
    </div>
  );
}

interface ChildDbData {
  rows: { id: string; properties: Record<string, unknown> }[];
  propNames: string[];
}

async function fetchChildDbData(blockId: string): Promise<
  { kind: 'ok'; data: ChildDbData }
  | { kind: 'empty' }
  | { kind: 'no_source' }
  | { kind: 'error'; message: string }
> {
  try {
    const client = getNotionClient();
    const db = (await withRetry(() =>
      client.databases.retrieve({ database_id: blockId }),
    )) as { data_sources?: { id: string }[] };
    const dataSources = db.data_sources ?? [];
    if (dataSources.length === 0) return { kind: 'no_source' };

    const resp = await withRetry(() =>
      client.dataSources.query({
        data_source_id: dataSources[0].id,
        page_size: 25,
      }),
    );
    const rows = resp.results.filter(
      (r): r is typeof r & { properties: Record<string, unknown> } => 'properties' in r,
    );
    if (rows.length === 0) return { kind: 'empty' };
    // Use first row's property order; cap to 5 columns for mobile-friendly inline render.
    const propNames = Object.keys(rows[0].properties).slice(0, 5);
    return { kind: 'ok', data: { rows, propNames } };
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Renders an inline child database. Notion API v2025-09 returns `data_sources`
 * on `databases.retrieve`; we query the first one and render up to 25 rows as
 * a basic table. Falls back to a labelled card on any fetch / schema error.
 *
 * Note: data fetch is intentionally separated from rendering so a thrown error
 * cannot land inside JSX — React renders are deferred, so try/catch around JSX
 * wouldn't actually catch render-time errors anyway.
 */
async function ChildDatabase({ block }: { block: NotionBlock }): Promise<React.JSX.Element> {
  const title = (block as { child_database?: { title?: string } }).child_database?.title ?? 'Untitled database';
  const result = await fetchChildDbData(block.id);

  if (result.kind === 'no_source') return <DbFallback title={title} note="no data source" />;
  if (result.kind === 'empty') return <DbFallback title={title} note="empty" />;
  if (result.kind === 'error') {
    console.warn(`[notion] child_database fetch failed for ${block.id}: ${result.message}`);
    return <DbFallback title={title} note="content unavailable" />;
  }

  const { rows, propNames } = result.data;
  return (
    <section className="my-6">
      <h3 className="mb-3 font-[family-name:var(--font-tight)] text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              {propNames.map((n) => (
                <th key={n} className="px-3 py-2 font-medium">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--color-border)]">
                {propNames.map((n) => (
                  <td key={n} className="px-3 py-2">
                    {renderProperty(row.properties[n])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
    case 'column_list':
      return <ColumnList block={block} />;
    case 'column':
      // ColumnList renders columns directly; bare columns are unusual but safe.
      return <ColumnFallback block={block} />;
    case 'child_page':
      return <ChildPage block={block} />;
    case 'child_database':
      // Async server component — Next.js + React 19 resolves it at render time.
      return <ChildDatabase block={block} />;
    default:
      return <Unsupported block={block} />;
  }
}
