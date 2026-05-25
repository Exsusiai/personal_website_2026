import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface UsageSummary {
  /** Rolling-window totals (default 30 days) */
  totalTokens: number;
  totalCostUsd: number;
  /** All-time totals across every event ever stored */
  allTimeTokens: number;
  allTimeCostUsd: number;
  /** Aggregate per platform within the rolling window */
  platforms: PlatformBucket[];
  /** Per-day series for the rolling window, with platform breakdown */
  daily: DailyPoint[];
  rangeDays: number;
}

export interface PlatformBucket {
  platform: string;
  totalTokens: number;
  costUsd: number;
  pct: number;
}

export interface DailyPoint {
  day: string;                           // YYYY-MM-DD
  totalTokens: number;
  costUsd: number;
  byPlatform: Record<string, number>;    // platform → tokens for stack chart
}

const EMPTY_SUMMARY: UsageSummary = {
  totalTokens: 0, totalCostUsd: 0,
  allTimeTokens: 0, allTimeCostUsd: 0,
  platforms: [], daily: [], rangeDays: 0,
};

/**
 * Aggregates usage_daily into both a rolling-window slice (default 30 days)
 * AND all-time totals, in a single materialized-view scan. We do all grouping
 * in JS because the chart needs per-day per-platform breakdown and we want
 * one network round-trip.
 *
 * Returns EMPTY_SUMMARY (graceful degradation) if Supabase isn't reachable.
 */
export async function getUsageSummary(days = 30): Promise<UsageSummary> {
  try {
    const supabase = getSupabaseAdmin();
    // Pull EVERY row from usage_daily — it's already aggregated per (day, platform, device),
    // so the row count is small (1 row per platform×device×day, ~150 rows after months).
    const { data, error } = await supabase
      .from('usage_daily')
      .select('day, platform, total_tokens, cost_usd')
      .order('day', { ascending: true });
    if (error) throw error;

    const windowStart = new Date(Date.now() - days * 86400_000);
    const windowStartStr = windowStart.toISOString().slice(0, 10);

    // Per-day with platform breakdown (rolling window)
    const dailyMap = new Map<string, DailyPoint>();
    // Per-platform totals (rolling window)
    const platformMap = new Map<string, PlatformBucket>();
    // All-time scalar accumulators
    let allTimeTokens = 0;
    let allTimeCost = 0;

    for (const row of data ?? []) {
      const dayStr = String(row.day).slice(0, 10);
      const platform = String(row.platform);
      const tokens = Number(row.total_tokens) || 0;
      const cost = Number(row.cost_usd) || 0;

      allTimeTokens += tokens;
      allTimeCost += cost;

      // Only rolling-window rows feed daily series + per-platform window aggregate
      if (dayStr >= windowStartStr) {
        const dp = dailyMap.get(dayStr) ?? { day: dayStr, totalTokens: 0, costUsd: 0, byPlatform: {} };
        dp.totalTokens += tokens;
        dp.costUsd += cost;
        dp.byPlatform[platform] = (dp.byPlatform[platform] ?? 0) + tokens;
        dailyMap.set(dayStr, dp);

        const pb = platformMap.get(platform) ?? { platform, totalTokens: 0, costUsd: 0, pct: 0 };
        pb.totalTokens += tokens;
        pb.costUsd += cost;
        platformMap.set(platform, pb);
      }
    }

    const totalTokens = Array.from(dailyMap.values()).reduce((s, d) => s + d.totalTokens, 0);
    const totalCostUsd = Array.from(dailyMap.values()).reduce((s, d) => s + d.costUsd, 0);

    const platforms = Array.from(platformMap.values())
      .map((p) => ({ ...p, pct: totalTokens > 0 ? (p.totalTokens / totalTokens) * 100 : 0 }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    // Fill missing days with zero rows so the chart shows continuous time axis.
    const daily = fillDays(dailyMap, days);

    return {
      totalTokens, totalCostUsd,
      allTimeTokens, allTimeCostUsd: allTimeCost,
      platforms, daily, rangeDays: days,
    };
  } catch {
    return EMPTY_SUMMARY;
  }
}

/**
 * Inserts zero-valued days for any date in the window that didn't have events.
 * This keeps the bar chart showing a continuous date axis instead of skipping
 * blanks (which would compress busy → quiet → busy stretches).
 */
function fillDays(dailyMap: Map<string, DailyPoint>, days: number): DailyPoint[] {
  const out: DailyPoint[] = [];
  // Iterate from oldest to newest within the window
  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(Date.now() - offset * 86400_000);
    const dayStr = d.toISOString().slice(0, 10);
    out.push(
      dailyMap.get(dayStr) ?? { day: dayStr, totalTokens: 0, costUsd: 0, byPlatform: {} },
    );
  }
  return out;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function formatUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}
