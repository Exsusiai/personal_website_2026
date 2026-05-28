import 'server-only';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { localDateNDaysAgo } from '@/lib/date/local-tz';
import type { DailyPoint, PlatformBucket, UsageSummary } from './usage-format';
import { estimateApiRateValue } from './pricing';

export type { DailyPoint, PlatformBucket, UsageSummary } from './usage-format';

const EMPTY_SUMMARY: UsageSummary = {
  activeTokens: 0, cacheReadTokens: 0, apiRateValueUsd: 0,
  allTimeActiveTokens: 0, allTimeCacheReadTokens: 0, allTimeApiRateValueUsd: 0,
  platforms: [], daily: [], rangeDays: 0,
};

interface UsageDailyRow {
  day: string;
  platform: string;
  model: string;
  active_tokens: number | string | null;
  cache_read_tokens: number | string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cache_write_tokens: number | string | null;
  reasoning_tokens: number | string | null;
  cost_usd: number | string | null;
}

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const x = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(x) ? x : 0;
}

/**
 * Aggregates usage_daily into both a rolling-window slice (default 30 days)
 * AND all-time totals, in a single materialized-view scan. All grouping is
 * done in JS because the chart needs per-day per-platform breakdown and we
 * want one network round-trip.
 *
 * "Active tokens" excludes cache_read so the public headline number tracks
 * real new processing rather than getting dominated by cache hits. Cache
 * reads are summed separately and surfaced as an efficiency signal.
 *
 * "API-rate value" uses the source-reported cost when non-zero (ccusage
 * already computes accurate cost via its own price table); otherwise falls
 * back to the local pricing module for sources that ship zero cost (org
 * pollers).
 *
 * On failure: logs server-side and returns EMPTY_SUMMARY (graceful degradation).
 */
export async function getUsageSummary(days = 30): Promise<UsageSummary> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('usage_daily')
      .select(
        'day, platform, model, active_tokens, cache_read_tokens, input_tokens, output_tokens, cache_write_tokens, reasoning_tokens, cost_usd',
      )
      .order('day', { ascending: true });
    if (error) throw error;

    // Window covers `days` calendar days INCLUDING today → use days-1 offset.
    // All date math in LOCAL_TZ (Europe/Berlin) to match the view's day truncation.
    const windowStartStr = localDateNDaysAgo(days - 1);

    // Per-day with platform breakdown (rolling window)
    const dailyMap = new Map<string, DailyPoint>();
    // Per-platform window totals
    const platformMap = new Map<string, PlatformBucket>();
    // All-time scalar accumulators
    let allTimeActive = 0;
    let allTimeCache = 0;
    let allTimeValue = 0;

    for (const raw of (data ?? []) as UsageDailyRow[]) {
      const dayStr = String(raw.day).slice(0, 10);
      const platform = String(raw.platform);
      const model = String(raw.model);

      const active = n(raw.active_tokens);
      const cacheRead = n(raw.cache_read_tokens);
      const reportedCost = n(raw.cost_usd);
      // Trust source cost when present (ccusage rows). Fall back to local
      // pricing estimate for sources that ship 0 (OpenAI / Anthropic org
      // pollers currently don't carry priced cost reports).
      const apiValue = reportedCost > 0
        ? reportedCost
        : estimateApiRateValue(
            {
              input_tokens: n(raw.input_tokens),
              output_tokens: n(raw.output_tokens),
              cache_read_tokens: cacheRead,
              cache_write_tokens: n(raw.cache_write_tokens),
              reasoning_tokens: n(raw.reasoning_tokens),
            },
            model,
          );

      allTimeActive += active;
      allTimeCache += cacheRead;
      allTimeValue += apiValue;

      // Only rolling-window rows feed daily series + per-platform window aggregate
      if (dayStr >= windowStartStr) {
        const dp =
          dailyMap.get(dayStr) ??
          { day: dayStr, activeTokens: 0, cacheReadTokens: 0, apiRateValueUsd: 0, byPlatform: {} };
        dp.activeTokens += active;
        dp.cacheReadTokens += cacheRead;
        dp.apiRateValueUsd += apiValue;
        dp.byPlatform[platform] = (dp.byPlatform[platform] ?? 0) + active;
        dailyMap.set(dayStr, dp);

        const pb =
          platformMap.get(platform) ??
          { platform, activeTokens: 0, cacheReadTokens: 0, apiRateValueUsd: 0, pct: 0 };
        pb.activeTokens += active;
        pb.cacheReadTokens += cacheRead;
        pb.apiRateValueUsd += apiValue;
        platformMap.set(platform, pb);
      }
    }

    const windowActive = Array.from(dailyMap.values()).reduce((s, d) => s + d.activeTokens, 0);
    const windowCache = Array.from(dailyMap.values()).reduce((s, d) => s + d.cacheReadTokens, 0);
    const windowValue = Array.from(dailyMap.values()).reduce((s, d) => s + d.apiRateValueUsd, 0);

    const platforms = Array.from(platformMap.values())
      .map((p) => ({ ...p, pct: windowActive > 0 ? (p.activeTokens / windowActive) * 100 : 0 }))
      .sort((a, b) => b.activeTokens - a.activeTokens);

    // Fill missing days with zero rows so the chart shows a continuous time axis.
    const daily = fillDays(dailyMap, days);

    return {
      activeTokens: windowActive,
      cacheReadTokens: windowCache,
      apiRateValueUsd: windowValue,
      allTimeActiveTokens: allTimeActive,
      allTimeCacheReadTokens: allTimeCache,
      allTimeApiRateValueUsd: allTimeValue,
      platforms,
      daily,
      rangeDays: days,
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
 * Keeps the bar chart showing a continuous date axis instead of skipping
 * blanks (which would compress busy → quiet → busy stretches).
 */
function fillDays(dailyMap: Map<string, DailyPoint>, days: number): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const dayStr = localDateNDaysAgo(offset);
    out.push(
      dailyMap.get(dayStr) ??
        { day: dayStr, activeTokens: 0, cacheReadTokens: 0, apiRateValueUsd: 0, byPlatform: {} },
    );
  }
  return out;
}
