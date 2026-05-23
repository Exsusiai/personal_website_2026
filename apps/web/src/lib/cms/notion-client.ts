import { Client } from '@notionhq/client';
import { getEnv } from '@/lib/env';

let _client: Client | null = null;

export function getNotionClient(): Client {
  if (_client) return _client;
  _client = new Client({
    auth: getEnv().NOTION_TOKEN,
    notionVersion: '2022-06-28',
  });
  return _client;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseDelay = opts.baseDelayMs ?? 300;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const code = (err as { code?: string } | null)?.code;
      const isRetriable =
        code === 'rate_limited' ||
        code === 'service_unavailable' ||
        code === 'internal_server_error';
      if (!isRetriable || attempt === retries) throw err;
      const delay = baseDelay * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
