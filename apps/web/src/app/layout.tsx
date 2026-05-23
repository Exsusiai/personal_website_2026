import type { Metadata } from 'next';
import { fontClassNames } from '@/lib/fonts';
import { TopNav } from '@/components/nav/top-nav';
import { Footer } from '@/components/nav/footer';
import { site } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${site.nameZh} ${site.name}`,
    template: `%s · ${site.nameZh}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
  openGraph: {
    title: `${site.nameZh} ${site.name}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={site.locale} className={fontClassNames}>
      <body className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
