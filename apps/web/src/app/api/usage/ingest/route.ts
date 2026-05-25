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
  const { data, error } = await supabase
    .from('usage_events')
    .upsert(parsed.data.events, {
      onConflict: 'session_id,ts,model,input_tokens,output_tokens',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: data?.length ?? 0,
    skipped_duplicates: parsed.data.events.length - (data?.length ?? 0),
  });
}
