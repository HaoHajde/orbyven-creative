"use client";

import {
  loadClientGrowthState,
  loadLatestCompletedClientWork,
  markClientFeedbackRequested,
  recordClientFeedback,
  scheduleClientUpsell,
  setClientReferralStatus,
  setClientReviewStatus,
  setClientUpsellStatus,
  type ClientGrowthCompletedWork,
  type ClientGrowthState,
} from "@/lib/modules/client-growth";
import { evaluateClientGrowth } from "@/lib/automation/client-growth";
import { createCrmLeadActivity } from "@/lib/modules/leads";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  organizationId: string;
  clientId: string;
  clientName: string;
  locale: string;
  canWrite: boolean;
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

export default function ClientGrowthPanel({
  organizationId,
  clientId,
  clientName,
  locale,
  canWrite,
  enabledModules,
  onOpenModule,
}: Props) {
  const [growth, setGrowth] = useState<ClientGrowthState | null>(null);
  const [latestWork, setLatestWork] = useState<ClientGrowthCompletedWork | null>(null);
  const [snapshotIso, setSnapshotIso] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [growthState, work] = await Promise.all([
        loadClientGrowthState(organizationId, clientId),
        loadLatestCompletedClientWork(organizationId, clientId),
      ]);
      setGrowth(growthState);
      setLatestWork(work);
      setFeedbackNote(
        growthState?.feedback_task_id === work?.id
          ? growthState?.feedback_note ?? ""
          : ""
      );
      setSnapshotIso(new Date().toISOString());
    } catch (loadError) {
      console.error(loadError);
      setError("Growth Loop nu a putut fi încărcat.");
    } finally {
      setLoading(false);
    }
  }, [clientId, organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const evaluation = useMemo(
    () =>
      evaluateClientGrowth(
        growth,
        latestWork
          ? {
              id: latestWork.id,
              title: latestWork.title,
              completedAt: latestWork.completed_at,
            }
          : null,
        snapshotIso ? new Date(snapshotIso) : new Date(0)
      ),
    [growth, latestWork, snapshotIso]
  );

  const sameCycle = Boolean(
    growth && latestWork && growth.feedback_task_id === latestWork.id
  );

  const audit = async (body: string) => {
    try {
      await createCrmLeadActivity(organizationId, clientId, "status", body);
    } catch (auditError) {
      console.error(auditError);
      setError("Starea a fost salvată, dar istoricul CRM nu a putut fi completat.");
    }
  };

  const run = async (
    action: () => Promise<ClientGrowthState>,
    auditBody: string
  ) => {
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const next = await action();
      setGrowth(next);
      setSnapshotIso(new Date().toISOString());
      await audit(auditBody);
    } catch (actionError) {
      console.error(actionError);
      setError("Acțiunea Growth Loop nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  const requestFeedback = () => {
    if (!latestWork) return;
    void run(
      () => markClientFeedbackRequested(organizationId, clientId, latestWork.id),
      `Feedback solicitat după „${latestWork.title}”.`
    );
  };

  const saveFeedback = (score: number) => {
    if (!latestWork) return;
    void run(
      () =>
        recordClientFeedback(
          organizationId,
          clientId,
          latestWork.id,
          score,
          feedbackNote
        ),
      `Feedback înregistrat: ${score}/5 după „${latestWork.title}”.`
    );
  };

  const setReview = (status: "requested" | "completed" | "declined") =>
    void run(
      () => setClientReviewStatus(organizationId, clientId, status),
      status === "requested"
        ? "Review public solicitat."
        : status === "completed"
          ? "Review public marcat ca primit."
          : "Review public marcat ca refuzat."
    );

  const setReferral = (status: "requested" | "received" | "declined") =>
    void run(
      () => setClientReferralStatus(organizationId, clientId, status),
      status === "requested"
        ? "Recomandare solicitată clientului."
        : status === "received"
          ? "Recomandare primită de la client."
          : "Recomandarea a fost amânată/refuzată."
    );

  const scheduleUpsell = (days: number) => {
    const when = new Date(Date.now() + days * 86400000).toISOString();
    void run(
      () =>
        scheduleClientUpsell(
          organizationId,
          clientId,
          when,
          latestWork ? `Continuare după: ${latestWork.title}` : undefined
        ),
      `Oportunitate comercială programată peste ${days} zile.`
    );
  };

  const openUpsellEstimate = async () => {
    if (!canWrite || saving || !enabledModules.includes("estimates")) return;
    setSaving(true);
    setError("");
    try {
      const next = await setClientUpsellStatus(
        organizationId,
        clientId,
        "offered",
        latestWork ? `Continuare după: ${latestWork.title}` : undefined
      );
      setGrowth(next);
      setSnapshotIso(new Date().toISOString());
      await audit("Growth Loop: oportunitate comercială deschisă în Oferte.");
      onOpenModule("estimates", { create: true, clientId });
    } catch (upsellError) {
      console.error(upsellError);
      setError("Oportunitatea comercială nu a putut fi deschisă.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface)]/70 p-4 text-xs text-[var(--muted)]">
        Se încarcă ORBYVEN Client Growth…
      </section>
    );
  }

  if (!latestWork) {
    return (
      <section className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface)]/70 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
          ORBYVEN · CLIENT GROWTH
        </p>
        <p className="mt-2 text-sm font-semibold">Growth Loop pregătit</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
          {clientName} intră automat în acest flux după prima lucrare sau comandă finalizată.
        </p>
      </section>
    );
  }

  const score = sameCycle ? growth?.feedback_score ?? null : null;

  return (
    <section className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface)]/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            ORBYVEN · CLIENT GROWTH
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{evaluation.label}</p>
            {score !== null && (
              <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold">
                {score}/5
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[var(--muted)]">
            {evaluation.detail}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted-2)]">
            Ultima lucrare · {latestWork.title} · {new Intl.DateTimeFormat(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(latestWork.completed_at))}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
          fără trimiteri automate
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-[12px] bg-red-500/[0.06] px-3 py-2 text-[11px] text-red-500">
          {error}
        </p>
      )}

      {canWrite && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          {(evaluation.action === "feedback_due" ||
            evaluation.action === "feedback_waiting") && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
                Feedback
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {evaluation.action === "feedback_due" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={requestFeedback}
                    className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50"
                  >
                    Marchează feedback cerut
                  </button>
                )}
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={saving}
                    onClick={() => saveFeedback(value)}
                    className="h-9 min-w-9 rounded-full border border-[var(--border-strong)] px-3 text-xs font-semibold disabled:opacity-50"
                  >
                    {value}★
                  </button>
                ))}
              </div>
              <input
                value={feedbackNote}
                onChange={(event) => setFeedbackNote(event.target.value)}
                placeholder="Notă feedback, opțional…"
                className="mt-2 h-10 w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-3 text-xs outline-none"
              />
            </div>
          )}

          {evaluation.action === "recovery_needed" && (
            <div>
              <p className="text-xs font-semibold">Rezolvă experiența înainte de marketing.</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                ORBYVEN nu va propune review, referral sau upsell pentru feedback slab.
              </p>
              {enabledModules.includes("calendar") && (
                <button
                  type="button"
                  onClick={() => onOpenModule("calendar", { create: true, clientId })}
                  className="mt-3 h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]"
                >
                  + Programare de remediere
                </button>
              )}
            </div>
          )}

          {evaluation.action === "review_ready" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => setReview("requested")} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                Marchează review cerut
              </button>
              <button type="button" disabled={saving} onClick={() => setReview("completed")} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-50">
                Review deja primit
              </button>
              <button type="button" disabled={saving} onClick={() => setReview("declined")} className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                Nu dorește
              </button>
            </div>
          )}

          {evaluation.action === "review_waiting" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => setReview("completed")} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                Review primit ✓
              </button>
              <button type="button" disabled={saving} onClick={() => setReview("declined")} className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-semibold disabled:opacity-50">
                Închide solicitarea
              </button>
            </div>
          )}

          {evaluation.action === "referral_ready" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => setReferral("requested")} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                Marchează recomandare cerută
              </button>
              <button type="button" disabled={saving} onClick={() => setReferral("received")} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-50">
                Recomandare deja primită
              </button>
              <button type="button" disabled={saving} onClick={() => setReferral("declined")} className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                Nu acum
              </button>
            </div>
          )}

          {evaluation.action === "referral_waiting" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => setReferral("received")} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                Recomandare primită ✓
              </button>
              <button type="button" disabled={saving} onClick={() => setReferral("declined")} className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-semibold disabled:opacity-50">
                Închide solicitarea
              </button>
            </div>
          )}

          {(evaluation.action === "upsell_ready" ||
            evaluation.action === "upsell_due") && (
            <div className="flex flex-wrap gap-2">
              {enabledModules.includes("estimates") && (
                <button type="button" disabled={saving} onClick={() => void openUpsellEstimate()} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                  + Creează ofertă relevantă
                </button>
              )}
              <button type="button" disabled={saving} onClick={() => scheduleUpsell(30)} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-50">
                Reamintește în 30 zile
              </button>
              <button type="button" disabled={saving} onClick={() => void run(
                () => setClientUpsellStatus(organizationId, clientId, "dismissed"),
                "Oportunitate comercială închisă."
              )} className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                Închide
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
