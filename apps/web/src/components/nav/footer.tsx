import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { footerLinks } from '@/lib/nav-items';
import { site } from '@/lib/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="hairline-t mt-24 py-12">
      <Container className="flex flex-col gap-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)] sm:flex-row sm:justify-between">
        <div>
          © {year} {site.nameZh} · Built with Next.js
        </div>
        <ul className="flex gap-6">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
