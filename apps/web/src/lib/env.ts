import { z } from 'zod';

/**
 * Notion uses two distinct IDs in API 2025-09-03+:
 *   - database_id  : the database container
 *   - data_source_id: the queryable data source inside the database (1:1 for simple databases)
 *
 * SDK v5's `dataSources.query` requires the data_source_id, NOT the database_id.
 * Our env vars store data_source IDs, hence the NOTION_DS_* naming.
 */
const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1, 'NOTION_TOKEN required'),
  NOTION_DS_PROJECTS: z.string().min(32),
  NOTION_DS_THINKING: z.string().min(32),
  NOTION_DS_RESUME: z.string().min(32),
  NOTION_DS_USES: z.string().min(32),
  NOTION_DS_TIMELINE: z.string().min(32),
  NOTION_PAGE_ABOUT: z.string().min(32),
  NOTION_PAGE_NOW: z.string().min(32),
  NOTION_PAGE_CONTACT: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${paths}`);
  }
  cached = result.data;
  return cached;
}
