import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Now' };

export default function NowPage() {
  return (
    <ComingSoon
      titleEn="Now"
      titleZh="近况"
      description="当下在忙什么，将在 Phase 2 从 Notion now page 拉取。"
    />
  );
}
