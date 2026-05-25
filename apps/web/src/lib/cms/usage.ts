import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface UsageSummary {
  totalTokens: number;
  totalCostUsd: number;
  platforms: PlatformBucket[];
  daily: DailyPoint[];
  rangeDays: number;
}

export interface PlatformBucket {
  platform: string;
  totalTokens: number;
  costUsd: number;
  pct: number; // 0..100
}

export interface DailyPoint {
  day: string; // YYYY-MM-DD
  totalTokens: number;
  costUsd: number;
}

/**
 * Aggregates usage_daily for the last N days. Used by both the homepage
 * TokenPreview server component and the /api/usage/stats route.
 *
 * Returns an empty-shape summary if Supabase isn't reachable or env isn't set
 * — keeps the homepage rendering during local dev with no DB.
 */
export async function getUsageSummary(days = 30): Promise<UsageSummary> {
  try {
    const supabase = getSupabaseAdmin();
    const sinceDate = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('usage_daily')
      .select('day, platform, total_tokens, cost_usd')
      .gte('day', sinceDate)
      .order('day', { ascending: true });
    if (error) throw error;

    const dailyMap = new Map<string, DailyPoint>();
    const platformMap = new Map<string, PlatformBucket>();

    for (const row of data ?? []) {
      const day = String(row.day).slice(0, 10);
      const tokens = Number(row.total_tokens);
      const cost = Number(row.cost_usd);
      const platform = String(row.platform);

      const dpt = dailyMap.get(day) ?? { day, totalTokens: 0, costUsd: 0 };
      dpt.totalTokens += tokens;
      dpt.costUsd += cost;
      dailyMap.set(day, dpt);

      const pb = platformMap.get(platform) ?? { platform, totalTokens: 0, costUsd: 0, pct: 0 };
      pb.totalTokens += tokens;
      pb.costUsd += cost;
      platformMap.set(platform, pb);
    }

    const totalTokens = Array.from(dailyMap.values()).reduce((s, d) => s + d.totalTokens, 0);
    const totalCostUsd = Array.from(dailyMap.values()).reduce((s, d) => s + d.costUsd, 0);

    const platforms = Array.from(platformMap.values())
      .map((p) => ({ ...p, pct: totalTokens > 0 ? (p.totalTokens / totalTokens) * 100 : 0 }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    return {
      totalTokens,
      totalCostUsd,
      platforms,
      daily: Array.from(dailyMap.values()),
      rangeDays: days,
    };
  } catch {
    // No Supabase config or query failure — gracefully degrade to empty.
    return { totalTokens: 0, totalCostUsd: 0, platforms: [], daily: [], rangeDays: days };
  }
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatUsd(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(2)}K` : `$${n.toFixed(2)}`;
}
