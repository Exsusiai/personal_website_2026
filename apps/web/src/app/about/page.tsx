import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import { TimelineSection } from '@/components/timeline/timeline-section';
import { getAboutBlocks } from '@/lib/cms/pages';
import { getTimeline } from '@/lib/cms/timeline';

export const revalidate = 300;

export const metadata: Metadata = { title: 'About' };

export default async function AboutPage() {
  const [blocks, timeline] = await Promise.all([getAboutBlocks(), getTimeline()]);

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="About" titleZh="我是谁" />
      <div className="prose-zh mx-auto max-w-[680px]">
        <NotionBlocks blocks={blocks} />
      </div>

      <div className="hairline-t mt-16 pt-16">
        <SectionHead titleEn="Timeline" titleZh="成长时间轴" />
        <TimelineSection nodes={timeline} />
      </div>
    </Container>
  );
}
