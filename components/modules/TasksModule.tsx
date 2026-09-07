"use client";

import {
  createWorkTask,
  createWorkTaskChecklistItem,
  deleteWorkTask,
  deleteWorkTaskChecklistItem,
  listWorkTaskChecklist,
  listWorkTaskClients,
  listWorkTasks,
  setWorkTaskChecklistItemDone,
  setWorkTaskProgress,
  setWorkTaskStatus,
  type WorkTask,
  type WorkTaskChecklistItem,
  type WorkTaskClient,
  type WorkTaskKind,
  type WorkTaskPriority,
  type WorkTaskStatus,
} from "@/lib/modules/tasks";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
};

type ViewMode = "board" | "list";
type StatusFilter = "all" | WorkTaskStatus;

type CreateForm = {
  title: string;
  kind: WorkTaskKind;
  priority: WorkTaskPriority;
  clientId: string;
  assignee: string;
  location: string;
  scheduledAt: string;
  dueAt: string;
  estimatedMinutes: string;
  description: string;
};

const emptyForm: CreateForm = {
  title: "",
  kind: "work",
  priority: "normal",
  clientId: "",
  assignee: "",
  location: "",
  scheduledAt: "",
  dueAt: "",
  estimatedMinutes: "",
  description: "",
};

const statusLabels: Record<WorkTaskStatus, string> = {
  planned: "De făcut",
  in_progress: "În lucru",
  blocked: "Blocat",
  done: "Finalizat",
  cancelled: "Anulat",
};

const priorityLabels: Record<WorkTaskPriority, string> = {
  low: "Scăzută",
  normal: "Normală",
  high: "Ridicată",
  urgent: "Urgentă",
};

