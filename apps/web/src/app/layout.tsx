import type { Metadata } from 'next';
import { fontClassNames } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '陈敬升 Jason Chen',
    template: '%s · 陈敬升',
  },
  description: '工程师 / Builder · 个人门户、项目、思考',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={fontClassNames}>
      <body>{children}</body>
    </html>
  );
}
