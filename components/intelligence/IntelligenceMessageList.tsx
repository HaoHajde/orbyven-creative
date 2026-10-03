"use client";

import type { IntelligenceResponse, IntelligenceSpecialist } from "@/lib/ai/intelligence-types";

type PlanAction = Extract<IntelligenceResponse["actions"][number], { kind: "review_plan" }>;
type ConfirmAction = Extract<IntelligenceResponse["actions"][number], { kind: "confirm_proposal" }>;

export type UiMessage = {
  key: string;
  role: "user" | "assistant";
  content: string;
  specialist: IntelligenceSpecialist | null;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceResponse["actions"];
  focus?: IntelligenceResponse["focus"];
  decision?: IntelligenceResponse["decision"];
  outcome?: IntelligenceResponse["outcome"];
};

const specialistLabels: Record<IntelligenceSpecialist, string> = {
  operations: "Operations",
  finance: "Finance",
  web_design: "Web Design",
  documents: "Documents",
  general: "ORBYVEN Core",
};

function outcomeFollowUp(outcome: NonNullable<IntelligenceResponse["outcome"]>) {
  if (outcome.status === "no_longer_primary") {
    return { label: "Vezi briefingul actual", prompt: "Fă-mi briefingul zilei" };
  }
  if (outcome.status === "shifted") {
    return { label: "Compară noul Focus", prompt: "Compară opțiunile pentru Focus #1" };
  }
  return { label: "Compară din nou", prompt: "Compară opțiunile pentru Focus #1" };
}

type ActionProps = {
  actions: IntelligenceResponse["actions"];
  proposalBusy: boolean;
  onDecideProposal: (action: ConfirmAction, decision: "confirm" | "reject") => void | Promise<void>;
  onDecidePlanStep: (plan: PlanAction, step: PlanAction["steps"][number], decision: "confirm" | "reject") => void;
  onRecoverPlanAction: (plan: PlanAction) => void | Promise<void>;
  onPreparePromptRepair: (value: string) => void;
  onRunAction: (action: IntelligenceResponse["actions"][number]) => void;
};

