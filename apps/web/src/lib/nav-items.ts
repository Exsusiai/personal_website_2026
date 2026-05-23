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
  { href: '/timeline', label: 'Timeline' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/now', label: 'Now' },
];

export const footerLinks: NavItem[] = [
  { href: `mailto:${site.email}`, label: 'Email' },
  { href: site.github, label: 'GitHub' },
  { href: '/hire-me', label: 'Hire me' },
  { href: '/uses', label: 'Uses' },
];
