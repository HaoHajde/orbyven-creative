"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SITE,
  SITE_PRESETS,
  SITE_PRESET_LABELS,
  SECTION_LABELS,
  type EditableSite,
  type SitePresetId,
} from "@/lib/ai/site-editor";
import { applyLocalPreviewCommand } from "@/lib/ai/local-preview-commands";

const STORAGE_KEY = "orbyven-web-design-specialist-draft-v08";

const QUICK = [
  "Vreau o tematică black & gold cu layout editorial",
  "Vreau scris mare și layout centrat",
  "Ascunde secțiunea despre",
  "Titlu: Un site care lucrează pentru afacerea ta",
];

export default function WebDesignSpecialist() {
  const router = useRouter();
  const [draft, setDraft] = useState<EditableSite>(DEFAULT_SITE);
  const [history, setHistory] = useState<EditableSite[]>([]);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("Web Design Specialist este pregătit.");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const preset = typeof parsed.preset === "string" && parsed.preset in SITE_PRESETS
            ? parsed.preset as SitePresetId
            : "studio";
          setDraft({ ...SITE_PRESETS[preset], ...parsed });
        }
      }
    } catch (error) {
      console.warn("ORBYVEN Web Design draft could not be restored", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  const visibleSections = useMemo(
    () => draft.sectionOrder.filter((section) => !draft.hiddenSections.includes(section)),
    [draft]
  );

  const applyPrompt = (value?: string) => {
    const request = (value ?? prompt).trim();
    if (!request) return;
    const result = applyLocalPreviewCommand(draft, request);
    setPrompt(request);
    if (!result) {
      setMessage("Cererea are nevoie de interpretare creativă. Motorul local 0.8 nu inventează copy și nu apelează încă un provider extern.");
      return;
    }
    if (JSON.stringify(result.draft) !== JSON.stringify(draft)) {
      setHistory((current) => [...current.slice(-19), draft]);
      setDraft(result.draft);
    }
    setMessage(result.message);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyPrompt();
  };

  const selectPreset = (preset: SitePresetId) => {
    setHistory((current) => [...current.slice(-19), draft]);
    setDraft(SITE_PRESETS[preset]);
    setMessage(`Am încărcat presetul ${SITE_PRESET_LABELS[preset]}.`);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setDraft(previous);
    setHistory((current) => current.slice(0, -1));
    setMessage("Am revenit la versiunea anterioară.");
  };

  const reset = () => {
    setHistory((current) => [...current.slice(-19), draft]);
    setDraft(SITE_PRESETS[draft.preset]);
    setMessage("Am resetat preview-ul la presetul selectat.");
  };

  return (
    <main className="min-h-screen bg-[#090b13] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090b13]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => router.push("/workspace")} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/70 hover:text-white">← Workspace</button>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#91a8ff]">ORBYVEN INTELLIGENCE · WEB DESIGN</p>
              <h1 className="truncate text-[16px] font-semibold tracking-[-0.03em]">Web Design Specialist</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!history.length} onClick={undo} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold disabled:opacity-30">Undo</button>
            <button type="button" onClick={reset} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold">Reset</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 p-4 sm:p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">SPECIALIST</p>
            <h2 className="mt-1 text-[18px] font-semibold">Descrie schimbarea.</h2>
            <p className="mt-2 text-[10px] leading-5 text-white/50">Motorul local modifică doar schema validată: layout, paletă, secțiuni și text furnizat explicit. Nu generează cod arbitrar.</p>
          </div>

          <label className="mt-5 block text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">Preset</label>
          <select
            value={draft.preset}
            onChange={(event) => selectPreset(event.target.value as SitePresetId)}
            className="mt-2 h-10 w-full rounded-[12px] border border-white/10 bg-black/25 px-3 text-[11px] outline-none"
          >
            {(Object.keys(SITE_PRESETS) as SitePresetId[]).map((id) => (
              <option key={id} value={id}>{SITE_PRESET_LABELS[id]}</option>
            ))}
          </select>

          <form onSubmit={submit} className="mt-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value.slice(0, 1200))}
              rows={5}
              placeholder="Ex: fă site-ul black & gold, layout editorial și titlul mai mare"
              className="w-full resize-none rounded-[14px] border border-white/10 bg-black/25 px-3 py-3 text-[11px] leading-5 outline-none placeholder:text-white/25 focus:border-[#7897ff]/45"
            />
            <button className="mt-2 h-10 w-full rounded-[12px] bg-white text-[11px] font-semibold text-black">Aplică în preview</button>
          </form>

          <div className="mt-4 grid gap-2">
            {QUICK.map((item) => (
              <button key={item} type="button" onClick={() => applyPrompt(item)} className="rounded-[12px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-left text-[10px] leading-4 text-white/70 hover:bg-white/[0.07]">
                {item}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-[13px] border border-[#7897ff]/15 bg-[#7897ff]/[0.07] px-3 py-3 text-[10px] leading-5 text-[#c1ccff]">
            {message}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#11141d] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">LIVE PREVIEW</p>
              <p className="mt-1 text-[11px] font-semibold">{draft.brand}</p>
            </div>
            <div className="flex gap-1.5">
              {draft.sectionOrder.map((section) => (
                <span key={section} className={`h-1.5 w-1.5 rounded-full ${draft.hiddenSections.includes(section) ? "bg-white/10" : "bg-[#8198ff]"}`} title={SECTION_LABELS[section]} />
              ))}
            </div>
          </div>

          <div
            className="min-h-[640px] overflow-hidden rounded-[22px] transition-colors"
            style={{ background: draft.background, color: draft.textColor }}
          >
            {visibleSections.map((section) => {
              if (section === "hero") {
                return (
                  <section key={section} className={`grid min-h-[420px] items-center gap-8 px-7 py-14 sm:px-10 lg:px-14 ${draft.layout === "split" ? "lg:grid-cols-2" : ""}`}>
                    <div className={draft.layout === "centered" ? "mx-auto max-w-3xl text-center" : draft.layout === "editorial" ? "max-w-4xl" : ""}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: draft.accent }}>{draft.eyebrow}</p>
                      <h2 className={`mt-4 font-semibold tracking-[-0.055em] ${draft.headlineSize === "large" ? "text-[clamp(3rem,7vw,6.5rem)] leading-[0.9]" : "text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.94]"}`}>
                        {draft.headline}
                      </h2>
                      <p className="mt-6 max-w-2xl text-[14px] leading-7 opacity-65">{draft.description}</p>
                      <button type="button" className="mt-7 rounded-full px-5 py-3 text-[11px] font-semibold" style={{ background: draft.accent, color: "#fff" }}>{draft.cta}</button>
                    </div>
                    {draft.layout === "split" ? (
                      <div className="min-h-[260px] rounded-[28px] border border-black/5 shadow-inner" style={{ background: draft.surface }}>
                        <div className="flex h-full min-h-[260px] items-center justify-center opacity-30">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Visual / Media Area</span>
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
              }
              if (section === "services") {
                return (
                  <section key={section} className="border-t border-black/10 px-7 py-12 sm:px-10 lg:px-14" style={{ background: draft.surface }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: draft.accent }}>SERVICII</p>
                    <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{draft.servicesTitle}</h3>
                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      {[1,2,3].map((item) => <div key={item} className="min-h-28 rounded-[18px] border border-black/10 p-4"><span className="text-[11px] font-semibold">Serviciu {item}</span></div>)}
                    </div>
                  </section>
                );
              }
              if (section === "about") {
                return (
                  <section key={section} className="border-t border-black/10 px-7 py-12 sm:px-10 lg:px-14">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: draft.accent }}>DESPRE</p>
                    <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{draft.aboutTitle}</h3>
                    <p className="mt-4 max-w-2xl text-[13px] leading-6 opacity-65">{draft.aboutDescription}</p>
                  </section>
                );
              }
              return (
                <section key={section} className="border-t border-black/10 px-7 py-12 sm:px-10 lg:px-14" style={{ background: draft.surface }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: draft.accent }}>CONTACT</p>
                  <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{draft.contactTitle}</h3>
                  <p className="mt-4 max-w-2xl text-[13px] leading-6 opacity-65">{draft.contactDescription}</p>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
