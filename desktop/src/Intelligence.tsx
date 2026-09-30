import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { desktopApiFetch } from "./client";
import type {
  IntelligenceAction,
  IntelligenceResponse,
  IntelligenceSpecialist,
} from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

type Props = {
  organizationId: string;
  onOpenModule: (moduleId: OrbyvenModuleId) => void;
};

type UiMessage = {
  key: string;
  role: "user" | "assistant";
  content: string;
  specialist: IntelligenceSpecialist | null;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceAction[];
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

const QUICK_PROMPTS = [
  "Ce am de făcut azi?",
  "Ce am de încasat?",
  "Ce necesită atenție acum?",
  "Creează lead Ana Popescu; telefon: 0712345678",
  "Creează lucrare Revizie centrală; prioritate: urgent",
  "Programează Revizie tehnică mâine la 10:30",
];

const specialistLabels: Record<IntelligenceSpecialist, string> = {
  operations: "Operations",
  finance: "Finance",
  web_design: "Web Design",
  documents: "Documents",
  general: "ORBYVEN Core",
};

function safeExternalUrl(href: string) {
  try {
    const url = new URL(href, "https://orbyven.ro");
    return url.protocol === "https:" && url.hostname === "orbyven.ro" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function DesktopIntelligence({ organizationId, onOpenModule }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const nextKey = (prefix: string) => {
    sequence.current += 1;
    return prefix + "-" + sequence.current;
  };
  const canSend = useMemo(() => prompt.trim().length >= 2 && !loading, [prompt, loading]);

  const loadConversations = async () => {
    setHistoryLoading(true);
    try {
      const response = await desktopApiFetch(
        "/api/desktop/ai/conversations?organizationId=" + encodeURIComponent(organizationId),
      );
      const body = await response.json() as { conversations?: ConversationSummary[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Istoricul nu a putut fi încărcat.");
      setConversations(body.conversations ?? []);
    } catch (cause) {
      console.error("Desktop Intelligence history:", cause);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadConversations();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, organizationId]);

  const ask = async (value?: string) => {
    const requestPrompt = (value ?? prompt).trim();
    if (requestPrompt.length < 2 || loading) return;
    setMessages((current) => [...current, {
      key: nextKey("user"),
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
      const response = await desktopApiFetch("/api/desktop/ai/intelligence", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          prompt: requestPrompt,
          conversationId,
        }),
      });
      const body = await response.json() as IntelligenceResponse & {
        conversationId?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || "ORBYVEN Intelligence nu a răspuns.");
      if (body.conversationId) setConversationId(body.conversationId);
      setMessages((current) => [...current, {
        key: nextKey("assistant"),
        role: "assistant",
        content: body.answer,
        specialist: body.specialist,
        facts: body.facts ?? [],
        actions: body.actions ?? [],
      }]);
      void loadConversations();
    } catch (cause) {
      console.error("Desktop Intelligence:", cause);
      setError(cause instanceof Error ? cause.message : "ORBYVEN Intelligence nu a răspuns.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask();
  };

  const loadConversation = async (id: string) => {
    if (historyLoading) return;
    setHistoryLoading(true);
    setError("");
    try {
      const response = await desktopApiFetch(
        "/api/desktop/ai/conversations?organizationId=" +
          encodeURIComponent(organizationId) +
          "&conversationId=" +
          encodeURIComponent(id),
      );
      const body = await response.json() as {
        conversation?: ConversationSummary;
        messages?: Array<{
          id: string;
          role: "user" | "assistant";
          specialist: IntelligenceSpecialist | null;
          content: string;
          facts?: Array<{ label: string; value: string }>;
        }>;
        error?: string;
      };
      if (!response.ok || !body.conversation) {
        throw new Error(body.error || "Conversația nu a putut fi încărcată.");
      }
      const restored: UiMessage[] = (body.messages ?? []).map((item) => ({
        key: item.id,
        role: item.role,
        content: item.content,
        specialist: item.specialist,
        facts: item.facts ?? [],
        actions: [],
      }));

      const planResponse = await desktopApiFetch(
        "/api/desktop/ai/plans?organizationId=" +
          encodeURIComponent(organizationId) +
          "&conversationId=" +
          encodeURIComponent(id),
      );
      if (planResponse.ok) {
        const planBody = await planResponse.json() as { plan?: IntelligenceAction | null };
        if (planBody.plan) {
          for (let index = restored.length - 1; index >= 0; index -= 1) {
            if (restored[index].role === "assistant") {
              restored[index].actions = [planBody.plan];
              break;
            }
          }
        }
      }

      setConversationId(body.conversation.id);
      setMessages(restored);
      setHistoryOpen(false);
      setPrompt("");
    } catch (cause) {
      console.error("Desktop Intelligence conversation:", cause);
      setError(cause instanceof Error ? cause.message : "Conversația nu a putut fi încărcată.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const decideProposal = async (
    action: Extract<IntelligenceAction, { kind: "confirm_proposal" }>,
    decision: "confirm" | "reject",
  ) => {
    if (actionBusy) return;
    setActionBusy(true);
    setError("");
    try {
      const response = await desktopApiFetch("/api/desktop/ai/actions/confirm", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          proposalId: action.proposalId,
          decision,
        }),
      });
      const body = await response.json() as {
        error?: string;
        message?: string;
        result?: { moduleId?: OrbyvenModuleId };
      };
      if (!response.ok) throw new Error(body.error || "Acțiunea nu a putut fi procesată.");
      setMessages((current) => current.map((message) => ({
        ...message,
        actions: message.actions.filter(
          (candidate) => candidate.kind !== "confirm_proposal" || candidate.proposalId !== action.proposalId,
        ),
      })));
      if (decision === "confirm" && body.result?.moduleId) onOpenModule(body.result.moduleId);
      if (body.message) {
        setMessages((current) => [...current, {
          key: nextKey("system"),
          role: "assistant",
          content: body.message || "Acțiunea a fost procesată.",
          specialist: "general",
          facts: [],
          actions: [],
        }]);
      }
    } catch (cause) {
      console.error("Desktop Intelligence action:", cause);
      setError(cause instanceof Error ? cause.message : "Acțiunea nu a putut fi procesată.");
    } finally {
      setActionBusy(false);
    }
  };

  const renderAction = (action: IntelligenceAction, index: number) => {
    if (action.kind === "open_module") {
      return <button key={index} className="ai-action" onClick={() => onOpenModule(action.moduleId)}>
        {action.label} →
      </button>;
    }
    if (action.kind === "open_path") {
      const url = safeExternalUrl(action.href);
      return <button key={index} className="ai-action" disabled={!url} onClick={() => {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}>{action.label} ↗</button>;
    }
    if (action.kind === "confirm_proposal") {
      return <div key={index} className="ai-confirm">
        <button className="ai-action primary-action" disabled={actionBusy} onClick={() => void decideProposal(action, "confirm")}>
          Confirmă
        </button>
        <button className="ai-action" disabled={actionBusy} onClick={() => void decideProposal(action, "reject")}>
          Respinge
        </button>
      </div>;
    }
    if (action.kind === "guided_resolution") {
      return <div key={index} className="ai-plan guided-resolution">
        <strong>GUIDED RESOLUTION · {action.title}</strong>
        <small>{action.rationale}</small>
        {action.steps.map((step, stepIndex) => (
          <span key={action.rule + "-" + stepIndex}>
            <i className="plan-dot ready" /> {stepIndex + 1}. {step}
          </span>
        ))}
        <button className="ai-action primary-action" onClick={() => onOpenModule(action.moduleId)}>
          {action.label} →
        </button>
      </div>;
    }
    if (action.kind === "repair_plan") {
      return <button key={index} className="ai-action" onClick={() => {
        setPrompt(action.suggestedPrompt.slice(0, 1200));
        window.requestAnimationFrame(() => composerRef.current?.focus());
      }}>{action.label}</button>;
    }
    return <div key={index} className="ai-plan">
      <strong>{action.label}</strong>
      {action.steps.map((step) => (
        <span key={step.proposalId}>
          <i className={"plan-dot " + step.status} /> {step.index + 1}. {step.summary}
        </span>
      ))}
      {action.recovery?.suggestedPrompt && (
        <button className="ai-action" onClick={() => setPrompt(action.recovery?.suggestedPrompt || "")}>
          {action.recovery.label}
        </button>
      )}
    </div>;
  };

  return (
    <div className="desktop-intelligence">
      <button type="button" className="ai-trigger" aria-label="Deschide ORBYVEN Intelligence" onClick={() => setOpen(true)}>
        <span className="ai-trigger-core">O</span><span className="ai-trigger-label">AI</span>
      </button>
      {open && (
        <div className="ai-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="ai-panel" role="dialog" aria-modal="true" aria-label="ORBYVEN Intelligence">
            <header className="ai-head">
              <div>
                <p className="eyebrow">ORBYVEN · INTELLIGENCE</p>
                <h2>Business copilot</h2>
                <p>Același motor Intelligence ca în workspace-ul web.</p>
              </div>
              <div className="ai-head-actions">
                <button onClick={() => setHistoryOpen((value) => !value)}>Istoric</button>
                <button className="icon-button" aria-label="Închide" onClick={() => setOpen(false)}>×</button>
              </div>
            </header>

            <div className="ai-body">
              {historyOpen ? (
                <div className="ai-history">
                  {historyLoading ? <p className="muted">Se încarcă istoricul...</p> :
                    conversations.length ? conversations.map((item) => (
                      <button key={item.id} className={item.id === conversationId ? "active" : ""} onClick={() => void loadConversation(item.id)}>
                        <strong>{item.title}</strong>
                        <small>{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.updatedAt))}</small>
                      </button>
                    )) : <p className="muted">Nu ai încă discuții salvate.</p>}
                </div>
              ) : (
                <>
                  {!messages.length && !loading && (
                    <div className="ai-quick-prompts">
                      {QUICK_PROMPTS.map((item) => (
                        <button key={item} onClick={() => void ask(item)}>{item}</button>
                      ))}
                    </div>
                  )}
                  <div className="ai-messages">
                    {messages.map((message) => message.role === "user" ? (
                      <div key={message.key} className="ai-message user">{message.content}</div>
                    ) : (
                      <article key={message.key} className="ai-message assistant">
                        <div className="ai-message-meta">
                          <span>{specialistLabels[message.specialist || "general"]}</span>
                          <small>ORBYVEN</small>
                        </div>
                        <p>{message.content}</p>
                        {message.facts.length > 0 && (
                          <div className="ai-facts">
                            {message.facts.map((fact, index) => (
                              <div key={fact.label + index}><small>{fact.label}</small><strong>{fact.value}</strong></div>
                            ))}
                          </div>
                        )}
                        {message.actions.length > 0 && <div className="ai-actions">{message.actions.map(renderAction)}</div>}
                      </article>
                    ))}
                    {loading && <div className="ai-loading"><span className="spinner" /><p>Analizez workspace-ul firmei...</p></div>}
                  </div>
                </>
              )}
              {error && <p className="ai-error" role="alert">{error}</p>}
            </div>

            {!historyOpen && (
              <form className="ai-composer" onSubmit={submit}>
                <textarea ref={composerRef} rows={2} value={prompt}
                  onChange={(event) => setPrompt(event.target.value.slice(0, 1200))}
                  placeholder="Întreabă ORBYVEN…" />
                <button className="primary" disabled={!canSend}>Trimite</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
