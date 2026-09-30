"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import type { IntelligenceResponse, IntelligenceSpecialist } from "@/lib/ai/intelligence-types";

type Props = {
  organizationId: string;
  themeVars: CSSProperties;
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

type PlanAction = Extract<IntelligenceResponse["actions"][number], { kind: "review_plan" }>;
type ConfirmAction = Extract<IntelligenceResponse["actions"][number], { kind: "confirm_proposal" }>;

type UiMessage = {
  key: string;
  role: "user" | "assistant";
  content: string;
  specialist: IntelligenceSpecialist | null;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceResponse["actions"];
};

const QUICK_PROMPTS = [
  "Ce am de făcut azi?",
  "Ce am de încasat?",
  "Creează lead Ana Popescu; telefon: 0712345678",
  "Creează lucrare Revizie centrală; prioritate: urgent",
  "Programează o programare Revizie tehnică mâine la 10:30",
  "Creează deviz Renovare baie; poziție: Montaj, 1 x 1500 lei",
  "Creează document Raport intervenție; conținut: Verificare finalizată fără probleme.",
  "Creează client Ana Popescu; apoi creează lucrare Revizie centrală pentru el; apoi programeaz-o mâine la 10:30",
  "Vreau să modific site-ul.",
];

const specialistLabels: Record<IntelligenceSpecialist, string> = {
  operations: "Operations",
  finance: "Finance",
  web_design: "Web Design",
  documents: "Documents",
  general: "ORBYVEN Core",
};

export default function WorkspaceIntelligence({ organizationId, themeVars, onOpenModule }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [error, setError] = useState("");
  const messageSequence = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const nextLocalKey = (prefix: string) => {
    messageSequence.current += 1;
    return `${prefix}-${messageSequence.current}`;
  };

  const canSend = useMemo(() => prompt.trim().length >= 2 && !loading, [prompt, loading]);

  const accessToken = async () => {
    const { data, error: sessionError } = await orbyvenSupabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error("Sesiunea a expirat. Reautentifică-te.");
    }
    return data.session.access_token;
  };

  const loadConversations = async () => {
    setHistoryLoading(true);
    try {
      const token = await accessToken();
      const response = await fetch(
        `/api/ai/conversations?organizationId=${encodeURIComponent(organizationId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const body = (await response.json()) as { conversations?: ConversationSummary[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Istoricul nu a putut fi încărcat.");
      setConversations(body.conversations ?? []);
    } catch (reason) {
      console.error(reason);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPlanForConversation = async (id: string, token: string) => {
    const response = await fetch(
      `/api/ai/plans?organizationId=${encodeURIComponent(organizationId)}&conversationId=${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    const body = (await response.json()) as { plan?: PlanAction | null; error?: string };
    if (!response.ok) throw new Error(body.error || "Planul nu a putut fi încărcat.");
    return body.plan ?? null;
  };

  const putPlanInMessages = (plan: PlanAction) => {
    setMessages((current) => current.map((message) => ({
      ...message,
      actions: message.actions.map((action) =>
        action.kind === "review_plan" ? plan : action
      ),
    })));
  };

  const preparePromptRepair = (value: string) => {
    setPrompt(value.slice(0, 1200));
    setHistoryOpen(false);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void loadConversations(), 0);
    return () => window.clearTimeout(timer);
    // organizationId is stable for the mounted workspace; reopening refreshes history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, organizationId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    setPrompt("");
    setError("");
    setHistoryOpen(false);
  };

  const loadConversation = async (id: string) => {
    if (historyLoading) return;
    setHistoryLoading(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch(
        `/api/ai/conversations?organizationId=${encodeURIComponent(organizationId)}&conversationId=${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const body = (await response.json()) as {
        conversation?: ConversationSummary;
        messages?: Array<{
          id: string;
          role: "user" | "assistant";
          specialist: IntelligenceSpecialist | null;
          content: string;
          facts: Array<{ label: string; value: string }>;
        }>;
        error?: string;
      };
      if (!response.ok || !body.conversation) {
        throw new Error(body.error || "Conversația nu a putut fi încărcată.");
      }
      const restored = (body.messages ?? []).map((item) => ({
        key: item.id,
        role: item.role,
        content: item.content,
        specialist: item.specialist,
        facts: item.facts ?? [],
        actions: [] as IntelligenceResponse["actions"],
      }));
      const plan = await loadPlanForConversation(body.conversation.id, token);
      if (plan) {
        for (let index = restored.length - 1; index >= 0; index -= 1) {
          if (restored[index].role === "assistant") {
            restored[index].actions = [plan];
            break;
          }
        }
      }
      setConversationId(body.conversation.id);
      setMessages(restored);
      setHistoryOpen(false);
      setPrompt("");
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Conversația nu a putut fi încărcată.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const ask = async (value?: string) => {
    const requestPrompt = (value ?? prompt).trim();
    if (requestPrompt.length < 2 || loading) return;

    const localUserKey = nextLocalKey("user");
    setMessages((current) => [...current, {
      key: localUserKey,
      role: "user",
      content: requestPrompt,
      specialist: null,
      facts: [],
      actions: [],
    }]);
    setPrompt("");
    setLoading(true);
    setError("");

    try {
      const token = await accessToken();
      const result = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          prompt: requestPrompt,
          conversationId,
        }),
      });

      const body = (await result.json()) as IntelligenceResponse & {
        conversationId?: string;
        error?: string;
      };
      if (!result.ok) throw new Error(body.error || "ORBYVEN Intelligence nu a răspuns.");
      if (body.conversationId) setConversationId(body.conversationId);
      setMessages((current) => [...current, {
        key: nextLocalKey("assistant"),
        role: "assistant",
        content: body.answer,
        specialist: body.specialist,
        facts: body.facts,
        actions: body.actions,
      }]);
      void loadConversations();
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

  const clearProposalAction = (proposalId: string) => {
    setMessages((current) => current.map((message) => ({
      ...message,
      actions: message.actions.filter(
        (action) => action.kind !== "confirm_proposal" || action.proposalId !== proposalId
      ),
    })));
  };

  const decideProposal = async (
    action: ConfirmAction,
    decision: "confirm" | "reject"
  ) => {
    if (proposalBusy) return;
    setProposalBusy(true);
    setError("");
    try {
      const token = await accessToken();
      const result = await fetch("/api/ai/actions/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        plan?: { id: string; step: number; total: number };
      };
      if (!result.ok) throw new Error(body.error || "Acțiunea nu a putut fi procesată.");

      clearProposalAction(action.proposalId);
      if (body.plan && body.status) {
        setMessages((current) => current.map((message) => ({
          ...message,
          actions: message.actions.map((candidate) => {
            if (candidate.kind !== "review_plan" || candidate.planId !== body.plan?.id) return candidate;
            return {
              ...candidate,
              steps: candidate.steps.map((step) => {
                if (step.index === body.plan?.step) {
                  return {
                    ...step,
                    status: body.status === "executed" ? "executed" as const : "rejected" as const,
                  };
                }
                if (body.status === "executed" && step.index === (body.plan?.step ?? 0) + 1) {
                  return { ...step, status: "ready" as const };
                }
                if ((body.plan?.step ?? 0) < step.index) {
                  return { ...step, status: "locked" as const };
                }
                return step;
              }),
            };
          }),
        })));
      }
      const created = body.result;
      setMessages((current) => [...current, {
        key: nextLocalKey("decision"),
        role: "assistant",
        specialist: "operations",
        content: body.message || (body.status === "rejected"
          ? "Acțiunea a fost anulată."
          : "Acțiunea a fost executată."),
        facts: [{
          label: "Status",
          value: body.status === "rejected" ? "Anulată" : "Creat cu confirmare",
        }],
        actions: created ? [{
          kind: "open_module",
          label: "Deschide înregistrarea",
          moduleId: created.moduleId,
          recordId: created.id,
        }] : [],
      }]);
      if (body.plan && conversationId) {
        try {
          const latestPlan = await loadPlanForConversation(conversationId, token);
          if (latestPlan) putPlanInMessages(latestPlan);
        } catch (planRefreshError) {
          console.error("ORBYVEN plan refresh failed", planRefreshError);
        }
      }
      void loadConversations();
    } catch (reason) {
      console.error(reason);
      if (conversationId) {
        try {
          const refreshToken = await accessToken();
          const latestPlan = await loadPlanForConversation(conversationId, refreshToken);
          if (latestPlan) putPlanInMessages(latestPlan);
        } catch (planRefreshError) {
          console.error("ORBYVEN failed-plan refresh failed", planRefreshError);
        }
      }
      setError(reason instanceof Error ? reason.message : "Acțiunea nu a putut fi procesată.");
    } finally {
      setProposalBusy(false);
    }
  };

  const decidePlanStep = (
    plan: PlanAction,
    step: PlanAction["steps"][number],
    decision: "confirm" | "reject"
  ) => {
    if (step.status !== "ready") return;
    const proposal: ConfirmAction = {
      kind: "confirm_proposal",
      label: "Confirmă pasul " + step.index,
      proposalId: step.proposalId,
      actionType: step.actionType,
      expiresAt: plan.expiresAt,
      targetModule: step.targetModule,
    };
    void decideProposal(proposal, decision);
  };

  const recoverPlanAction = async (plan: PlanAction) => {
    if (!plan.recovery || proposalBusy) return;
    if (plan.recovery.mode === "needs_input") {
      preparePromptRepair(plan.recovery.suggestedPrompt || "");
      return;
    }

    setProposalBusy(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/ai/plans/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId, planId: plan.planId }),
      });
      const body = (await response.json()) as {
        mode?: "recovered" | "needs_input";
        message?: string;
        blockedStep?: number;
        suggestedPrompt?: string;
        plan?: PlanAction;
        error?: string;
      };
      if (!response.ok || !body.mode || !body.plan) {
        throw new Error(body.error || "Planul nu a putut fi refăcut.");
      }
      const recoveredPlan = body.plan;

      if (body.mode === "needs_input") {
        putPlanInMessages(recoveredPlan);
        preparePromptRepair(body.suggestedPrompt || "");
        setMessages((current) => [...current, {
          key: nextLocalKey("recovery-input"),
          role: "assistant",
          specialist: "operations",
          content: body.message || "Planul are nevoie de o corecție înainte de refacere.",
          facts: [{ label: "Pas blocat", value: String(body.blockedStep || plan.recovery?.blockedStep || "") }],
          actions: [],
        }]);
        return;
      }

      setMessages((current) => [...current, {
        key: nextLocalKey("recovery"),
        role: "assistant",
        specialist: "operations",
        content: body.message || "Planul a fost reconstruit.",
        facts: [
          { label: "Recovery", value: "Controlat" },
          { label: "Confirmare", value: "Pas cu pas" },
        ],
        actions: [recoveredPlan],
      }]);
      void loadConversations();
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Planul nu a putut fi refăcut.");
    } finally {
      setProposalBusy(false);
    }
  };

  const runAction = (action: IntelligenceResponse["actions"][number]) => {
    if (action.kind === "confirm_proposal") {
      void decideProposal(action, "confirm");
      return;
    }
    if (action.kind === "review_plan") return;
    if (action.kind === "repair_plan") {
      preparePromptRepair(action.suggestedPrompt);
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

  const renderAssistantActions = (actions: IntelligenceResponse["actions"]) => {
    if (!actions.length) return null;
    return (
      <div className="mt-3 grid gap-2">
        {actions.map((action, index) => action.kind === "confirm_proposal" ? (
          <div key={action.proposalId} className="rounded-[14px] border border-amber-400/20 bg-amber-400/[0.06] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300">CONFIRMARE NECESARĂ</p>
            <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
              Propunerea expiră automat și poate fi executată o singură dată. Nu va reapărea ca acțiune în istoricul salvat.
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
        ) : action.kind === "review_plan" ? (
          <div key={action.planId} className="rounded-[15px] border border-[#7897ff]/20 bg-[#7897ff]/[0.055] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">PLAN MODE</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Fiecare pas se confirmă separat. Nu există „Confirmă tot”.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[8px] font-semibold text-[var(--muted)]">
                {action.steps.filter((step) => step.status === "executed").length}/{action.steps.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {action.steps.map((step) => {
                const statusLabel =
                  step.status === "executed" ? "Executat" :
                  step.status === "ready" ? "Pregătit" :
                  step.status === "rejected" ? "Oprit" :
                  step.status === "expired" ? "Expirat" :
                  step.status === "failed" ? "Eșuat" :
                  "Blocat";
                return (
                  <div key={step.proposalId} className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)]/55 px-3 py-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[8px] font-bold">
                        {step.status === "executed" ? "✓" : step.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold leading-4">{step.summary}</p>
                        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--muted-2)]">{statusLabel}</p>
                        {step.status === "ready" ? (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={proposalBusy}
                              onClick={() => decidePlanStep(action, step, "confirm")}
                              className="rounded-full bg-[var(--button)] px-3 py-1.5 text-[9px] font-semibold text-[var(--button-text)] disabled:opacity-40"
                            >
                              {proposalBusy ? "Se execută…" : "Confirmă pasul"}
                            </button>
                            <button
                              type="button"
                              disabled={proposalBusy}
                              onClick={() => decidePlanStep(action, step, "reject")}
                              className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-[9px] font-semibold disabled:opacity-40"
                            >
                              Oprește planul
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {action.recovery ? (
              <div className="mt-3 rounded-[13px] border border-[#7897ff]/25 bg-[#7897ff]/[0.08] p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#7897ff]/30 bg-[#7897ff]/10 text-[11px] text-[#b9c5ff]">↻</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">PLAN RECOVERY</p>
                    <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">{action.recovery.message}</p>
                    <button
                      type="button"
                      disabled={proposalBusy}
                      onClick={() => {
                        if (action.recovery?.mode === "needs_input") {
                          preparePromptRepair(action.recovery.suggestedPrompt || "");
                        } else {
                          void recoverPlanAction(action);
                        }
                      }}
                      className="mt-2.5 rounded-full border border-[#7897ff]/30 bg-[#7897ff]/10 px-3 py-1.5 text-[9px] font-semibold text-[#c7d0ff] transition hover:bg-[#7897ff]/15 disabled:opacity-40"
                    >
                      {proposalBusy ? "Se pregătește…" : action.recovery.label}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : action.kind === "guided_resolution" ? (
          <div key={`guided-${action.rule}-${index}`} className="rounded-[15px] border border-emerald-400/20 bg-emerald-400/[0.055] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300">GUIDED RESOLUTION</p>
                <p className="mt-1 text-[11px] font-semibold leading-4">{action.title}</p>
                <p className="mt-1.5 text-[9px] leading-4 text-[var(--muted)]">{action.rationale}</p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-1 text-[8px] font-semibold text-emerald-300">
                {index + 1}
              </span>
            </div>
            <div className="mt-3 grid gap-1.5">
              {action.steps.map((step, stepIndex) => (
                <div key={`${action.rule}-step-${stepIndex}`} className="flex items-start gap-2 rounded-[11px] border border-[var(--border)] bg-[var(--surface)]/45 px-2.5 py-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[7px] font-bold">
                    {stepIndex + 1}
                  </span>
                  <p className="text-[9px] leading-4 text-[var(--muted)]">{step}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => runAction(action)}
              className="mt-3 rounded-full bg-[var(--button)] px-3.5 py-2 text-[9px] font-semibold text-[var(--button-text)]"
            >
              {action.label}
            </button>
          </div>
        ) : action.kind === "repair_plan" ? (
          <div key={`repair-${action.blockedStep}-${index}`} className="rounded-[14px] border border-[#7897ff]/20 bg-[#7897ff]/[0.06] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">PLAN RECOVERY</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">{action.message}</p>
            <button
              type="button"
              onClick={() => preparePromptRepair(action.suggestedPrompt)}
              className="mt-2.5 rounded-full border border-[#7897ff]/30 bg-[#7897ff]/10 px-3 py-1.5 text-[9px] font-semibold text-[#c7d0ff]"
            >
              {action.label}
            </button>
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
    );
  };

  if (typeof document === "undefined") return null;

  return createPortal(
        <div
          style={themeVars}
          className="contents text-[var(--text)]"
          data-orbyven-intelligence-theme-scope="true"
        >
          <>
          <button
            type="button"
            aria-label={open ? "Închide ORBYVEN Intelligence" : "Deschide ORBYVEN Intelligence"}
            aria-haspopup="dialog"
            aria-controls="orbyven-intelligence-dialog"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[140] flex h-14 w-14 items-center justify-center rounded-full border border-[#7e9cff]/30 bg-[linear-gradient(145deg,rgba(34,55,105,0.96),rgba(24,31,67,0.98))] text-[#dfe7ff] shadow-[0_18px_55px_rgba(27,46,112,0.52),0_0_24px_rgba(120,151,255,0.12)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[#91a8ff]/55 active:translate-y-0 sm:bottom-5 sm:right-5"
          >
            {!open ? (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a1222] bg-[#7897ff] shadow-[0_0_14px_rgba(120,151,255,0.95)]" aria-hidden="true" />
            ) : null}
            {open ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.9">
                <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                <path d="M7.5 18.25 4 20l.9-3.55A7.1 7.1 0 0 1 3.5 12.2C3.5 7.95 7.25 4.5 12 4.5s8.5 3.45 8.5 7.7-3.75 7.3-8.5 7.3c-1.62 0-3.14-.35-4.5-1.25Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m12 8 .55 1.45L14 10l-1.45.55L12 12l-.55-1.45L10 10l1.45-.55L12 8Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="sr-only">ORBYVEN AI</span>
          </button>
    
          {open ? (
            <>
              <button
                type="button"
                aria-label="Închide ORBYVEN Intelligence"
                className="fixed inset-0 z-[100] cursor-default bg-[#020713]/70 backdrop-blur-[7px]"
                onClick={() => setOpen(false)}
              />
              <section
                id="orbyven-intelligence-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="ORBYVEN Intelligence"
                className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] top-3 z-[101] flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#91a8ff]/20 bg-[linear-gradient(180deg,rgba(10,19,36,0.985),rgba(5,11,23,0.995))] shadow-[0_35px_120px_rgba(0,0,0,0.58),0_0_0_1px_rgba(120,151,255,0.04)] backdrop-blur-2xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[460px] md:w-[480px] text-[var(--text)]"
              >
                <header className="relative border-b border-[#91a8ff]/10 bg-[linear-gradient(180deg,rgba(120,151,255,0.06),transparent)] px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#91a8ff]">ORBYVEN INTELLIGENCE · 0.8.14</p>
                      <h2 className="mt-1 truncate text-[18px] font-semibold tracking-[-0.04em]">
                        {historyOpen ? "Conversațiile tale" : "Ce vrei să rezolvăm?"}
                      </h2>
                      <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                        Thread-urile sunt private pentru contul tău în această firmă și se sincronizează între device-uri.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={newConversation}
                        className="rounded-full border border-[var(--border)] px-2.5 py-1.5 text-[9px] font-semibold"
                      >
                        + Nou
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryOpen((current) => !current)}
                        className="rounded-full border border-[var(--border)] px-2.5 py-1.5 text-[9px] font-semibold"
                      >
                        Istoric
                      </button>
                      <button
                        type="button"
                        aria-label="Închide chatul"
                        onClick={() => setOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 text-base text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </header>
    
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                  {historyOpen ? (
                    <div className="grid gap-2">
                      {historyLoading ? (
                        <p className="py-6 text-center text-[10px] text-[var(--muted)]">Se încarcă istoricul…</p>
                      ) : conversations.length ? conversations.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void loadConversation(item.id)}
                          className={`rounded-[13px] border px-3 py-3 text-left transition ${
                            item.id === conversationId
                              ? "border-[#7897ff]/35 bg-[#7897ff]/[0.08]"
                              : "border-[var(--border)] bg-[var(--surface-2)]/55 hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <span className="block truncate text-[10px] font-semibold">{item.title}</span>
                          <span className="mt-1 block text-[9px] text-[var(--muted-2)]">
                            {new Intl.DateTimeFormat("ro-RO", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            }).format(new Date(item.updatedAt))}
                          </span>
                        </button>
                      )) : (
                        <p className="py-6 text-center text-[10px] text-[var(--muted)]">Nu ai încă discuții salvate.</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {!messages.length && !loading ? (
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
    
                      <div className="grid gap-3">
                        {messages.map((message) => message.role === "user" ? (
                          <div key={message.key} className="ml-10 rounded-[15px] bg-[var(--button)] px-3.5 py-3 text-[11px] leading-5 text-[var(--button-text)]">
                            {message.content}
                          </div>
                        ) : (
                          <article key={message.key} className="mr-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]/45 p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-[#7897ff]/20 bg-[#7897ff]/10 px-2.5 py-1 text-[8px] font-bold text-[#aab9ff]">
                                {specialistLabels[message.specialist || "general"]}
                              </span>
                              <span className="text-[8px] text-[var(--muted-2)]">ORBYVEN</span>
                            </div>
                            <p className="mt-2.5 text-[12px] leading-5 text-[var(--text)]">{message.content}</p>
                            {message.facts.length ? (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {message.facts.map((fact, index) => (
                                  <div key={`${fact.label}-${index}`} className="rounded-[11px] border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2.5">
                                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--muted-2)]">{fact.label}</p>
                                    <p className="mt-1 text-[10px] font-semibold">{fact.value}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {renderAssistantActions(message.actions)}
                          </article>
                        ))}
    
                        {loading ? (
                          <div role="status" className="mr-16 rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-4 py-5 text-center">
                            <div className="mx-auto h-5 w-5 animate-pulse rounded-full border border-[#7897ff]/45 bg-[#7897ff]/10" />
                            <p className="mt-2 text-[9px] text-[var(--muted)]">Analizez workspace-ul firmei…</p>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
    
                  {error ? (
                    <p role="alert" className="mt-3 rounded-[13px] border border-rose-400/20 bg-rose-400/[0.07] px-3 py-3 text-[10px] leading-4 text-rose-300">{error}</p>
                  ) : null}
                </div>
    
                {!historyOpen ? (
                  <form onSubmit={submit} className="border-t border-[#91a8ff]/10 bg-[rgba(5,11,23,0.86)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4">
                    <div className="flex items-end gap-2 rounded-[17px] border border-[#91a8ff]/20 bg-[rgba(17,29,51,0.78)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                      <textarea
                        ref={composerRef}
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value.slice(0, 1200))}
                        rows={1}
                        placeholder="Întreabă ORBYVEN…"
                        className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[11px] leading-4 text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
                      />
                      <button
                        type="submit"
                        disabled={!canSend}
                        className="h-9 shrink-0 rounded-[11px] bg-[var(--button)] px-3 text-[10px] font-semibold text-[var(--button-text)] disabled:opacity-35"
                      >
                        Trimite
                      </button>
                    </div>
                    <p className="mt-2 px-1 text-[8px] text-[var(--muted-2)]">
                      0.8.14 Guided Resolution · prioritățile primesc pași clari și context exact; execuția rămâne controlată și confirmată.
                    </p>
                  </form>
                ) : null}
              </section>
            </>
          ) : null}
          </>
        </div>
    ,
    document.body
  );
}
