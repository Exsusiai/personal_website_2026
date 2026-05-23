import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Tokens' };

export default function TokensPage() {
  return (
    <ComingSoon
      titleEn="Token Usage"
      titleZh="用量看板"
      description="多平台 + 多设备 Token 用量看板将在 Phase 4 上线。"
    />
  );
}
