/**
 * Shanghai-local date helpers. The `usage_daily` materialized view buckets rows by
 * Asia/Shanghai (see migration 0004), so every comparison to its `day` column —
 * including the homepage "today" highlight — must use the same timezone. Plain
 * UTC dates drift by one day during 16:00-23:59 UTC each day.
 */

const FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' });

export function shanghaiDateStr(d: Date = new Date()): string {
  return FMT.format(d);
}

export function shanghaiToday(): string {
  return FMT.format(new Date());
}

export function shanghaiDateNDaysAgo(n: number): string {
  return FMT.format(new Date(Date.now() - n * 86400_000));
}
