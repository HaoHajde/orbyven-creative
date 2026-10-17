"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import WebDesignPreview, {
  type PreviewDevice,
} from "@/components/ai/WebDesignPreview";
import {
  applyLocalPreviewCommand,
  shouldUseGenerativeWebDesign,
} from "@/lib/ai/local-preview-commands";
import {
  DEFAULT_SITE,
  SITE_PRESETS,
  SITE_PRESET_LABELS,
  readSiteDraft,
  type EditableSite,
  type SitePresetId,
} from "@/lib/ai/site-editor";
import {
  getCurrentWorkspace,
  getWorkspaceEntryPath,
} from "@/lib/orbyven-workspace";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type ProjectMode = "website" | "wedding" | "baptism" | "event";

type GenerationBody = {
  draft?: unknown;
  summary?: string;
  suggestions?: string[];
  remainingToday?: number | null;
  error?: string;
};

type ProjectCopy = {
  label: string;
  title: string;
  helper: string;
  placeholder: string;
  quick: Array<{ label: string; prompt: string }>;
};

const PROJECTS: Record<ProjectMode, ProjectCopy> = {
  website: {
    label: "Website",
    title: "Ce construim?",
    helper: "Descrie business-ul, obiectivul și stilul.",
    placeholder:
      "Ex: florărie premium, stil editorial cald, focus pe comenzi și personalizare.",
    quick: [
      { label: "Premium minimal", prompt: "Fă o variantă premium, minimalistă și foarte clară." },
      { label: "Luxury", prompt: "Propune o variantă luxury editorială, cu mult spațiu și contrast elegant." },
      { label: "Mai simplu", prompt: "Simplifică designul și păstrează doar ce este esențial pentru conversie." },
    ],
  },
  wedding: {
    label: "Nuntă",
    title: "Invitație de nuntă",
    helper: "Nume, dată, locații și atmosfera dorită.",
    placeholder:
      "Ex: Ana & Vlad, 10 octombrie, elegant modern, ceremonie + petrecere, RSVP simplu.",
    quick: [
      { label: "Elegant", prompt: "Creează o invitație elegantă, caldă și aerisită." },
      { label: "Luxury", prompt: "Propune o invitație luxury editorială, sofisticată și minimalistă." },
      { label: "Modern", prompt: "Fă invitația modernă, foarte curată și optimizată pentru telefon." },
    ],
  },
  baptism: {
    label: "Botez",
    title: "Invitație de botez",
    helper: "Spune numele, data și direcția vizuală.",
    placeholder:
      "Ex: Sofia, botez delicat și modern, tonuri calde, program scurt și RSVP.",
    quick: [
      { label: "Delicat", prompt: "Creează o invitație delicată, luminoasă și elegantă." },
      { label: "Modern", prompt: "Propune o invitație modernă, curată și foarte ușor de citit." },
      { label: "Poveste", prompt: "Pune accent pe emoție, poveste și o compoziție blândă." },
    ],
  },
  event: {
    label: "Eveniment",
    title: "Invitație de eveniment",
    helper: "Tipul evenimentului, detaliile și vibe-ul.",
    placeholder:
      "Ex: majorat / aniversare / lansare, stil dark editorial, program și confirmare prezență.",
    quick: [
      { label: "Dark", prompt: "Creează o invitație dark editorială, premium și cinematică." },
      { label: "Bold", prompt: "Propune o invitație bold, energică și foarte vizuală." },
      { label: "Minimal", prompt: "Fă invitația minimalistă, aerisită și concentrată pe detalii și RSVP." },
    ],
  },
};

const PROJECT_ORDER: ProjectMode[] = ["website", "wedding", "baptism", "event"];

