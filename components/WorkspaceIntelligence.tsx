"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";

type Props = {
  organizationId: string;
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

const QUICK_PROMPTS = [
  "Ce am de făcut azi?",
  "Ce am de încasat?",
  "Creează lead Ana Popescu; telefon: 0712345678",
  "Creează lucrare Revizie centrală; prioritate: urgent",
  "Programează o programare Revizie tehnică mâine la 10:30",
  "Creează deviz Renovare baie; poziție: Montaj, 1 x 1500 lei",
  "Vreau să modific site-ul.",
];

const specialistLabels: Record<IntelligenceResponse["specialist"], string> = {
  operations: "Operations",
  finance: "Finance",
  web_design: "Web Design",
  documents: "Documents",
  general: "ORBYVEN Core",
};

export default function WorkspaceIntelligence({ organizationId, onOpenModule }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [error, setError] = useState("");

  const canSend = useMemo(() => prompt.trim().length >= 2 && !loading, [prompt, loading]);

  const ask = async (value?: string) => {
    const requestPrompt = (value ?? prompt).trim();
    if (requestPrompt.length < 2 || loading) return;

    setPrompt(requestPrompt);
    setLoading(true);
    setError("");

    try {
      const { data, error: sessionError } = await orbyvenSupabase.auth.getSession();
      if (sessionError || !data.session?.access_token) {
        throw new Error("Sesiunea a expirat. Reautentifică-te.");
      }

      const result = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ organizationId, prompt: requestPrompt }),
      });

      const body = (await result.json()) as IntelligenceResponse & { error?: string };
      if (!result.ok) throw new Error(body.error || "ORBYVEN Intelligence nu a răspuns.");
      setResponse(body);
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "ORBYVEN Intelligence nu a răspuns.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask();
  };

  const decideProposal = async (
    action: Extract<IntelligenceResponse["actions"][number], { kind: "confirm_proposal" }>,
    decision: "confirm" | "reject"
  ) => {
    if (proposalBusy) return;
    setProposalBusy(true);
    setError("");
    try {
      const { data, error: sessionError } = await orbyvenSupabase.auth.getSession();
      if (sessionError || !data.session?.access_token) throw new Error("Sesiunea a expirat. Reautentifică-te.");

      const result = await fetch("/api/ai/actions/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          organizationId,
          proposalId: action.proposalId,
          decision,
        }),
      });
      const body = (await result.json()) as {
        error?: string;
        message?: string;
        status?: "executed" | "rejected";
        result?: { type: string; id: string; moduleId: OrbyvenModuleId };
      };
      if (!result.ok) throw new Error(body.error || "Acțiunea nu a putut fi procesată.");

      if (body.status === "rejected") {
        setResponse({
          specialist: "operations",
          answer: body.message || "Acțiunea a fost anulată.",
          facts: [{ label: "Status", value: "Anulată" }],
          actions: [],
          generatedBy: "orbyven_core",
        });
        return;
      }

      const created = body.result;
      setResponse({
        specialist: "operations",
        answer: body.message || "Acțiunea a fost executată.",
        facts: [{ label: "Status", value: "Creat cu confirmare" }],
        actions: created ? [{
          kind: "open_module",
          label: "Deschide înregistrarea",
          moduleId: created.moduleId,
          recordId: created.id,
        }] : [],
        generatedBy: "orbyven_core",
      });
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Acțiunea nu a putut fi procesată.");
    } finally {
      setProposalBusy(false);
    }
  };

  const runAction = (action: IntelligenceResponse["actions"][number]) => {
    if (action.kind === "confirm_proposal") {
      void decideProposal(action, "confirm");
      return;
    }
    setOpen(false);
    if (action.kind === "open_path") {
      router.push(action.href);
      return;
    }
    onOpenModule(action.moduleId, {
      recordId: action.recordId,
      clientId: action.clientId,
      taskId: action.taskId,
      estimateId: action.estimateId,
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Deschide ORBYVEN Intelligence"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#7897ff]/25 bg-[linear-gradient(135deg,rgba(82,103,246,0.22),rgba(129,85,255,0.12))] px-3 text-[10px] font-semibold text-[var(--text)] shadow-sm transition hover:border-[#7897ff]/45"
      >
        <span aria-hidden="true">✦</span>
        <span className="hidden sm:inline">ORBYVEN AI</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Închide ORBYVEN Intelligence"
            className="fixed inset-0 z-[91] cursor-default bg-black/10 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-label="ORBYVEN Intelligence"
            className="fixed bottom-3 left-3 right-3 z-[92] flex max-h-[78vh] flex-col overflow-hidden rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg)] shadow-[0_32px_110px_rgba(0,0,0,0.36)] sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-12 sm:w-[430px]"
          >
            <header className="border-b border-[var(--border)] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a8ff]">ORBYVEN INTELLIGENCE · 0.8.2</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.04em]">Ce vrei să rezolvăm?</h2>
                  <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                    Un singur AI, specialiști diferiți. Poate pregăti acțiuni reale, dar le execută numai după confirmarea ta explicită.
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="text-lg text-[var(--muted)]">×</button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {!response && !loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void ask(item)}
                      className="rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-3 text-left text-[10px] font-semibold leading-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}

              {loading ? (
                <div role="status" className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-4 py-7 text-center">
                  <div className="mx-auto h-6 w-6 animate-pulse rounded-full border border-[#7897ff]/45 bg-[#7897ff]/10" />
                  <p className="mt-3 text-[10px] text-[var(--muted)]">Analizez workspace-ul firmei…</p>
                </div>
              ) : null}

              {error ? (
                <p role="alert" className="rounded-[13px] border border-rose-400/20 bg-rose-400/[0.07] px-3 py-3 text-[10px] leading-4 text-rose-300">{error}</p>
              ) : null}

              {response && !loading ? (
                <article>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-[#7897ff]/20 bg-[#7897ff]/10 px-2.5 py-1 text-[9px] font-bold text-[#aab9ff]">
                      {specialistLabels[response.specialist]}
                    </span>
                    <span className="text-[9px] text-[var(--muted-2)]">ORBYVEN Core</span>
                  </div>

                  <p className="mt-3 text-[13px] leading-6 text-[var(--text)]">{response.answer}</p>

                  {response.facts.length ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {response.facts.map((fact) => (
                        <div key={fact.label} className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-3">
                          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">{fact.label}</p>
                          <p className="mt-1 text-[12px] font-semibold">{fact.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {response.actions.length ? (
                    <div className="mt-4 grid gap-2">
                      {response.actions.map((action, index) => action.kind === "confirm_proposal" ? (
                        <div key={action.proposalId} className="rounded-[14px] border border-amber-400/20 bg-amber-400/[0.06] p-3">
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300">CONFIRMARE NECESARĂ</p>
                          <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                            Propunerea expiră automat dacă nu este confirmată. O singură confirmare poate executa acțiunea.
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              disabled={proposalBusy}
                              onClick={() => void decideProposal(action, "confirm")}
                              className="rounded-full bg-[var(--button)] px-3.5 py-2 text-[10px] font-semibold text-[var(--button-text)] disabled:opacity-40"
                            >
                              {proposalBusy ? "Se execută…" : action.label}
                            </button>
                            <button
                              type="button"
                              disabled={proposalBusy}
                              onClick={() => void decideProposal(action, "reject")}
                              className="rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[10px] font-semibold disabled:opacity-40"
                            >
                              Renunță
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          key={`${action.kind}-${index}`}
                          type="button"
                          onClick={() => runAction(action)}
                          className={index === 0
                            ? "w-fit rounded-full bg-[var(--button)] px-3.5 py-2 text-[10px] font-semibold text-[var(--button-text)]"
                            : "w-fit rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[10px] font-semibold"}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              ) : null}
            </div>

            <form onSubmit={submit} className="border-t border-[var(--border)] p-3">
              <div className="flex items-end gap-2 rounded-[15px] border border-[var(--border-strong)] bg-[var(--surface-2)]/70 p-2">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value.slice(0, 1200))}
                  rows={1}
                  placeholder="Întreabă ORBYVEN…"
                  className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[11px] leading-4 outline-none placeholder:text-[var(--muted-2)]"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="h-9 shrink-0 rounded-[11px] bg-[var(--button)] px-3 text-[10px] font-semibold text-[var(--button-text)] disabled:opacity-35"
                >
                  Trimite
                </button>
              </div>
              <p className="mt-2 px-1 text-[8px] text-[var(--muted-2)]">0.8.2 Agent Actions · lead/client/lucrare/programare/deviz draft · fiecare modificare necesită confirmare explicită și este auditată.</p>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
