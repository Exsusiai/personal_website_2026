import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { NowBlock } from './now-block';

export function NowSection() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <div className="border border-[var(--color-border)]">
          <NowBlock />
        </div>
        <div className="mt-4 text-right">
          <Link
            href="/now"
            className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)] hover:text-[var(--color-accent)]"
          >
            FULL NOW PAGE →
          </Link>
        </div>
      </Container>
    </section>
  );
}
