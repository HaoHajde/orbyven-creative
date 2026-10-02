"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SITE,
  SITE_PRESETS,
  SITE_PRESET_LABELS,
  readSiteDraft,
  type EditableSite,
  type SitePresetId,
} from "@/lib/ai/site-editor";
import {
  applyLocalPreviewCommand,
  shouldUseGenerativeWebDesign,
} from "@/lib/ai/local-preview-commands";
import {
  applyWebDesignInterviewAnswerLocally,
  buildWebDesignInterviewPrompt,
  readWebDesignInterviewFacts,
  readWebDesignInterviewQuestions,
  type WebDesignInterviewFact,
  type WebDesignInterviewQuestion,
} from "@/lib/ai/web-design-interview";
import {
  getCurrentWorkspace,
  getWorkspaceEntryPath,
} from "@/lib/orbyven-workspace";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import WebDesignPreview, {
  type PreviewDevice,
} from "@/components/ai/WebDesignPreview";

const STORAGE_KEY = "orbyven-web-design-specialist-draft-v09";
const LEGACY_STORAGE_KEY = "orbyven-web-design-specialist-draft-v08";
const VISUAL_MEMORY_KEY = "orbyven-web-design-visual-memory-v01";
const INTERVIEW_QUEUE_KEY = "orbyven-web-design-interview-queue-v01";
const INTERVIEW_FACTS_KEY = "orbyven-web-design-interview-facts-v01";

function workspaceStorageKey(base: string, organizationId: string) {
  return `${base}:${organizationId}`;
}

const QUICK = [
  "Creează un site complet pentru o firmă de servicii, modern, premium și foarte clar. Păstrează doar faptele pe care le cunoști.",
  "Propune o variantă luxury black & gold, editorială, cu mult spațiu și CTA puternic.",
  "Fă o variantă foarte minimalistă, luminoasă și orientată spre conversie.",
  "Ascunde secțiunea despre",
];

type GenerationBody = {
  draft?: unknown;
  summary?: string;
  suggestions?: string[];
  remainingToday?: number | null;
  quality?: {
    score?: number;
    status?: "strong" | "good" | "review";
    fixesApplied?: number;
  };
  readiness?: {
    score?: number;
    status?: "ready" | "almost_ready" | "draft";
    placeholderCount?: number;
    blockers?: Array<{ code?: string; message?: string }>;
  };
  refinement?: {
    attempted?: boolean;
    passes?: number;
    improved?: boolean;
    initialQuality?: number;
    finalQuality?: number;
    initialReadiness?: number;
    finalReadiness?: number;
    remainingActions?: string[];
  };
  selection?: {
    evaluatedCandidates?: number;
    selectedDna?: string | null;
    selectedScore?: number;
    selectedDistance?: number;
    styleAffinity?: number;
  };
  refineScope?: {
    strict?: boolean;
    targets?: string[];
  };
  evidence?: {
    revertedFields?: string[];
    unsupportedConcepts?: string[];
  };
  briefGaps?: {
    count?: number;
    completionScore?: number;
    labels?: string[];
    gaps?: Array<{
      id?: string;
      label?: string;
      question?: string;
      priority?: number;
    }>;
  };
  error?: string;
  code?: string;
};

async function getAccessToken() {
  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sesiunea a expirat. Reautentifică-te.");
  }
  return data.session.access_token;
}

