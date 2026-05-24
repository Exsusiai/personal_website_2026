import Link from 'next/link';
import { getNowBlocks } from '@/lib/cms/pages';
import type { NotionBlock } from '@/lib/cms/blocks';
import type { RichTextItem } from '@/components/notion/rich-text';

function extractPlainText(block: NotionBlock): string {
  const section = (block as Record<string, unknown>)[block.type] as
    | { rich_text?: RichTextItem[] }
    | undefined;
  return (section?.rich_text ?? []).map((r) => r.plain_text).join('');
}

export async function NowBlock() {
  const blocks = await getNowBlocks();

  // Find the first paragraph block for the teaser
  const firstParagraph = blocks.find((b) => b.type === 'paragraph');
  const teaser = firstParagraph ? extractPlainText(firstParagraph) : '';

  return (
    <div className="bg-[var(--color-bg)] p-9">
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Now
      </h3>
      <div className="font-[family-name:var(--font-zh-serif)] text-[17px] leading-[1.85]">
        {teaser || '近况更新中…'}
      </div>
      <Link
        href="/now"
        className="font-[family-name:var(--font-mono)] mt-5 inline-block text-xs text-[var(--color-accent)] hover:underline"
      >
        Read full Now →
      </Link>
    </div>
  );
}
