import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import { queryAll } from './paginated-query';
import {
  parseTitle,
  parseRichText,
  parseSelect,
  parseMultiSelect,
  parseNumber,
  parseCheckbox,
  parseUrl,
  parseFiles,
  parseEnum,
} from './parsers';
import type { Project } from './types';

const PROJECT_TYPES: readonly Project['type'][] = ['Software', 'Mechanical', 'AI', 'Other'];
const PROJECT_STATUSES: readonly Project['status'][] = ['Active', 'Archived', 'Draft'];

export function mapProjectFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): Project {
  const p = page.properties;
  return {
    id: page.id,
    slug: parseRichText(p['Slug'] as never),
    title: parseTitle(p['Title'] as never),
    type: parseEnum(parseSelect(p['Type'] as never), PROJECT_TYPES, 'Other', 'Project.Type'),
    status: parseEnum(parseSelect(p['Status'] as never), PROJECT_STATUSES, 'Draft', 'Project.Status'),
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
  const filter: { and: unknown[] } = {
    and: [{ property: 'Published', checkbox: { equals: true } }],
  };
  if (opts.featured !== undefined) {
    filter.and.push({ property: 'Featured', checkbox: { equals: opts.featured } });
  }

  return queryAll(
    {
      dataSourceId: getEnv().NOTION_DS_PROJECTS,
      filter,
      sorts: [{ property: 'Order', direction: 'ascending' }],
      limit: opts.limit,
    },
    mapProjectFromNotion,
  );
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const client = getNotionClient();
  const resp = await withRetry(() =>
    client.dataSources.query({
      data_source_id: getEnv().NOTION_DS_PROJECTS,
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
  return mapProjectFromNotion(first as never);
}
