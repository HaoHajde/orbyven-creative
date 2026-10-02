"use client";

import {
  createWorkTask,
  createRecurringWorkFromTask,
  createWorkTaskChecklistItem,
  deleteWorkTask,
  deleteWorkTaskChecklistItem,
  listWorkTaskChecklist,
  listWorkTaskClients,
  listWorkTasks,
  loadWorkTaskContext,
  setWorkTaskChecklistItemDone,
  setWorkTaskProgress,
  setWorkTaskStatus,
  type WorkTask,
  type WorkTaskChecklistItem,
  type WorkTaskClient,
  type WorkTaskContext,
  type WorkTaskKind,
  type WorkTaskPriority,
  type WorkTaskStatus,
} from "@/lib/modules/tasks";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { attachAcceptedEstimateToTask } from "@/lib/modules/estimates";
import { scheduleCrmFollowUp } from "@/lib/modules/leads";
import {
  loadPostServiceGrowthState,
  recordPostServiceEvent,
} from "@/lib/modules/client-growth";
import { listTeamMembers, type TeamMember } from "@/lib/modules/team";
import {
  evaluatePostServiceGrowth,
  type PostServiceEventType,
  type PostServiceGrowthState,
} from "@/lib/automation/post-service-growth";
import { useWorkspaceCreateFocus, useWorkspaceRecordFocus, useWorkspaceSelectionWarp } from "@/components/modules/useWorkspaceRecordFocus";
import { useWorkspaceLiveContext } from "@/components/modules/useWorkspaceLiveContext";
import WorkFileSummary from "@/components/modules/tasks/WorkFileSummary";
import TaskChecklistPanel from "@/components/modules/tasks/TaskChecklistPanel";
import { completeElapsedWorkEventsForTask } from "@/lib/automation/status-sync";
import { ModuleAdvancedFields, ModuleNextAction, ModuleProgressiveMetrics } from "@/components/modules/ModuleKit";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  initialCreate?: boolean;
  initialRecordId?: string;
  initialClientId?: string;
  initialEstimateId?: string;
  initialTitle?: string;
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

const kindLabels: Record<WorkTaskKind, string> = {
  work: "Lucrare",
  order: "Comandă",
  task: "Task",
};

function kindLabel(kind: WorkTaskKind) {
  return kindLabels[kind];
}

const boardStatuses: WorkTaskStatus[] = [
  "planned",
  "in_progress",
  "blocked",
  "done",
];

const AFTERCARE_WINDOWS = [7, 30, 90, 180] as const;
const RECURRING_WORK_WINDOWS = [30, 90, 180, 365] as const;

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

