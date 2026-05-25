import 'server-only';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { localDateNDaysAgo } from '@/lib/date/local-tz';
import type { DailyPoint, PlatformBucket, UsageSummary } from './usage-format';

export type { DailyPoint, PlatformBucket, UsageSummary } from './usage-format';

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
 * On failure: logs server-side and returns EMPTY_SUMMARY (graceful degradation).
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

    // Window covers `days` calendar days INCLUDING today → use days-1 offset.
    // All date math in LOCAL_TZ (Europe/Berlin) to match the view's day truncation.
    const windowStartStr = localDateNDaysAgo(days - 1);

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
  } catch (err) {
    // Preserve graceful UI degradation, but surface the cause in server logs so
    // we don't confuse a backend failure with a real zero. (Prior behavior was
    // a silent empty result, which made misconfiguration invisible.)
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[usage] getUsageSummary failed: ${msg}`);
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
  // Iterate from oldest to newest within the window, using Berlin-local
  // date strings to match the view's day truncation.
  for (let offset = days - 1; offset >= 0; offset--) {
    const dayStr = localDateNDaysAgo(offset);
    out.push(
      dailyMap.get(dayStr) ?? { day: dayStr, totalTokens: 0, costUsd: 0, byPlatform: {} },
    );
  }
  return out;
}
