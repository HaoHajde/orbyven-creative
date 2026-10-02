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
import {
  createOperationalResource,
  createResourceUnavailability,
  deleteResourceUnavailability,
  listOperationalResources,
  listResourceUnavailability,
  updateOperationalResource,
  type OperationalResource,
  type ResourceUnavailability,
} from "@/lib/modules/resources";
import { RESOURCE_TYPE_LABELS, type OperationalResourceType } from "@/lib/modules/resource-core";
import { Field, ModuleAdvancedFields, ModuleEmpty, ModuleError, ModuleHeader, ModuleMetric, ModuleProgressiveMetrics, moduleInputClass } from "@/components/modules/ModuleKit";
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

type ResourceForm = {
  name: string;
  resourceType: Exclude<OperationalResourceType, "person">;
  code: string;
  capacity: string;
  location: string;
  notes: string;
};

type UnavailabilityForm = {
  resourceId: string;
  startAt: string;
  endAt: string;
  reason: string;
};

const emptyResourceForm: ResourceForm = {
  name: "",
  resourceType: "vehicle",
  code: "",
  capacity: "1",
  location: "",
  notes: "",
};

const emptyUnavailabilityForm: UnavailabilityForm = {
  resourceId: "",
  startAt: "",
  endAt: "",
  reason: "",
};

