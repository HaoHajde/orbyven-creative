"use client";

import BrandLogo from "@/components/BrandLogo";
import type { CSSProperties } from "react";

type Theme = "light" | "dark";

type Props = {
  vars: CSSProperties;
  theme: Theme;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function WorkspaceStateScreen({
  vars,
  theme,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6 py-6 md:px-10">
        <BrandLogo compact theme={theme} />
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="max-w-lg text-center">
            <div className="mx-auto h-3 w-3 rounded-full bg-[var(--accent)]" />
            <h1 className="mt-6 text-[38px] font-semibold tracking-[-0.05em]">{title}</h1>
            {description && <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{description}</p>}
            {(actionLabel || secondaryLabel) && (
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {actionLabel && onAction && <button type="button" onClick={onAction} className="h-11 rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]">{actionLabel}</button>}
                {secondaryLabel && onSecondary && <button type="button" onClick={onSecondary} className="h-11 rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium">{secondaryLabel}</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
