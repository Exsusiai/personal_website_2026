import { Container } from '@/components/ui/container';
import { getHomeHero } from '@/lib/cms/home-hero';

export async function Hero() {
  const hero = await getHomeHero();

  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        {hero.eyebrow}
      </div>

      <h1 className="mb-8 max-w-[760px] font-[family-name:var(--font-tight)] text-5xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          {hero.titleOpening}
        </span>
        <br />
        {hero.titleBody}
      </h1>

      <p className="font-[family-name:var(--font-zh-serif)] mb-10 max-w-[600px] text-lg leading-[1.75]">
        {hero.lead}
      </p>

      <div className="font-[family-name:var(--font-mono)] flex flex-col gap-2 text-[13px] text-[var(--color-text-2)] sm:flex-row sm:gap-6">
        <span>
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] align-middle" />
          Now · {hero.status}
        </span>
        <span>{hero.location}</span>
      </div>
    </Container>
  );
}
