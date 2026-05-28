/**
 * Pure formatting + display types for token usage. Lives here (not in usage.ts)
 * so client components can import it without pulling Supabase / `server-only`
 * into the client bundle.
 */

export interface PlatformBucket {
  platform: string;
  /** Active = input + output + cache_write + reasoning. Excludes cache_read. */
  activeTokens: number;
  /** Cache reads kept separate so the UI can surface efficiency without inflating headline numbers. */
  cacheReadTokens: number;
  /** Estimated API-rate value in USD (uses source cost when available, pricing fallback otherwise). */
  apiRateValueUsd: number;
  /** Share of the platform's active tokens out of the window's total active tokens, 0..100. */
  pct: number;
}

export interface DailyPoint {
  day: string;                              // YYYY-MM-DD in LOCAL_TZ (see lib/date/local-tz.ts)
  activeTokens: number;
  cacheReadTokens: number;
  apiRateValueUsd: number;
  /** Active tokens per platform (used by the stacked bar chart). */
  byPlatform: Record<string, number>;
}

export interface UsageSummary {
  /** Rolling-window totals (default 30 days). */
  activeTokens: number;
  cacheReadTokens: number;
  apiRateValueUsd: number;

  /** All-time totals across every event ever stored. */
  allTimeActiveTokens: number;
  allTimeCacheReadTokens: number;
  allTimeApiRateValueUsd: number;

  /** Aggregate per platform within the rolling window. */
  platforms: PlatformBucket[];
  /** Per-day series for the rolling window, with platform breakdown. */
  daily: DailyPoint[];
  rangeDays: number;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function formatUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

/** Hit rate = cache_read / (cache_read + active). Returns 0..1, or 0 if both are zero. */
export function cacheHitRate(activeTokens: number, cacheReadTokens: number): number {
  const denom = activeTokens + cacheReadTokens;
  if (denom <= 0) return 0;
  return cacheReadTokens / denom;
}
