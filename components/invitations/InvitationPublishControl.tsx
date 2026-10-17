"use client";

import { useEffect, useMemo, useState } from "react";

import type { EditableSite } from "@/lib/ai/site-editor";
import type { InvitationProjectType } from "@/lib/invitations/contracts";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type AdminProject = {
  id: string;
  projectType: InvitationProjectType;
  slug: string;
  title: string;
  publishedAt: string;
  publicPath: string;
};

type Rsvp = {
  id: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  createdAt: string;
};

type State = {
  project: AdminProject | null;
  rsvps: Rsvp[];
  error?: string;
};

type Props = {
  organizationId: string;
  projectType: InvitationProjectType;
  draft: EditableSite;
  canEdit: boolean;
};

async function accessToken() {
  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sesiunea a expirat.");
  return data.session.access_token;
}

export default function InvitationPublishControl({
  organizationId,
  projectType,
  draft,
  canEdit,
}: Props) {
  const [state, setState] = useState<State>({ project: null, rsvps: [] });
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const attendingGuests = useMemo(
    () => state.rsvps.reduce((sum, item) => sum + (item.attending ? item.guestCount : 0), 0),
    [state.rsvps]
  );
  const attendingResponses = useMemo(
    () => state.rsvps.filter((item) => item.attending).length,
    [state.rsvps]
  );
  const declinedResponses = state.rsvps.length - attendingResponses;

  const load = async () => {
    setLoading(true);
    try {
      const token = await accessToken();
      const response = await fetch(
        `/api/invitations/projects?organizationId=${encodeURIComponent(organizationId)}&projectType=${encodeURIComponent(projectType)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const body = (await response.json()) as State;
      if (!response.ok) throw new Error(body.error || "Statusul invitației nu este disponibil.");
      setState({ project: body.project ?? null, rsvps: body.rsvps ?? [] });
    } catch (error) {
      setState({
        project: null,
        rsvps: [],
        error: error instanceof Error ? error.message : "Status indisponibil.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Reload only when the tenant/project identity changes, not after every AI draft keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, projectType]);

  const publish = async () => {
    if (!canEdit || publishing) return;
    setPublishing(true);
    setCopied(false);
    try {
      const token = await accessToken();
      const response = await fetch("/api/invitations/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId, projectType, draft }),
      });
      const body = (await response.json()) as State;
      if (!response.ok) throw new Error(body.error || "Invitația nu a putut fi publicată.");
      setState({ project: body.project ?? null, rsvps: body.rsvps ?? [] });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Publicarea a eșuat.",
      }));
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    if (!state.project) return;
    const url = `${window.location.origin}${state.project.publicPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-4 border-t border-white/[0.07] pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#9f8dff]">Invitație live</p>
          <p className="mt-1 text-[10px] text-white/42">
            {loading ? "Verific…" : state.project ? "Publicată · RSVP activ" : "Nepublicată"}
          </p>
        </div>
        {state.project ? (
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.7)]" />
        ) : null}
      </div>

      <button
        type="button"
        onClick={publish}
        disabled={!canEdit || publishing || loading}
        className="mt-3 h-10 w-full rounded-[12px] bg-[#9f8dff] px-3 text-[10px] font-semibold text-white transition hover:-translate-y-px disabled:opacity-35 disabled:hover:translate-y-0"
      >
        {publishing ? "Public…" : state.project ? "Actualizează invitația" : "Publică invitația"}
      </button>

      {state.project ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <a
            href={state.project.publicPath}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center justify-center rounded-[10px] border border-white/[0.08] text-[9px] font-semibold text-white/65 hover:bg-white/[0.05]"
          >
            Deschide
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="h-9 rounded-[10px] border border-white/[0.08] text-[9px] font-semibold text-white/65 hover:bg-white/[0.05]"
          >
            {copied ? "Copiat" : "Copiază link"}
          </button>
        </div>
      ) : null}

      {state.project ? (
        <div className="mt-3 rounded-[12px] border border-white/[0.07] bg-black/15 p-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="text-[9px] font-semibold text-white/65">RSVP · {state.rsvps.length} răspunsuri</span>
            <span className="text-[9px] text-white/30">{expanded ? "Ascunde" : "Vezi"}</span>
          </button>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <div className="rounded-[9px] bg-white/[0.035] px-2 py-2">
              <strong className="block text-[11px]">{attendingGuests}</strong>
              <span className="text-[8px] text-white/35">persoane</span>
            </div>
            <div className="rounded-[9px] bg-white/[0.035] px-2 py-2">
              <strong className="block text-[11px]">{attendingResponses}</strong>
              <span className="text-[8px] text-white/35">participă</span>
            </div>
            <div className="rounded-[9px] bg-white/[0.035] px-2 py-2">
              <strong className="block text-[11px]">{declinedResponses}</strong>
              <span className="text-[8px] text-white/35">nu vin</span>
            </div>
          </div>

          {expanded ? (
            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto border-t border-white/[0.06] pt-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => void load()} className="text-[8px] font-semibold text-[#bdb2ff]">Reîncarcă</button>
              </div>
              {state.rsvps.length ? state.rsvps.slice(0, 30).map((item) => (
                <article key={item.id} className="rounded-[9px] bg-white/[0.035] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[9px] font-semibold text-white/75">{item.guestName}</span>
                    <span className={`shrink-0 text-[8px] font-semibold ${item.attending ? "text-emerald-300" : "text-white/35"}`}>
                      {item.attending ? `${item.guestCount} pers.` : "Nu participă"}
                    </span>
                  </div>
                  {item.message ? <p className="mt-1 line-clamp-2 text-[8px] leading-4 text-white/35">{item.message}</p> : null}
                </article>
              )) : (
                <p className="py-3 text-center text-[9px] text-white/30">Niciun răspuns încă.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {state.error ? <p className="mt-2 text-[8px] leading-4 text-red-300/80">{state.error}</p> : null}
    </section>
  );
}
