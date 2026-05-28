import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

/**
 * platform / source kept as free-form strings (not enums) since users may
 * integrate custom agents (OpenClaw, Hermes, internal apps) with their own
 * provider names (deepseek / zhipu / minimax / local etc.) and source labels.
 * Sanity-check at the string level only.
 */
const eventSchema = z.object({
  ts: z.string(),
  device: z.string().min(1).max(64),
  platform: z.string().min(1).max(32),
  model: z.string().min(1).max(128),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cache_read_tokens: z.number().int().nonnegative().optional(),
  cache_write_tokens: z.number().int().nonnegative().optional(),
  // reasoning_tokens: ccusage's `extra_total_tokens` (Hermes / o1 / o3 etc.).
  // The previous schema silently dropped this; we now persist it so it can be
  // folded into the public "active tokens" metric.
  reasoning_tokens: z.number().int().nonnegative().optional(),
  cost_usd: z.number().nonnegative(),
  session_id: z.string().nullable().optional(),
  project_path: z.string().nullable().optional(),
  source: z.string().min(1).max(64),
});

const bodySchema = z.object({
  events: z.array(eventSchema).max(1000),
});

export async function POST(req: Request) {
  // Auth: shared secret in Authorization header
  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const expected = process.env.INGEST_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload', detail: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  // UPSERT-replace on (source, session_id, model). For cumulative snapshot sources
  // (ccusage), the newer counters overwrite older ones. For org-poller sources, the
  // deterministic session_id ensures repeated rolling polls of the same bucket
  // overwrite instead of duplicating. `source` is in the key so unrelated sources
  // never collide even if they happen to mint the same session_id by coincidence.
  const { data, error } = await supabase
    .from('usage_events')
    .upsert(parsed.data.events, {
      onConflict: 'source,session_id,model',
    })
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort refresh of usage_daily materialized view so the homepage
  // TokenPreview reflects new data within seconds (instead of waiting for a
  // separate cron). Failure here doesn't fail the ingest — events are
  // already committed.
  // `affected` = inserts + updates (UPSERT-replace; .select('id') returns both).
  // We no longer report `skipped_duplicates` because UPSERT never "skips" —
  // every conflict overwrites instead — so the old field would always be 0.
  const affected = data?.length ?? 0;
  let refreshed: 'ok' | 'failed' | 'skipped' = 'skipped';
  if (affected > 0) {
    const { error: refreshErr } = await supabase.rpc('refresh_usage_daily');
    refreshed = refreshErr ? 'failed' : 'ok';
    if (refreshErr) console.warn(`[ingest] view refresh failed: ${refreshErr.message}`);
  }

  return NextResponse.json({
    affected,
    view_refresh: refreshed,
  });
}
