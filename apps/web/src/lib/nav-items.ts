import { site } from './site';

export interface NavItem {
  href: string;
  label: string;
}

export const navItems: NavItem[] = [
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/projects', label: 'Projects' },
  { href: '/thinking', label: 'Thinking' },
  { href: '/now', label: 'Now' },
  { href: '/contact', label: 'Contact' },
];

export const footerLinks: NavItem[] = [
  { href: `mailto:${site.email}`, label: 'Email' },
  { href: site.github, label: 'GitHub' },
  { href: '/uses', label: 'Uses' },
];
