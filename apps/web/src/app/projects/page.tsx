import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <ComingSoon
      titleEn="Projects"
      titleZh="项目"
      description="完整项目列表将在 Phase 2 从 Notion projects database 拉取。"
    />
  );
}
