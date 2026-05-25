import { getBlockChildren } from './blocks';

export interface SiteVisibility {
  projects: boolean;
  resume: boolean;
  thinking: boolean;
  uses: boolean;
  timeline: boolean;
  contact: boolean;
}

const DEFAULT_ALL_VISIBLE: SiteVisibility = {
  projects: true,
  resume: true,
  thinking: true,
  uses: true,
  timeline: true,
  contact: true,
};

export async function getSiteVisibility(): Promise<SiteVisibility> {
  const rootId = process.env.NOTION_PAGE_ROOT;
  if (!rootId) return DEFAULT_ALL_VISIBLE;
  try {
    const blocks = await getBlockChildren(rootId);
    const visibility: Partial<SiteVisibility> = {};
    for (const b of blocks) {
      if (b.type !== 'to_do') continue;
      const todo = (b as { to_do?: { rich_text?: { plain_text: string }[]; checked: boolean } })
        .to_do;
      if (!todo) continue;
      const text = (todo.rich_text ?? [])
        .map((r) => r.plain_text)
        .join('')
        .trim();
      const m = text.match(/^show:(\w+)$/i);
      if (!m) continue;
      const key = m[1].toLowerCase() as keyof SiteVisibility;
      if (key in DEFAULT_ALL_VISIBLE) {
        visibility[key] = !!todo.checked;
      }
    }
    return { ...DEFAULT_ALL_VISIBLE, ...visibility };
  } catch {
    return DEFAULT_ALL_VISIBLE;
  }
}
