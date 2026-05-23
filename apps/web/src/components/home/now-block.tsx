export function NowBlock() {
  return (
    <div className="bg-[var(--color-bg)] p-9">
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Now
      </h3>
      <div className="font-[family-name:var(--font-zh-serif)] text-[17px] leading-[1.85]">
        目前在打磨{' '}
        <strong className="font-semibold text-[var(--color-accent)]">
          Finance Tracker
        </strong>{' '}
        的加密资产模块，同时把{' '}
        <strong className="font-semibold text-[var(--color-accent)]">
          个人主页
        </strong>{' '}
        这件事正式推进起来。读完了《The Score Takes Care of Itself》，正在重读《Working in Public》。这周末打算把桌面机械臂的上位机 UI 重做一遍。
      </div>
      <p className="font-[family-name:var(--font-mono)] mt-5 text-xs text-[var(--color-text-2)]">
        UPDATED · 2026-05-23 · SHENZHEN
      </p>
    </div>
  );
}
