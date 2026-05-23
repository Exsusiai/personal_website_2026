import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ProjectCardData {
  slug: string;
  ptype: string;
  title: string;
  summary: string;
  tags: string[];
}

interface ProjectCardProps {
  project: ProjectCardData;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        'flex min-h-[260px] flex-col bg-[var(--color-bg)] p-8 transition-colors hover:bg-[var(--color-surface)]',
        className,
      )}
    >
      <div className="font-[family-name:var(--font-mono)] mb-4 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-2)]">
        {project.ptype}
      </div>
      <h3 className="font-[family-name:var(--font-zh-serif)] mb-3 text-[22px] font-semibold leading-[1.3]">
        {project.title}
      </h3>
      <p className="flex-grow text-sm leading-[1.7] text-[var(--color-text-2)]">
        {project.summary}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-[family-name:var(--font-mono)] rounded-sm border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-2)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
