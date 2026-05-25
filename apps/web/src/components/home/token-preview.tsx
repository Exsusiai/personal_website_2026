import { getUsageSummary } from '@/lib/cms/usage';
import { formatTokens, formatUsd } from '@/lib/cms/usage-format';
import { localToday } from '@/lib/date/local-tz';
import { TokenChart } from './token-chart';

const FETCH_DAYS = 30;       // we fetch 30 days; chart scroll lets user see them all
const VIEW_DAYS = 7;         // KPI window (matches the chart's normalization window)

const PLATFORM_COLORS: Record<string, string> = {
  anthropic: '#D97757',                 // Anthropic brand-aligned orange
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

function colorFor(p: string) { return PLATFORM_COLORS[p] ?? '#9E9D97'; }
function labelFor(p: string) { return PLATFORM_LABELS[p] ?? p; }

export async function TokenPreview() {
  const summary = await getUsageSummary(FETCH_DAYS);
  const hasData = summary.totalTokens > 0 || summary.allTimeTokens > 0;
  // Match the materialized view's local TZ (Europe/Berlin) — UTC would
  // mis-highlight near midnight Berlin. See lib/date/local-tz.ts.
  const todayStr = localToday();

  // KPI summary uses the LAST `VIEW_DAYS` slice of the daily series so it
  // aligns with what the user sees in the default rightmost scroll position.
  const recentSlice = summary.daily.slice(-VIEW_DAYS);
  const recentTokens = recentSlice.reduce((s, d) => s + d.totalTokens, 0);
  const recentCost = recentSlice.reduce((s, d) => s + d.costUsd, 0);

  // Per-platform percentages computed over the same recent slice for consistency.
  const platformMap = new Map<string, number>();
  for (const d of recentSlice) {
    for (const [p, t] of Object.entries(d.byPlatform)) {
      platformMap.set(p, (platformMap.get(p) ?? 0) + t);
    }
  }
  const sortedPlatforms = Array.from(platformMap.entries())
    .map(([p, t]) => ({ platform: p, tokens: t, pct: recentTokens > 0 ? (t / recentTokens) * 100 : 0 }))
    .sort((a, b) => b.tokens - a.tokens);
  const top = sortedPlatforms.slice(0, 3);
  const rest = sortedPlatforms.slice(3);
  const restPct = rest.reduce((s, p) => s + p.pct, 0);

  return (
    <div className="bg-[var(--color-bg)] p-9">
      {/* Heading + 3 KPI cards */}
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Token Usage · Past {VIEW_DAYS} days
      </h3>

      <div className="mb-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
        <Kpi label={`${VIEW_DAYS}d Tokens`} value={hasData ? formatTokens(recentTokens) : '—'} />
        {/* Spend currently only covers ccusage rows; org-API pollers ship tokens with
            cost=0 until provider cost reports are wired up. Label clarifies the bound. */}
        <Kpi label={`${VIEW_DAYS}d Spend · est.`} value={hasData ? formatUsd(recentCost) : '—'} />
        <Kpi
          label="All-time Tokens"
          value={summary.allTimeTokens > 0 ? formatTokens(summary.allTimeTokens) : '—'}
          subtle={summary.allTimeCostUsd > 0 ? formatUsd(summary.allTimeCostUsd) : ''}
        />
      </div>

      {/* Scrollable daily stacked bar chart (client component) */}
      <TokenChart daily={summary.daily} todayStr={todayStr} />

      {/* Platform legend (over the recent slice) */}
      {hasData && (
        <div className="font-[family-name:var(--font-mono)] mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[var(--color-text-2)]">
          {top.map((p) => (
            <span key={p.platform} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5" style={{ background: colorFor(p.platform) }} />
              {labelFor(p.platform)} {p.pct.toFixed(0)}%
            </span>
          ))}
          {restPct > 0.5 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[var(--color-border)]" />
              Other {restPct.toFixed(0)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  subtle?: string;
}

function Kpi({ label, value, subtle }: KpiProps) {
  return (
    <div>
      <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[26px] font-medium leading-none">
        {value}
      </div>
      <div className="font-[family-name:var(--font-mono)] flex items-baseline gap-2 text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
        <span>{label}</span>
        {subtle && (
          <span className="normal-case tracking-normal text-[var(--color-text-2)] opacity-70">
            · {subtle}
          </span>
        )}
      </div>
    </div>
  );
}
