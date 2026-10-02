"use client";

import type { WorkTask, WorkTaskClient } from "@/lib/modules/tasks";
import {
  evaluatePostServiceGrowth,
  type PostServiceEventType,
  type PostServiceGrowthState,
} from "@/lib/automation/post-service-growth";

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
            <h2 className="text-[15px] font-semibold">Feedback → review → recomandare → oportunitate nouă.</h2>
            {state.feedbackScore !== null ? (
              <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold">{state.feedbackScore}/5</span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            {action?.detail ?? "Fluxul este în regulă; ORBYVEN va ridica următorul pas când devine relevant."}
          </p>
        </div>
        {action ? (
          <span className="self-start rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
            {action.level === "urgent" ? "Prioritar" : action.level === "attention" ? "Recomandat" : "Următorul pas"}
          </span>
        ) : null}
      </div>

      {canWrite ? (
        <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
          {(state.feedback === "none" || state.feedback === "requested") ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Feedback client</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.feedback === "none" ? (
                  <button type="button" disabled={saving} onClick={() => onEvent("feedback_requested")} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">Marchează feedback cerut</button>
                ) : null}
                {[1, 2, 3, 4, 5].map((score) => (
                  <button key={score} type="button" disabled={saving} onClick={() => onEvent("feedback_scored", score)} className="h-9 min-w-10 rounded-full bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent)] disabled:opacity-50">{score}★</button>
                ))}
                <button type="button" disabled={saving} onClick={() => onEvent("feedback_issue")} className="h-9 rounded-full border border-rose-400/30 px-3.5 text-xs font-semibold text-rose-500 disabled:opacity-50">Problemă raportată</button>
              </div>
            </div>
          ) : null}

          {state.feedback === "issue" ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-500">Recovery</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={onOpenClient} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold">Deschide clientul</button>
                <button type="button" onClick={onCreateRecovery} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)]">+ Lucrare de remediere</button>
                <button type="button" disabled={saving} onClick={() => onEvent("recovery_resolved")} className="h-9 rounded-full border border-emerald-500/30 px-3.5 text-xs font-semibold text-emerald-600 disabled:opacity-50">Remediere rezolvată ✓</button>
              </div>
            </div>
          ) : null}

          {state.feedback === "positive" && !state.reviewRequestedAt && !reviewResolved ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Review</p>
              <button type="button" disabled={saving} onClick={() => onEvent("review_requested")} className="mt-2 h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Marchează review cerut</button>
            </div>
          ) : null}

          {state.feedback === "positive" && state.reviewRequestedAt && !reviewResolved ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Rezultat review</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={saving} onClick={() => onEvent("review_completed")} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Review primit ✓</button>
                <button type="button" disabled={saving} onClick={() => onEvent("review_declined")} className="h-9 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">Nu dorește</button>
              </div>
            </div>
          ) : null}

          {state.feedback === "positive" && state.reviewCompletedAt && !state.referralRequestedAt && !referralResolved ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Recomandare</p>
              <button type="button" disabled={saving} onClick={() => onEvent("referral_requested")} className="mt-2 h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">Marchează recomandare cerută</button>
            </div>
          ) : null}

          {state.feedback === "positive" && state.reviewCompletedAt && state.referralRequestedAt && !referralResolved ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Rezultat recomandare</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={saving} onClick={() => onEvent("referral_received")} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Recomandare primită ✓</button>
                <button type="button" disabled={saving} onClick={() => onEvent("referral_declined")} className="h-9 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">Nu acum</button>
              </div>
            </div>
          ) : null}

          {action?.rule === "post_service_upsell" ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Oportunitate nouă</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {estimatesEnabled ? (
                  <button type="button" disabled={saving} onClick={onCreateEstimate} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">+ Ofertă nouă</button>
                ) : null}
                <button type="button" disabled={saving} onClick={() => onEvent("upsell_scheduled")} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">Amintește-mi peste 30 zile</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">ORBYVEN · AFTERCARE</p>
          <h2 className="mt-1 text-[15px] font-semibold">Nu lăsa relația cu clientul să se închidă odată cu lucrarea.</h2>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            {followUp
              ? `Revenire ${followUpIsFuture ? "programată" : "restantă"}: ${formatDateTime(followUp, locale)}`
              : "Programează următorul contact pentru mentenanță, feedback sau o comandă repetată."}
          </p>
        </div>
        <button type="button" onClick={onOpenClient} className="h-9 self-start rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">Fișa clientului ↗</button>
      </div>

      {canWrite ? (
        <>
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Revenire client</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AFTERCARE_WINDOWS.map((days) => (
                <button key={days} type="button" disabled={saving} onClick={() => onSchedule(days)} className="h-9 rounded-full bg-[var(--accent-soft)] px-3.5 text-xs font-semibold text-[var(--accent)] disabled:opacity-50">În {days} zile</button>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Lucrare recurentă</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">Creează următoarea lucrare cu același client, locație, durată și checklist. Responsabilul rămâne nealocat.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RECURRING_WORK_WINDOWS.map((days) => (
                <button key={days} type="button" disabled={saving} onClick={() => onRepeat(days)} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">Repetă în {days === 365 ? "1 an" : days + " zile"}</button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
