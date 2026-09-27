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
  const canAccessFinances = ["owner", "admin", "manager"].includes(role);
  const [snapshotNow, setSnapshotNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextSnapshot = await loadOverviewSnapshot(organizationId, canAccessFinances);
      setSnapshot(nextSnapshot);
      setSnapshotNow(new Date().getTime());
    } catch (loadError) {
      console.error(loadError);
      setError("Rezumatul businessului nu a putut fi încărcat.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, canAccessFinances]);

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

    const days = Array.from({ length: 7 }, (_, index) =>
      dateKey(new Date(snapshotNow - (6 - index) * 86400000).toISOString(), timeZone)
    );
    const trend = (values: string[]) => days.map((day) => values.filter((value) => dateKey(value, timeZone) === day).length);
    const recent = [
      ...snapshot.leads.filter((item) => enabledModules.includes("leads")).map((item) => ({ id: item.id, module: "leads" as const, title: item.name, when: item.created_at, label: "Client / cerere" })),
      ...snapshot.tasks.filter((item) => enabledModules.includes("tasks")).map((item) => ({ id: item.id, module: "tasks" as const, title: item.title, when: item.created_at, label: "Lucrare" })),
      ...snapshot.estimates.filter((item) => enabledModules.includes("estimates")).map((item) => ({ id: item.id, module: "estimates" as const, title: item.title, when: item.created_at, label: "Ofertă" })),
    ].sort((left, right) => right.when.localeCompare(left.when)).slice(0, 4);

    return {
      activeLeads,
      openTasks,
      todayEvents,
      sentEstimates,
      monthExpenses,
      trends: {
        leads: trend(activeLeads.map((item) => item.created_at)),
        tasks: trend(openTasks.map((item) => item.created_at)),
        calendar: trend(snapshot.events.filter((item) => item.status !== "cancelled").map((item) => item.start_at)),
        estimates: trend(sentEstimates.map((item) => item.created_at)),
      },
      recent,
      attention: attention.filter((item) => enabledModules.includes(item.module)).sort((left, right) => (left.level === right.level ? 0 : left.level === "urgent" ? -1 : 1)),
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
    { label: "Anulate", count: snapshot?.tasks.filter((task) => task.status === "cancelled").length ?? 0, color: "#64748b" },
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

  const workflow = [
    { id: "leads" as const, label: "Cereri active", count: computed?.activeLeads.length ?? 0, color: "#7376f8" },
    { id: "tasks" as const, label: "Lucrări deschise", count: computed?.openTasks.length ?? 0, color: "#5b9cf9" },
    { id: "estimates" as const, label: "Oferte trimise", count: computed?.sentEstimates.length ?? 0, color: "#7bd1f6" },
    { id: "calendar" as const, label: "Programări astăzi", count: computed?.todayEvents.length ?? 0, color: "#7ad8b7" },
  ].filter((step) => enabledModules.includes(step.id));
  const maxWorkflow = Math.max(1, ...workflow.map((step) => step.count));

  return (
    <div className="pb-24 md:pb-0">
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">ORBYVEN / OVERVIEW</p>
          <h1 className="mt-1.5 text-[29px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[34px]">
            Bună, {greetingName || "acolo"}.
          </h1>
          <p className="mt-1.5 text-[12px] text-[var(--muted)]">{dateLabel} · Rezumatul firmei</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-[9px] border border-emerald-400/15 bg-emerald-400/[0.07] px-3 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {roleLabels[role]}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="h-8 rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-[10px] font-semibold transition hover:border-[var(--border-strong)]"
          >
            ↻ Actualizează
          </button>
        </div>
      </section>

      <div className="mt-3"><ModuleError message={error} /></div>

      {snapshot && computed ? (
        <>
          <section aria-label="Indicatori business" className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            <MetricCard label="Cereri active" value={computed.activeLeads.length} note="Noi în ultimele 7 zile" trend={computed.trends.leads} color="#7c7afa" enabled={enabledModules.includes("leads")} onClick={() => onOpenModule("leads")} />
            <MetricCard label="Lucrări deschise" value={computed.openTasks.length} note="Noi în ultimele 7 zile" trend={computed.trends.tasks} color="#66aaff" enabled={enabledModules.includes("tasks")} onClick={() => onOpenModule("tasks")} />
            <MetricCard label="Programări astăzi" value={computed.todayEvents.length} note="Programate în ultimele 7 zile" trend={computed.trends.calendar} color="#70d1eb" enabled={enabledModules.includes("calendar")} onClick={() => onOpenModule("calendar")} />
            <MetricCard label="Oferte trimise" value={computed.sentEstimates.length} note="Create în ultimele 7 zile" trend={computed.trends.estimates} color="#7ad5b4" enabled={enabledModules.includes("estimates")} onClick={() => onOpenModule("estimates")} />
          </section>

          <section className="mt-2.5 grid gap-2.5 xl:grid-cols-[1fr_1.04fr]">
            <article className="min-w-0 rounded-[13px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(27,54,91,0.33),transparent_52%)] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">OPERATIONS</p>
                  <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">Lucrări după status</h2>
                </div>
                <span className="rounded-[7px] border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]">În timp real</span>
              </div>
              {enabledModules.includes("tasks") ? (
                <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenModule("tasks")}
                    aria-label={"Deschide lucrările. Total: " + workTotal}
                    className="relative flex h-[180px] w-[180px] shrink-0 items-center justify-center rounded-full transition hover:scale-[1.02]"
                    style={{ background: workRing }}
                  >
                    <span className="flex h-[135px] w-[135px] flex-col items-center justify-center rounded-full bg-[var(--surface)] text-center">
                      <span className="text-[29px] font-semibold tracking-[-0.05em] tabular-nums">{workTotal}</span>
                      <span className="mt-0.5 text-[10px] text-[var(--muted)]">total înregistrări</span>
                    </span>
                  </button>
                  <div className="grid w-full gap-3.5">
                    {workStages.map((stage) => (
                      <div key={stage.label} className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="flex min-w-0 items-center gap-2 text-[var(--muted)]">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.label}
                        </span>
                        <span className="font-semibold tabular-nums">{stage.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex min-h-[185px] items-center justify-center rounded-[12px] border border-dashed border-[var(--border-strong)] text-sm text-[var(--muted)]">Activează modulul Lucrări pentru grafic.</div>
              )}
              <p className="mt-5 text-[10px] text-[var(--muted-2)]">Distribuție reală a lucrărilor și taskurilor din firma ta.</p>
            </article>

            <article className="min-w-0 rounded-[13px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(24,54,100,0.34),transparent_65%)] p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">BUSINESS FLOW</p>
              <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.03em]">Activitate pe etape</h2>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Volumul curent din modulele active</p>
              {workflow.length ? (
                <div className="mt-6 grid gap-4">
                  {workflow.map((step, index) => (
                    <button key={step.id} type="button" onClick={() => onOpenModule(step.id)}
                      className="group block w-full rounded-[9px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-medium text-[var(--text)]"><span className="mr-2 text-[10px] text-[var(--muted-2)]">{String(index + 1).padStart(2, "0")}</span>{step.label}</span>
                        <span className="text-[13px] font-semibold tabular-nums">{step.count}</span>
                      </div>
                      <div className="h-[14px] overflow-hidden rounded-[5px] bg-[var(--surface-2)]">
                        <div className="h-full min-w-[3px] rounded-[5px] transition-[width] duration-300" style={{ width: step.count ? (step.count / maxWorkflow * 100) + "%" : "0%", background: "linear-gradient(90deg," + step.color + "b0," + step.color + ")" }} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : <p className="mt-8 text-sm text-[var(--muted)]">Activează un modul pentru a vedea activitatea.</p>}
              <p className="mt-6 border-t border-[var(--border)] pt-3 text-[10px] leading-4 text-[var(--muted-2)]">Etape comparate ca volum, nu rată de conversie sau traseu complet al aceluiași client.</p>
            </article>
          </section>

          <section className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.04fr_0.96fr]">
            <article className="min-w-0 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">FOLLOW-UP</p><h2 className="mt-1 text-[15px] font-semibold">Ce necesită atenție</h2></div>
                <span className="rounded-[7px] bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">{computed.attention.length}</span>
              </div>
              {computed.attention.length ? (
                <div className="mt-3 grid gap-1.5">
                  {computed.attention.slice(0, 4).map((item) => (
                    <button key={item.key} type="button" onClick={() => onOpenModule(item.module, { recordId: item.recordId })}
                      className="group flex w-full items-center justify-between gap-3 rounded-[9px] border border-[var(--border)] bg-[var(--surface)]/65 px-3 py-2.5 text-left hover:border-[var(--border-strong)]">
                      <div className="min-w-0"><p className="truncate text-[12px] font-semibold">{item.title}</p><p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{item.meta}</p></div>
                      <span className={item.level === "urgent" ? "h-2 w-2 shrink-0 rounded-full bg-rose-400" : "h-2 w-2 shrink-0 rounded-full bg-amber-400"} />
                    </button>
                  ))}
                </div>
              ) : <p className="mt-4 rounded-[9px] border border-dashed border-[var(--border)] px-4 py-7 text-center text-[12px] text-[var(--muted)]">Nicio urgență înregistrată.</p>}
              {computed.attention.length > 4 && <p className="mt-2 text-[10px] text-[var(--muted)]">Încă {computed.attention.length - 4} atenționări · deschide modulele pentru detalii.</p>}
            </article>

            <article className="min-w-0 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">ACTIVITY</p>
              <h2 className="mt-1 text-[15px] font-semibold">Înregistrări recente</h2>
              {computed.recent.length ? (
                <div className="mt-3 grid gap-1.5">
                  {computed.recent.map((item) => (
                    <button key={item.module + item.id} type="button" onClick={() => onOpenModule(item.module, { recordId: item.id })}
                      className="flex items-center justify-between gap-3 rounded-[9px] border border-[var(--border)] bg-[var(--surface)]/65 px-3 py-2.5 text-left hover:border-[var(--border-strong)]">
                      <span className="min-w-0"><span className="block truncate text-[12px] font-semibold">{item.title}</span><span className="mt-0.5 block text-[10px] text-[var(--muted)]">{item.label}</span></span>
                      <span className="shrink-0 text-[10px] text-[var(--muted-2)]">{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone }).format(new Date(item.when))}</span>
                    </button>
                  ))}
                </div>
              ) : <p className="mt-4 rounded-[9px] border border-dashed border-[var(--border)] px-4 py-7 text-center text-[12px] text-[var(--muted)]">Încă nu există înregistrări.</p>}
            </article>
          </section>

          <section aria-label="Rezumat operațional" className="mt-2.5 grid gap-2 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/50 p-2 sm:grid-cols-2 xl:grid-cols-4">
            {canAccessFinances && <SnapshotRow label="Cheltuieli luna aceasta" value={formatMoney(computed.monthExpenses, locale)} onClick={() => onOpenModule("expenses")} enabled={enabledModules.includes("expenses")} />}
            <SnapshotRow label="Documente" value={String(snapshot.documentCount)} onClick={() => onOpenModule("documents")} enabled={enabledModules.includes("documents")} />
            <SnapshotRow label="Echipă activă" value={String(snapshot.activeTeamCount)} onClick={() => onOpenModule("team")} enabled={enabledModules.includes("team")} />
            <SnapshotRow label="Module active" value={String(enabledModules.filter((id) => id !== "overview").length)} enabled />
          </section>

          {activeQuickActions.length ? (
            <section aria-label="Acțiuni rapide" className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">ACȚIUNI RAPIDE</span>
              {activeQuickActions.map((action) => (
                <button key={action.id} type="button" onClick={() => onOpenModule(action.id, { create: true })}
                  className="h-8 rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-[11px] font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]">
                  {action.label}
                </button>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const high = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = 2 + index * 16;
    const y = 43 - value / high * 34;
    return x + "," + y.toFixed(1);
  }).join(" ");
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true" className="h-[48px] w-full overflow-visible">
      <polygon points={points + " 98,48 2,48"} fill={color} opacity="0.06" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => <circle key={index} cx={2 + index * 16} cy={43 - value / high * 34} r="1.7" fill={color} />)}
    </svg>
  );
}

function MetricCard({ label, value, note, trend, color, enabled, onClick }: {
  label: string;
  value: number;
  note: string;
  trend: number[];
  color: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" disabled={!enabled} onClick={onClick} className="relative min-w-0 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/60 px-3.5 pb-2.5 pt-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)] disabled:cursor-default disabled:opacity-50 sm:px-4">
      <span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-[var(--muted)]">{label}</span><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: enabled ? color : "var(--muted-2)" }} /></span>
      <span className="mt-2.5 block text-[28px] font-semibold leading-none tracking-[-0.045em] tabular-nums sm:text-[31px]">{enabled ? value : "—"}</span>
      <span className="mt-1.5 block text-[10px] text-[var(--muted-2)]">{enabled ? note : "Modul inactiv"}</span>
      <span className="mt-2 block h-[48px] w-full">{enabled ? <MiniTrend values={trend} color={color} /> : null}</span>
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
