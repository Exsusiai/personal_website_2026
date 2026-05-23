import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import {
  parseTitle,
  parseRichText,
  parseMultiSelect,
  parseNumber,
  parseDate,
  parseFiles,
} from './parsers';
import type { Article } from './types';

export function mapArticleFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): Article {
  const p = page.properties;
  return {
    id: page.id,
    slug: parseRichText(p['Slug'] as never),
    title: parseTitle(p['Title'] as never),
    summary: parseRichText(p['Summary'] as never),
    tags: parseMultiSelect(p['Tags'] as never),
    coverUrl: parseFiles(p['Cover'] as never),
    publishedDate: parseDate(p['PublishedDate'] as never)?.start ?? '',
    readTime: parseNumber(p['ReadTime'] as never) ?? 0,
  };
}

export interface ListThinkingOpts {
  tag?: string;
  limit?: number;
}

export async function listThinking(opts: ListThinkingOpts = {}): Promise<Article[]> {
  const client = getNotionClient();
  const andFilters: unknown[] = [{ property: 'Published', checkbox: { equals: true } }];
  if (opts.tag) {
    andFilters.push({ property: 'Tags', multi_select: { contains: opts.tag } });
  }

  const resp = await withRetry(() =>
    client.dataSources.query({
      data_source_id: getEnv().NOTION_DB_THINKING,
      filter: { and: andFilters } as never,
      sorts: [{ property: 'PublishedDate', direction: 'descending' }],
      page_size: opts.limit ?? 100,
    }),
  );

  return resp.results
    .filter(
      (r): r is typeof r & { properties: Record<string, unknown> } => 'properties' in r,
    )
    .map(mapArticleFromNotion);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const client = getNotionClient();
  const resp = await withRetry(() =>
    client.dataSources.query({
      data_source_id: getEnv().NOTION_DB_THINKING,
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: slug } },
          { property: 'Published', checkbox: { equals: true } },
        ],
      } as never,
      page_size: 1,
    }),
  );
  const first = resp.results[0];
  if (!first || !('properties' in first)) return null;
  return mapArticleFromNotion(first as never);
}
