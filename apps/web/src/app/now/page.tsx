import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import { getNowBlocks, getPageMeta } from '@/lib/cms/pages';
import { getEnv } from '@/lib/env';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Now' };

export default async function NowPage() {
  const [blocks, meta] = await Promise.all([
    getNowBlocks(),
    getPageMeta(getEnv().NOTION_PAGE_NOW),
  ]);

  const lastEdited = (meta as { last_edited_time?: string }).last_edited_time;
  const updatedDate = lastEdited
    ? new Date(lastEdited).toISOString().slice(0, 10)
    : null;

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Now" titleZh="近况" />
      <div className="prose-zh mx-auto max-w-[680px]">
        <NotionBlocks blocks={blocks} />
        {updatedDate && (
          <p className="font-[family-name:var(--font-mono)] mt-10 text-xs text-[var(--color-text-2)]">
            UPDATED · {updatedDate}
          </p>
        )}
      </div>
    </Container>
  );
}
