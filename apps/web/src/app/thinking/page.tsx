import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Thinking' };

export default function ThinkingPage() {
  return (
    <ComingSoon
      titleEn="Thinking"
      titleZh="业务思考"
      description="完整博客列表将在 Phase 2 从 Notion thinking database 拉取。"
    />
  );
}
