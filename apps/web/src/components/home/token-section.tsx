import { Container } from '@/components/ui/container';
import { TokenPreview } from './token-preview';

export function TokenSection() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <div className="border border-[var(--color-border)]">
          <TokenPreview />
        </div>
      </Container>
    </section>
  );
}
