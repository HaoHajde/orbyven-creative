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
  updatedAt: string;
};

type State = {
  project: AdminProject | null;
  rsvps: Rsvp[];
  error?: string;
};

type Filter = "all" | "attending" | "declined";

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

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function shortDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("ro-RO");
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState("");
  const [editAttending, setEditAttending] = useState(true);
  const [editGuestCount, setEditGuestCount] = useState(1);
  const [editMessage, setEditMessage] = useState("");

  const attendingGuests = useMemo(
    () => state.rsvps.reduce((sum, item) => sum + (item.attending ? item.guestCount : 0), 0),
    [state.rsvps]
  );
  const attendingResponses = useMemo(
    () => state.rsvps.filter((item) => item.attending).length,
    [state.rsvps]
  );
  const declinedResponses = state.rsvps.length - attendingResponses;
  const visibleRsvps = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ro-RO");
    return state.rsvps.filter((item) => {
      if (filter === "attending" && !item.attending) return false;
      if (filter === "declined" && item.attending) return false;
      if (!needle) return true;
      return `${item.guestName} ${item.message ?? ""}`.toLocaleLowerCase("ro-RO").includes(needle);
    });
  }, [filter, query, state.rsvps]);

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

  const beginEdit = (item: Rsvp) => {
    setDeleteConfirmId(null);
    setEditingId(item.id);
    setEditGuestName(item.guestName);
    setEditAttending(item.attending);
    setEditGuestCount(item.attending ? Math.max(1, item.guestCount) : 1);
    setEditMessage(item.message ?? "");
  };

  const saveEdit = async (rsvpId: string) => {
    const guestName = editGuestName.trim();
    const message = editMessage.trim();
    if (guestName.length < 2 || guestName.length > 120 || message.length > 700) {
      setState((current) => ({ ...current, error: "Verifică numele și mesajul RSVP." }));
      return;
    }
    setSavingId(rsvpId);
    try {
      const token = await accessToken();
      const response = await fetch("/api/invitations/rsvps", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          projectType,
          rsvpId,
          guestName,
          attending: editAttending,
          guestCount: editAttending ? Math.min(12, Math.max(1, editGuestCount)) : 0,
          message,
        }),
      });
      const body = (await response.json()) as { rsvp?: Rsvp; error?: string };
      if (!response.ok || !body.rsvp) throw new Error(body.error || "Răspunsul nu a putut fi salvat.");
      setState((current) => ({
        ...current,
        error: undefined,
        rsvps: current.rsvps.map((item) => (item.id === rsvpId ? body.rsvp as Rsvp : item)),
      }));
      setEditingId(null);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Salvarea a eșuat.",
      }));
    } finally {
      setSavingId(null);
    }
  };

  const removeRsvp = async (rsvpId: string) => {
    setDeletingId(rsvpId);
    try {
      const token = await accessToken();
      const response = await fetch("/api/invitations/rsvps", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId, projectType, rsvpId }),
      });
      const body = (await response.json()) as { deletedId?: string; error?: string };
      if (!response.ok || body.deletedId !== rsvpId) throw new Error(body.error || "Răspunsul nu a putut fi șters.");
      setState((current) => ({
        ...current,
        error: undefined,
        rsvps: current.rsvps.filter((item) => item.id !== rsvpId),
      }));
      setDeleteConfirmId(null);
      if (editingId === rsvpId) setEditingId(null);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Ștergerea a eșuat.",
      }));
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    if (!visibleRsvps.length) return;
    const rows = [
      ["Nume", "Participă", "Persoane", "Mesaj", "Trimis", "Actualizat"],
      ...visibleRsvps.map((item) => [
        item.guestName,
        item.attending ? "Da" : "Nu",
        item.attending ? item.guestCount : 0,
        item.message ?? "",
        shortDate(item.createdAt),
        shortDate(item.updatedAt),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => csvCell(value)).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rsvp-${projectType}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Caută invitat"
                className="h-9 w-full rounded-[10px] border border-white/[0.08] bg-white/[0.035] px-3 text-[9px] text-white outline-none placeholder:text-white/25 focus:border-[#9f8dff]/60"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(["all", "attending", "declined"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`h-7 rounded-[9px] px-2.5 text-[8px] font-semibold ${
                      filter === value ? "bg-white/[0.1] text-white" : "bg-white/[0.035] text-white/38"
                    }`}
                  >
                    {value === "all" ? "Toate" : value === "attending" ? "Participă" : "Nu vin"}
                  </button>
                ))}
                <span className="ml-auto text-[8px] text-white/28">{visibleRsvps.length}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!visibleRsvps.length}
                  className="h-8 rounded-[9px] border border-white/[0.07] text-[8px] font-semibold text-white/55 disabled:opacity-30"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="h-8 rounded-[9px] border border-white/[0.07] text-[8px] font-semibold text-[#bdb2ff]"
                >
                  Reîncarcă
                </button>
              </div>

              <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                {visibleRsvps.length ? visibleRsvps.map((item) => (
                  <article key={item.id} className="rounded-[10px] bg-white/[0.035] px-2.5 py-2.5">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          value={editGuestName}
                          onChange={(event) => setEditGuestName(event.target.value)}
                          maxLength={120}
                          className="h-8 w-full rounded-[8px] border border-white/[0.08] bg-black/20 px-2.5 text-[9px] text-white outline-none focus:border-[#9f8dff]/60"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditAttending(true)}
                            className={`h-8 rounded-[8px] text-[8px] font-semibold ${editAttending ? "bg-emerald-400/15 text-emerald-200" : "bg-white/[0.035] text-white/35"}`}
                          >
                            Participă
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditAttending(false)}
                            className={`h-8 rounded-[8px] text-[8px] font-semibold ${!editAttending ? "bg-white/[0.1] text-white/75" : "bg-white/[0.035] text-white/35"}`}
                          >
                            Nu participă
                          </button>
                        </div>
                        {editAttending ? (
                          <label className="flex items-center justify-between gap-3 text-[8px] text-white/40">
                            Persoane
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={editGuestCount}
                              onChange={(event) => setEditGuestCount(Number(event.target.value))}
                              className="h-8 w-16 rounded-[8px] border border-white/[0.08] bg-black/20 px-2 text-center text-[9px] text-white outline-none"
                            />
                          </label>
                        ) : null}
                        <textarea
                          value={editMessage}
                          onChange={(event) => setEditMessage(event.target.value)}
                          maxLength={700}
                          rows={2}
                          placeholder="Mesaj"
                          className="w-full resize-none rounded-[8px] border border-white/[0.08] bg-black/20 px-2.5 py-2 text-[8px] leading-4 text-white outline-none placeholder:text-white/25 focus:border-[#9f8dff]/60"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="h-8 rounded-[8px] border border-white/[0.07] text-[8px] font-semibold text-white/45"
                          >
                            Anulează
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveEdit(item.id)}
                            disabled={savingId === item.id}
                            className="h-8 rounded-[8px] bg-[#9f8dff] text-[8px] font-semibold text-white disabled:opacity-45"
                          >
                            {savingId === item.id ? "Salvez…" : "Salvează"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block truncate text-[9px] font-semibold text-white/78">{item.guestName}</span>
                            <span className="mt-0.5 block text-[7px] text-white/25">{shortDate(item.createdAt)}</span>
                          </div>
                          <span className={`shrink-0 text-[8px] font-semibold ${item.attending ? "text-emerald-300" : "text-white/35"}`}>
                            {item.attending ? `${item.guestCount} pers.` : "Nu participă"}
                          </span>
                        </div>
                        {item.message ? <p className="mt-1.5 line-clamp-2 text-[8px] leading-4 text-white/35">{item.message}</p> : null}
                        {canEdit ? (
                          <div className="mt-2 flex items-center justify-end gap-2 border-t border-white/[0.05] pt-2">
                            <button type="button" onClick={() => beginEdit(item)} className="text-[8px] font-semibold text-[#bdb2ff]">Editează</button>
                            {deleteConfirmId === item.id ? (
                              <>
                                <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-[8px] text-white/35">Anulează</button>
                                <button
                                  type="button"
                                  onClick={() => void removeRsvp(item.id)}
                                  disabled={deletingId === item.id}
                                  className="text-[8px] font-semibold text-red-300 disabled:opacity-40"
                                >
                                  {deletingId === item.id ? "Șterg…" : "Confirmă"}
                                </button>
                              </>
                            ) : (
                              <button type="button" onClick={() => setDeleteConfirmId(item.id)} className="text-[8px] text-red-300/70">Șterge</button>
                            )}
                          </div>
                        ) : null}
                      </>
                    )}
                  </article>
                )) : (
                  <p className="py-4 text-center text-[9px] text-white/30">
                    {state.rsvps.length ? "Niciun rezultat." : "Niciun răspuns încă."}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {state.error ? <p className="mt-2 text-[8px] leading-4 text-red-300/80">{state.error}</p> : null}
    </section>
  );
}
