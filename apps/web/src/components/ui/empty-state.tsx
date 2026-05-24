interface EmptyStateProps {
  titleEn: string;
  titleZh: string;
  hint: string;
}

export function EmptyState({ titleEn, titleZh, hint }: EmptyStateProps) {
  return (
    <div className="py-20 text-center">
      <div className="font-[family-name:var(--font-tight)] mb-3 text-2xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          {titleZh}
        </span>
        {' · '}
        {titleEn}
      </div>
      <p className="text-sm text-[var(--color-text-2)]">{hint}</p>
    </div>
  );
}
