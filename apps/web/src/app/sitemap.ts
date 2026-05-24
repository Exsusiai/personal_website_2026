import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { listProjects } from '@/lib/cms/projects';
import { listThinking } from '@/lib/cms/thinking';

export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, '');

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/about`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resume`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/projects`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/thinking`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/now`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/uses`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Dynamic routes from Notion — wrap in try/catch since Notion may be down at build time
  let projectRoutes: MetadataRoute.Sitemap = [];
  let articleRoutes: MetadataRoute.Sitemap = [];

  try {
    const projects = await listProjects();
    projectRoutes = projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn('sitemap: failed to fetch projects:', (e as Error).message);
  }

  try {
    const articles = await listThinking();
    articleRoutes = articles.map((a) => ({
      url: `${base}/thinking/${a.slug}`,
      lastModified: new Date(a.publishedDate || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn('sitemap: failed to fetch articles:', (e as Error).message);
  }

  return [...staticRoutes, ...projectRoutes, ...articleRoutes];
}
