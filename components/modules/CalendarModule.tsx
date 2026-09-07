"use client";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarClients,
  listCalendarEvents,
  listCalendarTasks,
  setCalendarEventStatus,
  type CalendarClient,
  type CalendarEvent,
  type CalendarEventStatus,
  type CalendarEventType,
  type CalendarTask,
} from "@/lib/modules/calendar";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
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
  timeZone: string;
  role: OrbyvenWorkspace["membership"]["role"];
};

type ViewMode = "week" | "agenda";
type TypeFilter = "all" | CalendarEventType;

type CreateForm = {
  title: string;
  eventType: CalendarEventType;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  clientId: string;
  taskId: string;
  assignee: string;
  location: string;
  reminderMinutes: string;
  notes: string;
};

const emptyForm: CreateForm = {
  title: "",
  eventType: "appointment",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  clientId: "",
  taskId: "",
  assignee: "",
  location: "",
  reminderMinutes: "30",
  notes: "",
};

const typeLabels: Record<CalendarEventType, string> = {
  appointment: "Programare",
  work: "Lucrare",
  follow_up: "Follow-up",
  internal: "Intern",
};

const statusLabels: Record<CalendarEventStatus, string> = {
  scheduled: "Programat",
  completed: "Finalizat",
  cancelled: "Anulat",
};