function formatResourceWindow(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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
  const [resources, setResources] = useState<OperationalResource[]>([]);
  const [resourceCreateOpen, setResourceCreateOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState<ResourceForm>(emptyResourceForm);
  const [unavailability, setUnavailability] = useState<ResourceUnavailability[]>([]);
  const [unavailabilityOpen, setUnavailabilityOpen] = useState(false);
  const [unavailabilityForm, setUnavailabilityForm] = useState<UnavailabilityForm>(emptyUnavailabilityForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";
  const canManageAvailability = canDelete;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const rangeStart = now.toISOString();
      const rangeEnd = new Date(now.getTime() + 120 * 86400000).toISOString();
      const [nextMembers, nextAccess, nextResources, nextUnavailability] = await Promise.all([
        listTeamMembers(organizationId),
        listWorkspaceAccessMembers(organizationId),
        listOperationalResources(organizationId, { activeOnly: false }),
        listResourceUnavailability(organizationId, rangeStart, rangeEnd),
      ]);
      setMembers(nextMembers);
      setAccessMembers(nextAccess);
      setResources(nextResources);
      setUnavailability(nextUnavailability);
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
  const activeResourceCount = resources.filter((resource) => resource.active).length;
  const upcomingUnavailability = unavailability;
  const resourceById = useMemo(() => new Map(resources.map((item) => [item.id, item])), [resources]);

  const handleCreateResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createOperationalResource(organizationId, {
        name: resourceForm.name,
        resourceType: resourceForm.resourceType,
        code: resourceForm.code,
        capacity: Number(resourceForm.capacity || 1),
        location: resourceForm.location,
        notes: resourceForm.notes,
      });
      setResources((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setResourceForm(emptyResourceForm);
      setResourceCreateOpen(false);
    } catch (resourceError) {
      console.error(resourceError);
      setError(resourceError instanceof Error ? resourceError.message : "Resursa nu a putut fi adăugată.");
    } finally {
      setSaving(false);
    }
  };

  const toggleResource = async (resource: OperationalResource) => {
    if (!canWrite || saving || resource.team_member_id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateOperationalResource(organizationId, resource.id, {
        active: !resource.active,
      });
      setResources((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (resourceError) {
      console.error(resourceError);
      setError("Statusul resursei nu a putut fi schimbat.");
    } finally {
      setSaving(false);
    }
  };

  const addUnavailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageAvailability || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createResourceUnavailability(organizationId, {
        resourceId: unavailabilityForm.resourceId,
        startAt: unavailabilityForm.startAt,
        endAt: unavailabilityForm.endAt,
        reason: unavailabilityForm.reason,
      });
      setUnavailability((current) =>
        [...current, created].sort((a, b) => a.start_at.localeCompare(b.start_at))
      );
      setUnavailabilityForm(emptyUnavailabilityForm);
      setUnavailabilityOpen(false);
    } catch (availabilityError) {
      console.error(availabilityError);
      setError(availabilityError instanceof Error ? availabilityError.message : "Indisponibilitatea nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  const removeUnavailability = async (item: ResourceUnavailability) => {
    if (!canManageAvailability || saving) return;
    setSaving(true);
    setError("");
    try {
      await deleteResourceUnavailability(organizationId, item.id);
      setUnavailability((current) => current.filter((entry) => entry.id !== item.id));
    } catch (availabilityError) {
      console.error(availabilityError);
      setError("Indisponibilitatea nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

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
        description="Oameni și resurse operaționale programabile: echipe, vehicule, utilaje și spații. Conturile și rolurile de acces rămân separate."
        action={canWrite ? (
          <button type="button" onClick={() => setCreateOpen((current) => !current)} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
            {createOpen ? "Închide" : "+ Membru"}
          </button>
        ) : null}
      />

      <div className="mt-8"><ModuleError message={error} /></div>

      <ModuleProgressiveMetrics
        className="mt-8"
        primary={<>
          <ModuleMetric label="Echipă activă" value={String(activeCount)} note="oameni operaționali" />
          <ModuleMetric label="Resurse active" value={String(activeResourceCount)} note="oameni + operaționale" />
          <ModuleMetric label="Conturi legate" value={String(linkedCount)} note="au acces în workspace" />
        </>}
        secondary={<ModuleMetric label="Total" value={String(members.length)} note="activi + inactivi" />}
      />

      {createOpen && canWrite ? (
        <form onSubmit={handleCreate} className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nume *"><input value={form.displayName} onChange={(e) => setForm((c) => ({ ...c, displayName: e.target.value }))} className={moduleInputClass} placeholder="Nume și prenume" /></Field>
            <Field label="Rol în firmă"><input value={form.jobTitle} onChange={(e) => setForm((c) => ({ ...c, jobTitle: e.target.value }))} className={moduleInputClass} placeholder="Instalator, coordonator…" /></Field>
            <Field label="Telefon"><input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className={moduleInputClass} placeholder="07…" /></Field>
          </div>
          <ModuleAdvancedFields label="Acces și detalii">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Email contact"><input type="email" value={form.contactEmail} onChange={(e) => setForm((c) => ({ ...c, contactEmail: e.target.value }))} className={moduleInputClass} placeholder="nume@firma.ro" /></Field>
              <Field label="Status"><select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as TeamMemberStatus }))} className={moduleInputClass}><option value="active">Activ</option><option value="inactive">Inactiv</option></select></Field>
              <Field label="Leagă de cont ORBYVEN"><select value={form.linkedUserId} onChange={(e) => setForm((c) => ({ ...c, linkedUserId: e.target.value }))} className={moduleInputClass}><option value="">Fără cont legat</option>{accessMembers.filter((item) => !linkedIds.has(item.user_id)).map((item) => <option key={item.user_id} value={item.user_id}>{roleLabels[item.role]} · {item.user_id.slice(0, 8)}… · {item.access_status}</option>)}</select></Field>
              <Field label="Note" className="sm:col-span-2 lg:col-span-3"><textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} className={`${moduleInputClass} min-h-20 resize-y`} placeholder="Responsabilități, zonă, observații…" /></Field>
            </div>
          </ModuleAdvancedFields>
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
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Nume"><input disabled={!canWrite} value={editForm.displayName} onChange={(e) => updateEditForm((c) => ({ ...c, displayName: e.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Rol în firmă"><input disabled={!canWrite} value={editForm.jobTitle} onChange={(e) => updateEditForm((c) => ({ ...c, jobTitle: e.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Status"><select disabled={!canWrite} value={editForm.status} onChange={(e) => updateEditForm((c) => ({ ...c, status: e.target.value as TeamMemberStatus }))} className={moduleInputClass}><option value="active">Activ</option><option value="inactive">Inactiv</option></select></Field>
              </div>
              <ModuleAdvancedFields label="Contact, acces și note">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Telefon"><input disabled={!canWrite} value={editForm.phone} onChange={(e) => updateEditForm((c) => ({ ...c, phone: e.target.value }))} className={moduleInputClass} /></Field>
                  <Field label="Email contact"><input disabled={!canWrite} type="email" value={editForm.contactEmail} onChange={(e) => updateEditForm((c) => ({ ...c, contactEmail: e.target.value }))} className={moduleInputClass} /></Field>
                  <Field label="Cont ORBYVEN" className="sm:col-span-2"><select disabled={!canWrite} value={editForm.linkedUserId} onChange={(e) => updateEditForm((c) => ({ ...c, linkedUserId: e.target.value }))} className={moduleInputClass}><option value="">Fără cont legat</option>{accessMembers.filter((item) => item.user_id === selected.linked_user_id || !linkedIds.has(item.user_id)).map((item) => <option key={item.user_id} value={item.user_id}>{roleLabels[item.role]} · {item.user_id.slice(0, 8)}… · {item.access_status}</option>)}</select></Field>
                  <Field label="Note" className="sm:col-span-2"><textarea disabled={!canWrite} value={editForm.notes} onChange={(e) => updateEditForm((c) => ({ ...c, notes: e.target.value }))} className={`${moduleInputClass} min-h-24 resize-y`} /></Field>
                </div>
              </ModuleAdvancedFields>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {canDelete ? <button type="button" disabled={saving} onClick={() => void removeSelected()} className="h-11 rounded-full px-5 text-xs font-semibold text-red-500 disabled:opacity-40">Șterge profilul</button> : null}
                {canWrite ? <button disabled={saving} className="h-11 rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Salvează"}</button> : null}
              </div>
              <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted)]">Rolul de acces Owner/Admin/Manager/Member/Viewer și suspendarea contului nu se schimbă aici; acestea rămân în Platform Core.</p>
            </form>
          ) : <ModuleEmpty title="Selectează un membru" description="Profilul operațional și legătura cu un cont ORBYVEN apar aici." />}
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Resource Engine</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">Resurse operaționale</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Oamenii sunt sincronizați automat. Adaugă aici vehicule, echipe, utilaje sau spații care trebuie programate în Calendar.</p>
          </div>
          {canWrite ? (
            <button type="button" onClick={() => setResourceCreateOpen((current) => !current)} className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">
              {resourceCreateOpen ? "Închide" : "+ Resursă"}
            </button>
          ) : null}
        </div>

        {resourceCreateOpen && canWrite ? (
          <form onSubmit={handleCreateResource} className="mt-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nume *"><input value={resourceForm.name} onChange={(event) => setResourceForm((current) => ({ ...current, name: event.target.value }))} className={moduleInputClass} placeholder="Ex. BMW X5 / Echipa 2" /></Field>
              <Field label="Tip"><select value={resourceForm.resourceType} onChange={(event) => setResourceForm((current) => ({ ...current, resourceType: event.target.value as ResourceForm["resourceType"] }))} className={moduleInputClass}><option value="crew">Echipă</option><option value="vehicle">Vehicul</option><option value="equipment">Utilaj / echipament</option><option value="space">Spațiu / post</option></select></Field>
            </div>
            <ModuleAdvancedFields label="Detalii resursă">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Cod / număr"><input value={resourceForm.code} onChange={(event) => setResourceForm((current) => ({ ...current, code: event.target.value }))} className={moduleInputClass} placeholder="B-00-ORB / UTIL-02" /></Field>
                <Field label="Capacitate"><input type="number" min="1" max="100" value={resourceForm.capacity} onChange={(event) => setResourceForm((current) => ({ ...current, capacity: event.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Locație"><input value={resourceForm.location} onChange={(event) => setResourceForm((current) => ({ ...current, location: event.target.value }))} className={moduleInputClass} placeholder="Sediu / depozit / punct lucru" /></Field>
                <Field label="Note"><input value={resourceForm.notes} onChange={(event) => setResourceForm((current) => ({ ...current, notes: event.target.value }))} className={moduleInputClass} placeholder="Detalii utile" /></Field>
              </div>
            </ModuleAdvancedFields>
            <div className="mt-4 flex justify-end"><button disabled={saving} className="h-10 rounded-full bg-[var(--button)] px-5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Adaugă resursa"}</button></div>
          </form>
        ) : null}

        {canManageAvailability ? (
          <div className="mt-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Disponibilitate</p>
                <p className="mt-1 text-sm font-semibold">{upcomingUnavailability.length} intervale viitoare</p>
                <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">Concediu, service, rezervare internă sau orice perioadă în care resursa nu poate fi programată.</p>
              </div>
              <button type="button" onClick={() => setUnavailabilityOpen((value) => !value)} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">
                {unavailabilityOpen ? "Închide" : "+ Indisponibilitate"}
              </button>
            </div>
            {unavailabilityOpen ? (
              <form onSubmit={addUnavailability} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto] xl:items-end">
                <Field label="Resursă *"><select required value={unavailabilityForm.resourceId} onChange={(event) => setUnavailabilityForm((current) => ({ ...current, resourceId: event.target.value }))} className={moduleInputClass}><option value="">Alege resursa</option>{resources.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="De la *"><input required type="datetime-local" value={unavailabilityForm.startAt} onChange={(event) => setUnavailabilityForm((current) => ({ ...current, startAt: event.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Până la *"><input required type="datetime-local" value={unavailabilityForm.endAt} onChange={(event) => setUnavailabilityForm((current) => ({ ...current, endAt: event.target.value }))} className={moduleInputClass} /></Field>
                <Field label="Motiv"><input value={unavailabilityForm.reason} onChange={(event) => setUnavailabilityForm((current) => ({ ...current, reason: event.target.value }))} className={moduleInputClass} placeholder="Concediu / service / rezervat" /></Field>
                <button disabled={saving} className="h-11 rounded-[10px] bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-40">Blochează intervalul</button>
              </form>
            ) : null}
            {upcomingUnavailability.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {upcomingUnavailability.slice(0, 9).map((item) => (
                  <div key={item.id} className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-xs font-semibold">{resourceById.get(item.resource_id)?.name || "Resursă"}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{formatResourceWindow(item.start_at)} → {formatResourceWindow(item.end_at)}</p></div>
                      <button type="button" disabled={saving} onClick={() => void removeUnavailability(item)} className="text-[10px] font-semibold text-rose-400 disabled:opacity-40">Șterge</button>
                    </div>
                    {item.reason ? <p className="mt-2 truncate text-[10px] text-[var(--muted-2)]">{item.reason}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {resources.length ? resources.map((resource) => (
            <div key={resource.id} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{resource.name}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">{RESOURCE_TYPE_LABELS[resource.resource_type]}{resource.code ? " · " + resource.code : ""}{resource.capacity > 1 ? " · cap. " + resource.capacity : ""}</p>
                </div>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${resource.active ? "bg-emerald-500" : "bg-[var(--muted-2)]"}`} />
              </div>
              <p className="mt-2 min-h-4 truncate text-[10px] text-[var(--muted-2)]">{resource.location || resource.notes || (resource.team_member_id ? "Sincronizat din Echipă" : "Fără detalii")}</p>
              {canWrite && !resource.team_member_id ? (
                <button type="button" disabled={saving} onClick={() => void toggleResource(resource)} className="mt-3 text-[10px] font-semibold text-[var(--accent)] disabled:opacity-40">
                  {resource.active ? "Dezactivează" : "Reactivează"}
                </button>
              ) : null}
            </div>
          )) : (
            <ModuleEmpty title="Nu există resurse" description="Oamenii activi vor apărea automat aici, iar resursele fizice pot fi adăugate manual." />
          )}
        </div>
      </section>
    </div>
  );
}
