import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Uses' };

export default function UsesPage() {
  return (
    <ComingSoon
      titleEn="Uses"
      titleZh="装备清单"
      description="硬件/软件/服务清单将在 Phase 2 从 Notion uses database 拉取。"
    />
  );
}
