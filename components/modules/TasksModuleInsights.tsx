"use client";

import type {
  WorkTask,
  WorkTaskChecklistItem,
  WorkTaskClient,
  WorkTaskContext,
} from "@/lib/modules/tasks";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import {
  evaluatePostServiceGrowth,
  type PostServiceEventType,
  type PostServiceGrowthState,
} from "@/lib/automation/post-service-growth";
import { evaluateWorkReadiness } from "@/lib/automation/work-readiness";

const AFTERCARE_WINDOWS = [7, 30, 90, 180] as const;
const RECURRING_WORK_WINDOWS = [30, 90, 180, 365] as const;

function formatDateTime(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PostServiceGrowthPanel({
  task,
  state,
  loading,
  nowIso,
  saving,
  canWrite,
  estimatesEnabled,
  onEvent,
  onOpenClient,
  onCreateRecovery,
  onCreateEstimate,
}: {
  task: WorkTask;
  state: PostServiceGrowthState | null;
  loading: boolean;
  nowIso: string;
  saving: boolean;
  canWrite: boolean;
  estimatesEnabled: boolean;
  onEvent: (type: PostServiceEventType, score?: number) => void;
  onOpenClient: () => void;
  onCreateRecovery: () => void;
  onCreateEstimate: () => void;
}) {
  if (loading) {
    return (
      <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
        Se încarcă bucla post-serviciu…
      </section>
    );
  }
  if (!state) return null;

  const action = evaluatePostServiceGrowth({
    taskTitle: task.title,
    completedAt: task.completed_at,
    state,
    now: nowIso ? new Date(nowIso) : new Date(0),
  });
  const reviewResolved = Boolean(state.reviewCompletedAt || state.reviewDeclinedAt);
  const referralResolved = Boolean(state.referralReceivedAt || state.referralDeclinedAt);

  return (
    <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">
            ORBYVEN · POST-SERVICE GROWTH
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">
              Feedback → review → recomandare → oportunitate nouă.
            </h2>
            {state.feedbackScore !== null && (
              <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold">
                {state.feedbackScore}/5
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            {action?.detail ?? "Fluxul este în regulă; ORBYVEN va ridica următorul pas când devine relevant."}
          </p>
        </div>
        {action && (
          <span className="self-start rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
            {action.level === "urgent" ? "Prioritar" : action.level === "attention" ? "Recomandat" : "Următorul pas"}
          </span>
        )}
      </div>

      {canWrite && (
        <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
          {(state.feedback === "none" || state.feedback === "requested") && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
                Feedback client
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.feedback === "none" && (
                  <button type="button" disabled={saving} onClick={() => onEvent("feedback_requested")} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">
                    Marchează feedback cerut
                  </button>
                )}
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    disabled={saving}
                    onClick={() => onEvent("feedback_scored", score)}
                    className="h-9 min-w-10 rounded-full bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent)] disabled:opacity-50"
                  >
                    {score}★
                  </button>
                ))}
                <button type="button" disabled={saving} onClick={() => onEvent("feedback_issue")} className="h-9 rounded-full border border-rose-400/30 px-3.5 text-xs font-semibold text-rose-500 disabled:opacity-50">
                  Problemă raportată
                </button>
              </div>
            </div>
          )}

          {state.feedback === "issue" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-500">
                Recovery
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={onOpenClient} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold">
                  Deschide clientul
                </button>
                <button type="button" onClick={onCreateRecovery} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)]">
                  + Lucrare de remediere
                </button>
                <button type="button" disabled={saving} onClick={() => onEvent("recovery_resolved")} className="h-9 rounded-full border border-emerald-500/30 px-3.5 text-xs font-semibold text-emerald-600 disabled:opacity-50">
                  Remediere rezolvată ✓
                </button>
              </div>
            </div>
          )}

          {state.feedback === "positive" &&
            !state.reviewRequestedAt &&
            !reviewResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Review</p>
                <button type="button" disabled={saving} onClick={() => onEvent("review_requested")} className="mt-2 h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                  Marchează review cerut
                </button>
              </div>
            )}

          {state.feedback === "positive" &&
            state.reviewRequestedAt &&
            !reviewResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Rezultat review</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={saving} onClick={() => onEvent("review_completed")} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                    Review primit ✓
                  </button>
                  <button type="button" disabled={saving} onClick={() => onEvent("review_declined")} className="h-9 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                    Nu dorește
                  </button>
                </div>
              </div>
            )}

          {state.feedback === "positive" &&
            state.reviewCompletedAt &&
            !state.referralRequestedAt &&
            !referralResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Recomandare</p>
                <button type="button" disabled={saving} onClick={() => onEvent("referral_requested")} className="mt-2 h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">
                  Marchează recomandare cerută
                </button>
              </div>
            )}

          {state.feedback === "positive" &&
            state.reviewCompletedAt &&
            state.referralRequestedAt &&
            !referralResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Rezultat recomandare</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={saving} onClick={() => onEvent("referral_received")} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                    Recomandare primită ✓
                  </button>
                  <button type="button" disabled={saving} onClick={() => onEvent("referral_declined")} className="h-9 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                    Nu acum
                  </button>
                </div>
              </div>
            )}

          {action?.rule === "post_service_upsell" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Oportunitate nouă</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {estimatesEnabled && (
                  <button type="button" disabled={saving} onClick={onCreateEstimate} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                    + Ofertă nouă
                  </button>
                )}
                <button type="button" disabled={saving} onClick={() => onEvent("upsell_scheduled")} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">
                  Amintește-mi peste 30 zile
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function AftercarePanel({
  client,
  locale,
  nowIso,
  saving,
  canWrite,
  onSchedule,
  onRepeat,
  onOpenClient,
}: {
  client: WorkTaskClient;
  locale: string;
  nowIso: string;
  saving: boolean;
  canWrite: boolean;
  onSchedule: (days: number) => void;
  onRepeat: (days: number) => void;
  onOpenClient: () => void;
}) {
  const followUp = client.next_follow_up_at;
  const followUpIsFuture = followUp
    ? new Date(followUp).getTime() > new Date(nowIso || "1970-01-01T00:00:00.000Z").getTime()
    : false;

  return (
    <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">
            ORBYVEN · AFTERCARE
          </p>
          <h2 className="mt-1 text-[15px] font-semibold">
            Nu lăsa relația cu clientul să se închidă odată cu lucrarea.
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            {followUp
              ? `Revenire ${followUpIsFuture ? "programată" : "restantă"}: ${formatDateTime(followUp, locale)}`
              : "Programează următorul contact pentru mentenanță, feedback sau o comandă repetată."}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenClient}
          className="h-9 self-start rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold"
        >
          Fișa clientului ↗
        </button>
      </div>
      {canWrite && (
        <>
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
              Revenire client
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AFTERCARE_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={saving}
                  onClick={() => onSchedule(days)}
                  className="h-9 rounded-full bg-[var(--accent-soft)] px-3.5 text-xs font-semibold text-[var(--accent)] disabled:opacity-50"
                >
                  În {days} zile
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
              Lucrare recurentă
            </p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
              Creează următoarea lucrare cu același client, locație, durată și checklist. Responsabilul rămâne nealocat.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RECURRING_WORK_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={saving}
                  onClick={() => onRepeat(days)}
                  className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50"
                >
                  Repetă în {days === 365 ? "1 an" : days + " zile"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function WorkFileSummary({
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
            ? (context.inventoryShortageLines ?? 0) > 0
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
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
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
    </section>
  );
}
