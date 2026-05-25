import { describe, it, expect, vi } from 'vitest';
import { LOCAL_TZ, localDateStr, localDateNDaysAgo, localToday } from './local-tz';

describe('local-tz helpers (Europe/Berlin)', () => {
  it('uses Europe/Berlin as the configured TZ', () => {
    expect(LOCAL_TZ).toBe('Europe/Berlin');
  });

  it('formats a Date as YYYY-MM-DD in Europe/Berlin', () => {
    // 2026-06-15 23:30 UTC → 01:30 next day in CEST (UTC+2)
    const lateUtc = new Date('2026-06-15T23:30:00Z');
    expect(localDateStr(lateUtc)).toBe('2026-06-16');
  });

  it('handles CET (winter) and CEST (summer) automatically via Intl', () => {
    // 2026-01-15 23:30 UTC → 00:30 next day in CET (UTC+1)
    const winterLate = new Date('2026-01-15T23:30:00Z');
    expect(localDateStr(winterLate)).toBe('2026-01-16');
    // 2026-07-15 21:30 UTC → 23:30 same day in CEST (UTC+2)
    const summerEvening = new Date('2026-07-15T21:30:00Z');
    expect(localDateStr(summerEvening)).toBe('2026-07-15');
  });

  it('localDateNDaysAgo subtracts whole days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T10:00:00+02:00')); // CEST noon
    expect(localDateNDaysAgo(0)).toBe('2026-05-25');
    expect(localDateNDaysAgo(1)).toBe('2026-05-24');
    expect(localDateNDaysAgo(7)).toBe('2026-05-18');
    vi.useRealTimers();
  });

  it('localToday returns the current Berlin-local date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T21:00:00Z')); // 23:00 CEST same day
    expect(localToday()).toBe('2026-05-25');
    vi.useRealTimers();
  });
});
