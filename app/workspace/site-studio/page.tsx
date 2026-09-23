"use client";

import BrandLogo from "@/components/BrandLogo";
import StudioSitePreview from "@/components/StudioSitePreview";
import { clientTemplateCatalog } from "@/lib/client-template-catalog";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getCurrentWorkspace, type OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { studioSeed, studioTemplateSlugs, type StudioDraft } from "@/lib/site-studio";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type TemplateSlug = (typeof studioTemplateSlugs)[number];
type ChatMessage = { role: "user" | "assistant"; content: string };
type Device = "desktop" | "tablet" | "mobile";
type StudioSnapshot = { draft: StudioDraft; slug: TemplateSlug };

const examples = [
  "Fă site-ul mai elegant, cu fundal închis și accente aurii.",
  "Scurtează titlul principal și fă-l mai convingător.",
  "Rescrie descrierea pentru o afacere locală.",
  "Prezintă cele trei servicii într-un ton mai profesionist.",
];

const palettes = [
  { name: "Indigo", accent: "#4b46ee", background: "#f7f7f8", foreground: "#18181d" },
  { name: "Luxury", accent: "#bd9946", background: "#10151e", foreground: "#ffffff" },
  { name: "Forest", accent: "#31836b", background: "#f5f9f6", foreground: "#18181d" },
  { name: "Warm", accent: "#ae6b55", background: "#fcf8f3", foreground: "#18181d" },
];

async function studioHeaders() {
  const { data } = await orbyvenSupabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sesiunea a expirat. Conectează-te din nou.");
  return { Authorization: "Bearer " + data.session.access_token, "Content-Type": "application/json" };
}

