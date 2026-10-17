"use client";

import type { RecoveryPresentation } from "@/lib/operations/recovery";

const toneClass: Record<RecoveryPresentation["tone"], string> = {
  neutral:
    "border-[var(--border)] bg-[color:var(--surface)]/76",
  warning:
    "border-amber-500/20 bg-amber-500/[0.065]",
  danger:
    "border-red-500/20 bg-red-500/[0.055]",
};

const dotClass: Record<RecoveryPresentation["tone"], string> = {
  neutral: "bg-[var(--muted-2)]",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

type Props = {
  recovery: RecoveryPresentation;
  onRetry?: () => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  busy?: boolean;
  compact?: boolean;
  className?: string;
};

export default function RecoveryState({
  recovery,
  onRetry,
  onRefresh,
  busy = false,
  compact = false,
  className = "",
}: Props) {
  const handler =
    recovery.action?.kind === "retry"
      ? onRetry
      : recovery.action?.kind === "refresh"
        ? onRefresh
        : undefined;

  return (
    <section
      role="alert"
      aria-live="polite"
      data-recovery-reason={recovery.reason}
      className={`rounded-[20px] border ${toneClass[recovery.tone]} ${compact ? "p-4" : "p-5 sm:p-6"} ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass[recovery.tone]}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-[-0.015em] text-[var(--text)] sm:text-base">
            {recovery.title}
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {recovery.description}
          </p>
          {recovery.hint ? (
            <p className="mt-2 text-xs leading-5 text-[var(--muted-2)]">
              {recovery.hint}
            </p>
          ) : null}

          {recovery.action && handler ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handler()}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface)] disabled:cursor-wait disabled:opacity-55"
            >
              {busy ? "…" : recovery.action.label}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
