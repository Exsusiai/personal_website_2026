import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import { parseTitle, parseRichText, parseSelect, parseNumber, parseUrl } from './parsers';
import type { UsesItem, UsesGrouped, UsesCategory } from './types';

export function mapUsesFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): UsesItem {
  const p = page.properties;
  const subcategoryText = parseRichText(p['Subcategory'] as never);
  const brandText = parseRichText(p['Brand'] as never);
  const noteText = parseRichText(p['Note'] as never);
  return {
    id: page.id,
    title: parseTitle(p['Title'] as never),
    category: (parseSelect(p['Category'] as never) ?? 'Software') as UsesCategory,
    subcategory: subcategoryText.length > 0 ? subcategoryText : null,
    brand: brandText.length > 0 ? brandText : null,
    note: noteText.length > 0 ? noteText : null,
    url: parseUrl(p['URL'] as never),
    yearStarted: parseNumber(p['YearStarted'] as never) ?? 0,
  };
}

export function groupUsesItems(items: UsesItem[]): UsesGrouped {
  const grouped: UsesGrouped = { hardware: [], software: [], service: [] };
  for (const item of items) {
    const key = item.category.toLowerCase() as keyof UsesGrouped;
    grouped[key].push(item);
  }
  // Sort within each group: YearStarted desc, then Title asc
  const sortGroup = (arr: UsesItem[]) =>
    arr.sort((a, b) => {
      if (b.yearStarted !== a.yearStarted) return b.yearStarted - a.yearStarted;
      return a.title.localeCompare(b.title);
    });
  sortGroup(grouped.hardware);
  sortGroup(grouped.software);
  sortGroup(grouped.service);
  return grouped;
}

export async function getUses(): Promise<UsesGrouped> {
  const client = getNotionClient();
  const allItems: UsesItem[] = [];
  let cursor: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.databases.query({
        database_id: getEnv().NOTION_DB_USES,
        start_cursor: cursor,
        page_size: 100,
      }),
    );
    for (const r of resp.results) {
      if ('properties' in r) {
        allItems.push(mapUsesFromNotion(r as never));
      }
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);

  return groupUsesItems(allItems);
}
