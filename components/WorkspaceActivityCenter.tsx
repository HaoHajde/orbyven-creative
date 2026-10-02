"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadWorkspaceActivity, type WorkspaceActivityItem } from "@/lib/modules/activity";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";

type Props = {
  organizationId: string;
  locale: string;
  timeZone: string;
  role: OrbyvenWorkspace["membership"]["role"];
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

type NativeBridgeWindow = Window & {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
};

const levelDot = {
  urgent: "bg-rose-400",
  attention: "bg-amber-400",
  upcoming: "bg-sky-400",
} as const;

export default function WorkspaceActivityCenter({
  organizationId,
  locale,
  timeZone,
  role,
  enabledModules,
  onOpenModule,
}: Props) {
  const [items, setItems] = useState<WorkspaceActivityItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nativePushAvailable, setNativePushAvailable] = useState(false);

  const canAccessFinances = ["owner", "admin", "manager"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await loadWorkspaceActivity(
        organizationId,
        enabledModules,
        canAccessFinances,
        locale,
        timeZone
      );
      setItems(next);
    } catch (reason) {
      console.error(reason);
      setError("Atenționările nu au putut fi actualizate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, enabledModules, canAccessFinances, locale, timeZone]);

  useEffect(() => {
    const bridgeTimer = window.setTimeout(() => {
      const bridge = (window as NativeBridgeWindow).ReactNativeWebView;
      setNativePushAvailable(Boolean(bridge));
    }, 0);
    return () => window.clearTimeout(bridgeTimer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = window.setInterval(() => void load(), 5 * 60 * 1000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(refresh);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const urgentCount = useMemo(
    () => items.filter((item) => item.level === "urgent").length,
    [items]
  );

  const requestNativePush = () => {
    const bridge = (window as NativeBridgeWindow).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "orbyven:register-push" }));
  };

  const openItem = (item: WorkspaceActivityItem) => {
    setOpen(false);
    const options: WorkspaceOpenOptions = {
      create: item.create,
      recordId: item.recordId,
      clientId: item.clientId,
      taskId: item.taskId,
      estimateId: item.estimateId,
      purchaseOrderId: item.purchaseOrderId,
    };
    onOpenModule(item.module, options);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Deschide atenționările"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/75 text-sm transition hover:border-[var(--border-strong)]"
      >
        <span aria-hidden="true">◔</span>
        {items.length > 0 ? (
          <span
            className={
              "absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white " +
              (urgentCount ? "bg-rose-500" : "bg-[var(--accent)]")
            }
          >
            {items.length > 99 ? "99+" : items.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Închide atenționările"
            className="fixed inset-0 z-[89] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-label="Atenționări ORBYVEN"
            className="fixed left-3 right-3 top-[72px] z-[90] max-h-[calc(100dvh-84px)] overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] shadow-[0_26px_90px_rgba(0,0,0,0.28)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-2)]">
                  ORBYVEN · AUTOMATION
                </p>
                <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.035em]">
                  Ce necesită atenție
                </h2>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Semnale cross-module și următorul pas potrivit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="rounded-[9px] border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-40"
              >
                ↻
              </button>
            </header>

            <div className="max-h-[calc(100dvh-176px)] overflow-y-auto overscroll-contain p-2.5">
              {nativePushAvailable ? (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold">Alerte pe iPhone</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      Primește notificări ORBYVEN și deschide direct contextul relevant.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={requestNativePush}
                    className="shrink-0 rounded-full border border-[var(--border-strong)] px-3 py-2 text-[10px] font-semibold"
                  >
                    Activează
                  </button>
                </div>
              ) : null}
              {loading && !items.length ? (
                <p role="status" className="px-3 py-8 text-center text-xs text-[var(--muted)]">
                  Se verifică activitatea…
                </p>
              ) : error ? (
                <p role="alert" className="rounded-[12px] border border-rose-400/20 bg-rose-400/[0.06] px-3 py-3 text-[11px] text-rose-300">
                  {error}
                </p>
              ) : items.length ? (
                <div className="grid gap-1.5">
                  {items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => openItem(item)}
                      className="flex w-full items-center gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
                    >
                      <span className={"h-2 w-2 shrink-0 rounded-full " + levelDot[item.level]} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold">{item.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{item.meta}</span>
                      </span>
                      <span className="shrink-0 text-[9px] font-semibold text-[var(--accent)]">
                        {item.actionLabel || "Deschide"} →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-[14px] border border-dashed border-[var(--border)] px-4 py-8 text-center">
                  <p className="text-xs font-semibold">Totul este în ordine.</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">Nu există semnale operaționale care cer intervenție.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
