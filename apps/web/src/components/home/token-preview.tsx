import {
  getUsageSummary,
  formatTokens,
  formatUsd,
  type DailyPoint,
} from '@/lib/cms/usage';

// Stable platform order (top → bottom of each stacked bar)
// Place rare / cheap platforms first so they sit at the BOTTOM of the bar;
// dominant platforms (anthropic, openai) end up on top where the eye lands.
const PLATFORM_STACK_ORDER = ['moonshot', 'zhipu', 'minimax', 'deepseek', 'google', 'local', 'other', 'github', 'openai', 'anthropic'];

const PLATFORM_COLORS: Record<string, string> = {
  anthropic: 'var(--color-text)',       // ink black — heaviest visual
  openai: 'var(--color-accent)',         // brick red
  zhipu: 'var(--color-text-2)',          // warm gray
  moonshot: 'var(--color-border)',       // hairline tone
  google: '#A1A095',
  deepseek: '#8E8C85',
  minimax: '#B9B7B0',
  github: '#787671',
  local: '#9E9D97',
  other: '#C2C0BA',
};

const PLATFORM_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  zhipu: 'Zhipu',
  moonshot: 'Moonshot',
  google: 'Google',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
  github: 'GitHub',
  local: 'Local',
  other: 'Other',
};

function colorFor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? '#9E9D97';
}

function labelFor(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

interface StackedBarProps {
  point: DailyPoint;
  maxTokens: number;
  isToday: boolean;
}

function StackedBar({ point, maxTokens, isToday }: StackedBarProps) {
  const totalHeightPct = maxTokens > 0 ? (point.totalTokens / maxTokens) * 100 : 0;
  const platforms = Object.entries(point.byPlatform).sort(
    ([a], [b]) => PLATFORM_STACK_ORDER.indexOf(a) - PLATFORM_STACK_ORDER.indexOf(b),
  );

  // Tooltip body (native title attr — shows on hover desktop, long-press mobile)
  const breakdownLines = platforms
    .map(([p, t]) => `${labelFor(p)}: ${formatTokens(t)}`)
    .join('\n');
  const tooltip = `${point.day}\nTotal: ${formatTokens(point.totalTokens)}\n${breakdownLines}\nCost: ${formatUsd(point.costUsd)}`;

  return (
    <div
      className="group relative flex h-full w-3 shrink-0 cursor-default flex-col-reverse"
      title={tooltip}
    >
      {/* Each segment of the stack */}
      {point.totalTokens > 0 ? (
        platforms.map(([platform, tokens]) => {
          const segPct = (tokens / point.totalTokens) * totalHeightPct;
          return (
            <div
              key={platform}
              style={{
                height: `${segPct}%`,
                background: colorFor(platform),
              }}
              className="w-full"
            />
          );
        })
      ) : (
        /* No-data day: a faint baseline tick so the day still occupies space */
        <div className="h-px w-full bg-[var(--color-border)] opacity-40" />
      )}
      {/* Today marker (subtle underline) */}
      {isToday && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
      )}
    </div>
  );
}

export async function TokenPreview() {
  const summary = await getUsageSummary(30);
  const hasData = summary.totalTokens > 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Use the windowed max so individual day shape is comparable; if all zero, fall back to 1 to avoid /0
  const maxTokens = Math.max(...summary.daily.map((d) => d.totalTokens), 1);

  // Tick labels: first day + middle + last day (avoid clutter)
  const tickIndices = [0, Math.floor(summary.daily.length / 2), summary.daily.length - 1];
  const tickLabels = tickIndices.map((i) => summary.daily[i]?.day.slice(5) ?? ''); // MM-DD

  // Top 3 + Other rollup
  const top = summary.platforms.slice(0, 3);
  const rest = summary.platforms.slice(3);
  const restTokens = rest.reduce((s, p) => s + p.totalTokens, 0);
  const restPct = summary.totalTokens > 0 ? (restTokens / summary.totalTokens) * 100 : 0;

  return (
    <div className="bg-[var(--color-bg)] p-9">
      {/* Heading + 3 KPI cards */}
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Token Usage
      </h3>

      <div className="mb-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
        <Kpi label="30d Tokens" value={hasData ? formatTokens(summary.totalTokens) : '—'} />
        <Kpi label="30d Spend (USD eq.)" value={hasData ? formatUsd(summary.totalCostUsd) : '—'} />
        <Kpi
          label="All-time Tokens"
          value={summary.allTimeTokens > 0 ? formatTokens(summary.allTimeTokens) : '—'}
          subtle={summary.allTimeCostUsd > 0 ? formatUsd(summary.allTimeCostUsd) : ''}
        />
      </div>

      {/* Daily stacked bar chart */}
      {hasData ? (
        <>
          <div className="hairline-t hairline-b py-4">
            <div className="overflow-x-auto">
              <div className="flex h-[88px] items-end gap-1 px-1" style={{ minWidth: `${summary.daily.length * 16}px` }}>
                {summary.daily.map((d) => (
                  <StackedBar
                    key={d.day}
                    point={d}
                    maxTokens={maxTokens}
                    isToday={d.day === todayStr}
                  />
                ))}
              </div>
              {/* Date tick row */}
              <div
                className="font-[family-name:var(--font-mono)] mt-2 flex justify-between px-1 text-[10px] text-[var(--color-text-2)]"
                style={{ minWidth: `${summary.daily.length * 16}px` }}
              >
                {tickLabels.map((label, i) => (
                  <span key={i} className={i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hint */}
          <p className="font-[family-name:var(--font-mono)] mt-3 text-[10px] text-[var(--color-text-2)]">
            Hover (desktop) / long-press (mobile) any bar to see that day&apos;s per-platform breakdown.
          </p>

          {/* Platform legend */}
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
        </>
      ) : (
        <div className="font-[family-name:var(--font-mono)] py-8 text-center text-[11px] text-[var(--color-text-2)]">
          No data yet · daemons still warming up
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
