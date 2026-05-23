import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Resume' };

export default function ResumePage() {
  return (
    <ComingSoon
      titleEn="Resume"
      titleZh="简历"
      description="结构化简历 + PDF 下载将在 Phase 2 / Phase 5 实现。"
    />
  );
}