const INVITATION_BASE: EditableSite = {
  ...SITE_PRESETS.studio,
  preset: "studio",
  layout: "centered",
  headlineSize: "large",
  visualTone: "luxury",
  density: "airy",
  brand: "Invitația voastră",
  eyebrow: "INVITAȚIE ONLINE",
  headline: "Un moment important, într-o pagină care vă reprezintă.",
  description: "Adaugă detaliile reale în brief, iar ORBYVEN construiește invitația.",
  cta: "Confirmă prezența",
  servicesTitle: "Detalii",
  services: [
    { title: "Când", description: "Data și ora evenimentului." },
    { title: "Unde", description: "Locația sau locațiile importante." },
    { title: "RSVP", description: "Confirmarea prezenței direct din invitație." },
  ],
  benefitsTitle: "Totul într-un singur loc",
  benefits: [
    { title: "Poveste", description: "Un spațiu personal pentru momentul vostru." },
    { title: "Program", description: "Momentele importante, ușor de urmărit." },
    { title: "Detalii", description: "Informația esențială, fără aglomerație." },
  ],
  aboutTitle: "Povestea voastră",
  aboutDescription: "Completează doar informațiile pe care vrei să le vadă invitații.",
  processTitle: "Program",
  process: [
    { title: "Primul moment", description: "Ora și locul se completează din brief." },
    { title: "Întâlnirea", description: "Un reper important al evenimentului." },
    { title: "Continuăm împreună", description: "Ultimul moment principal al zilei sau serii." },
  ],
  contactTitle: "Ne vedem acolo?",
  contactDescription: "Confirmarea prezenței rămâne simplă și rapidă.",
  hiddenSections: ["gallery", "faq"],
  variants: {
    ...SITE_PRESETS.studio.variants,
    hero: "centered",
    benefits: "strip",
    about: "story",
    process: "timeline",
    contact: "compact",
  },
  accent: "#a98dff",
  background: "#f7f4fb",
  surface: "#ffffff",
  textColor: "#282232",
};

const PROJECT_STARTERS: Record<ProjectMode, EditableSite> = {
  website: DEFAULT_SITE,
  wedding: {
    ...INVITATION_BASE,
    brand: "Numele voastre",
    eyebrow: "INVITAȚIE DE NUNTĂ",
    headline: "Ziua voastră, în stilul vostru.",
    accent: "#b58a72",
    background: "#f8f2ee",
    surface: "#fffaf7",
    textColor: "#302521",
  },
  baptism: {
    ...INVITATION_BASE,
    brand: "Numele copilului",
    eyebrow: "INVITAȚIE DE BOTEZ",
    headline: "O zi mică. O amintire mare.",
    visualTone: "warm",
    accent: "#88a9c7",
    background: "#f3f8fb",
    surface: "#ffffff",
    textColor: "#24323e",
  },
  event: {
    ...INVITATION_BASE,
    brand: "Titlul evenimentului",
    eyebrow: "INVITAȚIE EVENIMENT",
    headline: "O seară care merită trăită.",
    layout: "editorial",
    visualTone: "bold",
    accent: "#d87a5f",
    background: "#0d0c12",
    surface: "#17151d",
    textColor: "#f7f2ed",
    variants: {
      ...INVITATION_BASE.variants,
      hero: "editorial",
    },
  },
};

function scopedStorageKey(base: string, organizationId: string) {
  return `${base}:${organizationId}`;
}

function promptForMode(mode: ProjectMode, request: string) {
  const trimmed = request.trim();
  if (mode === "website") return trimmed;
  if (mode === "wedding") return `Creează o invitație online de nuntă. ${trimmed}`;
  if (mode === "baptism") return `Creează o invitație online de botez. ${trimmed}`;
  return `Creează o invitație online pentru un eveniment. ${trimmed}`;
}

async function getAccessToken() {
  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sesiunea a expirat. Reautentifică-te.");
  }
  return data.session.access_token;
}

