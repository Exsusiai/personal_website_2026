/**
 * Local-time-zone date helpers. The `usage_daily` materialized view buckets
 * rows by `LOCAL_TZ` (see latest migration), so every comparison to its `day`
 * column — including the homepage "today" highlight — must use the same TZ.
 * Plain UTC dates drift by one day during the late-UTC window each day.
 *
 * If you change LOCAL_TZ, also write a new migration that re-buckets
 * `usage_daily` with the same timezone literal so client and DB stay aligned.
 */

export const LOCAL_TZ = 'Europe/Berlin';

const FMT = new Intl.DateTimeFormat('en-CA', { timeZone: LOCAL_TZ });

export function localDateStr(d: Date = new Date()): string {
  return FMT.format(d);
}

export function localToday(): string {
  return FMT.format(new Date());
}

export function localDateNDaysAgo(n: number): string {
  return FMT.format(new Date(Date.now() - n * 86400_000));
}
