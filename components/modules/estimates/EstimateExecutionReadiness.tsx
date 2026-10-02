"use client";

import { useEffect, useMemo, useState } from "react";
import type { Estimate } from "@/lib/modules/estimates";
import {
  loadInventoryTaskMaterialPlan,
  type InventoryTaskMaterialPlan,
} from "@/lib/modules/inventory";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { ModuleNextAction } from "@/components/modules/ModuleKit";

export type EstimateExecutionReadinessState = {
  plan: InventoryTaskMaterialPlan[] | null;
  taskId: string | null;
  loading: boolean;
  error: boolean;
  summary: {
    lines: number;
    untracked: number;
    unready: number;
    shortages: number;
  };
  materialBlocksScheduling: boolean;
};

export function useEstimateExecutionReadiness({
  organizationId,
  estimate,
  inventoryEnabled,
}: {
  organizationId: string;
  estimate: Estimate | null;
  inventoryEnabled: boolean;
}): EstimateExecutionReadinessState {
  const [plan, setPlan] = useState<InventoryTaskMaterialPlan[] | null>(null);
  const [planTaskId, setPlanTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const taskId = estimate?.status === "accepted" ? estimate.task_id : null;
      if (!taskId || !inventoryEnabled) {
        if (active) {
          setPlan(null);
          setPlanTaskId(null);
          setLoading(false);
          setError(false);
        }
        return;
      }

      setPlanTaskId(taskId);
      setLoading(true);
      setError(false);
      void loadInventoryTaskMaterialPlan(organizationId, taskId)
        .then((nextPlan) => {
          if (!active) return;
          setPlan(nextPlan);
          setError(false);
        })
        .catch((reason) => {
          console.error(reason);
          if (!active) return;
          setPlan(null);
          setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [estimate?.status, estimate?.task_id, inventoryEnabled, organizationId]);

  const summary = useMemo(() => {
    const rows = plan ?? [];
    const activeRows = rows.filter((item) => item.outstanding_quantity > 0);
    return {
      lines: rows.length,
      untracked: activeRows.filter((item) => !item.stock_tracked).length,
      unready: activeRows.filter(
        (item) =>
          item.stock_tracked &&
          item.reserved_quantity < item.outstanding_quantity
      ).length,
      shortages: activeRows.filter(
        (item) =>
          item.stock_tracked &&
          item.shortage_after_reservation > 0
      ).length,
    };
  }, [plan]);

  const materialBlocksScheduling = Boolean(
    estimate?.status === "accepted" &&
      estimate.task_id &&
      inventoryEnabled &&
      (
        planTaskId !== estimate.task_id ||
        loading ||
        error ||
        (plan && (summary.unready > 0 || summary.shortages > 0))
      )
  );

  return {
    plan,
    taskId: planTaskId,
    loading,
    error,
    summary,
    materialBlocksScheduling,
  };
}

export function EstimateExecutionNextAction({
  estimate,
  canWrite,
  enabledModules,
  onOpenModule,
  inventoryEnabled,
  readiness,
}: {
  estimate: Estimate;
  canWrite: boolean;
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  inventoryEnabled: boolean;
  readiness: EstimateExecutionReadinessState;
}) {
  if (estimate.status !== "accepted") return null;

  if (!estimate.task_id && canWrite && enabledModules.includes("tasks")) {
    return (
      <div className="mt-4">
        <ModuleNextAction
          title="Pornește lucrarea din oferta acceptată"
          description="Clientul, devizul și contextul comercial sunt transferate automat."
          action={
            <button
              type="button"
              onClick={() =>
                onOpenModule("tasks", {
                  create: true,
                  clientId: estimate.client_id ?? undefined,
                  estimateId: estimate.id,
                  prefillTitle: estimate.title,
                })
              }
              className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]"
            >
              Pornește lucrarea →
            </button>
          }
        />
      </div>
    );
  }

  if (!estimate.task_id) return null;

  if (
    inventoryEnabled &&
    (readiness.taskId !== estimate.task_id || readiness.loading)
  ) {
    return (
      <div className="mt-4">
        <ModuleNextAction
          eyebrow="Readiness"
          title="Verific materialele lucrării"
          description="ORBYVEN verifică necesarul, rezervările și lipsurile înainte să propună programarea."
        />
      </div>
    );
  }

  if (
    inventoryEnabled &&
    readiness.error &&
    enabledModules.includes("tasks")
  ) {
    return (
      <div className="mt-4">
        <ModuleNextAction
          eyebrow="Readiness"
          title="Verifică lucrarea înainte de programare"
          description="Pregătirea materialelor nu a putut fi confirmată acum; dosarul lucrării păstrează toate verificările într-un singur loc."
          action={
            <button
              type="button"
              onClick={() => onOpenModule("tasks", { recordId: estimate.task_id! })}
              className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]"
            >
              Deschide lucrarea →
            </button>
          }
        />
      </div>
    );
  }

  if (
    inventoryEnabled &&
    readiness.plan &&
    (readiness.summary.unready > 0 || readiness.summary.shortages > 0)
  ) {
    return (
      <div className="mt-4">
        <ModuleNextAction
          eyebrow="Înainte de calendar"
          title={
            readiness.summary.shortages > 0
              ? "Rezolvă materialele lipsă"
              : "Rezervă materialele disponibile"
          }
          description={
            readiness.summary.shortages > 0
              ? `${readiness.summary.shortages} poziții rămân neacoperite. Programarea vine după ce necesarul este clar.`
              : `${readiness.summary.unready} poziții pot fi pregătite din stoc înainte de programare.`
          }
          action={
            <button
              type="button"
              onClick={() => onOpenModule("inventory", { taskId: estimate.task_id! })}
              className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]"
            >
              Pregătește materialele →
            </button>
          }
        />
      </div>
    );
  }

  if (
    canWrite &&
    enabledModules.includes("calendar") &&
    !readiness.materialBlocksScheduling
  ) {
    return (
      <div className="mt-4">
        <ModuleNextAction
          title="Programează execuția"
          description={
            readiness.summary.untracked > 0
              ? `${readiness.summary.untracked} poziții nu folosesc stoc tracking și rămân de verificat manual; ORBYVEN nu le blochează automat. Lucrarea poate intra în calendar.`
              : readiness.plan && readiness.summary.lines > 0
                ? "Materialele urmărite sunt pregătite. Lucrarea poate intra în calendar."
                : "Nu există un blocaj material detectat. Lucrarea poate intra în calendar."
          }
          action={
            <button
              type="button"
              onClick={() =>
                onOpenModule("calendar", {
                  create: true,
                  clientId: estimate.client_id ?? undefined,
                  taskId: estimate.task_id ?? undefined,
                })
              }
              className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]"
            >
              + Programare
            </button>
          }
        />
      </div>
    );
  }

  return null;
}
