import { Container } from '@/components/ui/container';
import { NowBlock } from './now-block';
import { TokenPreview } from './token-preview';

export function NowTokensDuo() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-[1.4fr_1fr]">
          <NowBlock />
          <TokenPreview />
        </div>
      </Container>
    </section>
  );
}
