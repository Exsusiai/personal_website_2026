import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { listThinking } from '@/lib/cms/thinking';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Thinking' };

export default async function ThinkingPage() {
  const articles = await listThinking();

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Thinking" titleZh="业务思考" />
      {articles.length === 0 ? (
        <p className="text-[var(--color-text-2)]">No posts yet.</p>
      ) : (
        <ul className="max-w-[720px]">
          {articles.map((a, i) => (
            <li
              key={a.id}
              className={i < articles.length - 1 ? 'hairline-b py-5' : 'py-5'}
            >
              <Link
                href={`/thinking/${a.slug}`}
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-zh-serif)] mb-2 text-lg font-semibold">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-2)]">{a.summary}</p>
                </div>
                <span className="font-[family-name:var(--font-mono)] whitespace-nowrap pt-1 text-xs text-[var(--color-text-2)]">
                  {a.publishedDate}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
