import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { EmptyState } from '@/components/ui/empty-state';
import { getUses } from '@/lib/cms/uses';
import type { UsesItem } from '@/lib/cms/types';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Uses' };

function UsesItemRow({ item }: { item: UsesItem }) {
  return (
    <div className="hairline-b flex items-start justify-between gap-4 py-4">
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-semibold">{item.title}</span>
          {item.brand && (
            <span className="text-sm text-[var(--color-text-2)]">{item.brand}</span>
          )}
        </div>
        {item.note && (
          <p className="font-[family-name:var(--font-mono)] mt-1 text-xs text-[var(--color-text-2)]">
            {item.note}
          </p>
        )}
        {item.url && (
          <Link
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-mono)] mt-1 inline-block text-xs text-[var(--color-accent)] hover:underline"
          >
            LINK →
          </Link>
        )}
      </div>
      {item.yearStarted > 0 && (
        <span className="font-[family-name:var(--font-mono)] flex-shrink-0 text-xs text-[var(--color-text-2)]">
          {item.yearStarted}
        </span>
      )}
    </div>
  );
}

const SECTION_LABELS: Record<string, { en: string; zh: string }> = {
  hardware: { en: 'Hardware', zh: '硬件' },
  software: { en: 'Software', zh: '软件' },
  service: { en: 'Services', zh: '服务' },
};

export default async function UsesPage() {
  const uses = await getUses();

  const sections = [
    { key: 'hardware', items: uses.hardware },
    { key: 'software', items: uses.software },
    { key: 'service', items: uses.service },
  ] as const;

  const allEmpty = sections.every(({ items }) => items.length === 0);

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Uses" titleZh="装备清单" />
      {allEmpty ? (
        <EmptyState
          titleEn="No items"
          titleZh="暂无装备"
          hint="在 Notion 的 uses 数据库中创建条目并勾选 Published。"
        />
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {sections.map(({ key, items }) => {
            if (items.length === 0) return null;
            const label = SECTION_LABELS[key];
            return (
              <div key={key}>
                <h3 className="font-[family-name:var(--font-tight)] mb-4 text-lg font-semibold">
                  <span className="font-[family-name:var(--font-zh-serif)] font-medium">
                    {label.zh}
                  </span>
                  {' · '}
                  {label.en}
                </h3>
                <div>
                  {items.map((item) => (
                    <UsesItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
