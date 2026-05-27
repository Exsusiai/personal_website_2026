import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import {
  parseTitle,
  parseRichText,
  parseSelect,
  parseMultiSelect,
  parseNumber,
  parseDate,
  parseUrl,
  parseFiles,
  parseEnum,
} from './parsers';
import { getBlockChildren } from './blocks';
import type {
  ResumeItem,
  ResumeBundle,
  ResumeType,
  SkillCategory,
  ProjectType,
  FocusArea,
} from './types';

const RESUME_TYPES: readonly ResumeType[] = ['Experience', 'Education', 'Skill', 'Award', 'Project'];
const SKILL_CATEGORIES: readonly SkillCategory[] = ['Programming', 'Mechanical', 'Engineering', 'AI'];
const PROJECT_TYPES: readonly ProjectType[] = ['Personal', 'Independent', 'Course', 'Internship', 'OpenSource'];
const FOCUS_AREAS: readonly FocusArea[] = ['Software', 'Mechanical', 'AI', 'Robotics', 'Universal'];

/** Types whose body content (bulleted-list children) is part of the rendered
 * resume. Skill / Education / Award rows typically have no body so we skip the
 * extra fetch to keep page TTFB low. */
const TYPES_WITH_BODY: readonly ResumeType[] = ['Experience', 'Project'];

export function mapResumeFromNotion(page: {
  id: string;
  properties: Record<string, unknown>;
}): ResumeItem {
  const p = page.properties;
  const locationText = parseRichText(p['Location'] as never);
  const rawCategory = parseSelect(p['Category'] as never);
  const rawProjectType = parseSelect(p['ProjectType'] as never);
  const rawFocusAreas = parseMultiSelect(p['FocusArea'] as never).filter(
    (f): f is FocusArea => (FOCUS_AREAS as readonly string[]).includes(f),
  );
  return {
    id: page.id,
    type: parseEnum(parseSelect(p['Type'] as never), RESUME_TYPES, 'Skill', 'Resume.Type'),
    title: parseTitle(p['Title'] as never),
    org: parseRichText(p['Org'] as never),
    location: locationText.length > 0 ? locationText : null,
    startDate: parseDate(p['StartDate'] as never)?.start ?? '',
    endDate: parseDate(p['EndDate'] as never)?.start ?? null,
    summary: parseRichText(p['Summary'] as never),
    tags: parseMultiSelect(p['Tags'] as never),
    focusAreas: rawFocusAreas,
    order: parseNumber(p['Order'] as never) ?? 999,
    category: rawCategory
      ? parseEnum(rawCategory, SKILL_CATEGORIES, 'Programming', 'Resume.Category')
      : null,
    level: parseNumber(p['Level'] as never),
    projectType: rawProjectType
      ? parseEnum(rawProjectType, PROJECT_TYPES, 'Personal', 'Resume.ProjectType')
      : null,
    repoUrl: parseUrl(p['RepoUrl'] as never),
    demoUrl: parseUrl(p['DemoUrl'] as never),
    imageUrl: parseFiles(p['ImageUrl'] as never),
    details: [],
  };
}

export function groupResumeItems(items: ResumeItem[]): ResumeBundle {
  const bundle: ResumeBundle = {
    experience: [],
    education: [],
    project: [],
    skill: [],
    award: [],
  };
  for (const item of items) {
    // type already validated against RESUME_TYPES at parse time.
    const key = item.type.toLowerCase() as keyof ResumeBundle;
    bundle[key].push(item);
  }
  // Sort within each group: Order asc, then StartDate desc.
  const sortGroup = (arr: ResumeItem[]) =>
    arr.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.startDate.localeCompare(a.startDate);
    });
  sortGroup(bundle.experience);
  sortGroup(bundle.education);
  sortGroup(bundle.project);
  sortGroup(bundle.skill);
  sortGroup(bundle.award);
  return bundle;
}

/**
 * Fetch the resume bundle. Performance notes:
 *  - One paginated query against the Resume data source.
 *  - Body block children only fetched for Experience + Project rows (others
 *    have no bullet detail to render). Fetches run in parallel.
 */
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

  // Parallel body fetch for items that actually use it.
  await Promise.all(
    allItems
      .filter((it) => (TYPES_WITH_BODY as readonly string[]).includes(it.type))
      .map(async (it) => {
        try {
          it.details = await getBlockChildren(it.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[resume] body fetch failed for "${it.title}" (${it.id}): ${msg}`);
        }
      }),
  );

  return groupResumeItems(allItems);
}

/** True if the item should be visible under the given focus filter. Universal
 * always shows; null/undefined focus means "no filter" → everything visible. */
export function matchesFocus(item: ResumeItem, focus: FocusArea | null): boolean {
  if (!focus) return true;
  return item.focusAreas.includes(focus) || item.focusAreas.includes('Universal');
}

export function filterBundle(bundle: ResumeBundle, focus: FocusArea | null): ResumeBundle {
  if (!focus) return bundle;
  return {
    experience: bundle.experience.filter((i) => matchesFocus(i, focus)),
    education: bundle.education.filter((i) => matchesFocus(i, focus)),
    project: bundle.project.filter((i) => matchesFocus(i, focus)),
    skill: bundle.skill.filter((i) => matchesFocus(i, focus)),
    award: bundle.award.filter((i) => matchesFocus(i, focus)),
  };
}

export { FOCUS_AREAS };
