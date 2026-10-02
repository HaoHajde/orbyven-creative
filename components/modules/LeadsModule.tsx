"use client";

import {
  convertCrmLeadToClient,
  createCrmLead,
  createCrmLeadActivity,
  listCrmLeadActivities,
  listCrmLeads,
  scheduleCrmFollowUp,
  updateCrmLead,
  type CrmActivityKind,
  type CrmLead,
  type CrmLeadActivity,
  type CrmLeadKind,
  type CrmLeadStage,
} from "@/lib/modules/leads";
import { evaluateClientLifecycle, type ClientLifecycleSnapshot } from "@/lib/automation/client-lifecycle";
import { displayPostServiceActivity } from "@/lib/automation/post-service-growth";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { useWorkspaceCreateFocus, useWorkspaceRecordFocus, useWorkspaceSelectionWarp } from "@/components/modules/useWorkspaceRecordFocus";
import { useWorkspaceLiveContext } from "@/components/modules/useWorkspaceLiveContext";
import { ModuleAdvancedFields, ModuleNextAction, ModuleProgressiveMetrics } from "@/components/modules/ModuleKit";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

const STAGES: Array<{ id: CrmLeadStage; label: string }> = [
  { id: "new", label: "Nou" },
  { id: "contacted", label: "Contactat" },
  { id: "qualified", label: "Calificat" },
  { id: "proposal", label: "Ofertă" },
  { id: "won", label: "Câștigat" },
  { id: "lost", label: "Pierdut" },
];

const ACTIVITY_LABELS: Record<CrmActivityKind, string> = {
  note: "Notă",
  call: "Apel",
  email: "Email",
  meeting: "Întâlnire",
  status: "Status",
};

type Props = {
  organizationId: string;
  locale?: string;
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  initialCreate?: boolean;
  initialRecordId?: string;
  role: OrbyvenWorkspace["membership"]["role"];
};

type LeadDraft = {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  note: string;
  estimatedValue: string;
  currency: string;
  nextFollowUpAt: string;
};

function defaultCurrency(locale: string) {
  if (locale.startsWith("ro")) return "RON";
  if (locale === "en-US") return "USD";
  if (locale === "en-GB") return "GBP";
  return "EUR";
}

function emptyDraft(locale: string): LeadDraft {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "",
    note: "",
    estimatedValue: "",
    currency: defaultCurrency(locale),
    nextFollowUpAt: "",
  };
}

