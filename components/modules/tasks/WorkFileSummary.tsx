import type { WorkTask, WorkTaskChecklistItem, WorkTaskContext } from "@/lib/modules/tasks";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { evaluateWorkReadiness } from "@/lib/automation/work-readiness";
import { ModuleNextAction } from "@/components/modules/ModuleKit";

export default function WorkFileSummary({
  task,
  context,
  checklist,
  inactiveAssigneeNames,
  snapshotIso,
  loading,
  error,
  locale,
  enabledModules,
  canAccessFinances,
  onOpenModule,
  onCompleteTask,
}: {
  task: WorkTask;
  context: WorkTaskContext | null;
  checklist: WorkTaskChecklistItem[];
  inactiveAssigneeNames: string[];
  snapshotIso: string;
  loading: boolean;
  error: string;
  locale: string;
  enabledModules: OrbyvenModuleId[];
  canAccessFinances: boolean;
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  onCompleteTask?: () => void;
}) {
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "RON",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const readiness = context
    ? evaluateWorkReadiness({
        operation: {
          kind: task.kind,
          status: task.status,
          assignee: task.assignee,
          scheduledAt: task.scheduled_at,
          dueAt: task.due_at,
          progress: task.progress,
        },
        context,
        checklist: {
          total: checklist.length,
          done: checklist.filter((item) => item.done).length,
        },
        inactiveAssigneeNames,
        enabled: {
          estimates: enabledModules.includes("estimates"),
          documents: enabledModules.includes("documents"),
          calendar: enabledModules.includes("calendar"),
          expenses: enabledModules.includes("expenses"),
          inventory: enabledModules.includes("inventory"),
          team: enabledModules.includes("team"),
        },
        canAccessFinances,
        now: snapshotIso ? new Date(snapshotIso) : new Date(0),
      })
    : null;

  const attention = readiness?.checks.find((check) => check.state === "attention") ?? null;
  const operationalCloseReady = Boolean(
    !attention &&
    task.status === "in_progress" &&
    context &&
    context.upcomingEventsCount === 0 &&
    checklist.length > 0 &&
    checklist.every((item) => item.done) &&
    (!enabledModules.includes("documents") || context.documentsCount > 0)
  );
  const completionFinanceAction =
    !attention &&
    task.status === "done" &&
    enabledModules.includes("expenses") &&
    canAccessFinances
      ? {
          label: "Închide financiar",
          module: "expenses" as OrbyvenModuleId,
          options: {
            taskId: task.id,
            clientId: task.client_id ?? undefined,
          } as WorkspaceOpenOptions,
        }
      : null;

  const nextAction = attention
    ? attention.key === "commercial" && enabledModules.includes("estimates")
      ? { label: "Deschide ofertele", module: "estimates" as OrbyvenModuleId, options: { create: context?.estimatesCount === 0, taskId: task.id, clientId: task.client_id ?? undefined } as WorkspaceOpenOptions }
      : attention.key === "schedule" && enabledModules.includes("calendar")
        ? { label: "Programează", module: "calendar" as OrbyvenModuleId, options: { create: true, taskId: task.id, clientId: task.client_id ?? undefined } as WorkspaceOpenOptions }
        : attention.key === "documents" && enabledModules.includes("documents")
          ? { label: "Adaugă document", module: "documents" as OrbyvenModuleId, options: { create: true, taskId: task.id } as WorkspaceOpenOptions }
          : attention.key === "materials" && enabledModules.includes("inventory")
            ? { label: "Rezolvă materialele", module: "inventory" as OrbyvenModuleId, options: { taskId: task.id } as WorkspaceOpenOptions }
            : attention.key === "costs" && enabledModules.includes("expenses") && canAccessFinances
              ? { label: "Înregistrează cost", module: "expenses" as OrbyvenModuleId, options: { create: true, taskId: task.id, clientId: task.client_id ?? undefined } as WorkspaceOpenOptions }
              : attention.key === "financial" && enabledModules.includes("expenses") && canAccessFinances
                ? { label: "Închide financiar", module: "expenses" as OrbyvenModuleId, options: { taskId: task.id, clientId: task.client_id ?? undefined } as WorkspaceOpenOptions }
                : attention.key === "ownership" && enabledModules.includes("team")
                ? { label: "Deschide echipa", module: "team" as OrbyvenModuleId, options: undefined }
                : null
    : null;

  const cards = [
    enabledModules.includes("estimates")
      ? {
          id: "estimates" as const,
          label: "Oferte",
          value: context ? String(context.estimatesCount) : "—",
          note: context
            ? context.acceptedEstimatesCount
              ? context.acceptedEstimatesCount + " acceptate"
              : context.sentEstimatesCount
                ? context.sentEstimatesCount + " în așteptare"
                : "fără ofertă trimisă"
            : "se încarcă",
          options: context?.latestEstimateId ? { recordId: context.latestEstimateId } : undefined,
        }
      : null,
    enabledModules.includes("calendar")
      ? {
          id: "calendar" as const,
          label: "Programări",
          value: context ? String(context.eventsCount) : "—",
          note: context ? context.upcomingEventsCount + " viitoare" : "se încarcă",
          options: undefined,
        }
      : null,
    enabledModules.includes("documents")
      ? {
          id: "documents" as const,
          label: "Documente",
          value: context ? String(context.documentsCount) : "—",
          note: "legate de lucrare",
          options: { taskId: task.id },
        }
      : null,
    enabledModules.includes("inventory") && task.kind !== "task"
      ? {
          id: "inventory" as const,
          label: "Consum stoc",
          value: context?.inventoryConsumedCents !== null && context?.inventoryConsumedCents !== undefined
            ? money(context.inventoryConsumedCents)
            : "—",
          note: context
            ? (context.openPurchaseOrdersCount ?? 0) > 0
              ? context.openPurchaseOrdersCount + " PO deschise"
              : (context.inventoryShortageLines ?? 0) > 0
                ? context.inventoryShortageLines + " poziții cu lipsă"
                : (context.inventoryUnreadyLines ?? 0) > 0
                  ? context.inventoryUnreadyLines + " poziții de rezervat"
                  : (context.inventoryRequiredLines ?? 0) > 0
                    ? "necesar acoperit"
                    : (context.inventoryMovementsCount ?? 0) + " mișcări"
            : "se încarcă",
          options: { taskId: task.id },
        }
      : null,
    enabledModules.includes("expenses") && canAccessFinances
      ? {
          id: "expenses" as const,
          label: "Cost real",
          value: context?.realOperationalCostCents !== null && context?.realOperationalCostCents !== undefined
            ? money(context.realOperationalCostCents)
            : "—",
          note: context
            ? (context.expensesCount ?? 0) + " cheltuieli operative + " + (context.inventoryMovementsCount ?? 0) + " consumuri stoc"
            : "se încarcă",
          options: { taskId: task.id },
        }
      : null,
    enabledModules.includes("thermal") && task.kind === "work"
      ? {
          id: "thermal" as const,
          label: "Planșă",
          value: context?.thermalSketch ? "Creată" : context ? "Nouă" : "—",
          note: "modul specializat",
          options: { taskId: task.id },
        }
      : null,
  ].filter(Boolean) as Array<{
    id: OrbyvenModuleId;
    label: string;
    value: string;
    note: string;
    options?: WorkspaceOpenOptions;
  }>;

  if (!cards.length) return null;

  return (
    <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">DOSAR OPERAȚIONAL</p>
          <h2 className="mt-1 text-[15px] font-semibold">Tot contextul într-un singur loc</h2>
        </div>
        <span className="text-[10px] text-[var(--muted-2)]">{loading ? "Se sincronizează…" : "Live"}</span>
      </div>
      {error ? <p className="mt-2 text-[10px] text-amber-500">{error}</p> : null}
      {readiness ? (
        <div className={
          "mt-3 flex flex-col gap-2 rounded-[14px] border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between " +
          (readiness.level === "blocked"
            ? "border-rose-400/25 bg-rose-400/[0.06]"
            : readiness.level === "attention"
              ? "border-amber-400/25 bg-amber-400/[0.06]"
              : "border-emerald-400/20 bg-emerald-400/[0.05]")
        }>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">ORBYVEN · WORK READINESS</p>
            <p className="mt-1 text-[11px] font-semibold">{readiness.label}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-[var(--muted)]">{readiness.headline}</p>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-[9px] font-semibold text-[var(--muted)]">
            {readiness.attentionCount ? readiness.attentionCount + " de verificat" : "fără blocaje"}
          </span>
        </div>
      ) : null}
      {attention ? (
        <div className="mt-3">
          <ModuleNextAction
            eyebrow="Acum"
            title={attention.label + " · " + readiness!.headline}
            description="ORBYVEN a ales primul punct care poate bloca sau întârzia lucrarea."
            action={nextAction ? (
              <button
                type="button"
                onClick={() => onOpenModule(nextAction.module, nextAction.options)}
                className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]"
              >
                {nextAction.label} →
              </button>
            ) : attention.key === "checklist" ? (
              <button
                type="button"
                onClick={() => document.querySelector('[data-task-checklist="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]"
              >
                Deschide checklist →
              </button>
            ) : undefined}
          />
        </div>
      ) : readiness ? (
        <div className="mt-3">
          <ModuleNextAction
            eyebrow="Acum"
            title={
              task.status === "done"
                ? "Dosarul operațional este coerent"
                : task.status === "cancelled"
                  ? "Operațiunea este anulată"
                  : operationalCloseReady
                    ? "Lucrarea este pregătită pentru închidere"
                    : "Poți continua execuția"
            }
            description={
              task.status === "done"
                ? "Lucrarea este finalizată. Următorul pas este verificarea încasării, facturii și costurilor asociate."
                : task.status === "cancelled"
                  ? "Contextul rămâne disponibil pentru istoric. Nu există nicio acțiune de execuție recomandată."
                  : operationalCloseReady
                    ? "Nu mai există programări viitoare, checklist-ul este complet și dosarul are documentație asociată."
                    : "Nu există un blocaj operațional detectat în datele disponibile."
            }
            action={completionFinanceAction ? (
              <button
                type="button"
                onClick={() => onOpenModule(completionFinanceAction.module, completionFinanceAction.options)}
                className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]"
              >
                {completionFinanceAction.label} →
              </button>
            ) : operationalCloseReady && onCompleteTask ? (
              <button
                type="button"
                onClick={onCompleteTask}
                className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]"
              >
                Finalizează lucrarea →
              </button>
            ) : undefined}
          />
        </div>
      ) : null}

      <details className="group mt-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)]/45">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-[11px] font-semibold text-[var(--muted)] [&::-webkit-details-marker]:hidden">
          <span>Dosar complet · {cards.length} legături</span>
          <span aria-hidden="true" className="transition group-open:rotate-45">+</span>
        </summary>
        <div className="grid gap-2 border-t border-[var(--border)] p-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenModule(card.id, card.options)}
              className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)]/70 p-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
            >
              <span className="block text-[9px] font-semibold uppercase tracking-[0.11em] text-[var(--muted-2)]">{card.label}</span>
              <span className="mt-1.5 block truncate text-[17px] font-semibold tracking-[-0.03em]">{card.value}</span>
              <span className="mt-1 block truncate text-[10px] text-[var(--muted)]">{card.note}</span>
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}

