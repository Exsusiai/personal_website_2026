import { site } from './site';

export interface NavItem {
  href: string;
  label: string;
  module?: 'projects' | 'resume' | 'thinking' | 'uses' | 'timeline' | 'contact';
}

// Full nav list with optional visibility module. TopNav filters by visibility at render time.
export const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume', module: 'resume' },
  { href: '/projects', label: 'Projects', module: 'projects' },
  { href: '/thinking', label: 'Thinking', module: 'thinking' },
  { href: '/contact', label: 'Contact', module: 'contact' },
];

export const footerLinks: NavItem[] = [
  { href: `mailto:${site.email}`, label: 'Email' },
  { href: site.github, label: 'GitHub' },
  { href: '/uses', label: 'Uses', module: 'uses' },
];