const typeStyles: Record<CalendarEventType, string> = {
  appointment: "bg-blue-500/10 text-blue-500",
  work: "bg-violet-500/10 text-violet-500",
  follow_up: "bg-amber-500/10 text-amber-600",
  internal: "bg-emerald-500/10 text-emerald-600",
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + distance);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyInTimeZone(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

function formatDayLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatRange(start: Date, locale: string) {
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

function formatTime(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function formatDateTime(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function toEventTimes(form: CreateForm) {
  if (!form.date) throw new Error("Alege data evenimentului.");
  if (form.allDay) {
    const start = dateFromKey(form.date);
    const end = addDays(start, 1);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  const start = new Date(`${form.date}T${form.startTime}:00`);
  const end = new Date(`${form.date}T${form.endTime}:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new Error("Ora evenimentului nu este validă.");
  }
  if (end <= start) throw new Error("Ora de final trebuie să fie după ora de început.");
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

export default function CalendarModule({
  organizationId,
  locale,
  timeZone,
  role,
}: Props) {
  const [weekStartKey, setWeekStartKey] = useState("");
  const [snapshotIso, setSnapshotIso] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<CalendarClient[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      setWeekStartKey(localDateKey(startOfWeek(now)));
      setSnapshotIso(now.toISOString());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const weekStart = useMemo(
    () => (weekStartKey ? dateFromKey(weekStartKey) : null),
    [weekStartKey]
  );

  const weekDays = useMemo(
    () => (weekStart ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : []),
    [weekStart]
  );

  const load = useCallback(async () => {
    if (!weekStart) return;
    setLoading(true);
    setError("");
    const rangeStart = weekStart.toISOString();
    const rangeEnd = addDays(weekStart, 7).toISOString();

    try {
      const [nextEvents, nextClients, nextTasks] = await Promise.all([
        listCalendarEvents(organizationId, rangeStart, rangeEnd),
        listCalendarClients(organizationId),
        listCalendarTasks(organizationId),
      ]);
      setEvents(nextEvents);
      setClients(nextClients);
      setTasks(nextTasks);
      setSnapshotIso(new Date().toISOString());
      setSelectedId((current) =>
        current && nextEvents.some((event) => event.id === current)
          ? current
          : nextEvents[0]?.id ?? null
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Calendarul nu a putut fi încărcat.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, weekStart]);

  useEffect(() => {
    if (!weekStart) return;
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, weekStart]);

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) => typeFilter === "all" || event.event_type === typeFilter
      ),
    [events, typeFilter]
  );

  const todayKey = useMemo(
    () => (snapshotIso ? dateKeyInTimeZone(snapshotIso, timeZone) : ""),
    [snapshotIso, timeZone]
  );

  const metrics = useMemo(() => {
    const scheduled = events.filter((event) => event.status === "scheduled").length;
    const today = todayKey
      ? events.filter(
          (event) =>
            event.status !== "cancelled" &&
            dateKeyInTimeZone(event.start_at, timeZone) === todayKey
        ).length
      : 0;
    const completed = events.filter((event) => event.status === "completed").length;
    const linked = events.filter((event) => event.client_id || event.task_id).length;
    return { scheduled, today, completed, linked };
  }, [events, timeZone, todayKey]);

  const openCreate = (date?: Date) => {
    const target = date ?? (snapshotIso ? new Date(snapshotIso) : weekStart ?? new Date());
    setForm({ ...emptyForm, date: localDateKey(target) });
    setCreateOpen(true);
    setError("");
  };

  const shiftWeek = (days: number) => {
    if (!weekStart) return;
    setWeekStartKey(localDateKey(addDays(weekStart, days)));
    setSelectedId(null);
  };

  const goToday = () => {
    const now = new Date();
    setWeekStartKey(localDateKey(startOfWeek(now)));
    setSnapshotIso(now.toISOString());
    setSelectedId(null);
  };

  const handleTaskSelection = (taskId: string) => {
    const task = taskId ? taskById.get(taskId) : null;
    setForm((current) => ({
      ...current,
      taskId,
      clientId: task?.client_id ?? current.clientId,
      eventType: taskId ? "work" : current.eventType,
    }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;

    setSaving(true);
    setError("");
    try {
      const times = toEventTimes(form);
      const created = await createCalendarEvent(organizationId, {
        title: form.title,
        eventType: form.eventType,
        startAt: times.startAt,
        endAt: times.endAt,
        allDay: form.allDay,
        clientId: form.clientId || null,
        taskId: form.taskId || null,
        assignee: form.assignee,
        location: form.location,
        notes: form.notes,
        reminderMinutes: form.reminderMinutes ? Number(form.reminderMinutes) : null,
      });
      setEvents((current) => [...current, created].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      setSelectedId(created.id);
      setCreateOpen(false);
      setForm(emptyForm);
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Evenimentul nu a putut fi creat."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (event: CalendarEvent, status: CalendarEventStatus) => {
    if (!canWrite || saving || event.status === status) return;
    setSaving(true);
    setError("");
    try {
      const updated = await setCalendarEventStatus(organizationId, event.id, status);
      setEvents((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
    } catch (statusError) {
      console.error(statusError);
      setError("Statusul programării nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (event: CalendarEvent) => {
    if (!canDelete || saving) return;
    setSaving(true);
    setError("");
    try {
      await deleteCalendarEvent(organizationId, event.id);
      setEvents((current) => current.filter((entry) => entry.id !== event.id));
      setSelectedId(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Evenimentul nu a putut fi șters.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Calendar · Live
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px]">
            Săptămâna, la vedere.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            Programări, lucrări și follow-up-uri într-un singur loc, legate de clienții și taskurile firmei.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`h-11 rounded-full px-5 text-sm font-semibold ${
              viewMode === "week"
                ? "bg-[var(--button)] text-[var(--button-text)]"
                : "border border-[var(--border-strong)]"
            }`}
          >
            Săptămână
          </button>
          <button
            type="button"
            onClick={() => setViewMode("agenda")}
            className={`h-11 rounded-full px-5 text-sm font-semibold ${
              viewMode === "agenda"
                ? "bg-[var(--button)] text-[var(--button-text)]"
                : "border border-[var(--border-strong)]"
            }`}
          >
            Agenda
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => openCreate()}
              className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
            >
              + Programare
            </button>
          )}
        </div>
      </section>

      <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Programate" value={String(metrics.scheduled)} note="în săptămâna curentă" />
        <Metric label="Astăzi" value={String(metrics.today)} note="evenimente active" />
        <Metric label="Finalizate" value={String(metrics.completed)} note="în săptămâna afișată" />
        <Metric label="Conectate" value={String(metrics.linked)} note="la client sau lucrare" />
      </section>

      {error && (
        <div className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <section className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shiftWeek(-7)} className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--bg)] text-sm">←</button>
          <button type="button" onClick={goToday} className="h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 text-xs font-semibold">Astăzi</button>
          <button type="button" onClick={() => shiftWeek(7)} className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--bg)] text-sm">→</button>
          <span className="ml-1 text-sm font-semibold">
            {weekStart ? formatRange(weekStart, locale) : "Se pregătește calendarul..."}
          </span>
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
          className="h-10 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 text-xs font-medium outline-none"
        >
          <option value="all">Toate tipurile</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </section>

      {createOpen && canWrite && (
        <form onSubmit={handleCreate} className="mt-4 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Eveniment nou</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Pune timpul la locul lui.</h2>
            </div>
            <button type="button" onClick={() => setCreateOpen(false)} className="text-sm text-[var(--muted)]">Închide</button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Titlu" className="xl:col-span-2">
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Vizită tehnică — Popescu" className="calendar-input" />
            </Field>
            <Field label="Tip">
              <select value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value as CalendarEventType }))} className="calendar-input">
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Data">
              <input required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="calendar-input" />
            </Field>
            <Field label="Client">
              <select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} className="calendar-input">
                <option value="">Fără client asociat</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.company || client.name}</option>)}
              </select>
            </Field>
            <Field label="Lucrare / task">
              <select value={form.taskId} onChange={(event) => handleTaskSelection(event.target.value)} className="calendar-input">
                <option value="">Fără lucrare asociată</option>
                {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </Field>
            <Field label="Responsabil">
              <input value={form.assignee} onChange={(event) => setForm((current) => ({ ...current, assignee: event.target.value }))} placeholder="Ex. Andrei" className="calendar-input" />
            </Field>
            <Field label="Locație">
              <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Adresă / online / sediu" className="calendar-input" />
            </Field>
            <Field label="Ora început">
              <input type="time" disabled={form.allDay} value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} className="calendar-input disabled:opacity-40" />
            </Field>
            <Field label="Ora final">
              <input type="time" disabled={form.allDay} value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} className="calendar-input disabled:opacity-40" />
            </Field>
            <Field label="Reminder">
              <select value={form.reminderMinutes} onChange={(event) => setForm((current) => ({ ...current, reminderMinutes: event.target.value }))} className="calendar-input">
                <option value="">Fără reminder</option>
                <option value="10">10 minute înainte</option>
                <option value="30">30 minute înainte</option>
                <option value="60">1 oră înainte</option>
                <option value="1440">1 zi înainte</option>
              </select>
            </Field>
            <label className="flex h-11 items-center gap-3 self-end rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-4 text-sm">
              <input type="checkbox" checked={form.allDay} onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked }))} />
              Toată ziua
            </label>
            <Field label="Notițe" className="md:col-span-2 xl:col-span-4">
              <textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Detalii utile, ce trebuie pregătit, context..." className="calendar-input min-h-[98px] py-3" />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <button disabled={saving} className="h-11 rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50">
              {saving ? "Se salvează..." : "Adaugă în calendar"}
            </button>
          </div>
        </form>
      )}

      {loading || !weekStart ? (
        <div className="mt-4 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">Se încarcă programul...</div>
      ) : viewMode === "week" ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-7">
          {weekDays.map((day) => {
            const key = localDateKey(day);
            const dayEvents = filteredEvents.filter(
              (event) => dateKeyInTimeZone(event.start_at, timeZone) === key
            );
            const isToday = key === todayKey;
            return (
              <article key={key} className={`min-h-[240px] rounded-[26px] border p-3 ${isToday ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-2)]"}`}>
                <div className="flex items-center justify-between gap-2 px-1 py-1">
                  <div>
                    <p className="text-xs font-semibold">{formatDayLabel(day, locale)}</p>
                    {isToday && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">Astăzi</p>}
                  </div>
                  {canWrite && <button type="button" onClick={() => openCreate(day)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg)] text-sm">+</button>}
                </div>
                <div className="mt-3 space-y-2">
                  {dayEvents.length ? dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} locale={locale} timeZone={timeZone} active={event.id === selectedId} onSelect={() => setSelectedId(event.id)} />
                  )) : <p className="rounded-[16px] border border-dashed border-[var(--border)] px-3 py-5 text-center text-[11px] text-[var(--muted)]">Liber</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[28px] border border-[var(--border)]">
          {filteredEvents.length ? filteredEvents.map((event) => (
            <button key={event.id} type="button" onClick={() => setSelectedId(event.id)} className="grid w-full gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4 text-left last:border-b-0 hover:bg-[var(--surface-2)] sm:grid-cols-[1.35fr_0.9fr_0.8fr_0.8fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{event.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${typeStyles[event.event_type]}`}>{typeLabels[event.event_type]}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{event.client_id ? clientById.get(event.client_id)?.company || clientById.get(event.client_id)?.name || "Client" : "Fără client"}</p>
              </div>
              <ListValue label="Când" value={event.all_day ? formatDayLabel(new Date(event.start_at), locale) : formatDateTime(event.start_at, locale, timeZone)} />
              <ListValue label="Responsabil" value={event.assignee || "Nealocat"} />
              <ListValue label="Status" value={statusLabels[event.status]} />
            </button>
          )) : <div className="p-10 text-center text-sm text-[var(--muted)]">Nu există evenimente pentru filtrul ales.</div>}
        </div>
      )}

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          client={selectedEvent.client_id ? clientById.get(selectedEvent.client_id) : undefined}
          task={selectedEvent.task_id ? taskById.get(selectedEvent.task_id) : undefined}
          locale={locale}
          timeZone={timeZone}
          canWrite={canWrite}
          canDelete={canDelete}
          saving={saving}
          onStatus={(status) => void changeStatus(selectedEvent, status)}
          onDelete={() => void removeEvent(selectedEvent)}
        />
      )}

      <style jsx>{`
        .calendar-input {
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

function EventCard({
  event,
  locale,
  timeZone,
  active,
  onSelect,
}: {
  event: CalendarEvent;
  locale: string;
  timeZone: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-[18px] border p-3 text-left transition ${active ? "border-[var(--accent)] bg-[var(--bg)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.07em] ${typeStyles[event.event_type]}`}>{typeLabels[event.event_type]}</span>
        <span className="text-[10px] text-[var(--muted)]">{event.all_day ? "Toată ziua" : formatTime(event.start_at, locale, timeZone)}</span>
      </div>
      <p className={`mt-3 text-[13px] font-semibold leading-5 ${event.status === "cancelled" ? "text-[var(--muted)] line-through" : ""}`}>{event.title}</p>
      {event.location && <p className="mt-2 truncate text-[10px] text-[var(--muted)]">{event.location}</p>}
    </button>
  );
}