export default function WebDesignSpecialist() {
  const router = useRouter();
  const [draft, setDraft] = useState<EditableSite>(DEFAULT_SITE);
  const [history, setHistory] = useState<EditableSite[]>([]);
  const [visualMemory, setVisualMemory] = useState<EditableSite[]>([]);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("Web Design Intelligence este pregătit.");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [hydrated, setHydrated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<WebDesignInterviewQuestion[]>([]);
  const [interviewFacts, setInterviewFacts] = useState<WebDesignInterviewFact[]>([]);
  const [interviewAnswer, setInterviewAnswer] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const path = await getWorkspaceEntryPath();
        if (!active) return;
        if (path !== "/workspace") {
          router.replace(path);
          return;
        }

        const workspace = await getCurrentWorkspace();
        if (!active) return;
        if (!workspace) {
          router.replace("/workspace/login");
          return;
        }

        setOrganizationId(workspace.organization.id);
        setCanEdit(workspace.membership.role !== "viewer");
        setAuthorized(true);

        const workspaceId = workspace.organization.id;
        const draftStorageKey = workspaceStorageKey(STORAGE_KEY, workspaceId);
        const visualMemoryStorageKey = workspaceStorageKey(
          VISUAL_MEMORY_KEY,
          workspaceId
        );
        const interviewQueueStorageKey = workspaceStorageKey(
          INTERVIEW_QUEUE_KEY,
          workspaceId
        );
        const interviewFactsStorageKey = workspaceStorageKey(
          INTERVIEW_FACTS_KEY,
          workspaceId
        );

        let localDraft: EditableSite | null = null;
        try {
          const saved =
            window.localStorage.getItem(draftStorageKey) ??
            window.localStorage.getItem(STORAGE_KEY) ??
            window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (saved) {
            localDraft = readSiteDraft(JSON.parse(saved));
            if (localDraft) {
              window.localStorage.setItem(
                draftStorageKey,
                JSON.stringify(localDraft)
              );
              window.localStorage.removeItem(STORAGE_KEY);
              window.localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
          }
        } catch (error) {
          console.warn("ORBYVEN Web Design local draft could not be restored", error);
        }
        if (localDraft) setDraft(localDraft);

        try {
          const savedFacts =
            window.localStorage.getItem(interviewFactsStorageKey) ??
            window.localStorage.getItem(INTERVIEW_FACTS_KEY);
          if (savedFacts) {
            const facts = readWebDesignInterviewFacts(JSON.parse(savedFacts));
            setInterviewFacts(facts);
            if (facts.length) {
              window.localStorage.setItem(
                interviewFactsStorageKey,
                JSON.stringify(facts)
              );
            } else {
              window.localStorage.removeItem(interviewFactsStorageKey);
            }
            window.localStorage.removeItem(INTERVIEW_FACTS_KEY);
          }
        } catch (error) {
          console.warn("ORBYVEN Web Design interview facts could not be restored", error);
          window.localStorage.removeItem(interviewFactsStorageKey);
          window.localStorage.removeItem(INTERVIEW_FACTS_KEY);
        }

        try {
          const savedInterview =
            window.localStorage.getItem(interviewQueueStorageKey) ??
            window.localStorage.getItem(INTERVIEW_QUEUE_KEY);
          if (savedInterview) {
            const questions = readWebDesignInterviewQuestions(
              JSON.parse(savedInterview)
            );
            setInterviewQuestions(questions);
            if (questions.length) {
              window.localStorage.setItem(
                interviewQueueStorageKey,
                JSON.stringify(questions)
              );
            } else {
              window.localStorage.removeItem(interviewQueueStorageKey);
            }
            window.localStorage.removeItem(INTERVIEW_QUEUE_KEY);
          }
        } catch (error) {
          console.warn("ORBYVEN Web Design interview queue could not be restored", error);
          window.localStorage.removeItem(interviewQueueStorageKey);
          window.localStorage.removeItem(INTERVIEW_QUEUE_KEY);
        }

        try {
          const savedMemory =
            window.localStorage.getItem(visualMemoryStorageKey) ??
            window.localStorage.getItem(VISUAL_MEMORY_KEY);
          if (savedMemory) {
            const parsedMemory = JSON.parse(savedMemory);
            if (Array.isArray(parsedMemory)) {
              const validMemory = parsedMemory
                .map((item) => readSiteDraft(item))
                .filter((item): item is EditableSite => item !== null)
                .slice(-4);
              setVisualMemory(validMemory);
              window.localStorage.setItem(
                visualMemoryStorageKey,
                JSON.stringify(validMemory)
              );
            }
            window.localStorage.removeItem(VISUAL_MEMORY_KEY);
          }
        } catch (error) {
          console.warn("ORBYVEN Web Design visual memory could not be restored", error);
          window.localStorage.removeItem(visualMemoryStorageKey);
          window.localStorage.removeItem(VISUAL_MEMORY_KEY);
        }

        try {
          const token = await getAccessToken();
          const response = await fetch(
            `/api/ai/web-design/draft?organizationId=${encodeURIComponent(workspace.organization.id)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );
          if (response.ok) {
            const body = (await response.json()) as { draft?: unknown };
            const remote = readSiteDraft(body.draft);
            if (active && remote) {
              setDraft(remote);
              window.localStorage.setItem(
                draftStorageKey,
                JSON.stringify(remote)
              );
              setMessage("Am restaurat draftul sincronizat din ORBYVEN.");
            }
          }
        } catch (error) {
          console.warn("ORBYVEN Web Design remote draft unavailable", error);
        }
      } catch (error) {
        console.error(error);
        if (active) router.replace("/workspace/login");
      } finally {
        if (active) setHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!hydrated || !authorized || !organizationId) return;
    window.localStorage.setItem(
      workspaceStorageKey(STORAGE_KEY, organizationId),
      JSON.stringify(draft)
    );
  }, [draft, hydrated, authorized, organizationId]);

  useEffect(() => {
    if (!hydrated || !authorized || !organizationId) return;
    const key = workspaceStorageKey(INTERVIEW_QUEUE_KEY, organizationId);
    if (interviewQuestions.length) {
      window.localStorage.setItem(key, JSON.stringify(interviewQuestions));
    } else {
      window.localStorage.removeItem(key);
    }
  }, [interviewQuestions, hydrated, authorized, organizationId]);

  useEffect(() => {
    if (!hydrated || !authorized || !organizationId) return;
    const key = workspaceStorageKey(INTERVIEW_FACTS_KEY, organizationId);
    if (interviewFacts.length) {
      window.localStorage.setItem(
        key,
        JSON.stringify(interviewFacts.slice(-8))
      );
    } else {
      window.localStorage.removeItem(key);
    }
  }, [interviewFacts, hydrated, authorized, organizationId]);

  const saveRemote = async (
    next: EditableSite,
    source: "local" | "preset",
    lastPrompt?: string
  ) => {
    if (!organizationId || !canEdit) return;
    setSaveState("saving");
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/ai/web-design/draft", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          draft: next,
          source,
          prompt: lastPrompt ?? null,
        }),
      });
      if (!response.ok) throw new Error("draft save failed");
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1400);
    } catch (error) {
      console.warn("ORBYVEN Web Design remote save unavailable", error);
      setSaveState("idle");
    }
  };

  const commitDraft = (
    next: EditableSite,
    source: "local" | "preset",
    lastPrompt?: string
  ) => {
    if (JSON.stringify(next) === JSON.stringify(draft)) return;
    setHistory((current) => [...current.slice(-29), draft]);
    setDraft(next);
    setQualityScore(null);
    setReadinessScore(null);
    setInterviewQuestions([]);
    setInterviewAnswer("");
    void saveRemote(next, source, lastPrompt);
  };

  const generateWithAi = async (
    request: string,
    factOverride?: WebDesignInterviewFact[]
  ) => {
    if (!organizationId || !canEdit || aiBusy) return false;
    setAiBusy(true);
    setMessage("ORBYVEN construiește o variantă nouă din componente validate…");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/ai/web-design/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          prompt: request,
          currentDraft: draft,
          recentDrafts: visualMemory.slice(-4),
          interviewFacts: (factOverride ?? interviewFacts).slice(-8),
        }),
      });

      const body = (await response.json()) as GenerationBody;
      if (!response.ok) throw new Error(body.error || "Generatorul AI nu a răspuns.");

      const next = readSiteDraft(body.draft);
      if (!next) throw new Error("Generatorul a returnat un draft invalid.");

      setHistory((current) => [...current.slice(-29), draft]);
      setVisualMemory((current) => {
        const nextMemory = [...current, draft].slice(-4);
        if (organizationId) {
          window.localStorage.setItem(
            workspaceStorageKey(VISUAL_MEMORY_KEY, organizationId),
            JSON.stringify(nextMemory)
          );
        }
        return nextMemory;
      });
      setDraft(next);
      setSuggestions((body.suggestions ?? []).slice(0, 4));
      const nextInterviewQuestions = readWebDesignInterviewQuestions(
        body.briefGaps?.gaps
      );
      setInterviewQuestions(nextInterviewQuestions);
      if (!nextInterviewQuestions.length) setInterviewAnswer("");
      const nextQualityScore =
        typeof body.quality?.score === "number"
          ? Math.max(0, Math.min(100, Math.round(body.quality.score)))
          : null;
      setQualityScore(nextQualityScore);
      const nextReadinessScore =
        typeof body.readiness?.score === "number"
          ? Math.max(0, Math.min(100, Math.round(body.readiness.score)))
          : null;
      setReadinessScore(nextReadinessScore);
      const blockerCount = Array.isArray(body.readiness?.blockers)
        ? body.readiness.blockers.length
        : 0;
      const autonomousPasses =
        body.refinement?.attempted && typeof body.refinement.passes === "number"
          ? body.refinement.passes
          : 0;
      const candidateCount =
        typeof body.selection?.evaluatedCandidates === "number"
          ? body.selection.evaluatedCandidates
          : 1;
      const lockedTargets =
        body.refineScope?.strict && Array.isArray(body.refineScope.targets)
          ? body.refineScope.targets.slice(0, 4)
          : [];
      const revertedClaimCount = Array.isArray(body.evidence?.revertedFields)
        ? body.evidence.revertedFields.length
        : 0;
      const briefGapLabels = Array.isArray(body.briefGaps?.labels)
        ? body.briefGaps.labels.slice(0, 2)
        : [];
      setMessage(
        (body.summary || "Varianta AI a fost aplicată.") +
          (briefGapLabels.length > 0
            ? ` · lipsesc: ${briefGapLabels.join(", ")}`
            : "") +
          (revertedClaimCount > 0
            ? ` · ${revertedClaimCount} afirmații neverificate retrase`
            : "") +
          (lockedTargets.length > 0
            ? ` · editare izolată: ${lockedTargets.join(", ")}`
            : "") +
          (candidateCount > 1
            ? ` · selectată din ${candidateCount} variante interne`
            : "") +
          (body.refinement?.improved && autonomousPasses > 0
            ? ` · rafinată automat în ${autonomousPasses} ${autonomousPasses === 1 ? "pas" : "pași"}`
            : "") +
          (typeof body.quality?.fixesApplied === "number" && body.quality.fixesApplied > 0
            ? ` · ${body.quality.fixesApplied} corecții automate`
            : "") +
          (blockerCount > 0
            ? ` · ${blockerCount} elemente de completat înainte de publicare`
            : "") +
          (typeof body.remainingToday === "number"
            ? ` · ${body.remainingToday} generări rămase astăzi`
            : "")
      );
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Generatorul AI nu a putut finaliza varianta."
      );
      return false;
    } finally {
      setAiBusy(false);
    }
  };

  const applyPrompt = async (value?: string, forceAi = false) => {
    const request = (value ?? prompt).trim();
    if (!request || aiBusy) return;

    setPrompt(request);
    const local = applyLocalPreviewCommand(draft, request);
    const wantsAi = forceAi || shouldUseGenerativeWebDesign(request) || !local;

    if (wantsAi && canEdit && organizationId) {
      const generated = await generateWithAi(request);
      if (generated) return;
      if (!local) return;
      setMessage("AI indisponibil momentan; am aplicat doar partea deterministă a cererii.");
    }

    if (local) {
      commitDraft(local.draft, "local", request);
      setSuggestions([]);
      setMessage(local.message);
      return;
    }

    setMessage(
      canEdit
        ? "Cererea are nevoie de generatorul AI. Verifică activarea providerului Web Design în mediul ORBYVEN."
        : "Rolul tău poate vizualiza designul, dar nu îl poate modifica."
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void applyPrompt();
  };

  const activeInterviewQuestion = interviewQuestions[0] ?? null;

  const submitInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeInterviewQuestion || aiBusy || !canEdit) return;

    const fact: WebDesignInterviewFact = {
      id: activeInterviewQuestion.id,
      question: activeInterviewQuestion.question,
      answer: interviewAnswer.trim().slice(0, 1200),
    };
    const nextFacts = readWebDesignInterviewFacts([
      ...interviewFacts,
      fact,
    ]);
    setInterviewFacts(nextFacts);

    const localResult = applyWebDesignInterviewAnswerLocally(
      draft,
      activeInterviewQuestion,
      interviewAnswer
    );
    if (localResult) {
      commitDraft(
        localResult.draft,
        "local",
        `interview:${activeInterviewQuestion.id}`
      );
      setInterviewQuestions((current) => current.slice(1));
      setInterviewAnswer("");
      setSuggestions([]);
      setMessage(localResult.message);
      return;
    }

    const interviewPrompt = buildWebDesignInterviewPrompt(
      activeInterviewQuestion,
      interviewAnswer
    );
    if (!interviewPrompt) {
      setMessage("Răspunsul este prea scurt sau prea lung pentru a fi aplicat.");
      return;
    }

    const generated = await generateWithAi(interviewPrompt, nextFacts);
    if (generated) setInterviewAnswer("");
  };

  const skipInterviewQuestion = () => {
    setInterviewQuestions((current) => current.slice(1));
    setInterviewAnswer("");
  };

  const selectPreset = (preset: SitePresetId) => {
    const next = SITE_PRESETS[preset];
    setVisualMemory([]);
    setInterviewQuestions([]);
    setInterviewFacts([]);
    setInterviewAnswer("");
    if (organizationId) {
      window.localStorage.removeItem(
        workspaceStorageKey(VISUAL_MEMORY_KEY, organizationId)
      );
      window.localStorage.removeItem(
        workspaceStorageKey(INTERVIEW_QUEUE_KEY, organizationId)
      );
      window.localStorage.removeItem(
        workspaceStorageKey(INTERVIEW_FACTS_KEY, organizationId)
      );
    }
    commitDraft(next, "preset");
    setSuggestions([]);
    setMessage(`Am încărcat presetul ${SITE_PRESET_LABELS[preset]}.`);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setDraft(previous);
    setHistory((current) => current.slice(0, -1));
    setSuggestions([]);
    setQualityScore(null);
    setReadinessScore(null);
    setInterviewQuestions([]);
    setInterviewAnswer("");
    setMessage("Am revenit la versiunea anterioară.");
    void saveRemote(previous, "local", "undo");
  };

  const reset = () => {
    const next = SITE_PRESETS[draft.preset];
    setVisualMemory([]);
    setInterviewQuestions([]);
    setInterviewFacts([]);
    setInterviewAnswer("");
    if (organizationId) {
      window.localStorage.removeItem(
        workspaceStorageKey(VISUAL_MEMORY_KEY, organizationId)
      );
      window.localStorage.removeItem(
        workspaceStorageKey(INTERVIEW_QUEUE_KEY, organizationId)
      );
      window.localStorage.removeItem(
        workspaceStorageKey(INTERVIEW_FACTS_KEY, organizationId)
      );
    }
    commitDraft(next, "preset");
    setSuggestions([]);
    setMessage("Am resetat preview-ul la presetul selectat.");
  };

  const alternative = () => {
    void applyPrompt(
      "Propune o altă variantă completă și coerentă pentru același business. Schimbă compoziția, variantele de secțiuni și direcția vizuală, dar păstrează toate faptele reale și scopul principal.",
      true
    );
  };

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b13] text-white">
        <p className="text-[11px] text-white/45">Se verifică accesul ORBYVEN…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b13] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b13]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/workspace")}
              className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/70 hover:text-white"
            >
              ← Workspace
            </button>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#91a8ff]">
                ORBYVEN INTELLIGENCE · WEB DESIGN
              </p>
              <h1 className="truncate text-[16px] font-semibold tracking-[-0.03em]">
                Generative Web Design Specialist
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] text-white/35">
              {saveState === "saving" ? "Se salvează…" : saveState === "saved" ? "Salvat în cloud" : "Draft sincronizat"}
            </span>
            {qualityScore !== null ? (
              <span
                title="Scor tehnic intern pentru structură, contrast, densitate și CTA"
                className="rounded-full border border-[#7897ff]/20 bg-[#7897ff]/[0.08] px-2.5 py-1.5 text-[9px] font-semibold text-[#b9c5ff]"
              >
                Quality {qualityScore}
              </span>
            ) : null}
            {readinessScore !== null ? (
              <span
                title="Grad de pregătire pentru publicare: placeholders, structură și calitate"
                className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1.5 text-[9px] font-semibold text-emerald-200/80"
              >
                Ready {readinessScore}
              </span>
            ) : null}
            <button
              type="button"
              disabled={!history.length || aiBusy}
              onClick={undo}
              className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold disabled:opacity-30"
            >
              Undo
            </button>
            <button
              type="button"
              disabled={aiBusy}
              onClick={reset}
              className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold disabled:opacity-30"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={aiBusy || !canEdit}
              onClick={alternative}
              className="rounded-full bg-white px-3 py-2 text-[10px] font-semibold text-black disabled:opacity-30"
            >
              Altă propunere
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 p-4 sm:p-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-2xl xl:sticky xl:top-20">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
            DESIGN COPILOT
          </p>
          <h2 className="mt-1 text-[18px] font-semibold">Descrie business-ul sau schimbarea.</h2>
          <p className="mt-2 text-[10px] leading-5 text-white/50">
            ORBYVEN folosește gratuit motorul local pentru comenzi simple și AI doar când cererea are nevoie de compoziție, copy sau o variantă nouă. Modelul returnează date validate, niciodată cod executabil.
          </p>

          <label className="mt-5 block text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
            Punct de pornire
          </label>
          <select
            value={draft.preset}
            disabled={aiBusy || !canEdit}
            onChange={(event) => selectPreset(event.target.value as SitePresetId)}
            className="mt-2 h-10 w-full rounded-[12px] border border-white/10 bg-black/25 px-3 text-[11px] outline-none disabled:opacity-40"
          >
            {(Object.keys(SITE_PRESETS) as SitePresetId[]).map((id) => (
              <option key={id} value={id}>
                {SITE_PRESET_LABELS[id]}
              </option>
            ))}
          </select>

          <form onSubmit={submit} className="mt-4">
            <textarea
              value={prompt}
              disabled={aiBusy || !canEdit}
              onChange={(event) => setPrompt(event.target.value.slice(0, 2000))}
              rows={7}
              placeholder="Ex: florărie premium în Bragadiru, public 25–45, vreau un site editorial cald, axat pe comenzi și personalizare. Nu inventa recenzii sau cifre."
              className="w-full resize-none rounded-[14px] border border-white/10 bg-black/25 px-3 py-3 text-[11px] leading-5 outline-none placeholder:text-white/25 focus:border-[#7897ff]/45 disabled:opacity-40"
            />
            <button
              disabled={aiBusy || !canEdit}
              className="mt-2 h-11 w-full rounded-[12px] bg-white text-[11px] font-semibold text-black disabled:opacity-40"
            >
              {aiBusy ? "Construiesc varianta…" : "Aplică / Generează"}
            </button>
          </form>

          <div className="mt-4 grid gap-2">
            {QUICK.map((item) => (
              <button
                key={item}
                type="button"
                disabled={aiBusy || !canEdit}
                onClick={() => void applyPrompt(item)}
                className="rounded-[12px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-left text-[10px] leading-4 text-white/70 hover:bg-white/[0.07] disabled:opacity-35"
              >
                {item}
              </button>
            ))}
          </div>

          {activeInterviewQuestion ? (
            <form
              onSubmit={submitInterview}
              className="mt-4 rounded-[14px] border border-[#7897ff]/20 bg-[#7897ff]/[0.055] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aebcff]">
                  Întrebare utilă
                </p>
                <span className="text-[9px] text-white/30">
                  1 / {interviewQuestions.length}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-white/78">
                {activeInterviewQuestion.question}
              </p>
              <textarea
                value={interviewAnswer}
                disabled={aiBusy || !canEdit}
                onChange={(event) =>
                  setInterviewAnswer(event.target.value.slice(0, 1200))
                }
                rows={3}
                placeholder="Răspunde scurt, cu informația reală."
                className="mt-3 w-full resize-none rounded-[11px] border border-white/10 bg-black/20 px-3 py-2.5 text-[10px] leading-5 outline-none placeholder:text-white/25 focus:border-[#7897ff]/40 disabled:opacity-40"
              />
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="submit"
                  disabled={aiBusy || !canEdit || interviewAnswer.trim().length < 2}
                  className="h-9 rounded-[10px] bg-white px-3 text-[10px] font-semibold text-black disabled:opacity-35"
                >
                  Aplică răspunsul
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={skipInterviewQuestion}
                  className="h-9 rounded-[10px] border border-white/10 px-3 text-[10px] font-semibold text-white/55 disabled:opacity-35"
                >
                  Mai târziu
                </button>
              </div>
            </form>
          ) : null}

          {suggestions.length ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">
                Următoarele îmbunătățiri
              </p>
              <div className="mt-2 grid gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={aiBusy || !canEdit}
                    onClick={() => void applyPrompt(item, true)}
                    className="rounded-[12px] border border-[#7897ff]/15 bg-[#7897ff]/[0.06] px-3 py-2.5 text-left text-[10px] leading-4 text-[#c1ccff] disabled:opacity-35"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-[13px] border border-[#7897ff]/15 bg-[#7897ff]/[0.07] px-3 py-3 text-[10px] leading-5 text-[#c1ccff]">
            {message}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">
              Preview
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDevice(item)}
                  className={`rounded-[10px] border px-2 py-2 text-[9px] font-semibold ${
                    device === item
                      ? "border-white/25 bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/55"
                  }`}
                >
                  {item === "desktop" ? "Desktop" : item === "tablet" ? "Tablet" : "Mobil"}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#11141d] shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <WebDesignPreview draft={draft} device={device} />
        </section>
      </div>
    </main>
  );
}
