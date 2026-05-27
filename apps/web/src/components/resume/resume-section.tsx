import Link from 'next/link';
import Image from 'next/image';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import type { ResumeItem, SkillCategory } from '@/lib/cms/types';

interface ResumeSectionProps {
  items: ResumeItem[];
  variant: 'experience' | 'project' | 'education' | 'skill' | 'award';
}

function formatDateRange(start: string, end: string | null): string {
  const fmt = (d: string) => (d.length >= 7 ? d.slice(0, 7) : d);
  const startFmt = fmt(start);
  const endFmt = end ? fmt(end) : '至今';
  return startFmt ? `${startFmt} – ${endFmt}` : '';
}

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="font-[family-name:var(--font-mono)] rounded-sm border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-2)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ExperienceRow({ item }: { item: ResumeItem }) {
  const range = formatDateRange(item.startDate, item.endDate);
  return (
    <div className="hairline-b grid grid-cols-1 gap-2 py-6 sm:grid-cols-[160px_1fr]">
      <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)]">
        {range && <div>{range}</div>}
        {item.location && <div className="mt-1">{item.location}</div>}
      </div>
      <div>
        <div className="font-semibold">{item.title}</div>
        {item.org && <div className="mt-0.5 text-sm text-[var(--color-text-2)]">{item.org}</div>}
        {item.summary && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{item.summary}</p>
        )}
        {item.details.length > 0 && (
          <div className="mt-2 text-sm leading-relaxed">
            <NotionBlocks blocks={item.details} />
          </div>
        )}
        <TagChips tags={item.tags} />
      </div>
    </div>
  );
}

function ProjectRow({ item }: { item: ResumeItem }) {
  const range = formatDateRange(item.startDate, item.endDate);
  return (
    <div className="hairline-b grid grid-cols-1 gap-2 py-6 sm:grid-cols-[160px_1fr]">
      <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)]">
        {range && <div>{range}</div>}
        {item.projectType && <div className="mt-1">{item.projectType}</div>}
      </div>
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-semibold">{item.title}</span>
          {item.repoUrl && (
            <Link
              href={item.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)] underline-offset-2 hover:text-[var(--color-accent)] hover:underline"
            >
              github →
            </Link>
          )}
          {item.demoUrl && (
            <Link
              href={item.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)] underline-offset-2 hover:text-[var(--color-accent)] hover:underline"
            >
              demo →
            </Link>
          )}
        </div>
        {item.org && <div className="mt-0.5 text-sm text-[var(--color-text-2)]">{item.org}</div>}
        {item.summary && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{item.summary}</p>
        )}
        {item.details.length > 0 && (
          <div className="mt-2 text-sm leading-relaxed">
            <NotionBlocks blocks={item.details} />
          </div>
        )}
        <TagChips tags={item.tags} />
      </div>
    </div>
  );
}

function EducationRow({ item }: { item: ResumeItem }) {
  const range = formatDateRange(item.startDate, item.endDate);
  return (
    <div className="hairline-b grid grid-cols-1 gap-2 py-5 sm:grid-cols-[160px_1fr]">
      <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)]">
        {range && <div>{range}</div>}
        {item.location && <div className="mt-1">{item.location}</div>}
      </div>
      <div>
        <div className="font-semibold">{item.title}</div>
        {item.org && <div className="mt-0.5 text-sm text-[var(--color-text-2)]">{item.org}</div>}
        {item.summary && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-2)]">{item.summary}</p>
        )}
        <TagChips tags={item.tags} />
      </div>
    </div>
  );
}

function LevelBar({ level }: { level: number }) {
  // Render as 10-segment monospace bar — high-fidelity to the old resume's "8********" style.
  const filled = Math.max(0, Math.min(10, Math.round(level)));
  return (
    <span
      className="font-[family-name:var(--font-mono)] text-[10px] tracking-tight text-[var(--color-text-2)]"
      aria-label={`level ${filled}/10`}
    >
      {`${filled} `}
      <span className="text-[var(--color-text)]">{'■'.repeat(filled)}</span>
      <span className="opacity-30">{'□'.repeat(10 - filled)}</span>
    </span>
  );
}

function SkillRow({ item }: { item: ResumeItem }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm">{item.title}</span>
      {item.level != null && <LevelBar level={item.level} />}
    </div>
  );
}

const SKILL_CATEGORY_LABELS: Record<SkillCategory, { en: string; zh: string }> = {
  Programming: { en: 'Programming', zh: '编程类' },
  Mechanical: { en: 'Mechanical', zh: '机械类' },
  Engineering: { en: 'Engineering', zh: '工程类' },
  AI: { en: 'AI / AIGC', zh: '人工智能' },
};
const SKILL_CATEGORY_ORDER: SkillCategory[] = ['Programming', 'Mechanical', 'Engineering', 'AI'];

function SkillSection({ items }: { items: ResumeItem[] }) {
  // Group by category; uncategorised → 'Programming' bucket as fallback.
  const grouped = new Map<SkillCategory, ResumeItem[]>();
  for (const it of items) {
    const cat = (it.category ?? 'Programming') as SkillCategory;
    const arr = grouped.get(cat) ?? [];
    arr.push(it);
    grouped.set(cat, arr);
  }
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
      {SKILL_CATEGORY_ORDER.map((cat) => {
        const arr = grouped.get(cat);
        if (!arr || arr.length === 0) return null;
        const label = SKILL_CATEGORY_LABELS[cat];
        return (
          <div key={cat}>
            <h3 className="font-[family-name:var(--font-mono)] mb-2 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
              {label.en} · {label.zh}
            </h3>
            <div className="hairline-t">
              {arr.map((item) => (
                <SkillRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AwardRow({ item }: { item: ResumeItem }) {
  return (
    <div className="hairline-b grid grid-cols-1 gap-3 py-4 sm:grid-cols-[80px_1fr]">
      {item.imageUrl ? (
        <div className="relative aspect-square w-20 overflow-hidden rounded border border-[var(--color-border)]">
          <Image src={item.imageUrl} alt={`${item.title} certificate`} fill className="object-cover" sizes="80px" />
        </div>
      ) : (
        <div />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{item.title}</div>
          {item.org && <div className="text-sm text-[var(--color-text-2)]">{item.org}</div>}
          {item.summary && (
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-2)]">{item.summary}</p>
          )}
        </div>
        {item.startDate && (
          <span className="font-[family-name:var(--font-mono)] flex-shrink-0 text-xs text-[var(--color-text-2)]">
            {item.startDate.slice(0, 4)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ResumeSection({ items, variant }: ResumeSectionProps) {
  if (items.length === 0) return null;
  if (variant === 'skill') return <SkillSection items={items} />;
  return (
    <div>
      {items.map((item) => {
        if (variant === 'project') return <ProjectRow key={item.id} item={item} />;
        if (variant === 'education') return <EducationRow key={item.id} item={item} />;
        if (variant === 'award') return <AwardRow key={item.id} item={item} />;
        return <ExperienceRow key={item.id} item={item} />;
      })}
    </div>
  );
}
