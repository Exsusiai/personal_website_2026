import { describe, it, expect, vi } from 'vitest';
import { shanghaiDateStr, shanghaiDateNDaysAgo, shanghaiToday } from './shanghai';

describe('shanghai date helpers', () => {
  it('formats a Date as YYYY-MM-DD in Asia/Shanghai', () => {
    // 23:00 UTC on May 24 → 07:00 CST on May 25 (UTC+8)
    const lateUtc = new Date('2026-05-24T23:00:00Z');
    expect(shanghaiDateStr(lateUtc)).toBe('2026-05-25');
  });

  it('avoids the UTC off-by-one during late-UTC hours', () => {
    // 16:30 UTC on May 24 → 00:30 CST on May 25
    const utcAfternoon = new Date('2026-05-24T16:30:00Z');
    expect(shanghaiDateStr(utcAfternoon)).toBe('2026-05-25');
    // For the same instant, UTC slice would say '2026-05-24'
    expect(utcAfternoon.toISOString().slice(0, 10)).toBe('2026-05-24');
  });

  it('shanghaiDateNDaysAgo subtracts whole days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T08:00:00+08:00'));
    expect(shanghaiDateNDaysAgo(0)).toBe('2026-05-25');
    expect(shanghaiDateNDaysAgo(1)).toBe('2026-05-24');
    expect(shanghaiDateNDaysAgo(7)).toBe('2026-05-18');
    vi.useRealTimers();
  });

  it('shanghaiToday returns the current Shanghai-local date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T15:00:00Z')); // 23:00 CST same day
    expect(shanghaiToday()).toBe('2026-05-25');
    vi.useRealTimers();
  });
});
