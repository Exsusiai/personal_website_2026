import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { NotionBlocks } from '@/components/notion/notion-blocks';
import { getContactBlocks } from '@/lib/cms/pages';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage() {
  const blocks = await getContactBlocks();

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Contact" titleZh="联系方式" />
      <div className="prose-zh mx-auto max-w-[680px]">
        <NotionBlocks blocks={blocks} />
      </div>
    </Container>
  );
}
