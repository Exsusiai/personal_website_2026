import { getEnv } from '../shared/env.js';
import { postEvents } from '../shared/usage-client.js';
import type { UsageEvent } from '../shared/types.js';

/**
 * Anthropic Organization Usage Report API (released 2026):
 *   GET https://api.anthropic.com/v1/organizations/usage_report/messages
 *   Header: x-api-key: <ANTHROPIC_ADMIN_API_KEY>  (admin-level, not workspace)
 *   Header: anthropic-version: 2023-06-01
 *   Query: starting_at=<ISO>, ending_at=<ISO>, group_by[]=model
 *
 * Returns per-model token totals. We emit one UsageEvent per (day, model) bucket.
 *
 * Reference: https://platform.claude.com/docs/en/build-with-claude/usage-cost-api
 * Shape and exact endpoint may evolve — VERIFY against current docs before scheduling.
 */

interface AnthropicUsageBucket {
  starting_at: string;
  ending_at: string;
  model?: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

interface AnthropicUsageResponse {
  data: AnthropicUsageBucket[];
  has_more: boolean;
  next_page?: string | null;
}

async function fetchAnthropicUsage(apiKey: string, sinceIso: string): Promise<AnthropicUsageBucket[]> {
  const url = new URL('https://api.anthropic.com/v1/organizations/usage_report/messages');
  url.searchParams.set('starting_at', sinceIso);
  url.searchParams.set('ending_at', new Date().toISOString());
  url.searchParams.append('group_by[]', 'model');

  const all: AnthropicUsageBucket[] = [];
  let nextUrl: string | null = url.toString();
  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    if (!res.ok) {
      throw new Error(`Anthropic usage API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as AnthropicUsageResponse;
    all.push(...json.data);
    nextUrl = json.has_more ? (json.next_page ?? null) : null;
  }
  return all;
}

function toEvents(buckets: AnthropicUsageBucket[], device: string): UsageEvent[] {
  return buckets.map<UsageEvent>((b) => ({
    ts: b.starting_at,
    device,
    platform: 'anthropic',
    model: b.model ?? 'unknown',
    input_tokens: b.input_tokens,
    output_tokens: b.output_tokens,
    cache_read_tokens: b.cache_read_input_tokens ?? 0,
    cache_write_tokens: b.cache_creation_input_tokens ?? 0,
    cost_usd: 0,            // Anthropic usage API doesn't return cost directly — backfill from cost_report API in future
    session_id: null,
    project_path: null,
    source: 'anthropic-usage-api',
  }));
}

async function main() {
  const env = getEnv();
  if (!env.ANTHROPIC_ADMIN_API_KEY) {
    console.error('[anthropic-poller] ANTHROPIC_ADMIN_API_KEY not set, exiting');
    process.exit(2);
  }
  // poll last 24h on each run (idempotent via UNIQUE constraint in DB)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log(`[anthropic-poller] device=${env.DEVICE_NAME} since=${since}`);

  const buckets = await fetchAnthropicUsage(env.ANTHROPIC_ADMIN_API_KEY, since);
  const events = toEvents(buckets, env.DEVICE_NAME);
  console.log(`[anthropic-poller] mapped ${events.length} events`);

  if (events.length > 0) {
    const result = await postEvents(events);
    console.log(`[anthropic-poller] inserted=${result.inserted} skipped_duplicates=${result.skipped_duplicates}`);
  }
  console.log(`[anthropic-poller] done`);
}

main().catch((err: Error) => {
  console.error(`[anthropic-poller] ERROR: ${err.message}`);
  process.exit(1);
});
