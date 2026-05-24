import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import { parseTitle, parseSelect, parseNumber, parseFiles } from './parsers';
import type { TimelineNode, TimelineType } from './types';

export function mapTimelineFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): TimelineNode {
  const p = page.properties;
  return {
    id: page.id,
    year: parseNumber(p['Year'] as never) ?? 0,
    month: parseNumber(p['Month'] as never),
    title: parseTitle(p['Title'] as never),
    type: (parseSelect(p['Type'] as never) ?? 'Milestone') as TimelineType,
    coverUrl: parseFiles(p['Cover'] as never),
    order: parseNumber(p['Order'] as never) ?? 999,
  };
}

export function sortTimelineNodes(nodes: TimelineNode[]): TimelineNode[] {
  return [...nodes].sort((a, b) => {
    // Year descending
    if (b.year !== a.year) return b.year - a.year;
    // Month descending, nulls last
    if (a.month === null && b.month === null) return a.order - b.order;
    if (a.month === null) return 1;
    if (b.month === null) return -1;
    if (b.month !== a.month) return b.month - a.month;
    // Order ascending
    return a.order - b.order;
  });
}

export async function getTimeline(): Promise<TimelineNode[]> {
  const client = getNotionClient();
  const allNodes: TimelineNode[] = [];
  let cursor: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.dataSources.query({
        data_source_id: getEnv().NOTION_DS_TIMELINE,
        start_cursor: cursor,
        page_size: 100,
      }),
    );
    for (const r of resp.results) {
      if ('properties' in r) {
        allNodes.push(mapTimelineFromNotion(r as never));
      }
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);

  return sortTimelineNodes(allNodes);
}
