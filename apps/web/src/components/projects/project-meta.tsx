import Link from 'next/link';
import type { Project } from '@/lib/cms/types';

interface ProjectMetaProps {
  project: Project;
}

export function ProjectMeta({ project }: ProjectMetaProps) {
  return (
    <div className="border border-[var(--color-border)] p-6 mb-8">
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[var(--color-text-2)]">
          {project.type} · {project.year}
        </span>
        {project.status !== 'Active' && (
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[var(--color-text-2)]">
            {project.status}
          </span>
        )}
      </div>

      {project.stack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.stack.map((s) => (
            <span
              key={s}
              className="font-[family-name:var(--font-mono)] rounded-sm border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-2)]"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {(project.repoUrl || project.demoUrl) && (
        <div className="flex gap-4">
          {project.repoUrl && (
            <Link
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-accent)] hover:underline"
            >
              REPO →
            </Link>
          )}
          {project.demoUrl && (
            <Link
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-accent)] hover:underline"
            >
              DEMO →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
