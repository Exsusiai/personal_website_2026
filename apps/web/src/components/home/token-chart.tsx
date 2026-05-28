'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTokens, formatUsd, type DailyPoint } from '@/lib/cms/usage-format';

/**
 * Fixed bar dimensions. Choose so that
 *   (BAR_WIDTH + GAP) × WINDOW_DAYS ≈ typical container width.
 * 56 + 12 = 68px per slot × 7 visible = 476px → fits inside the TokenPreview
 * box (~600-720px content width inside Container) without horizontal scroll
 * triggering for the default 7-day view, while the full 30 days overflow → scroll.
 */
const BAR_WIDTH = 56;
const BAR_GAP = 12;
const WINDOW_DAYS = 7;        // how many bars define the "visible window" for normalization
const MIN_VISIBLE_PCT = 6;    // min % height for a non-zero day

const PLATFORM_STACK_ORDER = [
  'moonshot', 'zhipu', 'minimax', 'deepseek', 'google', 'local', 'other', 'github', 'openai', 'anthropic',
];
const PLATFORM_COLORS: Record<string, string> = {
  anthropic: '#D97757',                 // brand-aligned orange
  openai: 'var(--color-text)',          // ink black
  zhipu: 'var(--color-text-2)',         // warm gray
  moonshot: 'var(--color-border)',
  google: '#A1A095',
  deepseek: '#8E8C85',
  minimax: '#B9B7B0',
  github: '#787671',
  local: '#9E9D97',
  other: '#C2C0BA',
};
const PLATFORM_LABELS: Record<string, string> = {
  anthropic: 'Anthropic', openai: 'OpenAI', zhipu: 'ZAI/zhipu', moonshot: 'Moonshot',
  google: 'Google', deepseek: 'DeepSeek', minimax: 'MiniMax', github: 'GitHub',
  local: 'Local', other: 'Other',
};

function colorFor(p: string): string { return PLATFORM_COLORS[p] ?? '#9E9D97'; }
function labelFor(p: string): string { return PLATFORM_LABELS[p] ?? p; }

interface TokenChartProps {
  daily: DailyPoint[];   // chronological, oldest → newest
  todayStr: string;
}

const DAY_OF_WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TokenChart({ daily, todayStr }: TokenChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Visible window indices (inclusive start, exclusive end). Start as last 7.
  const [visStart, setVisStart] = useState(() => Math.max(0, daily.length - WINDOW_DAYS));

  // On mount: scroll to the right so today's bar sits at the right edge.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [daily.length]);

  // On scroll: recompute the index range of visible bars.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    function update() {
      if (!el) return;
      const slot = BAR_WIDTH + BAR_GAP;
      const start = Math.max(0, Math.floor(el.scrollLeft / slot));
      setVisStart(start);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [daily.length]);

  // Y-axis max recalculated for the visible window (per-window normalization).
  // We normalize on ACTIVE tokens so the headline metric drives the visual scale;
  // cache reads ride along as a faded background, not as a height contributor.
  const visibleSlice = daily.slice(visStart, visStart + WINDOW_DAYS);
  const maxActive = Math.max(1, ...visibleSlice.map((d) => d.activeTokens));

  if (daily.length === 0) {
    return (
      <div className="font-[family-name:var(--font-mono)] py-8 text-center text-[11px] text-[var(--color-text-2)]">
        No data yet · daemons still warming up
      </div>
    );
  }

  return (
    <div className="hairline-t hairline-b py-5">
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Bars row */}
        <div
          className="flex h-[140px] items-end"
          style={{ gap: `${BAR_GAP}px`, minWidth: `${daily.length * (BAR_WIDTH + BAR_GAP)}px` }}
        >
          {daily.map((d) => (
            <Bar
              key={d.day}
              point={d}
              maxActive={maxActive}
              isToday={d.day === todayStr}
            />
          ))}
        </div>
        {/* Label row */}
        <div
          className="font-[family-name:var(--font-mono)] mt-3 flex text-[10px] text-[var(--color-text-2)]"
          style={{ gap: `${BAR_GAP}px`, minWidth: `${daily.length * (BAR_WIDTH + BAR_GAP)}px` }}
        >
          {daily.map((d) => {
            const dow = DAY_OF_WEEK_LABELS[new Date(d.day + 'T00:00:00Z').getUTCDay()];
            const md = d.day.slice(5);
            const isToday = d.day === todayStr;
            return (
              <div
                key={d.day}
                className={'text-center ' + (isToday ? 'text-[var(--color-accent)]' : '')}
                style={{ width: `${BAR_WIDTH}px`, flexShrink: 0 }}
              >
                <div className="text-[9px] opacity-70">{dow}</div>
                <div>{md}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BarProps {
  point: DailyPoint;
  maxActive: number;
  isToday: boolean;
}

function Bar({ point, maxActive, isToday }: BarProps) {
  const rawPct = maxActive > 0 ? (point.activeTokens / maxActive) * 100 : 0;
  const activeHeightPct = point.activeTokens > 0 ? Math.max(MIN_VISIBLE_PCT, rawPct) : 0;

  // Cache reads are shown as a faint marker on the side of the bar so the
  // viewer can intuitively see "efficient day" (lots of cache hits) without
  // having cache_read inflate the bar height. We cap the marker length at
  // 100% of bar height even when cache >> active.
  const cacheRatio = point.activeTokens > 0
    ? Math.min(1, point.cacheReadTokens / point.activeTokens)
    : 0;
  const cacheMarkerHeightPct = activeHeightPct * cacheRatio;

  const platforms = Object.entries(point.byPlatform).sort(
    ([a], [b]) => PLATFORM_STACK_ORDER.indexOf(a) - PLATFORM_STACK_ORDER.indexOf(b),
  );

  const breakdownLines = platforms.map(([p, t]) => `${labelFor(p)}: ${formatTokens(t)}`).join('\n');
  const tooltip =
    `${point.day}\n` +
    `Active: ${formatTokens(point.activeTokens)}\n` +
    `${breakdownLines}\n` +
    `Cache reads: ${formatTokens(point.cacheReadTokens)}\n` +
    `API-rate value: ${formatUsd(point.apiRateValueUsd)}`;

  return (
    <div
      className="group relative flex items-end gap-[2px]"
      style={{ width: `${BAR_WIDTH}px`, flexShrink: 0, height: '100%' }}
      title={tooltip}
    >
      {/* Primary stacked active-tokens bar */}
      <div className="relative flex h-full flex-1 flex-col-reverse">
        <div
          className="flex w-full flex-col-reverse transition-[height] duration-200 ease-out"
          style={{ height: `${activeHeightPct}%` }}
        >
          {point.activeTokens > 0 ? (
            platforms.map(([platform, tokens]) => (
              <div
                key={platform}
                style={{
                  height: `${(tokens / point.activeTokens) * 100}%`,
                  background: colorFor(platform),
                }}
                className="w-full"
              />
            ))
          ) : (
            <div className="h-px w-full bg-[var(--color-border)] opacity-40" />
          )}
        </div>
      </div>

      {/* Cache-read sidecar: thin faded column, height scaled relative to
          active bar (capped at 100%) — communicates "cache hit volume" as
          a complementary signal without inflating headline height. */}
      {point.cacheReadTokens > 0 && (
        <div
          className="w-[3px] bg-[var(--color-border)] opacity-50 transition-[height] duration-200 ease-out"
          style={{ height: `${cacheMarkerHeightPct}%` }}
        />
      )}

      {isToday && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
      )}
    </div>
  );
}
