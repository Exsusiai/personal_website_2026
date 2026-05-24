import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const revalidate = 300;  // ISR for the API too

interface PlatformBucket {
  platform: string;
  total_tokens: number;
  cost_usd: number;
}

interface DailyPoint {
  day: string;             // YYYY-MM-DD
  total_tokens: number;
  cost_usd: number;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') ?? '30'), 1), 365);

  const supabase = getSupabaseAdmin();

  // Daily series (sum across all platforms + devices per day)
  const { data: dailyRows, error: dailyErr } = await supabase
    .from('usage_daily')
    .select('day, total_tokens, cost_usd')
    .gte('day', new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10))
    .order('day', { ascending: true });

  if (dailyErr) {
    return NextResponse.json({ error: dailyErr.message }, { status: 500 });
  }

  // Aggregate by day (rows are per-platform-per-device, collapse to per-day total)
  const dailyMap = new Map<string, DailyPoint>();
  for (const row of dailyRows ?? []) {
    const dayStr = String(row.day).slice(0, 10);
    const existing = dailyMap.get(dayStr) ?? { day: dayStr, total_tokens: 0, cost_usd: 0 };
    existing.total_tokens += Number(row.total_tokens);
    existing.cost_usd += Number(row.cost_usd);
    dailyMap.set(dayStr, existing);
  }
  const daily = Array.from(dailyMap.values());

  // Per-platform totals across the window
  const platformMap = new Map<string, PlatformBucket>();
  const { data: platformRows, error: platformErr } = await supabase
    .from('usage_daily')
    .select('platform, total_tokens, cost_usd')
    .gte('day', new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10));

  if (platformErr) {
    return NextResponse.json({ error: platformErr.message }, { status: 500 });
  }

  for (const row of platformRows ?? []) {
    const p = String(row.platform);
    const existing = platformMap.get(p) ?? { platform: p, total_tokens: 0, cost_usd: 0 };
    existing.total_tokens += Number(row.total_tokens);
    existing.cost_usd += Number(row.cost_usd);
    platformMap.set(p, existing);
  }

  const totalTokens = daily.reduce((s, d) => s + d.total_tokens, 0);
  const totalCost = daily.reduce((s, d) => s + d.cost_usd, 0);

  return NextResponse.json({
    range_days: days,
    total_tokens: totalTokens,
    total_cost_usd: totalCost,
    daily,
    platforms: Array.from(platformMap.values()),
  });
}
