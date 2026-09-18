"use client";

import { ModuleError } from "@/components/modules/ModuleKit";
import { loadOverviewSnapshot, type OverviewSnapshot } from "@/lib/modules/overview";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  organizationId: string;
  locale: string;
  timeZone: string;
  greetingName: string;
  dateLabel: string;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
  onOpenModule: (moduleId: OrbyvenModuleId) => void;
};

type Attention = {
  key: string;
  module: OrbyvenModuleId;
  title: string;
  meta: string;
  level: "urgent" | "normal";
};

type QuickAction = {
  id: OrbyvenModuleId;
  label: string;
  hint: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: "leads", label: "Cereri", hint: "Clienți noi" },
  { id: "tasks", label: "Lucrări", hint: "Ce ai de făcut" },
  { id: "calendar", label: "Calendar", hint: "Programul zilei" },
  { id: "estimates", label: "Oferte", hint: "Devize trimise" },
];

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

function dateKey(value: string, timeZone: string) {
  const p = zonedParts(new Date(value), timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function formatMoney(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

export default function OverviewModule({
  organizationId,
  locale,
  timeZone,
  greetingName,
  dateLabel,
  enabledModules,
  role,
  onOpenModule,
}: Props) {
  const [snapshot, setSnapshot] = useState<OverviewSnapshot | null>(null);
  const [snapshotNow, setSnapshotNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextSnapshot = await loadOverviewSnapshot(organizationId);
      setSnapshot(nextSnapshot);
      setSnapshotNow(new Date().getTime());
    } catch (loadError) {
      console.error(loadError);
      setError("Rezumatul businessului nu a putut fi încărcat.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const computed = useMemo(() => {
    if (!snapshot || !snapshotNow) return null;
    const nowIso = new Date(snapshotNow).toISOString();
    const today = dateKey(nowIso, timeZone);
    const currentMonth = today.slice(0, 7);
    const activeLeads = snapshot.leads.filter(
      (lead) => lead.kind === "lead" && !["won", "lost"].includes(lead.stage)
    );
    const openTasks = snapshot.tasks.filter(
      (task) => !["done", "cancelled"].includes(task.status)
    );
    const todayEvents = snapshot.events.filter(
      (event) =>
        event.status !== "cancelled" && dateKey(event.start_at, timeZone) === today
    );
    const sentEstimates = snapshot.estimates.filter(
      (estimate) => estimate.status === "sent"
    );
    const monthExpenses = snapshot.expenses
      .filter((expense) => expense.occurred_on.slice(0, 7) === currentMonth)
      .reduce((sum, expense) => sum + expense.amount_cents, 0);

    const attention: Attention[] = [];
    for (const lead of activeLeads) {
      if (
        lead.next_follow_up_at &&
        new Date(lead.next_follow_up_at).getTime() < snapshotNow
      ) {
        attention.push({
          key: `lead-${lead.id}`,
          module: "leads",
          title: `${lead.name} așteaptă follow-up`,
          meta: "Termenul de revenire a trecut.",
          level: "urgent",
        });
      }
    }

    for (const task of openTasks) {
      if (task.due_at && new Date(task.due_at).getTime() < snapshotNow) {
        attention.push({
          key: `task-${task.id}`,
          module: "tasks",
          title: task.title,
          meta: "Lucrare sau task întârziat.",
          level: "urgent",
        });
      } else if (task.priority === "urgent") {
        attention.push({
          key: `urgent-${task.id}`,
          module: "tasks",
          title: task.title,
          meta: "Prioritate urgentă.",
          level: "urgent",
        });
      }
    }

    for (const estimate of sentEstimates.slice(0, 4)) {
      const ageDays = Math.floor(
        (snapshotNow - new Date(estimate.updated_at).getTime()) / 86400000
      );
      if (ageDays >= 3) {
        attention.push({
          key: `estimate-${estimate.id}`,
          module: "estimates",
          title: `${estimate.reference} · ${estimate.title}`,
          meta: `Trimisă de ${ageDays} zile fără răspuns.`,
          level: "normal",
        });
      }
    }

    return {
      activeLeads,
      openTasks,
      todayEvents,
      sentEstimates,
      monthExpenses,
      attention: attention.slice(0, 6),
    };
  }, [snapshot, snapshotNow, timeZone]);

  if (loading) {
    return (
      <div className="flex min-h-[48vh] items-center justify-center">
        <div className="rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/70 px-4 py-2 text-xs font-medium text-[var(--muted)] backdrop-blur-xl">
          Se pregătește dashboardul…
        </div>
      </div>
    );
  }

  const activeQuickActions = QUICK_ACTIONS.filter((action) =>
    enabledModules.includes(action.id)
  );

  return (
    <div className="pb-24 md:pb-0">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            {dateLabel}
          </p>
          <h1 className="mt-2.5 text-[38px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[48px] lg:text-[54px]">
            Bună, {greetingName || "acolo"}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Tot ce contează azi, într-un singur loc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/70 px-3.5 text-[11px] font-semibold text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {roleLabels[role]}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="h-9 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/70 px-4 text-[11px] font-semibold transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
          >
            Actualizează
          </button>
        </div>
      </section>

      <div className="mt-4">
        <ModuleError message={error} />
      </div>

      {activeQuickActions.length ? (
        <section className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
            Acțiuni rapide
          </span>
          {activeQuickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onOpenModule(action.id)}
              className="group inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/62 px-3.5 text-left transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
            >
              <span className="text-[11px] font-semibold">{action.label}</span>
              <span className="hidden text-[10px] text-[var(--muted-2)] lg:inline">
                {action.hint}
              </span>
              <span className="text-[12px] text-[var(--muted)] transition group-hover:translate-x-0.5">
                →
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {snapshot && computed ? (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              label="Cereri active"
              value={String(computed.activeLeads.length)}
              note="de urmărit"
              enabled={enabledModules.includes("leads")}
              onClick={() => onOpenModule("leads")}
            />
            <MetricCard
              label="Lucrări deschise"
              value={String(computed.openTasks.length)}
              note="în lucru"
              enabled={enabledModules.includes("tasks")}
              onClick={() => onOpenModule("tasks")}
            />
            <MetricCard
              label="Astăzi"
              value={String(computed.todayEvents.length)}
              note="programări"
              enabled={enabledModules.includes("calendar")}
              onClick={() => onOpenModule("calendar")}
            />
            <MetricCard
              label="Oferte trimise"
              value={String(computed.sentEstimates.length)}
              note="în așteptare"
              enabled={enabledModules.includes("estimates")}
              onClick={() => onOpenModule("estimates")}
            />
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[1.18fr_0.82fr]">
            <article className="rounded-[22px] border border-[var(--border)] bg-[color:var(--surface)]/72 p-4 shadow-[0_14px_45px_rgba(0,0,0,0.035)] backdrop-blur-xl sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                    Priorități
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.035em]">
                    Ce necesită atenție
                  </h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[color:var(--bg)]/72 px-2.5 py-1 text-[10px] font-semibold text-[var(--muted)]">
                  {computed.attention.length}
                </span>
              </div>

              {computed.attention.length ? (
                <div className="mt-4 grid gap-2">
                  {computed.attention.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onOpenModule(item.module)}
                      className="group flex w-full items-center justify-between gap-4 rounded-[16px] border border-transparent bg-[color:var(--bg)]/72 px-3.5 py-3 text-left transition hover:border-[var(--border)] hover:bg-[var(--bg)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                          {item.meta}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.level === "urgent"
                              ? "bg-red-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="text-xs text-[var(--muted)] transition group-hover:translate-x-0.5">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-[136px] items-center justify-center rounded-[17px] border border-dashed border-[var(--border-strong)] bg-[color:var(--bg)]/44 px-5 text-center">
                  <div>
                    <p className="text-sm font-semibold">Totul e în regulă.</p>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                      Nu ai follow-up-uri sau lucrări întârziate.
                    </p>
                  </div>
                </div>
              )}
            </article>

            <article className="rounded-[22px] border border-[var(--border)] bg-[color:var(--surface-2)]/68 p-4 shadow-[0_14px_45px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                Business snapshot
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.035em]">
                Imaginea de ansamblu
              </h2>

              <div className="mt-4 grid gap-2">
                <SnapshotRow
                  label="Cheltuieli luna curentă"
                  value={formatMoney(computed.monthExpenses, locale)}
                  onClick={() => onOpenModule("expenses")}
                  enabled={enabledModules.includes("expenses")}
                />
                <SnapshotRow
                  label="Documente"
                  value={String(snapshot.documentCount)}
                  onClick={() => onOpenModule("documents")}
                  enabled={enabledModules.includes("documents")}
                />
                <SnapshotRow
                  label="Echipă activă"
                  value={String(snapshot.activeTeamCount)}
                  onClick={() => onOpenModule("team")}
                  enabled={enabledModules.includes("team")}
                />
                <SnapshotRow
                  label="Module active"
                  value={String(
                    enabledModules.filter((id) => id !== "overview").length
                  )}
                  enabled
                />
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  enabled,
  onClick,
}: {
  label: string;
  value: string;
  note: string;
  enabled: boolean;
  onClick: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[11px] font-medium text-[var(--muted)]">
          {label}
        </p>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            enabled ? "bg-[var(--accent)]" : "bg-[var(--muted-2)]/50"
          }`}
        />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[28px] font-semibold leading-none tracking-[-0.05em]">
          {enabled ? value : "—"}
        </p>
        <p className="text-[10px] text-[var(--muted-2)]">
          {enabled ? note : "inactiv"}
        </p>
      </div>
    </>
  );

  if (!enabled) {
    return (
      <div className="rounded-[18px] border border-[var(--border)] bg-[color:var(--surface-2)]/44 p-4 opacity-65">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-[var(--border)] bg-[color:var(--surface)]/72 p-4 text-left shadow-[0_10px_35px_rgba(0,0,0,0.025)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.05)]"
    >
      {content}
    </button>
  );
}

function SnapshotRow({
  label,
  value,
  onClick,
  enabled,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  enabled: boolean;
}) {
  const content = (
    <>
      <span className="min-w-0 truncate text-[12px] text-[var(--muted)]">
        {label}
      </span>
      <span className="shrink-0 text-[12px] font-semibold">
        {enabled ? value : "Inactiv"}
      </span>
    </>
  );

  return onClick && enabled ? (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[15px] border border-transparent bg-[color:var(--bg)]/68 px-3.5 py-3 text-left transition hover:border-[var(--border)] hover:bg-[var(--bg)]"
    >
      {content}
    </button>
  ) : (
    <div className="flex items-center justify-between gap-4 rounded-[15px] bg-[color:var(--bg)]/55 px-3.5 py-3">
      {content}
    </div>
  );
}
