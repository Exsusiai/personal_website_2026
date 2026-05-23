import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Project · ${slug}` };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <ComingSoon
      titleEn={`Project: ${slug}`}
      titleZh="项目详情"
      description="项目详情 + 3D 模型查看器将在 Phase 2 / Phase 3 实现。"
    />
  );
}
