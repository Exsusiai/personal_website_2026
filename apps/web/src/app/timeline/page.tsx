import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Timeline' };

export default function TimelinePage() {
  return (
    <ComingSoon
      titleEn="Timeline"
      titleZh="成长时间轴"
      description="纵向时间线将在 Phase 2 从 Notion timeline database 拉取。"
    />
  );
}
