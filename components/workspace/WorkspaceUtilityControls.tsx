"use client";

type OpenPath = (path: string) => void;

export function WorkspaceAiShortcuts({
  variant,
  onOpenPath,
  beforeOpen,
}: {
  variant: "header" | "sidebar" | "mobile";
  onOpenPath: OpenPath;
  beforeOpen?: () => void;
}) {
  const open = (path: string) => {
    beforeOpen?.();
    onOpenPath(path);
  };

  if (variant === "header") {
    return (
      <>
        <button
          type="button"
          onClick={() => open("/ai-web-design")}
          className="hidden h-9 rounded-[10px] border border-[#7897ff]/25 bg-[#7897ff]/10 px-3 text-[11px] font-semibold text-[#aebcff] transition hover:border-[#7897ff]/45 hover:bg-[#7897ff]/15 2xl:block"
        >
          AI Web Design
        </button>
        <button
          type="button"
          onClick={() => open("/video-ai")}
          className="hidden h-9 rounded-[10px] border border-[#9a79ff]/25 bg-[#9a79ff]/10 px-3 text-[11px] font-semibold text-[#c0adff] transition hover:border-[#9a79ff]/45 hover:bg-[#9a79ff]/15 2xl:block"
        >
          Video AI
        </button>
      </>
    );
  }

  if (variant === "sidebar") {
    return (
      <>
        <button
          type="button"
          onClick={() => open("/ai-web-design")}
          className="w-full rounded-[11px] border border-[#7897ff]/22 bg-[#7897ff]/[0.08] px-3.5 py-3 text-left transition hover:border-[#7897ff]/42 hover:bg-[#7897ff]/[0.12]"
        >
          <span className="block text-[11px] font-semibold text-[var(--text)]">✦ AI Web Design</span>
          <span className="mt-1 block text-[10px] font-normal leading-4 text-[var(--muted)]">Generează și rafinează website-ul →</span>
        </button>
        <button
          type="button"
          onClick={() => open("/video-ai")}
          className="w-full rounded-[11px] border border-[#9a79ff]/22 bg-[#9a79ff]/[0.08] px-3.5 py-3 text-left transition hover:border-[#9a79ff]/42 hover:bg-[#9a79ff]/[0.12]"
        >
          <span className="block text-[11px] font-semibold text-[var(--text)]">◈ Video AI</span>
          <span className="mt-1 block text-[10px] font-normal leading-4 text-[var(--muted)]">Storyboard și producție video AI →</span>
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => open("/ai-web-design")}
        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-[16px] border border-[#7897ff]/24 bg-[#7897ff]/[0.09] px-4 text-[11px] font-semibold text-[var(--text)]"
      >
        <span>✦ AI Web Design</span>
        <span className="text-[#aebcff]">→</span>
      </button>
      <button
        type="button"
        onClick={() => open("/video-ai")}
        className="mt-2 flex min-h-11 w-full items-center justify-between rounded-[16px] border border-[#9a79ff]/24 bg-[#9a79ff]/[0.09] px-4 text-[11px] font-semibold text-[var(--text)]"
      >
        <span>◈ Video AI</span>
        <span className="text-[#c0adff]">→</span>
      </button>
    </>
  );
}

export function WorkspaceTextScaleControl({
  percent,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  onReset,
}: {
  percent: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onReset: () => void;
}) {
  return (
    <div
      data-workspace-text-scale-control="desktop"
      className="min-w-0 rounded-[11px] border border-[var(--border)] bg-[color:var(--surface-2)]/60 px-3 py-2.5"
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 text-[10px] font-semibold leading-4 text-[var(--muted)]">Dimensiune text</span>
        <button
          type="button"
          onClick={onReset}
          title="Revino la 100%"
          aria-label="Revino la dimensiunea textului 100%"
          className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-center text-[9px] font-semibold text-[var(--muted-2)]"
        >
          {percent}%
        </button>
      </div>
      <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDecrease}
          disabled={!canDecrease}
          aria-label="Micșorează textul"
          className="flex h-8 min-w-0 items-center justify-center rounded-[9px] border border-[var(--border)] px-2 text-[12px] font-semibold disabled:opacity-30"
        >
          A−
        </button>
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canIncrease}
          aria-label="Mărește textul"
          className="flex h-8 min-w-0 items-center justify-center rounded-[9px] border border-[var(--border)] px-2 text-[12px] font-semibold disabled:opacity-30"
        >
          A+
        </button>
      </div>
    </div>
  );
}
