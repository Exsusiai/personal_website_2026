import { getEnv } from '../shared/env.js';
import { postEvents } from '../shared/usage-client.js';
import type { UsageEvent } from '../shared/types.js';

/**
 * OpenAI Organization Usage API:
 *   GET https://api.openai.com/v1/organization/usage/completions
 *   Header: Authorization: Bearer <OPENAI_ADMIN_API_KEY>  (admin key from org settings)
 *   Query: start_time=<unix>, end_time=<unix>, bucket_width=1d, group_by[]=model
 *
 * Reference: https://cookbook.openai.com/examples/completions_usage_api
 */

interface OpenAIUsageResult {
  input_tokens: number;
  output_tokens: number;
  num_model_requests: number;
  model?: string;
}

interface OpenAIBucket {
  start_time: number;            // unix seconds
  end_time: number;
  results: OpenAIUsageResult[];
}

interface OpenAIUsageResponse {
  data: OpenAIBucket[];
  has_more: boolean;
  next_page?: string | null;
}

async function fetchOpenAIUsage(apiKey: string, sinceSec: number): Promise<OpenAIBucket[]> {
  const url = new URL('https://api.openai.com/v1/organization/usage/completions');
  url.searchParams.set('start_time', String(sinceSec));
  url.searchParams.set('bucket_width', '1d');
  url.searchParams.append('group_by[]', 'model');

  const all: OpenAIBucket[] = [];
  let nextUrl: string | null = url.toString();
  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) {
      throw new Error(`OpenAI usage API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as OpenAIUsageResponse;
    all.push(...json.data);
    nextUrl = json.has_more ? (json.next_page ?? null) : null;
  }
  return all;
}

function toEvents(buckets: OpenAIBucket[], device: string): UsageEvent[] {
  const out: UsageEvent[] = [];
  for (const b of buckets) {
    const isoStart = new Date(b.start_time * 1000).toISOString();
    for (const r of b.results) {
      out.push({
        ts: isoStart,
        device,
        platform: 'openai',
        model: r.model ?? 'unknown',
        input_tokens: r.input_tokens,
        output_tokens: r.output_tokens,
        cost_usd: 0,                    // backfill from /v1/organization/costs in future
        session_id: null,
        source: 'openai-usage-api',
      });
    }
  }
  return out;
}

async function main() {
  const env = getEnv();
  if (!env.OPENAI_ADMIN_API_KEY) {
    console.error('[openai-poller] OPENAI_ADMIN_API_KEY not set, exiting');
    process.exit(2);
  }
  const sinceSec = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  console.log(`[openai-poller] device=${env.DEVICE_NAME} since=${new Date(sinceSec * 1000).toISOString()}`);

  const buckets = await fetchOpenAIUsage(env.OPENAI_ADMIN_API_KEY, sinceSec);
  const events = toEvents(buckets, env.DEVICE_NAME);
  console.log(`[openai-poller] mapped ${events.length} events`);

  if (events.length > 0) {
    const result = await postEvents(events);
    console.log(`[openai-poller] inserted=${result.inserted} skipped_duplicates=${result.skipped_duplicates}`);
  }
  console.log(`[openai-poller] done`);
}

main().catch((err: Error) => {
  console.error(`[openai-poller] ERROR: ${err.message}`);
  process.exit(1);
});
