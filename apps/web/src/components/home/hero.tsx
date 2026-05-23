import { Container } from '@/components/ui/container';
import { site } from '@/lib/site';

export function Hero() {
  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        {site.nameZh} · Engineer / Builder
      </div>

      <h1 className="mb-8 max-w-[760px] font-[family-name:var(--font-tight)] text-5xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          在机械与软件之间
        </span>
        <br />
        Building products at the intersection of{' '}
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          硬件、算法与人
        </span>
        .
      </h1>

      <p className="font-[family-name:var(--font-zh-serif)] mb-10 max-w-[600px] text-lg leading-[1.75]">
        我是一名同时在写代码与画机械图的工程师。这个网站记录我做过的项目、读过的书、烧掉的 token，以及一些关于产品与业务的不成熟的想法。
      </p>

      <div className="font-[family-name:var(--font-mono)] flex flex-col gap-2 text-[13px] text-[var(--color-text-2)] sm:flex-row sm:gap-6">
        <span>
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] align-middle" />
          Now · 在做个人主页与 Finance Tracker
        </span>
        <span>{site.location}</span>
      </div>
    </Container>
  );
}
