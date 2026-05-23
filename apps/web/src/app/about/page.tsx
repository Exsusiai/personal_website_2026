import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <ComingSoon
      titleEn="About"
      titleZh="我是谁"
      description="完整版自我介绍将在 Phase 2 从 Notion 拉取。"
    />
  );
}
