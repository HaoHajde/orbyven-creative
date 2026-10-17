"use client";

import { useMemo, useState } from "react";

import type { InvitationProjectType } from "@/lib/invitations/contracts";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type SeatingTable = {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
};

type SeatingRsvp = {
  id: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  tableId: string | null;
};

type Props = {
  organizationId: string;
  projectType: InvitationProjectType;
  tables: SeatingTable[];
  rsvps: SeatingRsvp[];
  canEdit: boolean;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
};

async function accessToken() {
  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sesiunea a expirat.");
  return data.session.access_token;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function InvitationSeatingControl({
  organizationId,
  projectType,
  tables,
  rsvps,
  canEdit,
  onRefresh,
  onError,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState(10);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState(10);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const attending = useMemo(() => rsvps.filter((item) => item.attending), [rsvps]);
  const tableStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of attending) {
      if (item.tableId) map.set(item.tableId, (map.get(item.tableId) ?? 0) + item.guestCount);
    }
    return map;
  }, [attending]);
  const unassignedGuests = attending.reduce(
    (sum, item) => sum + (item.tableId ? 0 : item.guestCount),
    0
  );

  const mutateTable = async (
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    busyKey: string
  ) => {
    setBusy(busyKey);
    try {
      const token = await accessToken();
      const response = await fetch("/api/invitations/tables", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId, projectType, ...body }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Mesele nu au putut fi actualizate.");
      await onRefresh();
      return true;
    } catch (error) {
      onError(error instanceof Error ? error.message : "Mesele nu au putut fi actualizate.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const addTable = async () => {
    const name = newName.trim();
    if (!name || name.length > 60 || newCapacity < 1 || newCapacity > 30) {
      onError("Verifică numele și capacitatea mesei.");
      return;
    }
    if (await mutateTable("POST", { name, capacity: newCapacity }, "new")) {
      setNewName("");
      setNewCapacity(10);
    }
  };

  const beginEdit = (table: SeatingTable) => {
    setDeleteConfirmId(null);
    setEditingId(table.id);
    setEditName(table.name);
    setEditCapacity(table.capacity);
  };

  const saveTable = async (tableId: string) => {
    const name = editName.trim();
    if (!name || name.length > 60 || editCapacity < 1 || editCapacity > 30) {
      onError("Verifică numele și capacitatea mesei.");
      return;
    }
    if (await mutateTable("PATCH", { tableId, name, capacity: editCapacity }, tableId)) {
      setEditingId(null);
    }
  };

  const removeTable = async (tableId: string) => {
    if (await mutateTable("DELETE", { tableId }, tableId)) {
      setDeleteConfirmId(null);
      if (editingId === tableId) setEditingId(null);
    }
  };

  const assignTable = async (item: SeatingRsvp, tableId: string | null) => {
    if (!canEdit || busy) return;
    setBusy(`rsvp:${item.id}`);
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
          rsvpId: item.id,
          guestName: item.guestName,
          attending: item.attending,
          guestCount: item.guestCount,
          message: item.message ?? "",
          tableId,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Masa nu a putut fi atribuită.");
      await onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Masa nu a putut fi atribuită.");
    } finally {
      setBusy(null);
    }
  };

  const printSeating = () => {
    if (!attending.length) return;
    const sections = tables.map((table) => {
      const assigned = attending.filter((item) => item.tableId === table.id);
      const total = assigned.reduce((sum, item) => sum + item.guestCount, 0);
      const guests = assigned.length
        ? assigned.map((item) => `<li><span>${escapeHtml(item.guestName)}</span><strong>${item.guestCount} pers.</strong></li>`).join("")
        : '<li class="empty">Niciun invitat atribuit.</li>';
      return `<section class="page"><div class="eyebrow">ORBYVEN · ARANJAMENT MESE</div><h1>${escapeHtml(table.name)}</h1><p class="count">${total} / ${table.capacity} persoane</p><ul>${guests}</ul></section>`;
    });
    const unassigned = attending.filter((item) => !item.tableId);
    if (unassigned.length) {
      sections.push(`<section class="page"><div class="eyebrow">ORBYVEN · ARANJAMENT MESE</div><h1>Neatribuiți</h1><p class="count">${unassignedGuests} persoane</p><ul>${unassigned.map((item) => `<li><span>${escapeHtml(item.guestName)}</span><strong>${item.guestCount} pers.</strong></li>`).join("")}</ul></section>`);
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onError("Browserul a blocat fereastra de tipărire.");
      return;
    }
    printWindow.opener = null;
    printWindow.document.write(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Aranjament mese</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#171717}.page{min-height:250mm;page-break-after:always;padding:8mm}.page:last-child{page-break-after:auto}.eyebrow{font-size:10px;letter-spacing:.18em;color:#777}h1{font-size:32px;margin:16px 0 4px}.count{margin:0 0 26px;color:#666}ul{list-style:none;padding:0;margin:0}li{display:flex;justify-content:space-between;gap:24px;padding:14px 0;border-bottom:1px solid #ddd;font-size:15px}.empty{color:#888}strong{white-space:nowrap}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body>${sections.join("")}<script>window.addEventListener('load',()=>window.print());<\/script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold text-white/65">Mese · {tables.length}</p>
          <p className="mt-0.5 text-[8px] text-white/28">{unassignedGuests} persoane neatribuite</p>
        </div>
        <button
          type="button"
          onClick={printSeating}
          disabled={!attending.length}
          className="h-8 rounded-[9px] border border-white/[0.07] px-2.5 text-[8px] font-semibold text-white/55 disabled:opacity-30"
        >
          Tipărește / PDF
        </button>
      </div>

      {canEdit ? (
        <div className="mt-3 grid grid-cols-[1fr_64px_64px] gap-1.5">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={60}
            placeholder="Masă nouă"
            className="h-8 min-w-0 rounded-[8px] border border-white/[0.08] bg-white/[0.035] px-2.5 text-[8px] text-white outline-none placeholder:text-white/25 focus:border-[#9f8dff]/60"
          />
          <input
            type="number"
            min={1}
            max={30}
            value={newCapacity}
            onChange={(event) => setNewCapacity(Number(event.target.value))}
            aria-label="Capacitate masă"
            className="h-8 rounded-[8px] border border-white/[0.08] bg-white/[0.035] px-2 text-center text-[8px] text-white outline-none"
          />
          <button
            type="button"
            onClick={() => void addTable()}
            disabled={busy === "new"}
            className="h-8 rounded-[8px] bg-[#9f8dff] text-[8px] font-semibold text-white disabled:opacity-40"
          >
            {busy === "new" ? "…" : "Adaugă"}
          </button>
        </div>
      ) : null}

      <div className="mt-3 space-y-1.5">
        {tables.map((table) => {
          const used = tableStats.get(table.id) ?? 0;
          const over = used > table.capacity;
          return (
            <div key={table.id} className="rounded-[9px] bg-white/[0.03] px-2.5 py-2">
              {editingId === table.id ? (
                <div className="grid grid-cols-[1fr_56px] gap-1.5">
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={60} className="h-8 min-w-0 rounded-[8px] border border-white/[0.08] bg-black/20 px-2 text-[8px] text-white outline-none" />
                  <input type="number" min={1} max={30} value={editCapacity} onChange={(event) => setEditCapacity(Number(event.target.value))} className="h-8 rounded-[8px] border border-white/[0.08] bg-black/20 px-2 text-center text-[8px] text-white outline-none" />
                  <button type="button" onClick={() => setEditingId(null)} className="h-7 rounded-[7px] text-[8px] text-white/35">Anulează</button>
                  <button type="button" onClick={() => void saveTable(table.id)} disabled={busy === table.id} className="h-7 rounded-[7px] bg-white/[0.08] text-[8px] font-semibold text-white/70 disabled:opacity-40">Salvează</button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block truncate text-[9px] font-semibold text-white/70">{table.name}</span>
                    <span className={`text-[8px] ${over ? "text-amber-300" : "text-white/28"}`}>{used} / {table.capacity} persoane{over ? " · depășită" : ""}</span>
                  </div>
                  {canEdit ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" onClick={() => beginEdit(table)} className="text-[8px] font-semibold text-[#bdb2ff]">Editează</button>
                      {deleteConfirmId === table.id ? (
                        <button type="button" onClick={() => void removeTable(table.id)} disabled={busy === table.id} className="text-[8px] font-semibold text-red-300 disabled:opacity-40">Confirmă</button>
                      ) : (
                        <button type="button" onClick={() => setDeleteConfirmId(table.id)} className="text-[8px] text-red-300/65">Șterge</button>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
        {!tables.length ? <p className="py-2 text-center text-[8px] text-white/28">Adaugă prima masă pentru a începe aranjarea.</p> : null}
      </div>

      {attending.length ? (
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/30">Așezare invitați</p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {attending.map((item) => (
              <label key={item.id} className="grid grid-cols-[1fr_120px] items-center gap-2 rounded-[8px] bg-white/[0.025] px-2.5 py-2">
                <span className="min-w-0 truncate text-[8px] text-white/60">{item.guestName} · {item.guestCount}</span>
                <select
                  value={item.tableId ?? ""}
                  onChange={(event) => void assignTable(item, event.target.value || null)}
                  disabled={!canEdit || busy === `rsvp:${item.id}`}
                  className="h-7 min-w-0 rounded-[7px] border border-white/[0.07] bg-[#171421] px-2 text-[8px] text-white/65 outline-none disabled:opacity-40"
                >
                  <option value="">Neatribuit</option>
                  {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
