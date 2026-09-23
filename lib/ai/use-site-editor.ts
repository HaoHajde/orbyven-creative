"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SITE, SITE_PRESETS, applySitePatch, readSiteDraft, readableText,
  type EditableSite, type SitePresetId,
} from "@/lib/ai/site-editor";
import { getCurrentWorkspace, getWorkspaceEntryPath, type OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { SiteEditorMessage } from "@/components/ai/SiteEditorChat";

type AiStatus = "loading" | "ready" | "disabled";
type AiStatusResponse = { enabled?: boolean; reason?: string };

export function useSiteEditor() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<EditableSite[]>([DEFAULT_SITE]);
  const [messages, setMessages] = useState<SiteEditorMessage[]>([
    {role:"assistant", text:"Bun venit! Alege un model de site, apoi spune-mi ce vrei să schimb la text, layout sau culori."},
  ]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [aiStatus, setAiStatus] = useState<AiStatus>("loading");
  const [aiStatusReason, setAiStatusReason] = useState("");
  const site = history[history.length - 1];
  const allowed = workspace?.membership.role === "owner" || workspace?.membership.role === "admin";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const current = await getCurrentWorkspace();
        if (!current) { router.replace(await getWorkspaceEntryPath()); return; }
        if (cancelled) return;
        setWorkspace(current);
        if (current.membership.role !== "owner" && current.membership.role !== "admin") {
          setError("Doar Owner sau Admin poate personaliza site-ul."); setReady(true); return;
        }
        let loaded: EditableSite | null = null;
        try {
          const saved = window.localStorage.getItem("orbyven-site-editor:" + current.organization.id + ":" + current.user.id);
          loaded = saved ? readSiteDraft(JSON.parse(saved)) : null;
        } catch { /* ignore corrupt browser draft */ }
        setHistory([loaded ?? {...DEFAULT_SITE, brand:current.organization.name.slice(0,70) || DEFAULT_SITE.brand}]);
        setReady(true);

        // Readiness never exposes any secret or accepted organization identifiers.
        const {data} = await orbyvenSupabase.auth.getSession();
        if (!data.session?.access_token) {
          if (!cancelled) {setAiStatus("disabled"); setAiStatusReason("Sesiunea a expirat.");}
          return;
        }
        const response = await fetch("/api/ai/site-editor/status", {
          cache:"no-store",
          headers:{Authorization:"Bearer " + data.session.access_token},
        });
        const status = await response.json() as AiStatusResponse;
        if (!cancelled) {
          setAiStatus(response.ok && status.enabled ? "ready" : "disabled");
          setAiStatusReason(status.reason || "Chatul AI este în pregătire pentru pilot.");
        }
      } catch {
        if (!cancelled) {
          setAiStatus("disabled");
          setAiStatusReason("Starea AI nu poate fi verificată acum; editorul manual rămâne disponibil.");
          setReady(true);
        }
      }
    };
    void load();
    return () => {cancelled = true;};
  }, [router]);

  const changeDraft = (next: EditableSite) => {
    setHistory(current => {
      if (JSON.stringify(current[current.length - 1]) === JSON.stringify(next)) return current;
      return [...current.slice(-15), next];
    });
    setNotice("");
    setError("");
  };

  const onPatch = (patch: Partial<EditableSite>) => {
    const last = history[history.length - 1];
    // Preserve empty text during active manual editing. Save/send reject invalid drafts.
    const next = {...last, ...patch};
    if (patch.background && !patch.textColor) next.textColor = readableText(next.background);
    changeDraft(next);
  };

  const onSelectPreset = (preset: SitePresetId) => {
    if (!SITE_PRESETS[preset] || busy) return;
    changeDraft({...SITE_PRESETS[preset]});
    setNotice("Model încărcat în preview. Poți reveni cu Undo.");
  };

  const save = () => {
    if (!workspace || !allowed) return;
    const draft = readSiteDraft(site);
    if (!draft) {setError("Completează toate câmpurile înainte de salvare."); return;}
    try {
      window.localStorage.setItem(
        "orbyven-site-editor:" + workspace.organization.id + ":" + workspace.user.id,
        JSON.stringify(draft)
      );
      setNotice("Draft salvat în acest browser. Site-ul public nu a fost modificat.");
      setError("");
    } catch {setError("Draftul nu a putut fi salvat pe acest dispozitiv.");}
  };

  const undo = () => {
    setHistory(current => current.length > 1 ? current.slice(0,-1) : current);
    setNotice("Am revenit la modificarea precedentă.");
    setError("");
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace || !allowed || busy || aiStatus !== "ready" || prompt.trim().length < 4) return;
    const validDraft = readSiteDraft(site);
    if (!validDraft) {setError("Completează toate câmpurile înainte de a cere o modificare AI.");return;}
    const requestText = prompt.trim();
    setPrompt(""); setNotice(""); setError("");
    setMessages(current => [...current, {role:"user",text:requestText}]);
    setBusy(true);
    try {
      const {data} = await orbyvenSupabase.auth.getSession();
      if (!data.session?.access_token) throw Error("Sesiunea a expirat. Autentifică-te din nou.");
      const response = await fetch("/api/ai/site-editor", {
        method:"POST", cache:"no-store",
        headers:{Authorization:"Bearer " + data.session.access_token,"Content-Type":"application/json"},
        body:JSON.stringify({organizationId:workspace.organization.id,prompt:requestText,draft:validDraft}),
      });
      const result = await response.json() as {
        message?:string; draft?:EditableSite; error?:string; remainingToday?:number;
      };
      if (!response.ok || !result.draft) throw Error(result.error || "AI-ul este indisponibil.");
      const next = readSiteDraft(result.draft);
      if (!next) throw Error("Modificarea primită nu este validă.");
      changeDraft(next);
      setMessages(current => [...current,{role:"assistant",text:result.message || "Preview actualizat."}]);
      if (typeof result.remainingToday === "number") {
        setNotice("Mai ai " + result.remainingToday + " cereri AI disponibile astăzi pentru firmă (UTC).");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Nu am putut procesa cererea.";
      setError(message);
      setMessages(current => [...current,{role:"assistant",text:message}]);
    } finally {setBusy(false);}
  };

  return {
    workspace, ready, allowed, error, notice, history, messages, prompt, setPrompt,
    busy, view, setView, site, save, undo, send, onPatch, onSelectPreset, aiStatus, aiStatusReason,
  };
}
