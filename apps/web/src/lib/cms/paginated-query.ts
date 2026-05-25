import { getNotionClient, withRetry } from './notion-client';

/**
 * Pages through every result of a Notion `dataSources.query`. Stops early if
 * `limit` is reached. Without this helper, single-shot calls with
 * `page_size: opts.limit ?? 100` silently truncated after the first 100 rows,
 * which made `projects` and `thinking` index pages drop older entries.
 */
export interface PaginatedQueryOpts {
  dataSourceId: string;
  filter?: unknown;
  sorts?: unknown;
  /** Hard cap on rows returned. Omit to fetch every published row. */
  limit?: number;
}

type NotionPage = { id: string; properties: Record<string, unknown> };

export async function queryAll<T>(
  opts: PaginatedQueryOpts,
  mapPage: (page: NotionPage) => T,
): Promise<T[]> {
  const client = getNotionClient();
  const out: T[] = [];
  let cursor: string | undefined;

  while (true) {
    const remaining = opts.limit !== undefined ? Math.max(0, opts.limit - out.length) : undefined;
    if (remaining === 0) break;
    const pageSize = remaining !== undefined ? Math.min(100, remaining) : 100;

    const resp = await withRetry(() =>
      client.dataSources.query({
        data_source_id: opts.dataSourceId,
        filter: opts.filter as never,
        sorts: opts.sorts as never,
        start_cursor: cursor,
        page_size: pageSize,
      }),
    );

    for (const r of resp.results) {
      if ('properties' in r) {
        out.push(mapPage(r as NotionPage));
        if (opts.limit !== undefined && out.length >= opts.limit) return out;
      }
    }

    cursor = resp.next_cursor ?? undefined;
    if (!cursor) break;
  }

  return out;
}
