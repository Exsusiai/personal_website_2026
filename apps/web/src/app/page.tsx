import { Hero } from '@/components/home/hero';
import { FeaturedProjects } from '@/components/home/featured-projects';
import { ThinkingList } from '@/components/home/thinking-list';
import { TokenSection } from '@/components/home/token-section';
import { NowSection } from '@/components/home/now-section';
import { getSiteVisibility } from '@/lib/cms/site-visibility';

export const revalidate = 300;

export default async function HomePage() {
  const visibility = await getSiteVisibility();

  return (
    <>
      <Hero />
      <TokenSection />
      {visibility.projects && <FeaturedProjects />}
      {visibility.thinking && <ThinkingList />}
      <NowSection />
    </>
  );
}
