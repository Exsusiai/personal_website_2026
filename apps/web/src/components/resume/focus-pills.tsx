import Link from 'next/link';
import type { FocusArea } from '@/lib/cms/types';

interface FocusPillsProps {
  active: FocusArea | null;
}

interface Pill {
  label: string;
  hint: string;
  /** Query value. null = "all" / no filter. */
  value: FocusArea | null;
}

const PILLS: Pill[] = [
  { label: 'All', hint: '完全体', value: null },
  { label: 'Software', hint: '程序员视角', value: 'Software' },
  { label: 'Mechanical', hint: '机械工程师视角', value: 'Mechanical' },
  { label: 'AI', hint: 'AI / ML', value: 'AI' },
  { label: 'Robotics', hint: '机器人 / 自动驾驶', value: 'Robotics' },
];

export function FocusPills({ active }: FocusPillsProps) {
  return (
    <nav
      aria-label="Resume focus filter"
      className="font-[family-name:var(--font-mono)] flex flex-wrap items-center gap-2 text-xs"
    >
      {PILLS.map((p) => {
        const isActive = p.value === active;
        const href = p.value ? `/resume?focus=${p.value}` : '/resume';
        return (
          <Link
            key={p.label}
            href={href}
            scroll={false}
            aria-current={isActive ? 'true' : undefined}
            className={
              'hairline px-3 py-1.5 uppercase tracking-wide transition-colors ' +
              (isActive
                ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                : 'text-[var(--color-text-2)] hover:text-[var(--color-text)]')
            }
            title={p.hint}
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
