import { getUsageSummary, formatTokens, formatUsd } from '@/lib/cms/usage';

const PLATFORM_COLORS: Record<string, string> = {
  anthropic: 'var(--color-text)',     // ink black (the user's heaviest)
  openai: 'var(--color-accent)',      // brick red
  zhipu: 'var(--color-text-2)',       // warm gray
  moonshot: 'var(--color-border)',    // hairline tone
  google: 'var(--color-text-2)',
  deepseek: 'var(--color-text-2)',
  minimax: 'var(--color-text-2)',
  github: 'var(--color-text-2)',
  local: 'var(--color-text-2)',
  other: 'var(--color-text-2)',
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
  return PLATFORM_COLORS[platform] ?? 'var(--color-text-2)';
}

function labelFor(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export async function TokenPreview() {
  const summary = await getUsageSummary(30);
  const hasData = summary.totalTokens > 0;

  // Build daily bar chart: take last 7 days, normalize to max
  const last7 = summary.daily.slice(-7);
  const maxTokens = Math.max(...last7.map((d) => d.totalTokens), 1);
  // Pad to 7 bars if we have fewer days
  while (last7.length < 7) last7.unshift({ day: '', totalTokens: 0, costUsd: 0 });
  const peakIdx = last7.reduce((peak, d, i) => (d.totalTokens > last7[peak].totalTokens ? i : peak), 0);

  // Top 3 platforms by tokens; rest collapse into "Other"
  const top = summary.platforms.slice(0, 3);
  const rest = summary.platforms.slice(3);
  const restTokens = rest.reduce((s, p) => s + p.totalTokens, 0);
  const restPct = summary.totalTokens > 0 ? (restTokens / summary.totalTokens) * 100 : 0;

  return (
    <div className="bg-[var(--color-bg)] p-9">
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Token Usage · 30 days
      </h3>

      <div className="mb-6 grid grid-cols-2 gap-5">
        <div>
          <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[28px] font-medium leading-none">
            {hasData ? formatTokens(summary.totalTokens) : '—'}
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
            Total Tokens
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[28px] font-medium leading-none">
            {hasData ? formatUsd(summary.totalCostUsd) : '—'}
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
            Spend (USD eq.)
          </div>
        </div>
      </div>

      <div className="mt-4 flex h-[60px] items-end gap-1.5">
        {last7.map((d, i) => {
          const pct = maxTokens > 0 ? Math.max(2, (d.totalTokens / maxTokens) * 100) : 2;
          const isPeak = i === peakIdx && d.totalTokens > 0;
          return (
            <div
              key={i}
              className="flex-1"
              style={{
                height: `${pct}%`,
                background: isPeak ? 'var(--color-accent)' : 'var(--color-text)',
                opacity: d.totalTokens > 0 ? (isPeak ? 1 : 0.85) : 0.15,
              }}
              title={d.day ? `${d.day}: ${formatTokens(d.totalTokens)}` : 'no data'}
            />
          );
        })}
      </div>

      <div className="font-[family-name:var(--font-mono)] mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-2)]">
        {hasData ? (
          <>
            {top.map((p) => (
              <span key={p.platform} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5"
                  style={{ background: colorFor(p.platform) }}
                />
                {labelFor(p.platform)} {p.pct.toFixed(0)}%
              </span>
            ))}
            {restPct > 0.5 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 bg-[var(--color-border)]" />
                Other {restPct.toFixed(0)}%
              </span>
            )}
          </>
        ) : (
          <span>No data yet · daemons still warming up</span>
        )}
      </div>
    </div>
  );
}
