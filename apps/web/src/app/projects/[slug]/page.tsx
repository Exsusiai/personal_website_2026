import type { Metadata } from 'next';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import { ProjectMeta } from '@/components/projects/project-meta';
import { getProjectBySlug } from '@/lib/cms/projects';
import { getBlockChildren } from '@/lib/cms/blocks';

const Model3DViewer = dynamic(
  () => import('@/components/projects/model-3d-viewer').then(m => m.Model3DViewer),
  { ssr: false, loading: () => null }
);

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Project Not Found' };
  return { title: project.title };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const blocks = await getBlockChildren(project.id);

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn={project.title} />
      <ProjectMeta project={project} />

      {project.coverUrl && (
        <div className="mb-8 overflow-hidden border border-[var(--color-border)]">
          <Image
            src={project.coverUrl}
            alt={project.title}
            width={1080}
            height={540}
            className="w-full object-cover"
          />
        </div>
      )}

      {project.modelGlbUrl && (
        <section className="my-12">
          <div className="font-[family-name:var(--font-mono)] mb-3 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
            3D Model · {project.title}
          </div>
          <Model3DViewer src={project.modelGlbUrl} />
          <p className="font-[family-name:var(--font-mono)] mt-2 text-xs text-[var(--color-text-2)]">
            拖动旋转 · 滚轮缩放 · 右键平移
          </p>
        </section>
      )}

      <div className="prose-zh mx-auto max-w-[680px]">
        <NotionBlocks blocks={blocks} />
      </div>
    </Container>
  );
}