export default function LeadsModule({
  organizationId, locale = "ro-RO", enabledModules, onOpenModule, initialCreate = false, initialRecordId, role,
}: Props) {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialRecordId ?? null);
  const [activities, setActivities] = useState<CrmLeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<CrmLeadStage | "all">("all");
  const [kindFilter, setKindFilter] = useState<CrmLeadKind | "all">("all");
  const [showCreate, setShowCreate] = useState(initialCreate && role !== "viewer");
  const canWrite = role !== "viewer";
  useWorkspaceCreateFocus(showCreate);
  const [draft, setDraft] = useState<LeadDraft>(() => emptyDraft(locale));
  const [activityKind, setActivityKind] = useState<CrmActivityKind>("note");
  const [activityBody, setActivityBody] = useState("");
  const [followUpLocal, setFollowUpLocal] = useState("");
  const [lifecycleNowIso, setLifecycleNowIso] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await listCrmLeads(organizationId);
      setLeads(next);
      setLifecycleNowIso(new Date().toISOString());
      setSelectedLeadId((current) =>
        current && next.some((lead) => lead.id === current)
          ? current
          : next[0]?.id ?? null
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Clienții și cererile nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLeads(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLeads]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );
  const lifecycleByClient = useMemo(() => {
    const now = lifecycleNowIso ? new Date(lifecycleNowIso) : new Date(0);
    return new Map(
      leads
        .filter((lead) => lead.kind === "client")
        .map((lead) => [
          lead.id,
          evaluateClientLifecycle({
            id: lead.id,
            name: lead.name,
            kind: lead.kind,
            lastContactAt: lead.last_contact_at,
            nextFollowUpAt: lead.next_follow_up_at,
            convertedAt: lead.converted_at,
            createdAt: lead.created_at,
          }, now),
        ] as const)
        .filter((entry): entry is readonly [string, ClientLifecycleSnapshot] => Boolean(entry[1]))
    );
  }, [leads, lifecycleNowIso]);
  const selectedLifecycle = selectedLead?.kind === "client"
    ? lifecycleByClient.get(selectedLead.id) ?? null
    : null;
  useWorkspaceLiveContext({ clientId: selectedLead?.id });
  useWorkspaceRecordFocus(initialRecordId, selectedLeadId, loading);
  useWorkspaceSelectionWarp(selectedLeadId, loading);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFollowUpLocal(selectedLead?.next_follow_up_at
        ? new Date(new Date(selectedLead.next_follow_up_at).getTime() - new Date(selectedLead.next_follow_up_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedLeadId, selectedLead?.next_follow_up_at]);

  useEffect(() => {
    if (!selectedLeadId) {
      const timer = window.setTimeout(() => setActivities([]), 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setActivitiesLoading(true);
      try {
        const next = await listCrmLeadActivities(organizationId, selectedLeadId);
        if (active) setActivities(next);
      } catch (activityError) {
        console.error(activityError);
        if (active) setActivities([]);
      } finally {
        if (active) setActivitiesLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, selectedLeadId]);

  const filteredLeads = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(locale);
    return leads.filter((lead) => {
      if (stageFilter !== "all" && lead.stage !== stageFilter) return false;
      if (kindFilter !== "all" && lead.kind !== kindFilter) return false;
      if (!needle) return true;
      return [lead.name, lead.company, lead.email, lead.phone, lead.source]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase(locale).includes(needle));
    });
  }, [kindFilter, leads, locale, search, stageFilter]);

  const metrics = useMemo(() => {
    const activeLeads = leads.filter(
      (lead) => lead.kind === "lead" && !["won", "lost"].includes(lead.stage)
    );
    return {
      active: activeLeads.length,
      clients: leads.filter((lead) => lead.kind === "client").length,
      pipeline: activeLeads.reduce(
        (sum, lead) => sum + (lead.estimated_value ?? 0),
        0
      ),
      followUps: leads.filter((lead) =>
        Boolean(lead.next_follow_up_at) &&
        (lead.kind === "client" || !["won", "lost"].includes(lead.stage))
      ).length,
      reactivation: [...lifecycleByClient.values()].filter((item) => item.needsReactivation).length,
    };
  }, [leads, lifecycleByClient]);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: defaultCurrency(locale),
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  const handleCreateLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || !draft.name.trim() || saving) return;

    setSaving(true);
    setError("");
    try {
      const created = await createCrmLead(organizationId, {
        name: draft.name,
        company: draft.company,
        email: draft.email,
        phone: draft.phone,
        source: draft.source,
        note: draft.note,
        estimatedValue: draft.estimatedValue ? Number(draft.estimatedValue) : null,
        currency: draft.currency,
        nextFollowUpAt: draft.nextFollowUpAt
          ? new Date(draft.nextFollowUpAt).toISOString()
          : null,
      });
      setLeads((current) => [created, ...current]);
      setSelectedLeadId(created.id);
      setDraft(emptyDraft(locale));
      setShowCreate(false);
    } catch (createError) {
      console.error(createError);
      setError("Cererea nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  const changeStage = async (stage: CrmLeadStage) => {
    if (!canWrite || !selectedLead || saving || selectedLead.stage === stage) return;

    const previous = selectedLead;
    setSaving(true);
    setError("");
    setLeads((current) =>
      current.map((lead) => (lead.id === previous.id ? { ...lead, stage } : lead))
    );

    try {
      const updated = await updateCrmLead(organizationId, previous.id, { stage });
      setLeads((current) =>
        current.map((lead) => (lead.id === updated.id ? updated : lead))
      );
      const label = STAGES.find((item) => item.id === stage)?.label ?? stage;
      const activity = await createCrmLeadActivity(
        organizationId,
        previous.id,
        "status",
        `Status schimbat în ${label}.`
      );
      setActivities((current) => [activity, ...current]);
    } catch (stageError) {
      console.error(stageError);
      setLeads((current) =>
        current.map((lead) => (lead.id === previous.id ? previous : lead))
      );
      setError("Statusul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const convertToClient = async () => {
    if (!canWrite || !selectedLead || selectedLead.kind === "client" || saving) return;

    setSaving(true);
    setError("");
    try {
      const updated = await convertCrmLeadToClient(organizationId, selectedLead.id);
      setLeads((current) =>
        current.map((lead) => (lead.id === updated.id ? updated : lead))
      );
      setLifecycleNowIso(new Date().toISOString());
      const activity = await createCrmLeadActivity(
        organizationId,
        selectedLead.id,
        "status",
        "Cererea a fost convertită în client."
      );
      setActivities((current) => [activity, ...current]);
    } catch (convertError) {
      console.error(convertError);
      setError("Conversia în client nu a putut fi finalizată.");
    } finally {
      setSaving(false);
    }
  };

  const updateFollowUp = async (done: boolean) => {
    if (!canWrite || !selectedLead || saving) return;
    if (!done && (!followUpLocal || !Number.isFinite(new Date(followUpLocal).getTime()))) {
      setError("Alege data și ora următoarei reveniri.");
      return;
    }
    const when = done ? null : new Date(followUpLocal).toISOString();
    setSaving(true);
    setError("");
    try {
      const updated = done
        ? await updateCrmLead(organizationId, selectedLead.id, {
            next_follow_up_at: null,
            last_contact_at: new Date().toISOString(),
          })
        : await scheduleCrmFollowUp(
            organizationId,
            selectedLead.id,
            when as string,
            "Follow-up reprogramat."
          );
      setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
      setLifecycleNowIso(new Date().toISOString());
      if (done) {
        try {
          const note = await createCrmLeadActivity(
            organizationId,
            updated.id,
            "status",
            "Follow-up marcat ca rezolvat."
          );
          setActivities((current) => [note, ...current]);
        } catch (historyError) {
          console.error(historyError);
          setError("Contactul a fost actualizat, dar istoricul nu a putut fi completat.");
        }
      }
    } catch (followUpError) {
      console.error(followUpError);
      setError("Follow-up-ul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleReactivation = async (days = 7) => {
    if (!canWrite || !selectedLead || selectedLead.kind !== "client" || saving) return;
    const when = new Date(Date.now() + days * 86400000).toISOString();
    setSaving(true);
    setError("");
    try {
      const updated = await scheduleCrmFollowUp(
        organizationId,
        selectedLead.id,
        when,
        `Reactivare client planificată peste ${days} zile.`
      );
      setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
      setLifecycleNowIso(new Date().toISOString());
      const local = new Date(new Date(updated.next_follow_up_at!).getTime() - new Date(updated.next_follow_up_at!).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setFollowUpLocal(local);
      const nextActivities = await listCrmLeadActivities(organizationId, selectedLead.id);
      setActivities(nextActivities);
    } catch (reactivationError) {
      console.error(reactivationError);
      setError("Reactivarea clientului nu a putut fi programată.");
    } finally {
      setSaving(false);
    }
  };

  const addActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || !selectedLead || !activityBody.trim() || saving) return;

    setSaving(true);
    setError("");
    try {
      const created = await createCrmLeadActivity(
        organizationId,
        selectedLead.id,
        activityKind,
        activityBody
      );
      setActivities((current) => [created, ...current]);
      if (activityKind !== "note" && activityKind !== "status") {
        setLeads((current) =>
          current.map((lead) =>
            lead.id === selectedLead.id
              ? { ...lead, last_contact_at: created.occurred_at }
              : lead
          )
        );
        setLifecycleNowIso(new Date().toISOString());
      }
      setActivityBody("");
    } catch (activityError) {
      console.error(activityError);
      setError("Activitatea nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Clienți & cereri
          </p>
          <h1 className="mt-2.5 text-[34px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[42px]">
            Clienți & cereri
          </h1>
          <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-[var(--muted)]">
            Cereri noi, clienți, status și istoricul conversațiilor într-un singur loc.
          </p>
        </div>
        {canWrite && <button
          type="button"
          onClick={() => setShowCreate((current) => !current)}
          className="h-11 self-start rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
        >
          {showCreate ? "Închide" : "+ Cerere nouă"}
        </button>}
      </section>

      {error && (
        <div className="mt-6 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {showCreate && canWrite && (
        <form
          data-workspace-create-focus={showCreate ? "true" : undefined}
          onSubmit={handleCreateLead}
          className="mt-8 scroll-mt-28 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Cerere nouă</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                Adaugă contactul
              </h2>
            </div>
            <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)]">
              Contact nou
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Field label="Nume *" value={draft.name} onChange={(value) => setDraft((d) => ({ ...d, name: value }))} />
            <Field label="Telefon" value={draft.phone} onChange={(value) => setDraft((d) => ({ ...d, phone: value }))} />
            <Field label="Email" type="email" value={draft.email} onChange={(value) => setDraft((d) => ({ ...d, email: value }))} />
            <Field label="Companie" value={draft.company} onChange={(value) => setDraft((d) => ({ ...d, company: value }))} />
          </div>

          <ModuleAdvancedFields label="Context comercial">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Sursă" value={draft.source} onChange={(value) => setDraft((d) => ({ ...d, source: value }))} />
              <Field label="Valoare estimată" type="number" value={draft.estimatedValue} onChange={(value) => setDraft((d) => ({ ...d, estimatedValue: value }))} />
              <Field label="Monedă" value={draft.currency} onChange={(value) => setDraft((d) => ({ ...d, currency: value }))} />
              <Field label="Follow-up" type="datetime-local" value={draft.nextFollowUpAt} onChange={(value) => setDraft((d) => ({ ...d, nextFollowUpAt: value }))} />
            </div>
            <label className="mt-3 block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Notă</span>
              <textarea value={draft.note} onChange={(event) => setDraft((d) => ({ ...d, note: event.target.value }))} rows={3} className="w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" placeholder="Ce trebuie să știi despre această cerere?" />
            </label>
          </ModuleAdvancedFields>

          <button
            type="submit"
            disabled={saving || !draft.name.trim()}
            className="mt-4 h-11 rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)] disabled:opacity-50"
          >
            {saving ? "Se salvează..." : "Salvează cererea"}
          </button>
        </form>
      )}

      <ModuleProgressiveMetrics
        className="mt-8"
        primary={<>
          <Metric label="Cereri active" value={String(metrics.active)} note="în lucru acum" />
          <Metric label="Follow-up" value={String(metrics.followUps)} note="programate" />
          <Metric label="De reactivat" value={String(metrics.reactivation)} note="relații fără pas următor" />
        </>}
        secondary={<>
          <Metric label="Clienți" value={String(metrics.clients)} note="convertiți din pipeline" />
          <Metric label="Pipeline" value={money.format(metrics.pipeline)} note="valoare estimată" />
        </>}
      />

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Caută nume, firmă, telefon..."
              className="h-11 min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none focus:border-[var(--accent)]"
            />
            <select
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as CrmLeadKind | "all")}
              className="h-11 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none"
            >
              <option value="all">Toate</option>
              <option value="lead">Cereri</option>
              <option value="client">Clienți</option>
            </select>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value as CrmLeadStage | "all")}
              className="h-11 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none"
            >
              <option value="all">Orice status</option>
              {STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-2">
            {loading ? (
              <EmptyState text="Se încarcă relațiile..." />
            ) : filteredLeads.length ? (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full rounded-[20px] border p-4 text-left transition ${
                    selectedLeadId === lead.id
                      ? "border-[var(--border-strong)] bg-[var(--bg)]"
                      : "border-transparent hover:bg-[var(--bg)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{lead.name}</p>
                        {lead.kind === "client" && (
                          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
                            Client
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--muted)]">
                        {lead.company || lead.phone || lead.email || "Fără detalii de contact"}
                      </p>
                    </div>
                    {lead.kind === "client" && lifecycleByClient.get(lead.id)
                      ? <ClientLifecyclePill snapshot={lifecycleByClient.get(lead.id)!} />
                      : <StagePill stage={lead.stage} />}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--muted-2)]">
                    <span>{lead.source || "Sursă nespecificată"}</span>
                    <span>{dateFormatter.format(new Date(lead.updated_at))}</span>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState text="Nu există rezultate pentru filtrele alese." />
            )}
          </div>
        </article>

        <article data-workspace-record-focus={selectedLead ? "true" : undefined} className="min-h-[520px] scroll-mt-28 rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
          {selectedLead ? (
            <>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    {selectedLead.kind === "client" ? "Client" : "Cerere"}
                  </p>
                  <h2 className="mt-2 truncate text-[30px] font-semibold tracking-[-0.05em]">
                    {selectedLead.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {selectedLead.company || "Persoană / companie nespecificată"}
                  </p>
                </div>

              </div>

              {canWrite && selectedLead.kind === "lead" ? (
                <div className="mt-4">
                  {selectedLead.stage === "won" ? (
                    <ModuleNextAction
                      title="Cererea este câștigată"
                      description="Transformă profilul în client fără să pierzi istoricul comercial."
                      action={<button type="button" onClick={convertToClient} disabled={saving} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Transformă în client →</button>}
                    />
                  ) : selectedLead.stage === "lost" ? (
                    <ModuleNextAction
                      title="Cererea este închisă ca pierdută"
                      description="Istoricul rămâne disponibil. Redeschide pipeline-ul doar printr-o schimbare explicită de status."
                    />
                  ) : selectedLead.stage === "proposal" && enabledModules.includes("estimates") ? (
                    <ModuleNextAction
                      title="Oferta este în lucru"
                      description="Deschide contextul comercial al acestei cereri pentru următorul pas."
                      action={<button type="button" onClick={() => onOpenModule("estimates", { clientId: selectedLead.id })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">Deschide oferta →</button>}
                    />
                  ) : enabledModules.includes("estimates") ? (
                    <ModuleNextAction
                      title="Pregătește oferta"
                      description="Clientul și contextul CRM sunt păstrate automat; după creare, pipeline-ul trece în Propunere."
                      action={<button type="button" onClick={() => onOpenModule("estimates", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Ofertă →</button>}
                    />
                  ) : (
                    <ModuleNextAction
                      title="Continuă calificarea cererii"
                      description="Actualizează statusul sau următorul follow-up înainte de conversia în client."
                    />
                  )}
                </div>
              ) : canWrite && selectedLead.kind === "client" ? (
                <div className="mt-4">
                  {selectedLifecycle?.state === "overdue" ? (
                    <ModuleNextAction
                      title="Follow-up ajuns la termen"
                      description={selectedLifecycle.detail}
                      action={<button type="button" onClick={() => document.querySelector('[data-client-follow-up="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">Deschide follow-up →</button>}
                    />
                  ) : selectedLifecycle?.needsReactivation ? (
                    <ModuleNextAction
                      title={selectedLifecycle.label}
                      description={selectedLifecycle.detail}
                      action={<button type="button" disabled={saving} onClick={() => void scheduleReactivation(7)} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Planifică revenire →</button>}
                    />
                  ) : selectedLifecycle?.state === "scheduled" ? (
                    <ModuleNextAction
                      title="Revenirea este deja programată"
                      description={selectedLifecycle.detail}
                      action={<button type="button" onClick={() => document.querySelector('[data-client-follow-up="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">Vezi revenirea →</button>}
                    />
                  ) : enabledModules.includes("tasks") ? (
                    <ModuleNextAction title="Pornește următoarea lucrare" description="Clientul rămâne asociat automat." action={<button type="button" onClick={() => onOpenModule("tasks", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Lucrare</button>} />
                  ) : enabledModules.includes("estimates") ? (
                    <ModuleNextAction title="Pregătește o ofertă" action={<button type="button" onClick={() => onOpenModule("estimates", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Ofertă</button>} />
                  ) : enabledModules.includes("calendar") ? (
                    <ModuleNextAction title="Programează următorul contact" action={<button type="button" onClick={() => onOpenModule("calendar", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Programare</button>} />
                  ) : null}
                  {(enabledModules.includes("estimates") || enabledModules.includes("calendar") || enabledModules.includes("tasks")) && (
                    <details className="mt-2 rounded-[12px] border border-[var(--border)] bg-[var(--bg)]">
                      <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-[var(--muted)] [&::-webkit-details-marker]:hidden">Alte acțiuni</summary>
                      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-3">
                        {enabledModules.includes("tasks") && <button type="button" onClick={() => onOpenModule("tasks", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Lucrare</button>}
                        {enabledModules.includes("estimates") && <button type="button" onClick={() => onOpenModule("estimates", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Ofertă</button>}
                        {enabledModules.includes("calendar") && <button type="button" onClick={() => onOpenModule("calendar", { create: true, clientId: selectedLead.id })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Programare</button>}
                      </div>
                    </details>
                  )}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Detail label="Telefon" value={selectedLead.phone || "—"} />
                <Detail label="Email" value={selectedLead.email || "—"} />
                <Detail label="Sursă" value={selectedLead.source || "—"} />
                <Detail
                  label="Valoare"
                  value={
                    selectedLead.estimated_value == null
                      ? "—"
                      : new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: selectedLead.currency,
                        }).format(selectedLead.estimated_value)
                  }
                />
              </div>

              {selectedLifecycle && (
                <ClientLifecyclePanel
                  snapshot={selectedLifecycle}
                  locale={locale}
                  canWrite={canWrite}
                  saving={saving}
                  onSchedule={() => void scheduleReactivation(7)}
                />
              )}

              <div className="mt-5 rounded-[22px] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Status</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Mută cererea prin pipeline.</p>
                  </div>
                  <select
                    value={selectedLead.stage}
                    onChange={(event) => void changeStage(event.target.value as CrmLeadStage)}
                    disabled={saving || !canWrite}
                    className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-semibold outline-none disabled:opacity-50"
                  >
                    {STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedLead.note && (
                <div className="mt-4 rounded-[22px] border border-[var(--border)] p-4 text-sm leading-6 text-[var(--muted)]">
                  {selectedLead.note}
                </div>
              )}

              {canWrite && (
                <div data-client-follow-up="true" className="mt-5 scroll-mt-28 rounded-[16px] border border-[var(--border)] bg-[var(--surface)]/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Următoarea revenire</p>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="min-w-[190px] flex-1 text-xs text-[var(--muted)]">
                      Data și ora locală
                      <input type="datetime-local" value={followUpLocal} onChange={(event) => setFollowUpLocal(event.target.value)} className="mt-1 block h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 text-xs text-[var(--text)]" />
                    </label>
                    <button type="button" onClick={() => void updateFollowUp(false)} disabled={saving || !followUpLocal} className="h-10 rounded-[10px] border border-[var(--border-strong)] px-3 text-xs font-semibold disabled:opacity-50">Salvează termenul</button>
                    {selectedLead.next_follow_up_at && <button type="button" onClick={() => void updateFollowUp(true)} disabled={saving} className="h-10 rounded-[10px] bg-[var(--button)] px-3 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Follow-up rezolvat ✓</button>}
                  </div>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">Istoric contact</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Ultimele interacțiuni</h3>
                </div>
                {selectedLead.next_follow_up_at && (
                  <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
                    Follow-up {dateFormatter.format(new Date(selectedLead.next_follow_up_at))}
                  </span>
                )}
              </div>

              {canWrite && <form onSubmit={addActivity} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <select
                  value={activityKind}
                  onChange={(event) => setActivityKind(event.target.value as CrmActivityKind)}
                  className="h-11 rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-3 text-xs outline-none"
                >
                  {Object.entries(ACTIVITY_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
                <input
                  value={activityBody}
                  onChange={(event) => setActivityBody(event.target.value)}
                  placeholder="Adaugă o notă sau o interacțiune..."
                  className="h-11 min-w-0 flex-1 rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={!activityBody.trim() || saving}
                  className="h-11 rounded-[16px] bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50"
                >
                  Adaugă
                </button>
              </form>}

              <div className="mt-4 space-y-2">
                {activitiesLoading ? (
                  <EmptyState text="Se încarcă istoricul..." compact />
                ) : activities.length ? (
                  activities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="rounded-[18px] bg-[var(--bg)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          {ACTIVITY_LABELS[activity.kind]}
                        </span>
                        <span className="text-[10px] text-[var(--muted-2)]">
                          {dateFormatter.format(new Date(activity.occurred_at))}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{displayPostServiceActivity(activity.body)}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState text="Încă nu există activitate pentru acest contact." compact />
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[470px] items-center justify-center text-center">
              <div>
                <p className="text-lg font-semibold">Selectează un contact</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Detaliile și istoricul apar aici.</p>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function ClientLifecyclePill({ snapshot }: { snapshot: ClientLifecycleSnapshot }) {
  const tone =
    snapshot.state === "overdue" || snapshot.state === "dormant"
      ? "text-rose-500"
      : snapshot.state === "cooling"
        ? "text-amber-500"
        : snapshot.state === "scheduled"
          ? "text-[var(--accent)]"
          : "text-emerald-600";

  return (
    <span className={`shrink-0 rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold ${tone}`}>
      {snapshot.label}
    </span>
  );
}

function ClientLifecyclePanel({
  snapshot,
  locale,
  canWrite,
  saving,
  onSchedule,
}: {
  snapshot: ClientLifecycleSnapshot;
  locale: string;
  canWrite: boolean;
  saving: boolean;
  onSchedule: () => void;
}) {
  const lastTouch = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(snapshot.lastTouchAt));

  return (
    <div className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface)]/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            ORBYVEN · CLIENT LIFECYCLE
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{snapshot.label}</p>
            <span className="text-[10px] text-[var(--muted-2)]">ultima interacțiune · {lastTouch}</span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{snapshot.detail}</p>
        </div>
        {canWrite && snapshot.needsReactivation && (
          <button
            type="button"
            disabled={saving}
            onClick={onSchedule}
            className="h-9 shrink-0 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50"
          >
            Planifică revenire · 7 zile
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-5 truncate text-[34px] font-semibold leading-none tracking-[-0.055em]">{value}</p>
      <p className="mt-3 text-xs text-[var(--muted-2)]">{note}</p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function StagePill({ stage }: { stage: CrmLeadStage }) {
  const label = STAGES.find((item) => item.id === stage)?.label ?? stage;
  return (
    <span className="shrink-0 rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--muted)]">
      {label}
    </span>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-[20px] border border-dashed border-[var(--border-strong)] text-center text-sm text-[var(--muted)] ${
        compact ? "p-4" : "p-8"
      }`}
    >
      {text}
    </div>
  );
}