export default function TasksModule({
  organizationId, locale, role, enabledModules, onOpenModule,
  initialCreate = false, initialRecordId, initialClientId, initialEstimateId, initialTitle,
}: Props) {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [clients, setClients] = useState<WorkTaskClient[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [checklist, setChecklist] = useState<WorkTaskChecklistItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialRecordId ?? null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(initialRecordId ? "list" : "board");
  const [createOpen, setCreateOpen] = useState(initialCreate && role !== "viewer");
  const [form, setForm] = useState<CreateForm>(() => ({
    ...emptyForm,
    clientId: initialClientId ?? "",
    title: initialTitle?.trim() || "",
  }));
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [snapshotIso, setSnapshotIso] = useState("");
  const [workContext, setWorkContext] = useState<WorkTaskContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [growthState, setGrowthState] = useState<PostServiceGrowthState | null>(null);
  const [growthLoading, setGrowthLoading] = useState(false);

  const canWrite = role !== "viewer";
  useWorkspaceCreateFocus(createOpen);
  const canDelete = role === "owner" || role === "admin" || role === "manager";
  const canAccessFinances = canDelete;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextTasks, nextClients, nextTeam] = await Promise.all([
        listWorkTasks(organizationId),
        listWorkTaskClients(organizationId),
        enabledModules.includes("team") ? listTeamMembers(organizationId) : Promise.resolve([]),
      ]);
      setTasks(nextTasks);
      setClients(nextClients);
      setTeamMembers(nextTeam);
      if (initialCreate && initialClientId) {
        const client = nextClients.find((item) => item.id === initialClientId);
        if (client) setForm((current) => ({ ...current, title: current.title || "Lucrare · " + (client.company || client.name) }));
      }
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
  }, [organizationId, initialCreate, initialClientId, enabledModules]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [selectedId, tasks]
  );
  useWorkspaceLiveContext({ taskId: selectedTask?.id, clientId: selectedTask?.client_id ?? undefined });
  useWorkspaceRecordFocus(initialRecordId, selectedId, loading);
  useWorkspaceSelectionWarp(selectedId, loading);

  useEffect(() => {
    if (!selectedTask) return;

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

  useEffect(() => {
    if (!selectedTask) return;

    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setContextLoading(true);
      setContextError("");
      setWorkContext(null);
      void loadWorkTaskContext(organizationId, selectedTask.id, {
        canAccessFinances,
        includeEstimates: enabledModules.includes("estimates"),
        includeDocuments: enabledModules.includes("documents"),
        includeCalendar: enabledModules.includes("calendar"),
        includeExpenses: enabledModules.includes("expenses"),
        includeInventory: enabledModules.includes("inventory"),
        includeThermal: enabledModules.includes("thermal"),
      })
        .then((nextContext) => {
          if (active) setWorkContext(nextContext);
        })
        .catch((contextLoadError) => {
          console.error(contextLoadError);
          if (active) {
            setWorkContext(null);
            setContextError("Dosarul lucrării nu a putut fi încărcat complet.");
          }
        })
        .finally(() => {
          if (active) setContextLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, selectedTask, canAccessFinances, enabledModules]);

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );

  useEffect(() => {
    if (
      !selectedTask ||
      selectedTask.status !== "done" ||
      selectedTask.kind === "task" ||
      !selectedTask.client_id
    ) {
      const timer = window.setTimeout(() => setGrowthState(null), 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setGrowthLoading(true);
      void loadPostServiceGrowthState(
        organizationId,
        selectedTask.client_id!,
        selectedTask.id
      )
        .then((state) => {
          if (active) setGrowthState(state);
        })
        .catch((growthError) => {
          console.error(growthError);
          if (active) setGrowthState(null);
        })
        .finally(() => {
          if (active) setGrowthLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, selectedTask]);

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
      (task) =>
        !["done", "cancelled"].includes(task.status) &&
        (task.priority === "urgent" ||
          Boolean(task.due_at && new Date(task.due_at).getTime() < new Date(snapshotIso).getTime()))
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
      if (initialEstimateId && created.kind === "work") {
        try {
          await attachAcceptedEstimateToTask(organizationId, initialEstimateId, created.id);
        } catch (linkError) {
          await deleteWorkTask(organizationId, created.id);
          throw linkError;
        }
      }
      setTasks((current) => [created, ...current]);
      setSelectedId(created.id);
      setForm(emptyForm);
      setCreateOpen(false);
    } catch (createError) {
      console.error(createError);
      setError(
        "Lucrarea nu a putut fi creată. Verifică datele și încearcă din nou."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task: WorkTask, status: WorkTaskStatus) => {
    if (!canWrite || saving || task.status === status) return;
    setSaving(true);
    setError("");
    try {
      const updated = await setWorkTaskStatus(organizationId, task.id, status);
      replaceTask(updated);
      if (status === "done" && enabledModules.includes("calendar")) {
        try {
          const sync = await completeElapsedWorkEventsForTask(organizationId, task.id);
          setSyncWarning(
            sync.futureScheduled > 0
              ? `Lucrarea este finalizată, dar ${sync.futureScheduled} programări de lucru viitoare sunt încă active. Verifică Calendarul.`
              : sync.completedEvents > 0
                ? `${sync.completedEvents} programări de lucru deja trecute au fost închise automat.`
                : ""
          );
        } catch (syncError) {
          console.error(syncError);
          setSyncWarning("Lucrarea este finalizată, dar programările trecute nu au putut fi sincronizate automat.");
        }
      } else {
        setSyncWarning("");
      }
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
      const updated = await setWorkTaskProgress(organizationId, task.id, progress);
      replaceTask(updated);
      if (progress === 100 && enabledModules.includes("calendar")) {
        try {
          const sync = await completeElapsedWorkEventsForTask(organizationId, task.id);
          setSyncWarning(
            sync.futureScheduled > 0
              ? `Lucrarea este la 100%, dar ${sync.futureScheduled} programări de lucru viitoare sunt încă active. Verifică Calendarul.`
              : sync.completedEvents > 0
                ? `${sync.completedEvents} programări de lucru deja trecute au fost închise automat.`
                : ""
          );
        } catch (syncError) {
          console.error(syncError);
          setSyncWarning("Lucrarea este la 100%, dar programările trecute nu au putut fi sincronizate automat.");
        }
      } else {
        setSyncWarning("");
      }
    } catch (progressError) {
      console.error(progressError);
      setError("Progresul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleAftercare = async (days: number) => {
    if (
      !selectedTask?.client_id ||
      selectedTask.status !== "done" ||
      selectedTask.kind === "task" ||
      saving
    ) return;

    const client = clientById.get(selectedTask.client_id);
    if (!client) return;

    const when = new Date(Date.now() + days * 86400000).toISOString();
    setSaving(true);
    setError("");
    try {
      const updatedClient = await scheduleCrmFollowUp(
        organizationId,
        client.id,
        when,
        `Aftercare programat la ${days} zile după finalizarea: ${selectedTask.title}.`
      );
      setClients((current) =>
        current.map((entry) =>
          entry.id === updatedClient.id
            ? { ...entry, next_follow_up_at: updatedClient.next_follow_up_at }
            : entry
        )
      );
    } catch (aftercareError) {
      console.error(aftercareError);
      setError("Revenirea către client nu a putut fi programată.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleRecurringWork = async (days: number) => {
    if (
      !selectedTask?.client_id ||
      selectedTask.status !== "done" ||
      selectedTask.kind === "task" ||
      saving
    ) return;

    const when = new Date(Date.now() + days * 86400000).toISOString();
    setSaving(true);
    setError("");
    try {
      const created = await createRecurringWorkFromTask(
        organizationId,
        selectedTask.id,
        when
      );
      setTasks((current) => [created, ...current]);
      setSelectedId(created.id);
      setViewMode("list");
    } catch (recurringError) {
      console.error(recurringError);
      setError("Următoarea lucrare nu a putut fi creată.");
    } finally {
      setSaving(false);
    }
  };

  const recordGrowthEvent = async (
    type: PostServiceEventType,
    score?: number
  ): Promise<boolean> => {
    if (
      !canWrite ||
      !selectedTask?.client_id ||
      selectedTask.status !== "done" ||
      selectedTask.kind === "task" ||
      saving
    ) return false;

    setSaving(true);
    setError("");
    try {
      await recordPostServiceEvent(
        organizationId,
        selectedTask.client_id,
        selectedTask.id,
        type,
        type === "feedback_scored" && score ? `Feedback înregistrat: ${score}/5.` : undefined,
        score
      );
      setGrowthState(
        await loadPostServiceGrowthState(
          organizationId,
          selectedTask.client_id,
          selectedTask.id
        )
      );
      setSnapshotIso(new Date().toISOString());
      return true;
    } catch (growthError) {
      console.error(growthError);
      setError("Starea post-serviciu nu a putut fi actualizată.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createGrowthEstimate = async () => {
    if (!selectedTask?.client_id || saving) return;
    const recorded = await recordGrowthEvent("upsell_offered");
    if (recorded) {
      onOpenModule("estimates", {
        create: true,
        clientId: selectedTask.client_id,
      });
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
      setError("Operațiunea nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Operations Core · Live
          </p>
          <h1 className="mt-2.5 text-[34px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[42px]">
            Lucrări & comenzi
          </h1>
          <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-[var(--muted)]">
            Același nucleu pentru lucrări, comenzi și taskuri: responsabil, termen,
            client, checklist și contextul comercial într-un singur loc.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`h-11 rounded-full px-5 text-sm font-semibold ${
              viewMode === "board"
                ? "bg-[var(--button)] text-[var(--button-text)]"
                : "border border-[var(--border-strong)]"
            }`}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`h-11 rounded-full px-5 text-sm font-semibold ${
              viewMode === "list"
                ? "bg-[var(--button)] text-[var(--button-text)]"
                : "border border-[var(--border-strong)]"
            }`}
          >
            Listă
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => setCreateOpen((open) => !open)}
              className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
            >
              + Nou
            </button>
          )}
        </div>
      </section>

      <ModuleProgressiveMetrics
        className="mt-9"
        primary={<>
          <Metric label="Active" value={String(metrics.active)} note="de făcut sau în lucru" />
          <Metric label="Astăzi" value={String(metrics.today)} note="programate sau scadente" />
          <Metric label="Atenție" value={String(metrics.urgent)} note="urgente sau întârziate" />
        </>}
        secondary={<Metric label="Finalizate" value={String(metrics.done)} note="istoric păstrat" />}
      />

      {error && (
        <div className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}
      {syncWarning ? (
        <p className="mt-3 rounded-[14px] border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[11px] leading-5 text-amber-300">
          {syncWarning}
        </p>
      ) : null}

      {createOpen && canWrite && (
        <form
          data-workspace-create-focus={createOpen ? "true" : undefined}
          onSubmit={handleCreate}
          className="mt-4 scroll-mt-28 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Operațiune nouă</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                Lucrare, comandă sau task.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-sm text-[var(--muted)]"
            >
              Închide
            </button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Titlu" className="xl:col-span-2">
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ex. Montaj centrală termică"
                className="input"
              />
            </Field>
            <Field label="Tip">
              <select
                value={form.kind}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    kind: event.target.value as WorkTaskKind,
                  }))
                }
                className="input"
              >
                <option value="work">Lucrare</option>
                <option value="order">Comandă</option>
                <option value="task">Task</option>
              </select>
            </Field>
            <Field label="Client">
              <select
                value={form.clientId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, clientId: event.target.value }))
                }
                className="input"
              >
                <option value="">Fără client asociat</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company || client.name} · {client.kind === "client" ? "client" : "lead"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <ModuleAdvancedFields label="Planificare și responsabilitate">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Prioritate">
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as WorkTaskPriority,
                  }))
                }
                className="input"
              >
                <option value="low">Scăzută</option>
                <option value="normal">Normală</option>
                <option value="high">Ridicată</option>
                <option value="urgent">Urgentă</option>
              </select>
            </Field>
            <Field label="Responsabil">
              <input
                value={form.assignee}
                onChange={(event) =>
                  setForm((current) => ({ ...current, assignee: event.target.value }))
                }
                placeholder="Ex. Mihai"
                className="input"
              />
            </Field>
            <Field label="Locație">
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
                placeholder="Adresă / punct de lucru"
                className="input"
              />
            </Field>
            <Field label="Durată estimată">
              <input
                type="number"
                min="0"
                step="15"
                value={form.estimatedMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estimatedMinutes: event.target.value,
                  }))
                }
                placeholder="minute"
                className="input"
              />
            </Field>
            <Field label="Programată">
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledAt: event.target.value,
                  }))
                }
                className="input"
              />
            </Field>
            <Field label="Termen">
              <input
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueAt: event.target.value }))
                }
                className="input"
              />
            </Field>
            <Field label="Descriere" className="md:col-span-2">
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Ce trebuie făcut, materiale, observații..."
                className="input min-h-[98px] py-3"
              />
            </Field>
            </div>
          </ModuleAdvancedFields>
          <div className="mt-5 flex justify-end">
            <button
              disabled={saving}
              className="h-11 rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50"
            >
              {saving ? "Se salvează..." : "Creează"}
            </button>
          </div>
        </form>
      )}

      <section className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Caută lucrare, comandă, client, responsabil sau locație..."
          className="h-11 min-w-0 flex-1 rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="h-11 rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm outline-none"
        >
          <option value="all">Toate statusurile</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      {loading ? (
        <div className="mt-4 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
          Se încarcă lucrările...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="mt-4 rounded-[30px] border border-dashed border-[var(--border-strong)] p-10 text-center">
          <h2 className="text-xl font-semibold">Nimic de urmărit aici.</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Creează prima lucrare, comandă sau task ori schimbă filtrele.
          </p>
        </div>
      ) : viewMode === "board" && statusFilter !== "cancelled" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-4">
          {boardStatuses.map((status) => {
            const columnTasks = filteredTasks.filter((task) => task.status === status);
            return (
              <div
                key={status}
                className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-3"
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <h2 className="text-sm font-semibold">{statusLabels[status]}</h2>
                  <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="mt-2 space-y-3">
                  {columnTasks.length ? (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        client={task.client_id ? clientById.get(task.client_id) : undefined}
                        locale={locale}
                        active={task.id === selectedId}
                        onSelect={() => setSelectedId(task.id)}
                      />
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--muted)]">
                      Gol
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[28px] border border-[var(--border)]">
          {filteredTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedId(task.id)}
              className="grid w-full gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4 text-left last:border-b-0 hover:bg-[var(--surface-2)] sm:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr]"
            >
              <div>
                <p className="text-sm font-semibold">{task.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {task.client_id
                    ? clientById.get(task.client_id)?.company ||
                      clientById.get(task.client_id)?.name ||
                      "Client"
                    : kindLabel(task.kind)}
                </p>
              </div>
              <ListValue label="Status" value={statusLabels[task.status]} />
              <ListValue label="Responsabil" value={task.assignee || "Nealocat"} />
              <ListValue label="Termen" value={formatDateTime(task.due_at, locale)} />
            </button>
          ))}
        </div>
      )}

      {selectedTask && canWrite ? (
        <div className="mt-4">
          {selectedTask.kind !== "task" && enabledModules.includes("estimates") && (workContext?.acceptedEstimatesCount ?? 0) === 0 ? (
            <ModuleNextAction
              title="Pregătește sau validează oferta"
              description="Execuția rămâne legată de o ofertă acceptată."
              action={<button type="button" onClick={() => onOpenModule("estimates", { create: true, taskId: selectedTask.id, clientId: selectedTask.client_id ?? undefined })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Ofertă</button>}
            />
          ) : enabledModules.includes("inventory") && (workContext?.inventoryUnreadyLines ?? 0) > 0 ? (
            <ModuleNextAction
              title="Rezolvă materialele înainte de execuție"
              description={`${workContext?.inventoryUnreadyLines ?? 0} poziții necesită rezervare sau aprovizionare.`}
              action={<button type="button" onClick={() => onOpenModule("inventory", { taskId: selectedTask.id })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">Deschide stocul →</button>}
            />
          ) : enabledModules.includes("calendar") && selectedTask.status !== "done" && selectedTask.status !== "cancelled" && (workContext?.upcomingEventsCount ?? 0) === 0 ? (
            <ModuleNextAction
              title="Programează lucrarea"
              description="Clientul și lucrarea sunt completate automat în calendar."
              action={<button type="button" onClick={() => onOpenModule("calendar", { create: true, taskId: selectedTask.id, clientId: selectedTask.client_id ?? undefined })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Programare</button>}
            />
          ) : null}
          <details className="mt-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/45">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-[var(--muted)] [&::-webkit-details-marker]:hidden">Alte acțiuni</summary>
            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-3">
              {enabledModules.includes("leads") && selectedTask.client_id && <button type="button" onClick={() => onOpenModule("leads", { recordId: selectedTask.client_id! })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">Client ↗</button>}
              {canAccessFinances && enabledModules.includes("expenses") && <button type="button" onClick={() => onOpenModule("expenses", { create: true, clientId: selectedTask.client_id ?? undefined, taskId: selectedTask.id })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Cheltuială</button>}
              {selectedTask.kind !== "task" && enabledModules.includes("estimates") && <button type="button" onClick={() => onOpenModule("estimates", { create: true, taskId: selectedTask.id, clientId: selectedTask.client_id ?? undefined })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Ofertă</button>}
              {enabledModules.includes("calendar") && <button type="button" onClick={() => onOpenModule("calendar", { create: true, taskId: selectedTask.id, clientId: selectedTask.client_id ?? undefined })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Programare</button>}
            </div>
          </details>
        </div>
      )}
      {selectedTask &&
        selectedTask.status === "done" &&
        selectedTask.kind !== "task" &&
        selectedTask.client_id &&
        enabledModules.includes("leads") &&
        clientById.get(selectedTask.client_id) && (
          <AftercarePanel
            client={clientById.get(selectedTask.client_id)!}
            locale={locale}
            nowIso={snapshotIso}
            saving={saving}
            canWrite={canWrite}
            onSchedule={(days) => void scheduleAftercare(days)}
            onRepeat={(days) => void scheduleRecurringWork(days)}
            onOpenClient={() => onOpenModule("leads", { recordId: selectedTask.client_id! })}
          />
        )}
      {selectedTask &&
        selectedTask.status === "done" &&
        selectedTask.kind !== "task" &&
        selectedTask.client_id &&
        enabledModules.includes("leads") && (
          <PostServiceGrowthPanel
            task={selectedTask}
            state={growthState}
            loading={growthLoading}
            nowIso={snapshotIso}
            saving={saving}
            canWrite={canWrite}
            estimatesEnabled={enabledModules.includes("estimates")}
            onEvent={(type, score) => void recordGrowthEvent(type, score)}
            onOpenClient={() => onOpenModule("leads", { recordId: selectedTask.client_id! })}
            onCreateRecovery={() => onOpenModule("tasks", { create: true, clientId: selectedTask.client_id! })}
            onCreateEstimate={() => void createGrowthEstimate()}
          />
        )}
      {selectedTask && (
        <WorkFileSummary
          task={selectedTask}
          context={workContext}
          checklist={checklist}
          inactiveAssigneeNames={teamMembers
            .filter((member) => member.status === "inactive")
            .map((member) => member.display_name)}
          snapshotIso={snapshotIso}
          loading={contextLoading}
          error={contextError}
          locale={locale}
          enabledModules={enabledModules}
          canAccessFinances={canAccessFinances}
          onOpenModule={onOpenModule}
        />
      )}
      {selectedTask && (
        <div data-workspace-record-focus={selectedTask ? "true" : undefined} className="scroll-mt-28">
        <TaskDetail
          task={selectedTask}
          client={
            selectedTask.client_id ? clientById.get(selectedTask.client_id) : undefined
          }
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
        </div>
      )}

      <style jsx>{`
        .input {
          height: 44px;
          width: 100%;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--bg);
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          color: var(--text);
        }
      `}</style>
    </div>
  );
}

function PostServiceGrowthPanel({
  task,
  state,
  loading,
  nowIso,
  saving,
  canWrite,
  estimatesEnabled,
  onEvent,
  onOpenClient,
  onCreateRecovery,
  onCreateEstimate,
}: {
  task: WorkTask;
  state: PostServiceGrowthState | null;
  loading: boolean;
  nowIso: string;
  saving: boolean;
  canWrite: boolean;
  estimatesEnabled: boolean;
  onEvent: (type: PostServiceEventType, score?: number) => void;
  onOpenClient: () => void;
  onCreateRecovery: () => void;
  onCreateEstimate: () => void;
}) {
  if (loading) {
    return (
      <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
        Se încarcă bucla post-serviciu…
      </section>
    );
  }
  if (!state) return null;

  const action = evaluatePostServiceGrowth({
    taskTitle: task.title,
    completedAt: task.completed_at,
    state,
    now: nowIso ? new Date(nowIso) : new Date(0),
  });
  const reviewResolved = Boolean(state.reviewCompletedAt || state.reviewDeclinedAt);
  const referralResolved = Boolean(state.referralReceivedAt || state.referralDeclinedAt);

  return (
    <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">
            ORBYVEN · POST-SERVICE GROWTH
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">
              Feedback → review → recomandare → oportunitate nouă.
            </h2>
            {state.feedbackScore !== null && (
              <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold">
                {state.feedbackScore}/5
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            {action?.detail ?? "Fluxul este în regulă; ORBYVEN va ridica următorul pas când devine relevant."}
          </p>
        </div>
        {action && (
          <span className="self-start rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
            {action.level === "urgent" ? "Prioritar" : action.level === "attention" ? "Recomandat" : "Următorul pas"}
          </span>
        )}
      </div>

      {canWrite && (
        <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
          {(state.feedback === "none" || state.feedback === "requested") && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
                Feedback client
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.feedback === "none" && (
                  <button type="button" disabled={saving} onClick={() => onEvent("feedback_requested")} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">
                    Marchează feedback cerut
                  </button>
                )}
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    disabled={saving}
                    onClick={() => onEvent("feedback_scored", score)}
                    className="h-9 min-w-10 rounded-full bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent)] disabled:opacity-50"
                  >
                    {score}★
                  </button>
                ))}
                <button type="button" disabled={saving} onClick={() => onEvent("feedback_issue")} className="h-9 rounded-full border border-rose-400/30 px-3.5 text-xs font-semibold text-rose-500 disabled:opacity-50">
                  Problemă raportată
                </button>
              </div>
            </div>
          )}

          {state.feedback === "issue" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-500">
                Recovery
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={onOpenClient} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold">
                  Deschide clientul
                </button>
                <button type="button" onClick={onCreateRecovery} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)]">
                  + Lucrare de remediere
                </button>
                <button type="button" disabled={saving} onClick={() => onEvent("recovery_resolved")} className="h-9 rounded-full border border-emerald-500/30 px-3.5 text-xs font-semibold text-emerald-600 disabled:opacity-50">
                  Remediere rezolvată ✓
                </button>
              </div>
            </div>
          )}

          {state.feedback === "positive" &&
            !state.reviewRequestedAt &&
            !reviewResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Review</p>
                <button type="button" disabled={saving} onClick={() => onEvent("review_requested")} className="mt-2 h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                  Marchează review cerut
                </button>
              </div>
            )}

          {state.feedback === "positive" &&
            state.reviewRequestedAt &&
            !reviewResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Rezultat review</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={saving} onClick={() => onEvent("review_completed")} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                    Review primit ✓
                  </button>
                  <button type="button" disabled={saving} onClick={() => onEvent("review_declined")} className="h-9 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                    Nu dorește
                  </button>
                </div>
              </div>
            )}

          {state.feedback === "positive" &&
            state.reviewCompletedAt &&
            !state.referralRequestedAt &&
            !referralResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Recomandare</p>
                <button type="button" disabled={saving} onClick={() => onEvent("referral_requested")} className="mt-2 h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">
                  Marchează recomandare cerută
                </button>
              </div>
            )}

          {state.feedback === "positive" &&
            state.reviewCompletedAt &&
            state.referralRequestedAt &&
            !referralResolved && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Rezultat recomandare</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={saving} onClick={() => onEvent("referral_received")} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                    Recomandare primită ✓
                  </button>
                  <button type="button" disabled={saving} onClick={() => onEvent("referral_declined")} className="h-9 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-50">
                    Nu acum
                  </button>
                </div>
              </div>
            )}

          {action?.rule === "post_service_upsell" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Oportunitate nouă</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {estimatesEnabled && (
                  <button type="button" disabled={saving} onClick={onCreateEstimate} className="h-9 rounded-full bg-[var(--button)] px-3.5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
                    + Ofertă nouă
                  </button>
                )}
                <button type="button" disabled={saving} onClick={() => onEvent("upsell_scheduled")} className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50">
                  Amintește-mi peste 30 zile
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AftercarePanel({
  client,
  locale,
  nowIso,
  saving,
  canWrite,
  onSchedule,
  onRepeat,
  onOpenClient,
}: {
  client: WorkTaskClient;
  locale: string;
  nowIso: string;
  saving: boolean;
  canWrite: boolean;
  onSchedule: (days: number) => void;
  onRepeat: (days: number) => void;
  onOpenClient: () => void;
}) {
  const followUp = client.next_follow_up_at;
  const followUpIsFuture = followUp
    ? new Date(followUp).getTime() > new Date(nowIso || "1970-01-01T00:00:00.000Z").getTime()
    : false;

  return (
    <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">
            ORBYVEN · AFTERCARE
          </p>
          <h2 className="mt-1 text-[15px] font-semibold">
            Nu lăsa relația cu clientul să se închidă odată cu lucrarea.
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            {followUp
              ? `Revenire ${followUpIsFuture ? "programată" : "restantă"}: ${formatDateTime(followUp, locale)}`
              : "Programează următorul contact pentru mentenanță, feedback sau o comandă repetată."}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenClient}
          className="h-9 self-start rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold"
        >
          Fișa clientului ↗
        </button>
      </div>
      {canWrite && (
        <>
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
              Revenire client
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AFTERCARE_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={saving}
                  onClick={() => onSchedule(days)}
                  className="h-9 rounded-full bg-[var(--accent-soft)] px-3.5 text-xs font-semibold text-[var(--accent)] disabled:opacity-50"
                >
                  În {days} zile
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
              Lucrare recurentă
            </p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
              Creează următoarea lucrare cu același client, locație, durată și checklist. Responsabilul rămâne nealocat.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RECURRING_WORK_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={saving}
                  onClick={() => onRepeat(days)}
                  className="h-9 rounded-full border border-[var(--border-strong)] px-3.5 text-xs font-semibold disabled:opacity-50"
                >
                  Repetă în {days === 365 ? "1 an" : days + " zile"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TaskCard({
  task,
  client,
  locale,
  active,
  onSelect,
}: {
  task: WorkTask;
  client?: WorkTaskClient;
  locale: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[22px] border p-4 text-left transition ${
        active
          ? "border-[var(--accent)] bg-[var(--bg)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          {kindLabel(task.kind)}
        </span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${
            task.priority === "urgent"
              ? "text-red-500"
              : task.priority === "high"
                ? "text-orange-500"
                : "text-[var(--muted)]"
          }`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold leading-5">{task.title}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
        {client?.company || client?.name || task.location || "Fără client asociat"}
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${task.progress}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
        <span>{task.assignee || "Nealocat"}</span>
        <span>
          {task.due_at ? formatDateTime(task.due_at, locale) : "Fără termen"}
        </span>
      </div>
    </button>
  );
}

function TaskDetail({
  task,
  client,
  checklist,
  locale,
  canWrite,
  canDelete,
  saving,
  newChecklistTitle,
  onChecklistTitle,
  onAddChecklist,
  onToggleChecklist,
  onRemoveChecklist,
  onStatus,
  onProgress,
  onDelete,
}: {
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
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">
              {kindLabel(task.kind)} · {priorityLabels[task.priority]}
            </p>
            <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.045em]">
              {task.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {client?.company || client?.name || "Fără client asociat"}
            </p>
          </div>
          <span className="self-start rounded-full bg-[var(--bg)] px-3 py-2 text-xs font-semibold">
            {statusLabels[task.status]}
          </span>
        </div>
        {task.description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
            {task.description}
          </p>
        )}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <DetailValue label="Responsabil" value={task.assignee || "Nealocat"} />
          <DetailValue label="Locație" value={task.location || "—"} />
          <DetailValue label="Programată" value={formatDateTime(task.scheduled_at, locale)} />
          <DetailValue label="Termen" value={formatDateTime(task.due_at, locale)} />
          <DetailValue label="Durată estimată" value={formatDuration(task.estimated_minutes)} />
          <DetailValue label="Progres" value={`${task.progress}%`} />
        </div>
        {canWrite && (
          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Status rapid
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["planned", "in_progress", "blocked", "done"] as WorkTaskStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={saving || task.status === status}
                    onClick={() => onStatus(status)}
                    className={`h-9 rounded-full px-3 text-xs font-semibold disabled:opacity-50 ${
                      task.status === status
                        ? "bg-[var(--button)] text-[var(--button-text)]"
                        : "border border-[var(--border)]"
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                )
              )}
            </div>
          </div>
        )}
        {canWrite && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Progres
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[0, 25, 50, 75, 100].map((progress) => (
                <button
                  key={progress}
                  type="button"
                  disabled={saving || task.progress === progress}
                  onClick={() => onProgress(progress)}
                  className={`h-9 rounded-full px-3 text-xs font-semibold disabled:opacity-50 ${
                    task.progress === progress
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border)]"
                  }`}
                >
                  {progress}%
                </button>
              ))}
            </div>
          </div>
        )}
        {canDelete && (
          <div className="mt-8 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              disabled={saving}
              onClick={onDelete}
              className="text-xs font-semibold text-red-500 disabled:opacity-50"
            >
              Șterge operațiunea
            </button>
          </div>
        )}
      </article>

      <TaskChecklistPanel
        checklist={checklist}
        canWrite={canWrite}
        canDelete={canDelete}
        saving={saving}
        newChecklistTitle={newChecklistTitle}
        onChecklistTitle={onChecklistTitle}
        onAddChecklist={onAddChecklist}
        onToggleChecklist={onToggleChecklist}
        onRemoveChecklist={onRemoveChecklist}
      />
    </section>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.05em]">
        {value}
      </p>
      <p className="mt-2 text-xs text-[var(--muted-2)]">{note}</p>
    </article>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-medium text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--bg)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function ListValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium">{value}</p>
    </div>
  );
}
