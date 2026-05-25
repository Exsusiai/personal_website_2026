import { getNotionClient, withRetry } from './notion-client';
import { parseTitle, parseRichText } from './parsers';

export interface HeroContent {
  eyebrow: string;
  titleOpening: string; // rendered with zh-serif font (highlight effect)
  titleBody: string;    // rendered with tight font
  lead: string;
  status: string;
  location: string;
}

const FALLBACK: HeroContent = {
  eyebrow: '陈敬升 · Engineer / Builder',
  titleOpening: '在机械与软件之间',
  titleBody: 'Building products at the intersection of 硬件、算法与人.',
  lead: '我是一名同时在写代码与画机械图的工程师。这个网站记录我做过的项目、读过的书、烧掉的 token，以及一些关于产品与业务的不成熟的想法。',
  status: '在做个人主页',
  location: 'Shenzhen · Beijing',
};

export async function getHomeHero(): Promise<HeroContent> {
  const dsId = process.env.NOTION_DS_HOME_HERO;
  if (!dsId) return FALLBACK;
  try {
    const client = getNotionClient();
    const resp = await withRetry(() =>
      client.dataSources.query({
        data_source_id: dsId,
        sorts: [{ property: 'Order', direction: 'ascending' }],
        page_size: 20,
      }),
    );
    const map = new Map<string, string>();
    for (const r of resp.results) {
      if (!('properties' in r)) continue;
      const props = (r as { properties: Record<string, unknown> }).properties;
      const key = parseTitle(props['Key'] as never);
      const value = parseRichText(props['Value'] as never);
      if (key) map.set(key, value);
    }
    return {
      eyebrow: map.get('eyebrow') ?? FALLBACK.eyebrow,
      titleOpening: map.get('title.opening') ?? FALLBACK.titleOpening,
      titleBody: map.get('title.body') ?? FALLBACK.titleBody,
      lead: map.get('lead') ?? FALLBACK.lead,
      status: map.get('status') ?? FALLBACK.status,
      location: map.get('location') ?? FALLBACK.location,
    };
  } catch {
    return FALLBACK;
  }
}
