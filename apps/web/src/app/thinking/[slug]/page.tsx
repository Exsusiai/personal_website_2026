import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Article · ${slug}` };
}

export default async function ThinkingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <ComingSoon
      titleEn={`Article: ${slug}`}
      titleZh="文章详情"
      description="文章正文将在 Phase 2 通过 Notion Block Renderer 渲染。"
    />
  );
}
