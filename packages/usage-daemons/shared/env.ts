import { z } from 'zod';

const schema = z.object({
  INGEST_URL: z.string().url(),               // e.g. https://yoursite.com/api/usage/ingest
  INGEST_SECRET: z.string().min(16),          // shared secret between daemon and API route
  DEVICE_NAME: z.string().min(1),             // e.g. mac-desktop
  ANTHROPIC_ADMIN_API_KEY: z.string().optional(),
  OPENAI_ADMIN_API_KEY: z.string().optional(),
  CCUSAGE_PATH: z.string().default('ccusage'),
});

export type DaemonEnv = z.infer<typeof schema>;

export function getEnv(): DaemonEnv {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid daemon env:', parsed.error.issues.map(i => i.path.join('.')).join(', '));
    process.exit(2);
  }
  return parsed.data;
}
