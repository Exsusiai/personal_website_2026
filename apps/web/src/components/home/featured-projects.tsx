import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { ProjectCard } from './project-card';
import { listProjects } from '@/lib/cms/projects';

export async function FeaturedProjects() {
  const projects = await listProjects({ featured: true, limit: 3 });

  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <SectionHead
          titleEn="Selected Work"
          titleZh="精选项目"
          more={{ href: '/projects' }}
        />
        {projects.length === 0 ? (
          <p className="text-[var(--color-text-2)]">No featured projects yet.</p>
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
    </section>
  );
}