export default function WebsiteStudioPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [draft, setDraft] = useState<StudioDraft | null>(null);
  const [saved, setSaved] = useState<StudioDraft | null>(null);
  const [templateSlug, setTemplateSlug] = useState<TemplateSlug>("instalatii");
  const [savedTemplateSlug, setSavedTemplateSlug] = useState<TemplateSlug>("instalatii");
  const [device, setDevice] = useState<Device>("desktop");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("preview");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Bine ai venit! Spune-mi cum vrei să arate website-ul tău. Îți arăt fiecare modificare în preview, fără să ating site-ul public." },
  ]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [undoStack, setUndoStack] = useState<StudioSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<StudioSnapshot[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const current = await getCurrentWorkspace();
        if (!current) {
          router.replace("/workspace/login");
          return;
        }
        const response = await fetch("/api/site-studio?organizationId=" + encodeURIComponent(current.organization.id), {
          headers: await studioHeaders(), cache: "no-store",
        });
        const body = await response.json() as {
          draft?: StudioDraft; templateSlug?: TemplateSlug; error?: string;
        };
        if (!active) return;
        setWorkspace(current);
        if (!response.ok || !body.draft) {
          setBlocked(body.error || "Website Studio nu poate fi încărcat.");
        } else {
          setDraft(body.draft);
          setSaved(body.draft);
          setTemplateSlug(body.templateSlug || "instalatii");
          setSavedTemplateSlug(body.templateSlug || "instalatii");
        }
      } catch {
        if (active) setBlocked("Nu am putut încărca proiectul. Verifică sesiunea și conexiunea.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  const canEdit = workspace ? ["owner", "admin", "manager"].includes(workspace.membership.role) : false;
  const changed = Boolean(draft && saved && (templateSlug !== savedTemplateSlug || JSON.stringify(draft) !== JSON.stringify(saved)));

  const changeDraft = (next: StudioDraft) => {
    if (!draft || !canEdit || JSON.stringify(draft) === JSON.stringify(next)) return;
    setUndoStack((stack) => [...stack.slice(-19), { draft, slug: templateSlug }]);
    setRedoStack([]);
    setDraft(next);
    setNotice("");
    setError("");
  };

  const undo = () => {
    if (!draft || !undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, { draft, slug: templateSlug }]);
    setDraft(previous.draft);
    setTemplateSlug(previous.slug);
    setNotice("");
  };

  const redo = () => {
    if (!draft || !redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, { draft, slug: templateSlug }]);
    setDraft(next.draft);
    setTemplateSlug(next.slug);
    setNotice("");
  };

  const send = async (value: string) => {
    const message = value.trim();
    if (!workspace || !draft || busy || !canEdit || !message || message.length > 600) return;
    const history = messages.slice(-6);
    setPrompt("");
    setError("");
    setNotice("");
    setBusy(true);
    setMessages((items) => [...items, { role: "user", content: message }]);
    try {
      const response = await fetch("/api/site-studio", {
        method: "POST",
        headers: await studioHeaders(),
        body: JSON.stringify({
          organizationId: workspace.organization.id,
          templateSlug, draft, message, history,
        }),
      });
      const body = await response.json() as { error?: string; reply?: string; draft?: StudioDraft };
      if (!response.ok || !body.draft) throw new Error(body.error || "Asistentul nu a răspuns.");
      changeDraft(body.draft);
      setMessages((items) => [...items, { role: "assistant", content: body.reply || "Modificările sunt pregătite în preview." }]);
      setMobileTab("preview");
    } catch (sendError) {
      const text = sendError instanceof Error ? sendError.message : "Asistent indisponibil.";
      setError(text);
      setMessages((items) => [...items, { role: "assistant", content: "Nu am putut aplica cererea. Draft-ul existent a rămas neschimbat." }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(prompt);
  };

  const save = async () => {
    if (!workspace || !draft || saving || !canEdit) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/site-studio", {
        method: "PUT",
        headers: await studioHeaders(),
        body: JSON.stringify({ organizationId: workspace.organization.id, templateSlug, draft }),
      });
      const body = await response.json() as { draft?: StudioDraft; error?: string };
      if (!response.ok || !body.draft) throw new Error(body.error || "Salvarea nu a reușit.");
      setDraft(body.draft);
      setSaved(body.draft);
      setSavedTemplateSlug(templateSlug);
      setNotice("Draft salvat pentru organizația ta. Site-ul public nu a fost modificat.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Salvarea nu a reușit.");
    } finally {
      setSaving(false);
    }
  };

  const changeTemplate = (slug: TemplateSlug) => {
    if (!workspace || !canEdit) return;
    if (slug === templateSlug) return;
    changeDraft(studioSeed(slug, workspace.organization.name));
    setTemplateSlug(slug);
    setNotice("Template schimbat în preview. Salvează când ești mulțumit.");
  };

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#0c0d12] text-sm text-white/60">Pregătim Website Studio...</main>;
  }

  if (blocked || !draft || !workspace) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0c0d12] px-6 text-white">
        <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[.04] p-8">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#aaa4ff]">ORBYVEN · Website Studio</p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-.045em]">Personalizarea site-ului</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">{blocked || "Proiect indisponibil."}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/workspace/billing" className="rounded-full bg-white px-5 py-3 text-xs font-semibold text-black">Vezi abonamentul</Link>
            <Link href="/workspace" className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold">Înapoi la dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#0c0d12] font-sans text-[#f5f5f8]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-56 top-[-200px] h-[620px] w-[620px] rounded-full bg-[#5348e9]/[.14] blur-[130px]" />
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#101116]/85 px-4 py-4 backdrop-blur-xl md:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/workspace" aria-label="Înapoi la workspace"><BrandLogo compact theme="dark" /></Link>
          <span className="hidden h-6 w-px bg-white/12 sm:block" />
          <div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#a6a1ff]">Website Studio · Alpha</p>
            <h1 className="truncate text-sm font-semibold">{workspace.organization.name}</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-amber-400/20 bg-amber-400/[.08] px-3 py-2 text-[10px] font-semibold text-amber-200 sm:block">● Draft nepublicat</span>
          <button type="button" disabled={!changed || !canEdit || saving} onClick={() => void save()}
            className="min-h-10 rounded-full bg-[#eeeaff] px-5 text-xs font-semibold text-[#17142c] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? "Se salvează..." : changed ? "Salvează draft" : "Salvat"}
          </button>
        </div>
      </header>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3 md:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="studio-template" className="text-[10px] text-white/45">Model</label>
          <select id="studio-template" value={templateSlug} disabled={!canEdit}
            onChange={(event) => changeTemplate(event.target.value as TemplateSlug)}
            className="max-w-[190px] rounded-full border border-white/10 bg-[#20212a] px-3 py-2 text-[11px] outline-none disabled:opacity-50">
            {studioTemplateSlugs.map((slug) => <option key={slug} value={slug}>{clientTemplateCatalog[slug].title}</option>)}
          </select>
          <button type="button" onClick={undo} disabled={!undoStack.length || !canEdit} className="rounded-full border border-white/10 px-3 py-2 text-[11px] disabled:opacity-30" aria-label="Anulează modificarea">↶ Undo</button>
          <button type="button" onClick={redo} disabled={!redoStack.length || !canEdit} className="rounded-full border border-white/10 px-3 py-2 text-[11px] disabled:opacity-30" aria-label="Refă modificarea">↷ Redo</button>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[.035] p-1">
          {(["desktop", "tablet", "mobile"] as const).map((item) => (
            <button key={item} type="button" onClick={() => { setDevice(item); setMobileTab("preview"); }}
              aria-pressed={device === item} className={"rounded-full px-3 py-2 text-[10px] capitalize transition " + (device === item ? "bg-white text-black" : "text-white/50 hover:text-white")}>{item}</button>
          ))}
        </div>
      </div>

      {(error || notice) && <div role={error ? "alert" : "status"} className={"relative z-10 mx-4 mt-3 rounded-xl border px-4 py-3 text-xs md:mx-7 " + (error ? "border-rose-400/20 bg-rose-400/[.07] text-rose-200" : "border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200")}>{error || notice}</div>}

      <div className="relative z-10 mx-4 mt-3 grid grid-cols-2 gap-2 lg:hidden">
        {(["preview", "chat"] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setMobileTab(tab)}
            className={"rounded-xl px-4 py-3 text-xs font-semibold " + (mobileTab === tab ? "bg-[#dcd7ff] text-[#1e1947]" : "border border-white/10 text-white/60")}>{tab === "preview" ? "Live Preview" : "AI Chat"}</button>
        ))}
      </div>

      <div className="relative z-10 grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(300px,350px)_minmax(0,1fr)] lg:p-4">
        <aside className={"flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#171821]/90 shadow-[0_22px_60px_rgba(0,0,0,.18)] lg:h-[calc(100vh-177px)] lg:min-h-[650px] " + (mobileTab === "preview" ? "hidden lg:flex" : "flex")}>
          <div className="border-b border-white/[.08] px-5 py-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#9d96ff]">Assistant</p><h2 className="mt-2 text-xl font-semibold tracking-[-.04em]">Creează prin conversație.</h2></div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#5f53f2]/20 text-[#c1bbff]">✦</span></div>
            <p className="mt-3 text-xs leading-5 text-white/45">Spune ce îți dorești. Verifică în preview. Salvează numai când ești mulțumit.</p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
            {messages.map((message, index) => <div key={index} className={"flex " + (message.role === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-[93%] rounded-[19px] px-4 py-3 text-xs leading-6 " + (message.role === "user" ? "rounded-br-md bg-[#5f53f2] text-white" : "rounded-bl-md border border-white/10 bg-white/[.055] text-white/80")}>{message.content}</div>
            </div>)}
            {busy && <p className="text-xs text-[#b9b3ff]">✦ Pregătesc modificările pentru preview...</p>}
          </div>
          <div className="border-t border-white/10 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.13em] text-white/35">Încearcă o idee</p>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {examples.map((example, index) => <button key={example} type="button" disabled={busy || !canEdit} onClick={() => void send(example)}
                className="min-w-[145px] max-w-[180px] shrink-0 rounded-xl border border-white/10 bg-white/[.035] p-3 text-left text-[10px] leading-4 text-white/65 transition hover:bg-white/[.09] disabled:opacity-40">{index + 1 < 10 ? "0" : ""}{index + 1} · {example}</button>)}
            </div>
            <form onSubmit={onSubmit} className="rounded-[20px] border border-white/12 bg-[#23242e] p-2 focus-within:border-[#8c81ff]/60">
              <label htmlFor="studio-chat" className="sr-only">Descrie modificarea dorită</label>
              <textarea id="studio-chat" rows={3} maxLength={600} value={prompt} onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(prompt); } }}
                placeholder="Ex: Vreau un hero mai spectaculos, cu un titlu mai scurt..." disabled={busy || !canEdit}
                className="w-full resize-none bg-transparent px-3 py-2 text-xs leading-5 text-white outline-none placeholder:text-white/28 disabled:opacity-50" />
              <div className="flex items-center justify-between gap-3 pl-3"><span className="text-[10px] text-white/30">{prompt.length}/600</span><button type="submit" disabled={!prompt.trim() || busy || !canEdit} className="rounded-full bg-[#dcd7ff] px-5 py-2.5 text-[11px] font-bold text-[#201b4a] disabled:opacity-35">Trimite ↗</button></div>
            </form>
            {!canEdit && <p className="mt-3 text-xs text-amber-200/70">Poți vedea preview-ul, dar rolul tău nu permite editarea.</p>}
          </div>
        </aside>

        <section className={"min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#181922]/85 shadow-[0_22px_60px_rgba(0,0,0,.18)] lg:flex lg:h-[calc(100vh-177px)] lg:min-h-[650px] lg:flex-col " + (mobileTab === "chat" ? "hidden lg:flex" : "flex flex-col")}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#aaa4ff]">Live preview</p><h2 className="mt-1 text-sm font-semibold">Așa arată proiectul tău</h2></div>
            <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] text-white/55">● Preview · nu site-ul public</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[.08] px-5 py-3">
            <span className="mr-2 text-[10px] text-white/40">Palete rapide</span>
            {palettes.map((palette) => <button key={palette.name} type="button" disabled={!canEdit}
              onClick={() => changeDraft({ ...draft, ...palette })}
              className="flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-white/65 disabled:opacity-35">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.accent }} />{palette.name}
            </button>)}
          </div>
          <div className="flex min-h-[550px] flex-1 justify-center overflow-auto bg-[#252630] p-3 sm:p-6">
            <div className="w-full shrink-0 self-start overflow-hidden rounded-[18px] border border-black/20 bg-white shadow-[0_25px_100px_rgba(0,0,0,.22)] transition-[max-width] duration-300"
              style={{ maxWidth: device === "mobile" ? 390 : device === "tablet" ? 780 : 1440 }}>
              <div className="flex items-center gap-1.5 border-b border-black/10 bg-[#f3f3f5] px-4 py-3"><span className="h-2 w-2 rounded-full bg-[#ff6b6b]" /><span className="h-2 w-2 rounded-full bg-[#ffcf64]" /><span className="h-2 w-2 rounded-full bg-[#69c994]" /><span className="mx-auto max-w-[60%] truncate rounded-md bg-white px-5 py-1 text-[9px] text-black/35">{workspace.organization.slug}.orbyven.ro · preview</span></div>
              <StudioSitePreview draft={draft} templateSlug={templateSlug} mobile={device === "mobile"} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
            <span className="text-[10px] text-white/45">Modificările AI rămân draft până apeși Salvează.</span>
            <div className="flex items-center gap-2">
              {changed && <button type="button" onClick={() => { if (saved) { changeDraft(saved); setTemplateSlug(savedTemplateSlug); } }} className="rounded-full border border-white/15 px-4 py-2 text-[10px]">Revino la salvat</button>}
              <button type="button" disabled={!changed || !canEdit || saving} onClick={() => void save()} className="rounded-full bg-[#dcd7ff] px-5 py-2.5 text-[11px] font-semibold text-[#201b4a] disabled:opacity-35">{saving ? "Se salvează..." : "Salvează draft"}</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
