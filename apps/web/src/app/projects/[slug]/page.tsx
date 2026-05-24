import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import { ProjectMeta } from '@/components/projects/project-meta';
import { getProjectBySlug } from '@/lib/cms/projects';
import { getBlockChildren } from '@/lib/cms/blocks';

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

      {/* TODO Phase 3: render Model3DViewer when project.modelGlbUrl exists */}
      <div className="prose-zh mx-auto max-w-[680px]">
        <NotionBlocks blocks={blocks} />
      </div>
    </Container>
  );
}
