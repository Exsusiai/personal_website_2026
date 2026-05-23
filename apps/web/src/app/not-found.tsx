import Link from 'next/link';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        404
      </div>
      <h1 className="mb-8 font-[family-name:var(--font-tight)] text-5xl font-semibold leading-[1.05] tracking-[-0.03em]">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          页面不存在
        </span>{' '}
        · Not Found
      </h1>
      <p className="font-[family-name:var(--font-zh-serif)] mb-6 text-lg leading-[1.75] text-[var(--color-text-2)]">
        你访问的页面不存在或已经被移走了。
      </p>
      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-accent)] hover:underline"
      >
        ← BACK TO HOME
      </Link>
    </Container>
  );
}
