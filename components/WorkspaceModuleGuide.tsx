"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrbyvenModule, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { WorkspaceNavigationIntent, WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { getEnabledWorkspaceFlow, getWorkspaceTargetOptions } from "@/lib/workspace-module-flow";
import {
  WORKSPACE_LIVE_CONTEXT_EVENT,
  type WorkspaceLiveContext,
} from "@/lib/workspace-live-context";

type Props = {
  activeModule: OrbyvenModuleId;
  navigation: WorkspaceNavigationIntent;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

export default function WorkspaceModuleGuide({
  activeModule,
  navigation,
  enabledModules,
  role,
  onOpenModule,
}: Props) {
  const flow = getEnabledWorkspaceFlow(activeModule, enabledModules);
  const current = getOrbyvenModule(activeModule);
  const nextModuleId = flow.next[0];
  const nextModule = nextModuleId ? getOrbyvenModule(nextModuleId) : null;
  const canCreate = role !== "viewer" && Boolean(flow.createLabel);
  const navigationContext = useMemo<WorkspaceLiveContext>(() => (
    navigation.module === activeModule
      ? {
          clientId: navigation.clientId,
          taskId: navigation.taskId,
          estimateId: navigation.estimateId,
          purchaseOrderId: navigation.purchaseOrderId,
          documentId: navigation.documentId,
        }
      : {}
  ), [
    activeModule,
    navigation.module,
    navigation.clientId,
    navigation.taskId,
    navigation.estimateId,
    navigation.purchaseOrderId,
    navigation.documentId,
  ]);
  const [liveState, setLiveState] = useState<{
    module: OrbyvenModuleId;
    context: WorkspaceLiveContext;
  }>({ module: activeModule, context: {} });
  const effectiveContext = useMemo<WorkspaceLiveContext>(() => {
    const liveContext = liveState.module === activeModule ? liveState.context : {};
    return { ...navigationContext, ...liveContext };
  }, [activeModule, liveState, navigationContext]);

  useEffect(() => {
    const handleContext = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceLiveContext>).detail;
      if (!detail) return;
      setLiveState({ module: activeModule, context: detail });
    };
    window.addEventListener(WORKSPACE_LIVE_CONTEXT_EVENT, handleContext);
    return () => window.removeEventListener(WORKSPACE_LIVE_CONTEXT_EVENT, handleContext);
  }, [activeModule]);

  if (activeModule === "overview") return null;

  const openConnectedModule = (
    moduleId: OrbyvenModuleId,
    extra: Pick<WorkspaceOpenOptions, "create"> = {},
  ) => onOpenModule(moduleId, getWorkspaceTargetOptions(moduleId, effectiveContext, extra));

  return (
    <section
      aria-label="Flux modul"
      className="mb-3 flex min-h-12 flex-col gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-5 text-[var(--muted)]">
          <span className="font-semibold text-[var(--text)]">{current?.shortName ?? "Modul"}</span>
          <span className="mx-1.5 text-[var(--muted-2)]">·</span>
          {flow.summary}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {canCreate && (
          <button
            type="button"
            onClick={() => openConnectedModule(activeModule, { create: true })}
            className="h-8 rounded-full bg-[var(--button)] px-3 text-[11px] font-semibold text-[var(--button-text)] transition hover:opacity-90"
          >
            + {flow.createLabel}
          </button>
        )}

        {nextModuleId && nextModule && (
          <button
            type="button"
            onClick={() => openConnectedModule(nextModuleId)}
            className="inline-flex h-8 items-center rounded-full border border-[var(--border-strong)] px-3 text-[11px] font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
          >
            <span className="sm:hidden">Continuă →</span>
            <span className="hidden sm:inline">Continuă · {nextModule.shortName}</span>
          </button>
        )}

        {flow.related.length > 1 && (
          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center rounded-full border border-[var(--border)] px-3 text-[11px] font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-2)] [&::-webkit-details-marker]:hidden">
              Legături
            </summary>
            <div className="absolute right-0 top-10 z-30 w-56 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl shadow-black/20">
              {flow.related.slice(0, 6).map((moduleId) => {
                const definition = getOrbyvenModule(moduleId);
                if (!definition) return null;
                return (
                  <button
                    key={moduleId}
                    type="button"
                    onClick={(event) => {
                      const details = event.currentTarget.closest("details");
                      if (details) details.open = false;
                      openConnectedModule(moduleId);
                    }}
                    className="flex w-full items-center justify-between rounded-[11px] px-3 py-2 text-left text-xs font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                  >
                    <span>{definition.shortName}</span>
                    <span aria-hidden="true" className="text-[var(--muted-2)]">→</span>
                  </button>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
