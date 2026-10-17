"use client";

import BrandLogo from "@/components/BrandLogo";
import type {
  IntegrityCategory,
  IntegrityFinding,
  IntegrityPayload,
  IntegrityRun,
} from "@/lib/orbyven-integrity-contracts";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_LABELS: Record<IntegrityCategory, string> = {
  code: "Cod",
  security: "Securitate",
  seo: "SEO",
  legal: "Juridic",
};

const CATEGORY_ORDER: IntegrityCategory[] = [
  "code",
  "security",
  "seo",
  "legal",
];

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case "passed":
      return "Protejat";
    case "warning":
      return "Atenție";
    case "failed":
      return "Acțiune necesară";
    case "error":
      return "Audit incomplet";
    case "running":
      return "Audit în curs";
    case "queued":
      return "În așteptare";
    default:
      return "Fără audit";
  }
}

function scoreClass(score: number | null | undefined) {
  if (score === null || score === undefined) return "text-[#86868b]";
  if (score >= 90) return "text-emerald-300";
  if (score >= 70) return "text-amber-300";
  return "text-red-300";
}

function findingAccent(finding: IntegrityFinding) {
  if (finding.severity === "critical" || finding.severity === "high") {
    return "border-red-400/20 bg-red-400/[0.05]";
  }
  if (finding.severity === "medium") {
    return "border-amber-400/20 bg-amber-400/[0.04]";
  }
  return "border-white/[0.08] bg-white/[0.025]";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  }).format(date);
}