export default function WebDesignStudio() {
  const router = useRouter();
  const [draft, setDraft] = useState<EditableSite>(DEFAULT_SITE);
  const [history, setHistory] = useState<EditableSite[]>([]);
  const [modeDrafts, setModeDrafts] = useState<Partial<Record<ProjectMode, EditableSite>>>({});
  const [projectMode, setProjectMode] = useState<ProjectMode>("website");
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState("Pregătit.");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [ready, setReady] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const entryPath = await getWorkspaceEntryPath();
        if (!active) return;
        if (entryPath !== "/workspace") {
          router.replace(entryPath);
          return;
        }

        const workspace = await getCurrentWorkspace();
        if (!active) return;
        if (!workspace) {
          router.replace("/workspace/login?next=ai-web-design");
          return;
        }

        const id = workspace.organization.id;
        setOrganizationId(id);
        setCanEdit(workspace.membership.role !== "viewer");

        const savedMode = window.localStorage.getItem(
          scopedStorageKey("orbyven-ai-design-project-mode-v01", id)
        );
        if (PROJECT_ORDER.includes(savedMode as ProjectMode)) {
          setProjectMode(savedMode as ProjectMode);
        }

        try {
          const token = await getAccessToken();
          const response = await fetch(
            `/api/ai/web-design/draft?organizationId=${encodeURIComponent(id)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );
          if (response.ok) {
            const body = (await response.json()) as { draft?: unknown };
            const restored = readSiteDraft(body.draft);
            if (active && restored) setDraft(restored);
          }
        } catch (error) {
          console.warn("ORBYVEN AI Design draft restore unavailable", error);
        }
      } catch (error) {
        console.error(error);
        if (active) router.replace("/workspace/login?next=ai-web-design");
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

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
      window.setTimeout(() => setSaveState("idle"), 1300);
    } catch (error) {
      console.warn("ORBYVEN AI Design draft save unavailable", error);
      setSaveState("idle");
    }
  };

  const commitDraft = (
    next: EditableSite,
    source: "local" | "preset",
    lastPrompt?: string
  ) => {
    if (JSON.stringify(next) === JSON.stringify(draft)) return;
    setHistory((current) => [...current.slice(-24), draft]);
    setDraft(next);
    void saveRemote(next, source, lastPrompt);
  };

  const generateWithAi = async (request: string) => {
    if (!organizationId || !canEdit || aiBusy) return false;
    setAiBusy(true);
    setMessage("Construiesc varianta…");

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
          prompt: promptForMode(projectMode, request),
          currentDraft: draft,
          recentDrafts: history.slice(-4),
        }),
      });
      const body = (await response.json()) as GenerationBody;
      if (!response.ok) throw new Error(body.error || "Generatorul AI nu a răspuns.");

      const next = readSiteDraft(body.draft);
      if (!next) throw new Error("Generatorul a returnat un draft invalid.");

      setHistory((current) => [...current.slice(-24), draft]);
      setDraft(next);
      setSuggestions((body.suggestions ?? []).slice(0, 3));
      const remaining =
        typeof body.remainingToday === "number"
          ? ` · ${body.remainingToday} generări rămase`
          : "";
      setMessage(`${body.summary || "Varianta e gata."}${remaining}`);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nu am putut genera varianta.");
      return false;
    } finally {
      setAiBusy(false);
    }
  };

  const applyPrompt = async (value?: string, forceAi = false) => {
    const request = (value ?? prompt).trim();
    if (!request || aiBusy) return;
    setPrompt(request);

    const local = projectMode === "website" ? applyLocalPreviewCommand(draft, request) : null;
    const wantsAi =
      projectMode !== "website" || forceAi || shouldUseGenerativeWebDesign(request) || !local;

    if (wantsAi) {
      const generated = await generateWithAi(request);
      if (generated || !local) return;
    }

    if (local) {
      commitDraft(local.draft, "local", request);
      setSuggestions([]);
      setMessage(local.message);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void applyPrompt();
  };

  const switchProject = (nextMode: ProjectMode) => {
    if (nextMode === projectMode || aiBusy) return;
    setModeDrafts((current) => ({ ...current, [projectMode]: draft }));
    const nextDraft = modeDrafts[nextMode] ?? PROJECT_STARTERS[nextMode];
    setHistory((current) => [...current.slice(-24), draft]);
    setDraft(nextDraft);
    setProjectMode(nextMode);
    setPrompt("");
    setSuggestions([]);
    setMessage("Spune-mi ce vrei să construiesc.");
    if (organizationId) {
      window.localStorage.setItem(
        scopedStorageKey("orbyven-ai-design-project-mode-v01", organizationId),
        nextMode
      );
    }
  };

  const selectPreset = (preset: SitePresetId) => {
    if (projectMode !== "website") return;
    commitDraft(SITE_PRESETS[preset], "preset");
    setSuggestions([]);
    setMessage(`${SITE_PRESET_LABELS[preset]} este punctul de pornire.`);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous || aiBusy) return;
    setDraft(previous);
    setHistory((current) => current.slice(0, -1));
    setSuggestions([]);
    setMessage("Am revenit la varianta anterioară.");
    void saveRemote(previous, "local", "undo");
  };

  const reset = () => {
    if (aiBusy) return;
    const next =
      projectMode === "website" ? SITE_PRESETS[draft.preset] : PROJECT_STARTERS[projectMode];
    commitDraft(next, "preset");
    setPrompt("");
    setSuggestions([]);
    setMessage("Am resetat proiectul.");
  };

  const alternative = () => {
    const request =
      projectMode === "website"
        ? "Propune o altă variantă completă pentru același proiect. Schimbă direcția vizuală și compoziția, dar păstrează faptele reale."
        : "Propune o altă variantă completă a invitației. Schimbă direcția vizuală și compoziția, dar păstrează toate detaliile reale.";
    void applyPrompt(request, true);
  };

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07080d] text-white">
        <p className="text-[11px] text-white/45">Se deschide AI Design…</p>
      </main>
    );
  }

  const project = PROJECTS[projectMode];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#07080d] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(115,92,255,0.12),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(67,109,255,0.07),transparent_28%)]"
      />

      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#07080d]/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/workspace")}
              className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"
            >
              ← Workspace
            </button>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#9f8dff]">
                ORBYVEN · AI DESIGN
              </p>
              <h1 className="truncate text-[15px] font-semibold tracking-[-0.03em]">
                Design Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[9px] text-white/30 sm:inline">
              {saveState === "saving" ? "Se salvează…" : saveState === "saved" ? "Salvat" : "Sincronizat"}
            </span>
            <button
              type="button"
              disabled={!history.length || aiBusy}
              onClick={undo}
              className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/65 disabled:opacity-25"
            >
              Undo
            </button>
            <button
              type="button"
              disabled={aiBusy}
              onClick={reset}
              className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/65 disabled:opacity-25"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={aiBusy || !canEdit}
              onClick={alternative}
              className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold text-black disabled:opacity-30"
            >
              Altă variantă
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1760px] gap-4 p-4 sm:p-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[28px] border border-white/[0.08] bg-white/[0.045] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.28)] xl:sticky xl:top-20">
          <div className="grid grid-cols-4 gap-1 rounded-[14px] border border-white/[0.07] bg-black/20 p-1">
            {PROJECT_ORDER.map((item) => (
              <button
                key={item}
                type="button"
                disabled={aiBusy}
                onClick={() => switchProject(item)}
                className={`rounded-[10px] px-2 py-2.5 text-[9px] font-semibold transition ${
                  projectMode === item
                    ? "bg-white text-black shadow-sm"
                    : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
                }`}
              >
                {PROJECTS[item].label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#9f8dff]">
              {project.label}
            </p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.04em]">{project.title}</h2>
            <p className="mt-1 text-[10px] leading-5 text-white/42">{project.helper}</p>
          </div>

          {projectMode === "website" ? (
            <select
              value={draft.preset}
              disabled={aiBusy || !canEdit}
              onChange={(event) => selectPreset(event.target.value as SitePresetId)}
              aria-label="Punct de pornire website"
              className="mt-4 h-10 w-full rounded-[12px] border border-white/[0.08] bg-black/20 px-3 text-[10px] text-white/75 outline-none disabled:opacity-40"
            >
              {(Object.keys(SITE_PRESETS) as SitePresetId[]).map((id) => (
                <option key={id} value={id}>
                  {SITE_PRESET_LABELS[id]}
                </option>
              ))}
            </select>
          ) : null}

          <form onSubmit={submit} className="mt-3">
            <textarea
              value={prompt}
              disabled={aiBusy || !canEdit}
              onChange={(event) => setPrompt(event.target.value.slice(0, 1700))}
              rows={5}
              placeholder={project.placeholder}
              className="w-full resize-none rounded-[16px] border border-white/[0.08] bg-black/20 px-3.5 py-3 text-[11px] leading-5 text-white/85 outline-none placeholder:text-white/22 focus:border-[#9f8dff]/45 disabled:opacity-40"
            />
            <button
              disabled={aiBusy || !canEdit || prompt.trim().length < 2}
              className="mt-2 h-11 w-full rounded-[13px] bg-white text-[11px] font-semibold text-black transition hover:-translate-y-px disabled:opacity-35 disabled:hover:translate-y-0"
            >
              {aiBusy ? "Construiesc…" : "Generează"}
            </button>
          </form>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {project.quick.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={aiBusy || !canEdit}
                onClick={() => void applyPrompt(item.prompt, true)}
                className="rounded-[11px] border border-white/[0.07] bg-white/[0.025] px-2 py-2.5 text-[9px] font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white/85 disabled:opacity-30"
              >
                {item.label}
              </button>
            ))}
          </div>

          {suggestions.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.07] pt-4">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={aiBusy || !canEdit}
                  onClick={() => void applyPrompt(item, true)}
                  className="rounded-full border border-[#9f8dff]/15 bg-[#9f8dff]/[0.055] px-3 py-2 text-left text-[9px] text-[#c9beff] disabled:opacity-30"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 rounded-[13px] border border-white/[0.07] bg-black/15 px-3 py-2.5 text-[9px] leading-4 text-white/42">
            {message}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-[12px] border border-white/[0.07] bg-black/15 p-1">
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDevice(item)}
                className={`rounded-[9px] px-2 py-2 text-[9px] font-semibold ${
                  device === item ? "bg-white/[0.1] text-white" : "text-white/35"
                }`}
              >
                {item === "desktop" ? "Desktop" : item === "tablet" ? "Tablet" : "Mobil"}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0d0f16] shadow-[0_32px_110px_rgba(0,0,0,0.36)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9f8dff]" />
              <span className="text-[9px] font-semibold text-white/55">Live preview</span>
            </div>
            <span className="text-[9px] text-white/30">{project.title}</span>
          </div>
          <WebDesignPreview draft={draft} device={device} />
        </section>
      </div>
    </main>
  );
}
