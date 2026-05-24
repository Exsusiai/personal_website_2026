import type { ResumeItem } from '@/lib/cms/types';

interface ResumeSectionProps {
  items: ResumeItem[];
  variant: 'experience' | 'education' | 'skill' | 'award';
}

function formatDateRange(start: string, end: string | null): string {
  const fmt = (d: string) => {
    if (!d) return '';
    // Format ISO date to YYYY-MM
    return d.length >= 7 ? d.slice(0, 7) : d;
  };
  const startFmt = fmt(start);
  const endFmt = end ? fmt(end) : '至今';
  return `${startFmt} – ${endFmt}`;
}

function ExperienceRow({ item }: { item: ResumeItem }) {
  return (
    <div className="hairline-b grid grid-cols-1 gap-2 py-5 sm:grid-cols-[160px_1fr]">
      <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)]">
        {formatDateRange(item.startDate, item.endDate)}
        {item.location && (
          <div className="mt-1">{item.location}</div>
        )}
      </div>
      <div>
        <div className="font-semibold">{item.title}</div>
        {item.org && (
          <div className="mt-0.5 text-sm text-[var(--color-text-2)]">{item.org}</div>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="font-[family-name:var(--font-mono)] rounded-sm border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-2)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillRow({ item }: { item: ResumeItem }) {
  return (
    <div className="hairline-b flex items-center justify-between gap-4 py-3">
      <span className="font-medium">{item.title}</span>
      {item.tags.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="font-[family-name:var(--font-mono)] rounded-sm border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-2)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AwardRow({ item }: { item: ResumeItem }) {
  return (
    <div className="hairline-b flex items-start justify-between gap-4 py-3">
      <div>
        <span className="font-medium">{item.title}</span>
        {item.org && (
          <span className="ml-2 text-sm text-[var(--color-text-2)]">{item.org}</span>
        )}
      </div>
      {item.startDate && (
        <span className="font-[family-name:var(--font-mono)] flex-shrink-0 text-xs text-[var(--color-text-2)]">
          {item.startDate.slice(0, 4)}
        </span>
      )}
    </div>
  );
}

export function ResumeSection({ items, variant }: ResumeSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      {items.map((item) => {
        if (variant === 'skill') return <SkillRow key={item.id} item={item} />;
        if (variant === 'award') return <AwardRow key={item.id} item={item} />;
        return <ExperienceRow key={item.id} item={item} />;
      })}
    </div>
  );
}