const boardStatuses: WorkTaskStatus[] = ["planned", "in_progress", "blocked", "done"];

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function dayKey(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function TasksModule({ organizationId, locale, role }: Props) {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [clients, setClients] = useState<WorkTaskClient[]>([]);
  const [checklist, setChecklist] = useState<WorkTaskChecklistItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [snapshotIso, setSnapshotIso] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextTasks, nextClients] = await Promise.all([
        listWorkTasks(organizationId),
        listWorkTaskClients(organizationId),
      ]);
      setTasks(nextTasks);
      setClients(nextClients);
      setSnapshotIso(new Date().toISOString());
      setSelectedId((current) =>
        current && nextTasks.some((task) => task.id === current)
          ? current
          : nextTasks[0]?.id ?? null
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Lucrările nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [selectedId, tasks]
  );

  useEffect(() => {
    if (!selectedTask) {
      setChecklist([]);
      return;
    }

    let active = true;
    void listWorkTaskChecklist(organizationId, selectedTask.id)
      .then((items) => {
        if (active) setChecklist(items);
      })
      .catch((checklistError) => {
        console.error(checklistError);
        if (active) setError("Checklist-ul nu a putut fi încărcat.");
      });

    return () => {
      active = false;
    };
  }, [organizationId, selectedTask]);

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const client = task.client_id ? clientById.get(task.client_id) : null;
      const haystack = [
        task.title,
        task.description,
        task.assignee,
        task.location,
        client?.name,
        client?.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale);
      return haystack.includes(normalizedQuery);
    });
  }, [clientById, locale, query, statusFilter, tasks]);

  const metrics = useMemo(() => {
    const today = dayKey(snapshotIso);
    const active = tasks.filter(
      (task) => !["done", "cancelled"].includes(task.status)
    ).length;
    const urgent = tasks.filter(
      (task) => task.priority === "urgent" && !["done", "cancelled"].includes(task.status)
    ).length;
    const todayCount = today
      ? tasks.filter(
          (task) =>
            !["done", "cancelled"].includes(task.status) &&
            (dayKey(task.scheduled_at) === today || dayKey(task.due_at) === today)
        ).length
      : 0;
    const done = tasks.filter((task) => task.status === "done").length;
    return { active, urgent, today: todayCount, done };
  }, [snapshotIso, tasks]);

  const replaceTask = (nextTask: WorkTask) => {
    setTasks((current) =>
      current.map((task) => (task.id === nextTask.id ? nextTask : task))
    );
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;

    setSaving(true);
    setError("");
    try {
      const created = await createWorkTask(organizationId, {
        title: form.title,
        kind: form.kind,
        priority: form.priority,
        clientId: form.clientId || null,
        assignee: form.assignee,
        location: form.location,
        scheduledAt: toIso(form.scheduledAt),
        dueAt: toIso(form.dueAt),
        estimatedMinutes: form.estimatedMinutes
          ? Number(form.estimatedMinutes)
          : null,
        description: form.description,
      });
      setTasks((current) => [created, ...current]);
      setSelectedId(created.id);
      setForm(emptyForm);
      setCreateOpen(false);
    } catch (createError) {
      console.error(createError);
      setError("Lucrarea nu a putut fi creată. Verifică datele și încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task: WorkTask, status: WorkTaskStatus) => {
    if (!canWrite || saving || task.status === status) return;
    setSaving(true);
    setError("");
    try {
      replaceTask(await setWorkTaskStatus(organizationId, task.id, status));
    } catch (statusError) {
      console.error(statusError);
      setError("Statusul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const changeProgress = async (task: WorkTask, progress: number) => {
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      replaceTask(await setWorkTaskProgress(organizationId, task.id, progress));
    } catch (progressError) {
      console.error(progressError);
      setError("Progresul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const addChecklistItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTask || !canWrite || saving || !newChecklistTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const item = await createWorkTaskChecklistItem(
        organizationId,
        selectedTask.id,
        newChecklistTitle,
        checklist.length
      );
      setChecklist((current) => [...current, item]);
      setNewChecklistTitle("");
    } catch (itemError) {
      console.error(itemError);
      setError("Pasul nu a putut fi adăugat.");
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = async (item: WorkTaskChecklistItem) => {
    if (!selectedTask || !canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await setWorkTaskChecklistItemDone(
        organizationId,
        selectedTask.id,
        item.id,
        !item.done
      );
      setChecklist((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
    } catch (itemError) {
      console.error(itemError);
      setError("Pasul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const removeChecklistItem = async (item: WorkTaskChecklistItem) => {
    if (!selectedTask || !canDelete || saving) return;
    setSaving(true);
    setError("");
    try {
      await deleteWorkTaskChecklistItem(organizationId, selectedTask.id, item.id);
      setChecklist((current) => current.filter((entry) => entry.id !== item.id));
    } catch (itemError) {
      console.error(itemError);
      setError("Pasul nu a putut fi șters.");
    } finally {
      setSaving(false);
    }
  };

  const removeTask = async (task: WorkTask) => {
    if (!canDelete || saving) return;
    setSaving(true);
    setError("");
    try {
      await deleteWorkTask(organizationId, task.id);
      setTasks((current) => current.filter((entry) => entry.id !== task.id));
      setSelectedId(null);
      setChecklist([]);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Lucrarea nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Operations · Live</p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px]">Lucrările, fără haos.</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            Vezi ce urmează, cine se ocupă, unde trebuie ajuns și ce mai lipsește până la finalizare.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setViewMode("board")} className={`h-11 rounded-full px-5 text-sm font-semibold ${viewMode === "board" ? "bg-[var(--button)] text-[var(--button-text)]" : "border border-[var(--border-strong)]"}`}>Board</button>
          <button type="button" onClick={() => setViewMode("list")} className={`h-11 rounded-full px-5 text-sm font-semibold ${viewMode === "list" ? "bg-[var(--button)] text-[var(--button-text)]" : "border border-[var(--border-strong)]"}`}>Listă</button>
          {canWrite && (
            <button type="button" onClick={() => setCreateOpen((open) => !open)} className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white">+ Lucrare</button>
          )}
        </div>
      </section>

      <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active" value={String(metrics.active)} note="de făcut sau în lucru" />
        <Metric label="Astăzi" value={String(metrics.today)} note="programate sau scadente" />
        <Metric label="Urgente" value={String(metrics.urgent)} note="necesită atenție" />
        <Metric label="Finalizate" value={String(metrics.done)} note="istoric păstrat" />
      </section>

      {error && <div className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">{error}</div>}

      {createOpen && canWrite && (
        <form onSubmit={handleCreate} className="mt-4 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-medium text-[var(--muted)]">Lucrare nouă</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Pune treaba în sistem.</h2></div>
            <button type="button" onClick={() => setCreateOpen(false)} className="text-sm text-[var(--muted)]">Închide</button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Titlu" className="xl:col-span-2"><input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Montaj centrală termică" className="input" /></Field>
            <Field label="Tip"><select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as WorkTaskKind }))} className="input"><option value="work">Lucrare</option><option value="task">Task</option></select></Field>
            <Field label="Prioritate"><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as WorkTaskPriority }))} className="input"><option value="low">Scăzută</option><option value="normal">Normală</option><option value="high">Ridicată</option><option value="urgent">Urgentă</option></select></Field>
            <Field label="Client"><select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} className="input"><option value="">Fără client asociat</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.company || client.name} · {client.kind === "client" ? "client" : "lead"}</option>)}</select></Field>
            <Field label="Responsabil"><input value={form.assignee} onChange={(event) => setForm((current) => ({ ...current, assignee: event.target.value }))} placeholder="Ex. Mihai" className="input" /></Field>
            <Field label="Locație"><input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Adresă / punct de lucru" className="input" /></Field>
            <Field label="Durată estimată"><input type="number" min="0" step="15" value={form.estimatedMinutes} onChange={(event) => setForm((current) => ({ ...current, estimatedMinutes: event.target.value }))} placeholder="minute" className="input" /></Field>
            <Field label="Programată"><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} className="input" /></Field>
            <Field label="Termen"><input type="datetime-local" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} className="input" /></Field>
            <Field label="Descriere" className="md:col-span-2"><textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ce trebuie făcut, materiale, observații..." className="input min-h-[98px] py-3" /></Field>
          </div>
          <div className="mt-5 flex justify-end"><button disabled={saving} className="h-11 rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50">{saving ? "Se salvează..." : "Creează lucrarea"}</button></div>
        </form>
      )}

      <section className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-3 sm:flex-row sm:items-center">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută lucrare, client, responsabil sau locație..." className="h-11 min-w-0 flex-1 rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none">
          <option value="all">Toate statusurile</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </section>

      {loading ? (
        <div className="mt-4 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">Se încarcă lucrările...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="mt-4 rounded-[30px] border border-dashed border-[var(--border-strong)] p-10 text-center"><h2 className="text-xl font-semibold">Nimic de urmărit aici.</h2><p className="mt-2 text-sm text-[var(--muted)]">Creează prima lucrare sau schimbă filtrele.</p></div>
      ) : viewMode === "board" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-4">
          {boardStatuses.map((status) => {
            const columnTasks = filteredTasks.filter((task) => task.status === status);
            return <div key={status} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex items-center justify-between px-2 py-2"><h2 className="text-sm font-semibold">{statusLabels[status]}</h2><span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">{columnTasks.length}</span></div>
              <div className="mt-2 space-y-3">{columnTasks.length ? columnTasks.map((task) => <TaskCard key={task.id} task={task} client={task.client_id ? clientById.get(task.client_id) : undefined} locale={locale} active={task.id === selectedId} onSelect={() => setSelectedId(task.id)} />) : <div className="rounded-[20px] border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--muted)]">Gol</div>}</div>
            </div>;
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[28px] border border-[var(--border)]">
          {filteredTasks.map((task) => <button key={task.id} type="button" onClick={() => setSelectedId(task.id)} className="grid w-full gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4 text-left last:border-b-0 hover:bg-[var(--surface-2)] sm:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr]"><div><p className="text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{task.client_id ? clientById.get(task.client_id)?.company || clientById.get(task.client_id)?.name || "Client" : task.kind === "work" ? "Lucrare" : "Task"}</p></div><ListValue label="Status" value={statusLabels[task.status]} /><ListValue label="Responsabil" value={task.assignee || "Nealocat"} /><ListValue label="Termen" value={formatDateTime(task.due_at, locale)} /></button>)}
        </div>
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          client={selectedTask.client_id ? clientById.get(selectedTask.client_id) : undefined}
          checklist={checklist}
          locale={locale}
          canWrite={canWrite}
          canDelete={canDelete}
          saving={saving}
          newChecklistTitle={newChecklistTitle}
          onChecklistTitle={setNewChecklistTitle}
          onAddChecklist={addChecklistItem}
          onToggleChecklist={toggleChecklistItem}
          onRemoveChecklist={removeChecklistItem}
          onStatus={(status) => void changeStatus(selectedTask, status)}
          onProgress={(progress) => void changeProgress(selectedTask, progress)}
          onDelete={() => void removeTask(selectedTask)}
        />
      )}

      <style jsx>{`
        .input { height: 44px; width: 100%; border-radius: 14px; border: 1px solid var(--border); background: var(--bg); padding: 0 14px; font-size: 14px; outline: none; color: var(--text); }
      `}</style>
    </div>
  );
}

function TaskCard({ task, client, locale, active, onSelect }: { task: WorkTask; client?: WorkTaskClient; locale: string; active: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`w-full rounded-[22px] border p-4 text-left transition ${active ? "border-[var(--accent)] bg-[var(--bg)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"}`}>
    <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{task.kind === "work" ? "Lucrare" : "Task"}</span><span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${task.priority === "urgent" ? "text-red-500" : task.priority === "high" ? "text-orange-500" : "text-[var(--muted)]"}`}>{priorityLabels[task.priority]}</span></div>
    <h3 className="mt-4 text-[15px] font-semibold leading-5">{task.title}</h3>
    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{client?.company || client?.name || task.location || "Fără client asociat"}</p>
    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${task.progress}%` }} /></div>
    <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]"><span>{task.assignee || "Nealocat"}</span><span>{task.due_at ? formatDateTime(task.due_at, locale) : "Fără termen"}</span></div>
  </button>;
}

