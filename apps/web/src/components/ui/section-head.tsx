import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionHeadProps {
  /** English part of the title */
  titleEn: string;
  /** Chinese part of the title (optional, rendered with serif) */
  titleZh?: string;
  /** Optional "view all" link */
  more?: { href: string; label?: string };
  className?: string;
}

export function SectionHead({
  titleEn,
  titleZh,
  more,
  className,
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        'mb-12 flex items-baseline justify-between',
        className,
      )}
    >
      <h2 className="font-[family-name:var(--font-tight)] text-2xl font-semibold tracking-tight">
        {titleZh && (
          <span className="font-[family-name:var(--font-zh-serif)] font-medium">
            {titleZh}
          </span>
        )}
        {titleZh && ' · '}
        {titleEn}
      </h2>
      {more && (
        <Link
          href={more.href}
          className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)] hover:text-[var(--color-text)]"
        >
          {(more.label ?? 'VIEW ALL').toUpperCase()} →
        </Link>
      )}
    </div>
  );
}
