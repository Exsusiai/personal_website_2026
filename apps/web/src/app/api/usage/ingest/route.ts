import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';

const eventSchema = z.object({
  ts: z.string(),
  device: z.string().min(1),
  platform: z.enum(['anthropic', 'openai', 'google']),
  model: z.string().min(1),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cache_read_tokens: z.number().int().nonnegative().optional(),
  cache_write_tokens: z.number().int().nonnegative().optional(),
  cost_usd: z.number().nonnegative(),
  session_id: z.string().nullable().optional(),
  project_path: z.string().nullable().optional(),
  source: z.enum(['ccusage', 'anthropic-usage-api', 'openai-usage-api']),
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