function TaskDetail({ task, client, checklist, locale, canWrite, canDelete, saving, newChecklistTitle, onChecklistTitle, onAddChecklist, onToggleChecklist, onRemoveChecklist, onStatus, onProgress, onDelete }: {
  task: WorkTask;
  client?: WorkTaskClient;
  checklist: WorkTaskChecklistItem[];
  locale: string;
  canWrite: boolean;
  canDelete: boolean;
  saving: boolean;
  newChecklistTitle: string;
  onChecklistTitle: (value: string) => void;
  onAddChecklist: (event: FormEvent<HTMLFormElement>) => void;
  onToggleChecklist: (item: WorkTaskChecklistItem) => void;
  onRemoveChecklist: (item: WorkTaskChecklistItem) => void;
  onStatus: (status: WorkTaskStatus) => void;
  onProgress: (progress: number) => void;
  onDelete: () => void;
}) {
  const completedItems = checklist.filter((item) => item.done).length;
  return <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
    <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-medium text-[var(--muted)]">{task.kind === "work" ? "Lucrare" : "Task"} · {priorityLabels[task.priority]}</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-0.045em]">{task.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{client?.company || client?.name || "Fără client asociat"}</p></div><span className="self-start rounded-full bg-[var(--bg)] px-3 py-2 text-xs font-semibold">{statusLabels[task.status]}</span></div>
      {task.description && <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{task.description}</p>}
      <div className="mt-7 grid gap-3 sm:grid-cols-2"><DetailValue label="Responsabil" value={task.assignee || "Nealocat"} /><DetailValue label="Locație" value={task.location || "—"} /><DetailValue label="Programată" value={formatDateTime(task.scheduled_at, locale)} /><DetailValue label="Termen" value={formatDateTime(task.due_at, locale)} /><DetailValue label="Durată estimată" value={formatDuration(task.estimated_minutes)} /><DetailValue label="Progres" value={`${task.progress}%`} /></div>
      {canWrite && <div className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Status rapid</p><div className="mt-3 flex flex-wrap gap-2">{(["planned", "in_progress", "blocked", "done"] as WorkTaskStatus[]).map((status) => <button key={status} type="button" disabled={saving || task.status === status} onClick={() => onStatus(status)} className={`h-9 rounded-full px-3 text-xs font-semibold disabled:opacity-50 ${task.status === status ? "bg-[var(--button)] text-[var(--button-text)]" : "border border-[var(--border)]"}`}>{statusLabels[status]}</button>)}</div></div>}
      {canWrite && <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Progres</p><div className="mt-3 flex flex-wrap gap-2">{[0, 25, 50, 75, 100].map((progress) => <button key={progress} type="button" disabled={saving || task.progress === progress} onClick={() => onProgress(progress)} className={`h-9 rounded-full px-3 text-xs font-semibold disabled:opacity-50 ${task.progress === progress ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}>{progress}%</button>)}</div></div>}
      {canDelete && <div className="mt-8 border-t border-[var(--border)] pt-5"><button type="button" disabled={saving} onClick={onDelete} className="text-xs font-semibold text-red-500 disabled:opacity-50">Șterge lucrarea</button></div>}
    </article>

    <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium text-[var(--muted)]">Checklist</p><h2 className="mt-2 text-[26px] font-semibold tracking-[-0.04em]">Pașii lucrării</h2></div><span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">{completedItems}/{checklist.length}</span></div>
      <div className="mt-6 space-y-2">{checklist.length ? checklist.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-[18px] bg-[var(--bg)] p-3"><button type="button" disabled={!canWrite || saving} onClick={() => onToggleChecklist(item)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${item.done ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border-strong)]"}`}>{item.done ? "✓" : ""}</button><span className={`min-w-0 flex-1 text-sm ${item.done ? "text-[var(--muted)] line-through" : ""}`}>{item.title}</span>{canDelete && <button type="button" disabled={saving} onClick={() => onRemoveChecklist(item)} className="text-xs text-[var(--muted)]">×</button>}</div>) : <p className="rounded-[18px] border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--muted)]">Adaugă pașii esențiali ai lucrării.</p>}</div>
      {canWrite && <form onSubmit={onAddChecklist} className="mt-4 flex gap-2"><input value={newChecklistTitle} onChange={(event) => onChecklistTitle(event.target.value)} placeholder="Ex. Verifică presiunea instalației" className="h-11 min-w-0 flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm outline-none" /><button disabled={saving || !newChecklistTitle.trim()} className="h-11 rounded-[14px] bg-[var(--button)] px-4 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50">Adaugă</button></form>}
    </article>
  </section>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.05em]">{value}</p><p className="mt-2 text-xs text-[var(--muted-2)]">{note}</p></article>;
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="mb-2 block text-xs font-medium text-[var(--muted)]">{label}</span>{children}</label>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] bg-[var(--bg)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>;
}

function ListValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">{label}</p><p className="mt-1 text-xs font-medium">{value}</p></div>;
}
