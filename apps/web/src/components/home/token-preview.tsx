interface BarSpec {
  height: number;
  accent?: boolean;
}

const SAMPLE_BARS: BarSpec[] = [
  { height: 30 },
  { height: 45 },
  { height: 60 },
  { height: 38 },
  { height: 90, accent: true },
  { height: 55 },
  { height: 70 },
];

export function TokenPreview() {
  return (
    <div className="bg-[var(--color-bg)] p-9">
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Token Usage · 30 days
      </h3>

      <div className="mb-6 grid grid-cols-2 gap-5">
        <div>
          <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[28px] font-medium leading-none">
            142.8M
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
            Total Tokens
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[28px] font-medium leading-none">
            $1,847
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
            Spend (USD)
          </div>
        </div>
      </div>

      <div className="mt-4 flex h-[60px] items-end gap-1.5">
        {SAMPLE_BARS.map((bar, i) => (
          <div
            key={i}
            className={
              bar.accent
                ? 'flex-1 bg-[var(--color-accent)]'
                : 'flex-1 bg-[var(--color-text)]/85'
            }
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>

      <div className="font-[family-name:var(--font-mono)] mt-3 flex flex-wrap gap-4 text-[11px] text-[var(--color-text-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--color-text)]/85" />
          Anthropic 78%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--color-accent)]" />
          OpenAI 18%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--color-text-2)]" />
          Other 4%
        </span>
      </div>
    </div>
  );
}
