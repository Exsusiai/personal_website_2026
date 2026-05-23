import { z } from 'zod';

const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1, 'NOTION_TOKEN required'),
  NOTION_DB_PROJECTS: z.string().min(32),
  NOTION_DB_THINKING: z.string().min(32),
  NOTION_DB_RESUME: z.string().min(32),
  NOTION_DB_USES: z.string().min(32),
  NOTION_DB_TIMELINE: z.string().min(32),
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
