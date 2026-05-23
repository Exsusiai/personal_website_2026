import { Hero } from '@/components/home/hero';
import { FeaturedProjects } from '@/components/home/featured-projects';
import { NowTokensDuo } from '@/components/home/now-tokens-duo';
import { ThinkingList } from '@/components/home/thinking-list';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <NowTokensDuo />
      <ThinkingList />
    </>
  );
}
