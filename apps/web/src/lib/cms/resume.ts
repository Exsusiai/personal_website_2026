import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import { parseTitle, parseRichText, parseSelect, parseMultiSelect, parseNumber, parseDate } from './parsers';
import type { ResumeItem, ResumeBundle, ResumeType } from './types';

export function mapResumeFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): ResumeItem {
  const p = page.properties;
  const locationText = parseRichText(p['Location'] as never);
  return {
    id: page.id,
    type: (parseSelect(p['Type'] as never) ?? 'Skill') as ResumeType,
    title: parseTitle(p['Title'] as never),
    org: parseRichText(p['Org'] as never),
    location: locationText.length > 0 ? locationText : null,
    startDate: parseDate(p['StartDate'] as never)?.start ?? '',
    endDate: parseDate(p['EndDate'] as never)?.start ?? null,
    tags: parseMultiSelect(p['Tags'] as never),
    order: parseNumber(p['Order'] as never) ?? 999,
  };
}

export function groupResumeItems(items: ResumeItem[]): ResumeBundle {
  const bundle: ResumeBundle = {
    experience: [],
    education: [],
    skill: [],
    award: [],
  };
  for (const item of items) {
    const key = item.type.toLowerCase() as keyof ResumeBundle;
    bundle[key].push(item);
  }
  // Sort within each group: Order asc, then StartDate desc
  const sortGroup = (arr: ResumeItem[]) =>
    arr.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.startDate.localeCompare(a.startDate);
    });
  sortGroup(bundle.experience);
  sortGroup(bundle.education);
  sortGroup(bundle.skill);
  sortGroup(bundle.award);
  return bundle;
}

export async function getResume(): Promise<ResumeBundle> {
  const client = getNotionClient();
  const allItems: ResumeItem[] = [];
  let cursor: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.dataSources.query({
        data_source_id: getEnv().NOTION_DS_RESUME,
        filter: { property: 'Published', checkbox: { equals: true } } as never,
        start_cursor: cursor,
        page_size: 100,
      }),
    );
    for (const r of resp.results) {
      if ('properties' in r) {
        allItems.push(mapResumeFromNotion(r as never));
      }
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);

  return groupResumeItems(allItems);
}
