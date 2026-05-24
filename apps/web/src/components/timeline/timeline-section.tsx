import type { TimelineNode, TimelineType } from '@/lib/cms/types';

interface TimelineSectionProps {
  nodes: TimelineNode[];
}

function typeColor(type: TimelineType): string {
  switch (type) {
    case 'Career':
      return 'text-[var(--color-text)]';
    case 'Project':
      return 'text-[var(--color-accent)]';
    case 'Milestone':
      return 'text-[var(--color-accent)]';
    case 'Education':
      return 'text-[var(--color-text-2)]';
    case 'Personal':
      return 'text-[var(--color-text-2)]';
    default:
      return 'text-[var(--color-text-2)]';
  }
}

function groupByYear(nodes: TimelineNode[]): Map<number, TimelineNode[]> {
  const map = new Map<number, TimelineNode[]>();
  for (const node of nodes) {
    const group = map.get(node.year) ?? [];
    group.push(node);
    map.set(node.year, group);
  }
  return map;
}

function NodeItem({ node }: { node: TimelineNode }) {
  const isMilestone = node.type === 'Milestone';
  return (
    <div className="flex gap-4 py-2">
      <div className="mt-1.5 flex-shrink-0">
        {isMilestone ? (
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]" />
        )}
      </div>
      <div>
        <span className={`text-sm font-medium ${typeColor(node.type)}`}>
          {node.title}
        </span>
        <span className="font-[family-name:var(--font-mono)] ml-3 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-2)]">
          {node.type}
          {node.month !== null && ` · ${String(node.month).padStart(2, '0')}`}
        </span>
      </div>
    </div>
  );
}

export function TimelineSection({ nodes }: TimelineSectionProps) {
  const byYear = groupByYear(nodes);
  // Years sorted descending
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);
  // Last 3 years are expanded by default; older years use <details>
  const currentYear = new Date().getFullYear();
  const expandedYears = new Set(years.filter((y) => y >= currentYear - 2));

  return (
    <div className="mt-4">
      {years.map((year) => {
        const yearNodes = byYear.get(year) ?? [];
        const isExpanded = expandedYears.has(year);

        if (isExpanded) {
          return (
            <div key={year} className="mb-6 grid grid-cols-[64px_1fr] gap-4">
              <div className="font-[family-name:var(--font-mono)] pt-2.5 text-right text-sm font-semibold text-[var(--color-text-2)]">
                {year}
              </div>
              <div className="border-l border-[var(--color-border)] pl-6">
                {yearNodes.map((node) => (
                  <NodeItem key={node.id} node={node} />
                ))}
              </div>
            </div>
          );
        }

        return (
          <details key={year} className="mb-4 group">
            <summary className="grid cursor-pointer list-none grid-cols-[64px_1fr] gap-4">
              <span className="font-[family-name:var(--font-mono)] pt-0.5 text-right text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)]">
                {year}
              </span>
              <span className="font-[family-name:var(--font-mono)] pt-0.5 text-xs text-[var(--color-text-2)]">
                {yearNodes.length} event{yearNodes.length !== 1 ? 's' : ''} ▸
              </span>
            </summary>
            <div className="mt-2 grid grid-cols-[64px_1fr] gap-4">
              <div />
              <div className="border-l border-[var(--color-border)] pl-6">
                {yearNodes.map((node) => (
                  <NodeItem key={node.id} node={node} />
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
