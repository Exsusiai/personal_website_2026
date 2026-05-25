import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { navItems } from '@/lib/nav-items';
import { site } from '@/lib/site';
import { getSiteVisibility } from '@/lib/cms/site-visibility';
import type { SiteVisibility } from '@/lib/cms/site-visibility';

export async function TopNav() {
  const visibility: SiteVisibility = await getSiteVisibility();

  const visibleItems = navItems.filter(
    (item) => !item.module || visibility[item.module],
  );

  return (
    <nav
      className="sticky top-0 z-10 hairline-b bg-[var(--color-bg)]/90 backdrop-blur"
      aria-label="Primary"
    >
      <Container as="div" className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-tight)] text-lg font-bold tracking-tight"
          aria-label={site.name + ' homepage'}
        >
          {site.monogram}
        </Link>
        <ul className="flex gap-8">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
