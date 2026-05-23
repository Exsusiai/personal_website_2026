import { Container } from '@/components/ui/container';

interface ComingSoonProps {
  titleEn: string;
  titleZh: string;
  description?: string;
}

export function ComingSoon({ titleEn, titleZh, description }: ComingSoonProps) {
  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Phase 1 · Placeholder
      </div>
      <h1 className="mb-8 max-w-[760px] font-[family-name:var(--font-tight)] text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          {titleZh}
        </span>{' '}
        · {titleEn}
      </h1>
      <p className="font-[family-name:var(--font-zh-serif)] max-w-[600px] text-lg leading-[1.75] text-[var(--color-text-2)]">
        {description ??
          '这个页面将在 Phase 2 接入 Notion 后填充真实内容。'}
      </p>
    </Container>
  );
}