export default function ControlCenterIntegrity() {
  const router = useRouter();
  const [payload, setPayload] = useState<IntegrityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const getAccessToken = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/control-center/login");
      throw new Error("Missing session");
    }
    return token;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/control-center/integrity", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as IntegrityPayload & {
        message?: string;
      };

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/control-center/login");
          return;
        }
        throw new Error(data.message ?? "Integritatea ORBYVEN nu a putut fi încărcată.");
      }
      setPayload(data);
    } catch (error) {
      if (error instanceof Error && error.message === "Missing session") return;
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Integritatea ORBYVEN nu a putut fi încărcată."
      );
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const performAction = async (
    action: "queue_guardian_fix" | "resolve_manual" | "accept_risk",
    findingId: string,
    successMessage: string
  ) => {
    setBusy(`${action}:${findingId}`);
    setErrorMessage("");
    setActionMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/control-center/integrity", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, finding_id: findingId }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(result.message ?? "Acțiunea nu a putut fi salvată.");
      }
      setActionMessage(successMessage);
      await load();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Acțiunea a eșuat.");
    } finally {
      setBusy("");
    }
  };

  const downloadReport = async (run: IntegrityRun) => {
    setBusy(`download:${run.id}`);
    setErrorMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `/api/control-center/integrity/report?run_id=${encodeURIComponent(run.id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(result.message ?? "Raportul nu a putut fi descărcat.");
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `orbyven-integrity-${run.run_key}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Raportul nu a putut fi descărcat."
      );
    } finally {
      setBusy("");
    }
  };

  const latestFindings = useMemo(() => {
    const latestRunId = payload?.latest_run?.id;
    if (!latestRunId) return [];
    return payload?.findings.filter((finding) => finding.run_id === latestRunId) ?? [];
  }, [payload]);

  const openManual = useMemo(
    () =>
      (payload?.manual_actions ?? []).filter((finding) =>
        ["open", "queued", "in_progress"].includes(finding.status)
      ),
    [payload]
  );

  const openGuardian = useMemo(
    () =>
      (payload?.ai_actions ?? []).filter((finding) =>
        ["open", "queued", "in_progress"].includes(finding.status)
      ),
    [payload]
  );

  const latest = payload?.latest_run ?? null;

  return (
    <main className="min-h-screen bg-[#08080a] text-[#f5f5f7] antialiased">
      <div className="mx-auto max-w-[1480px] px-5 py-6 md:px-9 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo compact theme="dark" />
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Owner only · MFA
            </span>
            <Link
              href="/control-center"
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#d1d1d6] transition hover:bg-white/[0.08]"
            >
              Control Center
            </Link>
          </div>
        </header>

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
              ORBYVEN · INTEGRITY
            </p>
            <h1 className="mt-4 max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[64px]">
              Control fără zgomot.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#a1a1a6]">
              Audit automat pentru cod, securitate, SEO și juridic. Tu vezi doar ce contează;
              raportul tehnic complet rămâne separat și protejat.
            </p>
          </div>

          <div className="min-w-[220px] rounded-[28px] border border-white/[0.1] bg-[#111113] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">
              Health score
            </p>
            <div className={`mt-3 text-6xl font-semibold tracking-[-0.06em] ${scoreClass(latest?.overall_score)}`}>
              {latest?.overall_score ?? "—"}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#a1a1a6]">
              <span>{statusLabel(latest?.status)}</span>
              <span>{latest ? formatDate(latest.finished_at ?? latest.started_at) : "—"}</span>
            </div>
          </div>
        </section>

        {(errorMessage || actionMessage) && (
          <div
            className={`mt-8 rounded-[18px] border px-4 py-3 text-sm ${
              errorMessage
                ? "border-red-400/20 bg-red-400/[0.08] text-red-200"
                : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
            }`}
          >
            {errorMessage || actionMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-16 text-sm text-[#86868b]">Se verifică starea platformei...</div>
        ) : (
          <>
            <section className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {CATEGORY_ORDER.map((category) => {
                const score = latest?.category_scores?.[category] ?? null;
                const findings = latestFindings.filter(
                  (finding) => finding.category === category && finding.status !== "resolved"
                );
                return (
                  <article
                    key={category}
                    className="rounded-[24px] border border-white/[0.08] bg-[#101012] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#d1d1d6]">
                          {CATEGORY_LABELS[category]}
                        </p>
                        <p className="mt-1 text-[11px] text-[#6e6e73]">
                          {findings.length === 0
                            ? "Fără constatări deschise"
                            : `${findings.length} constatări`}
                        </p>
                      </div>
                      <span className={`text-2xl font-semibold tracking-[-0.04em] ${scoreClass(score)}`}>
                        {score ?? "—"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-2">
              <article className="rounded-[30px] border border-white/[0.09] bg-[#0f0f11] p-5 md:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">
                      Pentru tine
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                      Lucru manual
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/[0.1] px-3 py-1 text-xs text-[#a1a1a6]">
                    {openManual.length}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {openManual.length === 0 ? (
                    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-sm text-[#86868b]">
                      Nimic de făcut manual acum.
                    </div>
                  ) : (
                    openManual.map((finding) => (
                      <div
                        key={finding.id}
                        className={`rounded-[20px] border p-4 ${findingAccent(finding)}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{finding.title}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
                            {CATEGORY_LABELS[finding.category]} · {finding.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#a1a1a6]">
                          {finding.manual_action ?? finding.summary}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() =>
                              void performAction(
                                "resolve_manual",
                                finding.id,
                                "Constatarea a fost marcată ca rezolvată."
                              )
                            }
                            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            {busy === `resolve_manual:${finding.id}` ? "Se salvează..." : "Rezolvat"}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() =>
                              void performAction(
                                "accept_risk",
                                finding.id,
                                "Riscul a fost acceptat și înregistrat."
                              )
                            }
                            className="rounded-full border border-white/[0.1] px-4 py-2 text-xs font-medium text-[#a1a1a6] disabled:opacity-50"
                          >
                            Accept risc
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-[30px] border border-indigo-400/15 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.09),transparent_38%),#0f0f11] p-5 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300">
                      Orbyven Guardian
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                      Poate pregăti singur
                    </h2>
                  </div>
                  <div className="text-right text-[10px] leading-5 text-[#86868b]">
                    <div>PR only</div>
                    <div>No auto-merge · No production write</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {openGuardian.length === 0 ? (
                    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-sm text-[#86868b]">
                      Nu există remedieri automate în coadă.
                    </div>
                  ) : (
                    openGuardian.map((finding) => (
                      <div
                        key={finding.id}
                        className={`rounded-[20px] border p-4 ${findingAccent(finding)}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{finding.title}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
                            {finding.status === "queued" ? "PR în coadă" : finding.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#a1a1a6]">
                          {finding.ai_action ?? finding.summary}
                        </p>
                        <button
                          type="button"
                          disabled={Boolean(busy) || finding.status === "queued"}
                          onClick={() =>
                            void performAction(
                              "queue_guardian_fix",
                              finding.id,
                              "Guardian a primit remedierea și o va limita la branch + PR."
                            )
                          }
                          className="mt-4 rounded-full border border-indigo-300/25 bg-indigo-400/[0.08] px-4 py-2 text-xs font-semibold text-indigo-100 disabled:opacity-50"
                        >
                          {finding.status === "queued"
                            ? "În coadă"
                            : busy === `queue_guardian_fix:${finding.id}`
                              ? "Se adaugă..."
                              : "Pregătește PR"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="mt-5 rounded-[30px] border border-white/[0.09] bg-[#0f0f11] p-5 md:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">
                    Istoric
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                    Rapoarte de integritate
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading || Boolean(busy)}
                  className="rounded-full border border-white/[0.1] px-4 py-2 text-xs font-medium text-[#a1a1a6] disabled:opacity-50"
                >
                  Reîmprospătează
                </button>
              </div>

              <div className="mt-6 divide-y divide-white/[0.06] overflow-hidden rounded-[20px] border border-white/[0.06]">
                {(payload?.recent_runs ?? []).length === 0 ? (
                  <div className="px-4 py-7 text-sm text-[#86868b]">
                    Primul raport va apărea după prima rulare a auditului.
                  </div>
                ) : (
                  payload?.recent_runs.map((run) => (
                    <div
                      key={run.id}
                      className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{run.run_key}</p>
                          <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#86868b]">
                            {statusLabel(run.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#6e6e73]">
                          {formatDate(run.finished_at ?? run.started_at)} · {run.branch ?? "main"}
                        </p>
                      </div>
                      <div className={`text-xl font-semibold ${scoreClass(run.overall_score)}`}>
                        {run.overall_score ?? "—"}
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void downloadReport(run)}
                        className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#d1d1d6] disabled:opacity-50"
                      >
                        {busy === `download:${run.id}` ? "Se descarcă..." : "Raport complet ↓"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
