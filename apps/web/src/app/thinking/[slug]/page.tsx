import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import { getArticleBySlug } from '@/lib/cms/thinking';
import { getBlockChildren } from '@/lib/cms/blocks';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };
  return { title: article.title, description: article.summary };
}

export default async function ThinkingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const blocks = await getBlockChildren(article.id);

  return (
    <Container as="section" className="py-18 sm:py-20">
      <div className="mx-auto max-w-[680px]">
        <h1 className="font-[family-name:var(--font-tight)] mb-4 text-3xl font-semibold leading-tight tracking-tight">
          {article.title}
        </h1>
        <p className="font-[family-name:var(--font-mono)] mb-10 text-xs text-[var(--color-text-2)]">
          {article.publishedDate}
          {article.readTime > 0 && ` · ${article.readTime} min read`}
          {article.tags.length > 0 && ` · ${article.tags.join(', ')}`}
        </p>
        <div className="prose-zh">
          <NotionBlocks blocks={blocks} />
        </div>
      </div>
    </Container>
  );
}
