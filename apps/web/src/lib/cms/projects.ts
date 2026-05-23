import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import {
  parseTitle,
  parseRichText,
  parseSelect,
  parseMultiSelect,
  parseNumber,
  parseCheckbox,
  parseUrl,
  parseFiles,
} from './parsers';
import type { Project } from './types';

export function mapProjectFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): Project {
  const p = page.properties;
  return {
    id: page.id,
    slug: parseRichText(p['Slug'] as never),
    title: parseTitle(p['Title'] as never),
    type: (parseSelect(p['Type'] as never) ?? 'Other') as Project['type'],
    status: (parseSelect(p['Status'] as never) ?? 'Draft') as Project['status'],
    year: parseNumber(p['Year'] as never) ?? 0,
    summary: parseRichText(p['Summary'] as never),
    coverUrl: parseFiles(p['Cover'] as never),
    tags: parseMultiSelect(p['Tags'] as never),
    stack: parseMultiSelect(p['Stack'] as never),
    repoUrl: parseUrl(p['RepoURL'] as never),
    demoUrl: parseUrl(p['DemoURL'] as never),
    modelGlbUrl: parseUrl(p['ModelGLB_URL'] as never),
    featured: parseCheckbox(p['Featured'] as never),
    order: parseNumber(p['Order'] as never) ?? 999,
  };
}

export interface ListProjectsOpts {
  featured?: boolean;
  limit?: number;
}

export async function listProjects(opts: ListProjectsOpts = {}): Promise<Project[]> {
  const client = getNotionClient();
  const filter: { and: unknown[] } = {
    and: [{ property: 'Published', checkbox: { equals: true } }],
  };
  if (opts.featured !== undefined) {
    filter.and.push({ property: 'Featured', checkbox: { equals: opts.featured } });
  }

  const resp = await withRetry(() =>
    client.databases.query({
      database_id: getEnv().NOTION_DB_PROJECTS,
      filter,
      sorts: [{ property: 'Order', direction: 'ascending' }],
      page_size: opts.limit ?? 100,
    }),
  );

  return resp.results
    .filter(
      (r): r is typeof r & { properties: Record<string, unknown> } => 'properties' in r,
    )
    .map(mapProjectFromNotion);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const client = getNotionClient();
  const resp = await withRetry(() =>
    client.databases.query({
      database_id: getEnv().NOTION_DB_PROJECTS,
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: slug } },
          { property: 'Published', checkbox: { equals: true } },
        ],
      },
      page_size: 1,
    }),
  );
  const first = resp.results[0];
  if (!first || !('properties' in first)) return null;
  return mapProjectFromNotion(first as never);
}
