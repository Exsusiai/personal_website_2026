/**
 * Pure formatting + display types for token usage. Lives here (not in usage.ts)
 * so client components can import it without pulling Supabase / `server-only`
 * into the client bundle.
 */

export interface PlatformBucket {
  platform: string;
  totalTokens: number;
  costUsd: number;
  pct: number;
}

export interface DailyPoint {
  day: string;                           // YYYY-MM-DD in LOCAL_TZ (see lib/date/local-tz.ts)
  totalTokens: number;
  costUsd: number;
  byPlatform: Record<string, number>;    // platform → tokens for stack chart
}

export interface UsageSummary {
  /** Rolling-window totals (default 30 days). */
  totalTokens: number;
  totalCostUsd: number;
  /** All-time totals across every event ever stored. */
  allTimeTokens: number;
  allTimeCostUsd: number;
  /** Aggregate per platform within the rolling window. */
  platforms: PlatformBucket[];
  /** Per-day series for the rolling window, with platform breakdown. */
  daily: DailyPoint[];
  rangeDays: number;
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
