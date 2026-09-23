"use client";

import { ModuleError } from "@/components/modules/ModuleKit";
import { loadOverviewSnapshot, type OverviewSnapshot } from "@/lib/modules/overview";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  organizationId: string;
  locale: string;
  timeZone: string;
  greetingName: string;
  dateLabel: string;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

type Attention = {
  key: string;
  module: OrbyvenModuleId;
  recordId: string;
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
  { id: "leads", label: "+ Cerere", hint: "Client nou" },
  { id: "tasks", label: "+ Lucrare", hint: "De planificat" },
  { id: "calendar", label: "+ Programare", hint: "În calendar" },
  { id: "estimates", label: "+ Ofertă", hint: "Deviz nou" },
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
          recordId: lead.id,
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
          recordId: task.id,
          title: task.title,
          meta: "Lucrare sau task întârziat.",
          level: "urgent",
        });
      } else if (task.priority === "urgent") {
        attention.push({
          key: `urgent-${task.id}`,
          module: "tasks",
          recordId: task.id,
          title: task.title,
          meta: "Prioritate urgentă.",
          level: "urgent",
        });
      }
    }

    for (const estimate of sentEstimates) {
      const ageDays = Math.floor(
        (snapshotNow - new Date(estimate.updated_at).getTime()) / 86400000
      );
      if (ageDays >= 3) {
        attention.push({
          key: `estimate-${estimate.id}`,
          module: "estimates",
          recordId: estimate.id,
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
      attention: attention.filter((item) => enabledModules.includes(item.module)).sort((a, b) => (a.level === b.level ? 0 : a.level === "urgent" ? -1 : 1)),
    };
  }, [snapshot, snapshotNow, timeZone, enabledModules]);

  if (loading) {
    return (
      <div className="flex min-h-[48vh] items-center justify-center">
        <div className="rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/70 px-4 py-2 text-xs font-medium text-[var(--muted)] backdrop-blur-xl">
          Se pregătește dashboardul…
        </div>
      </div>
    );
  }

  const activeQuickActions = role === "viewer"
    ? []
    : QUICK_ACTIONS.filter((action) => enabledModules.includes(action.id));

  // The ring is based only on this organization's actual task statuses.
  const workStages = [
    { label: "De făcut", count: snapshot?.tasks.filter((task) => task.status === "planned").length ?? 0, color: "#738bff" },
    { label: "În lucru", count: snapshot?.tasks.filter((task) => task.status === "in_progress").length ?? 0, color: "#66bff0" },
    { label: "Blocate", count: snapshot?.tasks.filter((task) => task.status === "blocked").length ?? 0, color: "#efad77" },
    { label: "Finalizate", count: snapshot?.tasks.filter((task) => task.status === "done").length ?? 0, color: "#6ed3ae" },
  ];
  const workTotal = workStages.reduce((sum, stage) => sum + stage.count, 0);
  let currentAngle = 0;
  const ringSlices = workStages.filter((stage) => stage.count > 0).map((stage) => {
    const start = currentAngle;
    currentAngle += (stage.count / workTotal) * 360;
    return stage.color + " " + start + "deg " + currentAngle + "deg";
  });
  const workRing = workTotal
    ? "conic-gradient(" + ringSlices.join(",") + ")"
    : "conic-gradient(#2a405e 0deg 360deg)";

  return (
    <div className="pb-24 md:pb-0">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            {dateLabel}
          </p>
          <h1 className="mt-2 text-[36px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[43px] lg:text-[46px]">
            Bună, {greetingName || "acolo"}.
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-5 text-[var(--muted)]">
            Priorități clare. Activitatea firmei, dintr-o privire.
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
              onClick={() => onOpenModule(action.id, { create: true })}
              className="group inline-flex h-9 items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
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
          <section className="mt-5 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
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

          <section className="mt-3 grid gap-3 lg:grid-cols-[1.12fr_0.88fr]">
            <article className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]/65 p-4 sm:p-5">
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
                  {computed.attention.slice(0, 4).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onOpenModule(item.module, { recordId: item.recordId })}
                      className="group flex w-full items-center justify-between gap-4 rounded-[13px] border border-[var(--border)] bg-[var(--surface)]/65 px-3.5 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
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
                <div className="mt-4 flex min-h-[150px] items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/50 px-5 text-center">
                  <div>
                    <p className="text-sm font-semibold">Totul e în regulă.</p>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                      Nu ai follow-up-uri sau lucrări întârziate.
                    </p>
                  </div>
                </div>
              )}
            </article>

            <article className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]/65 p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                Activitate
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.035em]">
                Lucrările, pe scurt
              </h2>

              {enabledModules.includes("tasks") ? (
                <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenModule("tasks")}
                    aria-label={"Deschide lucrările. Total: " + workTotal}
                    className="relative flex h-[152px] w-[152px] shrink-0 items-center justify-center rounded-full transition hover:scale-[1.02]"
                    style={{ background: workRing }}
                  >
                    <span className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-[var(--surface)] text-center">
                      <span className="text-[29px] font-semibold tracking-[-0.05em]">{workTotal}</span>
                      <span className="text-[10px] text-[var(--muted)]">lucrări / taskuri</span>
                    </span>
                  </button>
                  <div className="grid w-full gap-3">
                    {workStages.map((stage) => (
                      <div key={stage.label} className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="flex min-w-0 items-center gap-2 text-[var(--muted)]">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: stage.color }} />
                          {stage.label}
                        </span>
                        <span className="font-semibold tabular-nums">{stage.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex min-h-[150px] items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] px-5 text-center text-sm text-[var(--muted)]">
                  Modulul Lucrări nu este activ.
                </div>
              )}
              <p className="mt-4 text-[11px] leading-5 text-[var(--muted-2)]">
                Distribuție după status, din datele firmei. Fără valori demonstrative.
              </p>
            </article>
          </section>

          <section className="mt-3 grid gap-2.5 rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]/65 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <SnapshotRow label="Cheltuieli luna aceasta" value={formatMoney(computed.monthExpenses, locale)} onClick={() => onOpenModule("expenses")} enabled={enabledModules.includes("expenses")} />
            <SnapshotRow label="Documente" value={String(snapshot.documentCount)} onClick={() => onOpenModule("documents")} enabled={enabledModules.includes("documents")} />
            <SnapshotRow label="Echipă activă" value={String(snapshot.activeTeamCount)} onClick={() => onOpenModule("team")} enabled={enabledModules.includes("team")} />
            <SnapshotRow label="Module active" value={String(enabledModules.filter((id) => id !== "overview").length)} enabled />
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
        <p className="text-[30px] font-semibold leading-none tracking-[-0.05em] tabular-nums">
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
      <div className="rounded-[15px] border border-[var(--border)] bg-[var(--surface-2)]/45 p-4 opacity-65">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[15px] border border-[var(--border)] bg-[var(--surface-2)]/70 p-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
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
      className="flex w-full items-center justify-between gap-4 rounded-[12px] border border-transparent bg-[var(--surface)]/65 px-3.5 py-3 text-left transition hover:border-[var(--border)] hover:bg-[var(--accent-soft)]"
    >
      {content}
    </button>
  ) : (
    <div className="flex items-center justify-between gap-4 rounded-[12px] bg-[var(--surface)]/65 px-3.5 py-3">
      {content}
    </div>
  );
}
