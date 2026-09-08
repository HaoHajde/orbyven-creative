"use client";

import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  listWorkspaceAccessMembers,
  updateTeamMember,
  type TeamMember,
  type TeamMemberStatus,
  type WorkspaceAccessMember,
} from "@/lib/modules/team";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { Field, ModuleEmpty, ModuleError, ModuleHeader, ModuleMetric, moduleInputClass } from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  role: OrbyvenWorkspace["membership"]["role"];
};

type FormState = {
  displayName: string;
  jobTitle: string;
  contactEmail: string;
  phone: string;
  status: TeamMemberStatus;
  notes: string;
  linkedUserId: string;
};

type EditDraft = {
  memberId: string;
  value: FormState;
};

const emptyForm: FormState = {
  displayName: "",
  jobTitle: "",
  contactEmail: "",
  phone: "",
  status: "active",
  notes: "",
  linkedUserId: "",
};

const roleLabels: Record<WorkspaceAccessMember["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

function formFromMember(member: TeamMember | null): FormState {
  if (!member) return emptyForm;
  return {
    displayName: member.display_name,
    jobTitle: member.job_title || "",
    contactEmail: member.email || "",
    phone: member.phone || "",
    status: member.status,
    notes: member.notes || "",
    linkedUserId: member.linked_user_id || "",
  };
}

export default function TeamModule({ organizationId, role }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [accessMembers, setAccessMembers] = useState<WorkspaceAccessMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextMembers, nextAccess] = await Promise.all([
        listTeamMembers(organizationId),
        listWorkspaceAccessMembers(organizationId),
      ]);
      setMembers(nextMembers);
      setAccessMembers(nextAccess);
      setSelectedId((current) =>
        current && nextMembers.some((item) => item.id === current)
          ? current
          : nextMembers[0]?.id ?? null
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Echipa nu a putut fi încărcată.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selected = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId]
  );

  const baseEditForm = useMemo(() => formFromMember(selected), [selected]);
  const editForm =
    selected && editDraft?.memberId === selected.id ? editDraft.value : baseEditForm;

  const updateEditForm = useCallback(
    (updater: (current: FormState) => FormState) => {
      if (!selected) return;
      setEditDraft((current) => {
        const base = current?.memberId === selected.id ? current.value : formFromMember(selected);
        return { memberId: selected.id, value: updater(base) };
      });
    },
    [selected]
  );

  const accessById = useMemo(() => new Map(accessMembers.map((item) => [item.user_id, item])), [accessMembers]);
  const linkedIds = useMemo(() => new Set(members.map((member) => member.linked_user_id).filter(Boolean)), [members]);
  const activeCount = members.filter((member) => member.status === "active").length;
  const linkedCount = members.filter((member) => member.linked_user_id).length;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createTeamMember(organizationId, {
        displayName: form.displayName,
        jobTitle: form.jobTitle,
        contactEmail: form.contactEmail,
        phone: form.phone,
        status: form.status,
        notes: form.notes,
        linkedUserId: form.linkedUserId || null,
      });
      setMembers((current) => [...current, created].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setSelectedId(created.id);
      setEditDraft(null);
      setForm(emptyForm);
      setCreateOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Membrul nu a putut fi adăugat.");
    } finally {
      setSaving(false);
    }
  };

  const saveSelected = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateTeamMember(organizationId, selected.id, {
        displayName: editForm.displayName,
        jobTitle: editForm.jobTitle,
        contactEmail: editForm.contactEmail,
        phone: editForm.phone,
        status: editForm.status,
        notes: editForm.notes,
        linkedUserId: editForm.linkedUserId || null,
      });
      setMembers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditDraft(null);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Datele membrului nu au putut fi salvate.");
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!selected || !canDelete || saving || !window.confirm(`Ștergi ${selected.display_name} din echipa operațională?`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteTeamMember(organizationId, selected.id);
      const next = members.filter((item) => item.id !== selected.id);
      setMembers(next);
      setSelectedId(next[0]?.id ?? null);
      setEditDraft(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Membrul nu a putut fi șters.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pb-24 text-sm text-[var(--muted)]">Se încarcă echipa…</div>;

  return (
    <div className="pb-24 md:pb-8">
      <ModuleHeader
        eyebrow="People · Echipă"
        title="Echipă"
        description="Oamenii care lucrează efectiv în business, inclusiv cei din teren. Conturile și rolurile de acces rămân controlate separat de ORBYVEN Core."
        action={canWrite ? (
          <button type="button" onClick={() => setCreateOpen((current) => !current)} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
            {createOpen ? "Închide" : "+ Membru"}
          </button>
        ) : null}
      />

      <div className="mt-8"><ModuleError message={error} /></div>

      <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModuleMetric label="Echipă activă" value={String(activeCount)} note="oameni operaționali" />
        <ModuleMetric label="Total" value={String(members.length)} note="activi + inactivi" />
        <ModuleMetric label="Conturi legate" value={String(linkedCount)} note="au acces în workspace" />
        <ModuleMetric label="Acces platformă" value={String(accessMembers.length)} note="gestionat de Core" />
      </section>

      {createOpen && canWrite ? (
        <form onSubmit={handleCreate} className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nume *"><input value={form.displayName} onChange={(e) => setForm((c) => ({ ...c, displayName: e.target.value }))} className={moduleInputClass} placeholder="Nume și prenume" /></Field>
            <Field label="Rol în firmă"><input value={form.jobTitle} onChange={(e) => setForm((c) => ({ ...c, jobTitle: e.target.value }))} className={moduleInputClass} placeholder="Instalator, coordonator…" /></Field>
            <Field label="Telefon"><input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className={moduleInputClass} placeholder="07…" /></Field>
            <Field label="Email contact"><input type="email" value={form.contactEmail} onChange={(e) => setForm((c) => ({ ...c, contactEmail: e.target.value }))} className={moduleInputClass} placeholder="nume@firma.ro" /></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as TeamMemberStatus }))} className={moduleInputClass}><option value="active">Activ</option><option value="inactive">Inactiv</option></select></Field>
            <Field label="Leagă de cont ORBYVEN">
              <select value={form.linkedUserId} onChange={(e) => setForm((c) => ({ ...c, linkedUserId: e.target.value }))} className={moduleInputClass}>
                <option value="">Fără cont legat</option>
                {accessMembers.filter((item) => !linkedIds.has(item.user_id)).map((item) => <option key={item.user_id} value={item.user_id}>{roleLabels[item.role]} · {item.user_id.slice(0, 8)}… · {item.access_status}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Note" className="mt-4"><textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} className={`${moduleInputClass} min-h-20 resize-y`} placeholder="Responsabilități, zonă, observații…" /></Field>
          <div className="mt-5 flex justify-end"><button disabled={saving} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Adaugă în echipă"}</button></div>
        </form>
      ) : null}

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <h2 className="mb-4 font-semibold">Oameni</h2>
          {members.length ? (
            <div className="space-y-2">
              {members.map((member) => {
                const access = member.linked_user_id ? accessById.get(member.linked_user_id) : null;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(member.id);
                      setEditDraft(null);
                    }}
                    className={`w-full rounded-[18px] border p-4 text-left ${selectedId === member.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--bg)]"}`}
                  >
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{member.display_name}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{member.job_title || "Rol nespecificat"}{access ? ` · ${roleLabels[access.role]} access` : ""}</p></div><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${member.status === "active" ? "bg-emerald-500" : "bg-[var(--muted-2)]"}`} /></div>
                  </button>
                );
              })}
            </div>
          ) : <ModuleEmpty title="Echipa este goală" description="Adaugă oamenii care trebuie să apară în fluxul operațional, chiar dacă nu au cont în platformă." />}
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
          {selected ? (
            <form onSubmit={saveSelected}>
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Profil operațional</p><h2 className="mt-3 text-[30px] font-semibold tracking-[-0.045em]">{selected.display_name}</h2></div>{selected.linked_user_id ? <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-semibold text-[var(--accent)]">Cont legat</span> : null}</div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nume"><input disabled={!canWrite} value={editForm.displayName} onChange={(e) => updateEditForm((c) => ({ ...c, displayName: e.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Rol în firmă"><input disabled={!canWrite} value={editForm.jobTitle} onChange={(e) => updateEditForm((c) => ({ ...c, jobTitle: e.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Telefon"><input disabled={!canWrite} value={editForm.phone} onChange={(e) => updateEditForm((c) => ({ ...c, phone: e.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Email contact"><input disabled={!canWrite} type="email" value={editForm.contactEmail} onChange={(e) => updateEditForm((c) => ({ ...c, contactEmail: e.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Status"><select disabled={!canWrite} value={editForm.status} onChange={(e) => updateEditForm((c) => ({ ...c, status: e.target.value as TeamMemberStatus }))} className={moduleInputClass}><option value="active">Activ</option><option value="inactive">Inactiv</option></select></Field>
                <Field label="Cont ORBYVEN">
                  <select disabled={!canWrite} value={editForm.linkedUserId} onChange={(e) => updateEditForm((c) => ({ ...c, linkedUserId: e.target.value }))} className={moduleInputClass}>
                    <option value="">Fără cont legat</option>
                    {accessMembers.filter((item) => item.user_id === selected.linked_user_id || !linkedIds.has(item.user_id)).map((item) => <option key={item.user_id} value={item.user_id}>{roleLabels[item.role]} · {item.user_id.slice(0, 8)}… · {item.access_status}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Note" className="mt-4"><textarea disabled={!canWrite} value={editForm.notes} onChange={(e) => updateEditForm((c) => ({ ...c, notes: e.target.value }))} className={`${moduleInputClass} min-h-24 resize-y`} /></Field>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {canDelete ? <button type="button" disabled={saving} onClick={() => void removeSelected()} className="h-11 rounded-full px-5 text-xs font-semibold text-red-500 disabled:opacity-40">Șterge profilul</button> : null}
                {canWrite ? <button disabled={saving} className="h-11 rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Salvează"}</button> : null}
              </div>
              <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted)]">Rolul de acces Owner/Admin/Manager/Member/Viewer și suspendarea contului nu se schimbă aici; acestea rămân în Platform Core.</p>
            </form>
          ) : <ModuleEmpty title="Selectează un membru" description="Profilul operațional și legătura cu un cont ORBYVEN apar aici." />}
        </div>
      </section>
    </div>
  );
}