function EventDetail({
  event,
  client,
  task,
  locale,
  timeZone,
  canWrite,
  canDelete,
  saving,
  onStatus,
  onDelete,
}: {
  event: CalendarEvent;
  client?: CalendarClient;
  task?: CalendarTask;
  locale: string;
  timeZone: string;
  canWrite: boolean;
  canDelete: boolean;
  saving: boolean;
  onStatus: (status: CalendarEventStatus) => void;
  onDelete: () => void;
}) {
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${typeStyles[event.event_type]}`}>{typeLabels[event.event_type]}</span>
            <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.045em]">{event.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{statusLabels[event.status]}</p>
          </div>
          {canWrite && (
            <div className="flex flex-wrap gap-2">
              {event.status !== "completed" && <button type="button" disabled={saving} onClick={() => onStatus("completed")} className="h-9 rounded-full bg-[var(--button)] px-3 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">Finalizează</button>}
              {event.status !== "scheduled" && <button type="button" disabled={saving} onClick={() => onStatus("scheduled")} className="h-9 rounded-full border border-[var(--border)] px-3 text-xs font-semibold disabled:opacity-50">Reprogramează</button>}
              {event.status !== "cancelled" && <button type="button" disabled={saving} onClick={() => onStatus("cancelled")} className="h-9 rounded-full border border-[var(--border)] px-3 text-xs font-semibold text-red-500 disabled:opacity-50">Anulează</button>}
            </div>
          )}
        </div>
        {event.notes && <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{event.notes}</p>}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <DetailValue label="Început" value={event.all_day ? "Toată ziua" : formatDateTime(event.start_at, locale, timeZone)} />
          <DetailValue label="Final" value={event.all_day ? "Sfârșitul zilei" : formatDateTime(event.end_at, locale, timeZone)} />
          <DetailValue label="Responsabil" value={event.assignee || "Nealocat"} />
          <DetailValue label="Locație" value={event.location || "—"} />
        </div>
        {canDelete && <div className="mt-8 border-t border-[var(--border)] pt-5"><button type="button" disabled={saving} onClick={onDelete} className="text-xs font-semibold text-red-500 disabled:opacity-50">Șterge evenimentul</button></div>}
      </article>

      <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
        <p className="text-xs font-medium text-[var(--muted)]">Context</p>
        <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.04em]">Totul legat.</h2>
        <div className="mt-6 space-y-3">
          <ContextItem label="Client" value={client?.company || client?.name || "Fără client asociat"} />
          <ContextItem label="Lucrare" value={task?.title || "Fără lucrare asociată"} />
          <ContextItem label="Reminder" value={event.reminder_minutes === null ? "Oprit" : event.reminder_minutes >= 1440 ? `${Math.round(event.reminder_minutes / 1440)} zi înainte` : event.reminder_minutes >= 60 ? `${Math.round(event.reminder_minutes / 60)}h înainte` : `${event.reminder_minutes} min înainte`} />
        </div>
      </article>
    </section>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.05em]">{value}</p><p className="mt-2 text-xs text-[var(--muted-2)]">{note}</p></article>;
}

function Field({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={className}><span className="mb-2 block text-xs font-medium text-[var(--muted)]">{label}</span>{children}</label>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] bg-[var(--bg)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>;
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] bg-[var(--bg)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>;
}

function ListValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">{label}</p><p className="mt-1 text-xs font-medium">{value}</p></div>;
}