function AssistantActions({
  actions,
  proposalBusy,
  onDecideProposal,
  onDecidePlanStep,
  onRecoverPlanAction,
  onPreparePromptRepair,
  onRunAction,
}: ActionProps) {

    if (!actions.length) return null;
    return (
      <div className="mt-3 grid gap-2">
        {actions.map((action, index) => action.kind === "confirm_proposal" ? (
          <div key={action.proposalId} className="rounded-[14px] border border-amber-400/20 bg-amber-400/[0.06] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">CONFIRMARE NECESARĂ</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">
              Confirmă pentru execuție. Propunerea expiră automat.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={proposalBusy}
                onClick={() => void onDecideProposal(action, "confirm")}
                className="rounded-full bg-[var(--button)] px-3.5 py-2 text-[11px] font-semibold text-[var(--button-text)] disabled:opacity-40"
              >
                {proposalBusy ? "Se execută…" : action.label}
              </button>
              <button
                type="button"
                disabled={proposalBusy}
                onClick={() => void onDecideProposal(action, "reject")}
                className="rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[11px] font-semibold disabled:opacity-40"
              >
                Renunță
              </button>
            </div>
          </div>
        ) : action.kind === "review_plan" ? (
          <div key={action.planId} className="rounded-[15px] border border-[#7897ff]/20 bg-[#7897ff]/[0.055] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">PLAN</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Confirmare pas cu pas.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[9px] font-semibold text-[var(--muted)]">
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
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[9px] font-bold">
                        {step.status === "executed" ? "✓" : step.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold leading-5">{step.summary}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted-2)]">{statusLabel}</p>
                        {step.status === "ready" ? (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={proposalBusy}
                              onClick={() => onDecidePlanStep(action, step, "confirm")}
                              className="rounded-full bg-[var(--button)] px-3.5 py-2 text-[11px] font-semibold text-[var(--button-text)] disabled:opacity-40"
                            >
                              {proposalBusy ? "Se execută…" : "Confirmă"}
                            </button>
                            <button
                              type="button"
                              disabled={proposalBusy}
                              onClick={() => onDecidePlanStep(action, step, "reject")}
                              className="rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[11px] font-semibold disabled:opacity-40"
                            >
                              Oprește
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
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">PLAN RECOVERY</p>
                    <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{action.recovery.message}</p>
                    <button
                      type="button"
                      disabled={proposalBusy}
                      onClick={() => {
                        if (action.recovery?.mode === "needs_input") {
                          onPreparePromptRepair(action.recovery.suggestedPrompt || "");
                        } else {
                          void onRecoverPlanAction(action);
                        }
                      }}
                      className="mt-2.5 rounded-full border border-[#7897ff]/30 bg-[#7897ff]/10 px-3 py-1.5 text-[10px] font-semibold text-[#c7d0ff] transition hover:bg-[#7897ff]/15 disabled:opacity-40"
                    >
                      {proposalBusy ? "Se pregătește…" : action.recovery.label}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : action.kind === "repair_plan" ? (
          <div key={`repair-${action.blockedStep}-${index}`} className="rounded-[14px] border border-[#7897ff]/20 bg-[#7897ff]/[0.06] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">PLAN RECOVERY</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{action.message}</p>
            <button
              type="button"
              onClick={() => onPreparePromptRepair(action.suggestedPrompt)}
              className="mt-2.5 rounded-full border border-[#7897ff]/30 bg-[#7897ff]/10 px-3 py-1.5 text-[10px] font-semibold text-[#c7d0ff]"
            >
              {action.label}
            </button>
          </div>
        ) : (
          <button
            key={`${action.kind}-${index}`}
            type="button"
            onClick={() => onRunAction(action)}
            className={index === 0
              ? "w-fit rounded-full bg-[var(--button)] px-3.5 py-2 text-[10px] font-semibold text-[var(--button-text)]"
              : "w-fit rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[10px] font-semibold"}
          >
            {action.label}
          </button>
        ))}
      </div>
    );

}

type Props = {
  messages: UiMessage[];
  loading: boolean;
  proposalBusy: boolean;
  decisionBusy: boolean;
  onAsk: (prompt: string) => void | Promise<void>;
  onChooseDecision: (
    decision: NonNullable<IntelligenceResponse["decision"]>,
    optionIndex: number
  ) => void | Promise<void>;
  onDecideProposal: ActionProps["onDecideProposal"];
  onDecidePlanStep: ActionProps["onDecidePlanStep"];
  onRecoverPlanAction: ActionProps["onRecoverPlanAction"];
  onPreparePromptRepair: ActionProps["onPreparePromptRepair"];
  onRunAction: ActionProps["onRunAction"];
};

export default function IntelligenceMessageList({
  messages,
  loading,
  proposalBusy,
  decisionBusy,
  onAsk,
  onChooseDecision,
  onDecideProposal,
  onDecidePlanStep,
  onRecoverPlanAction,
  onPreparePromptRepair,
  onRunAction,
}: Props) {
  const renderAssistantActions = (actions: IntelligenceResponse["actions"]) => (
    <AssistantActions
      actions={actions}
      proposalBusy={proposalBusy}
      onDecideProposal={onDecideProposal}
      onDecidePlanStep={onDecidePlanStep}
      onRecoverPlanAction={onRecoverPlanAction}
      onPreparePromptRepair={onPreparePromptRepair}
      onRunAction={onRunAction}
    />
  );

  return (
    <>
                        {messages.map((message) => {
                          if (message.role === "user") {
                            return (
                              <div key={message.key} className="ml-10 rounded-[15px] bg-[var(--button)] px-3.5 py-3 text-[12px] leading-5 text-[var(--button-text)]">
                                {message.content}
                              </div>
                            );
                          }

                          const plan = message.actions.find(
                            (action): action is PlanAction => action.kind === "review_plan"
                          );
                          const displayContent = plan
                            ? `Plan pregătit · ${plan.steps.length} pași`
                            : message.content;
                          const displayFacts = plan ? [] : message.facts;

                          return (
                            <article key={message.key} className="mr-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]/45 p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-[#7897ff]/20 bg-[#7897ff]/10 px-2.5 py-1 text-[9px] font-bold text-[#aab9ff]">
                                  {specialistLabels[message.specialist || "general"]}
                                </span>
                                <span className="text-[9px] text-[var(--muted-2)]">ORBYVEN</span>
                              </div>
                              <p className="mt-2.5 text-[13px] leading-5 text-[var(--text)]">{displayContent}</p>
                              {message.outcome ? (
                                <div
                                  data-orbyven-outcome="true"
                                  className="mt-3 overflow-hidden rounded-[13px] border border-emerald-300/15 bg-emerald-300/[0.045]"
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-emerald-300/10 px-3 py-2">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-200/85">OUTCOME</span>
                                    <span className="text-[9px] font-semibold text-[var(--muted-2)]">
                                      {message.outcome.status === "no_longer_primary"
                                        ? "nu mai e Focus #1"
                                        : message.outcome.status === "shifted"
                                          ? "focus mutat"
                                          : "încă prioritar"}
                                    </span>
                                  </div>
                                  <div className="px-3 py-2.5">
                                    <p className="text-[11px] leading-4 text-[var(--text)]">{message.outcome.summary}</p>
                                    {message.outcome.currentFocus ? (
                                      <p className="mt-1.5 text-[10px] leading-4 text-[var(--muted)]">
                                        Focus curent: {message.outcome.currentFocus}
                                      </p>
                                    ) : null}
                                    <button
                                      type="button"
                                      disabled={loading}
                                      onClick={() => {
                                        const followUp = outcomeFollowUp(message.outcome!);
                                        void onAsk(followUp.prompt);
                                      }}
                                      className="mt-2.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1.5 text-[9px] font-semibold text-emerald-100/90 transition hover:bg-emerald-300/[0.10] disabled:opacity-40"
                                    >
                                      {outcomeFollowUp(message.outcome).label}
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                              {message.focus && !message.decision && !message.outcome ? (
                                <div
                                  data-orbyven-focus-explanation="true"
                                  className="mt-3 overflow-hidden rounded-[13px] border border-[#7897ff]/20 bg-[#7897ff]/[0.055]"
                                >
                                  <div className="flex items-center justify-between border-b border-[#7897ff]/15 px-3 py-2">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">FOCUS</span>
                                    <span className="text-[9px] font-semibold text-[var(--muted-2)]">
                                      {message.focus.confidence === "high" ? "date verificate" : "context parțial"}
                                    </span>
                                  </div>
                                  <div className="divide-y divide-[#7897ff]/10">
                                    <div className="grid grid-cols-[58px_1fr] gap-2 px-3 py-2">
                                      <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--muted-2)]">De ce</span>
                                      <p className="text-[11px] leading-4 text-[var(--text)]">{message.focus.why}</p>
                                    </div>
                                    <div className="grid grid-cols-[58px_1fr] gap-2 px-3 py-2">
                                      <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--muted-2)]">Risc</span>
                                      <p className="text-[11px] leading-4 text-[var(--muted)]">{message.focus.consequence}</p>
                                    </div>
                                    <div className="grid grid-cols-[58px_1fr] gap-2 px-3 py-2">
                                      <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--muted-2)]">Următor</span>
                                      <p className="text-[11px] font-semibold leading-4 text-[var(--text)]">{message.focus.nextStep}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              {message.decision ? (
                                <div
                                  data-orbyven-decision-support="true"
                                  className="mt-3 rounded-[13px] border border-[var(--border)] bg-[var(--surface)]/48 p-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2 px-1 pb-2">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aab9ff]">VARIANTE</span>
                                    <span className="truncate text-[9px] text-[var(--muted-2)]">{message.decision.subject}</span>
                                  </div>
                                  {message.focus?.why ? (
                                    <p className="px-1 pb-2 text-[10px] leading-4 text-[var(--muted)]">{message.focus.why}</p>
                                  ) : null}
                                  <div className="grid gap-2">
                                    {message.decision.options.slice(0, 3).map((option, index) => (
                                      <div key={`${option.label}-${index}`} className="rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#7897ff]/25 bg-[#7897ff]/10 text-[9px] font-bold text-[#b9c5ff]">
                                            {index + 1}
                                          </span>
                                          <p className="min-w-0 truncate text-[11px] font-semibold">{option.label}</p>
                                        </div>
                                        <p className="mt-2 text-[10px] leading-4 text-[var(--text)]">{option.impact}</p>
                                        <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">Compromis: {option.tradeoff}</p>
                                        <p className="mt-1 text-[9px] leading-4 text-[var(--muted-2)]">Potrivit când: {option.whenToUse}</p>
                                        {message.decision?.handoffAvailable ? (
                                          <button
                                            type="button"
                                            disabled={decisionBusy}
                                            onClick={() => void onChooseDecision(message.decision!, index)}
                                            className="mt-2 rounded-full border border-[#7897ff]/25 bg-[#7897ff]/10 px-3 py-1.5 text-[9px] font-semibold text-[#c7d0ff] transition hover:bg-[#7897ff]/15 disabled:opacity-40"
                                          >
                                            {decisionBusy ? "Se pregătește…" : "Pregătește planul"}
                                          </button>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {displayFacts.length ? (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  {displayFacts.map((fact, index) => (
                                    <div key={`${fact.label}-${index}`} className="rounded-[11px] border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2.5">
                                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted-2)]">{fact.label}</p>
                                      <p className="mt-1 text-[11px] font-semibold">{fact.value}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              {renderAssistantActions(message.actions)}
                            </article>
                          );
                        })}


    </>
  );
}
