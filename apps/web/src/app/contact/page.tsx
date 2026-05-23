import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <ComingSoon
      titleEn="Contact"
      titleZh="联系方式"
      description="完整版联系方式（邮箱 / 社交账号 / 合作意向）将在 Phase 2 从 Notion 拉取。"
    />
  );
}
