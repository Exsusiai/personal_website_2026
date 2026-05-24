import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { ProjectCard } from '@/components/home/project-card';
import { listProjects } from '@/lib/cms/projects';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Projects" titleZh="项目" />
      {projects.length === 0 ? (
        <p className="text-[var(--color-text-2)]">No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={{
                slug: p.slug,
                ptype: `${p.type} · ${p.year}`,
                title: p.title,
                summary: p.summary,
                tags: p.tags,
              }}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
