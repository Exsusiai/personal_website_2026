import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Hire me' };

export default function HireMePage() {
  return (
    <ComingSoon
      titleEn="Hire me"
      titleZh="联系方式"
      description="联系方式 + 合作意向将在 Phase 2 从 Notion hire-me page 拉取。"
    />
  );
}
