import { useCallback, useEffect, useMemo, useState } from "react";
import { loadOverviewSnapshot, type OverviewSnapshot } from "@/lib/modules/overview";
import {
  buildBusinessAutomationSignals,
  type AutomationEstimate,
  type AutomationEvent,
  type AutomationOperation,
} from "@/lib/automation/business-signals";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";

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

const QUICK_ACTIONS: Array<{ id: OrbyvenModuleId; label: string }> = [
  { id: "leads", label: "+ Cerere" },
  { id: "tasks", label: "+ Lucrare" },
  { id: "calendar", label: "+ Programare" },
  { id: "estimates", label: "+ Ofertă" },
];

const roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

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
  return p.year + "-" + p.month + "-" + p.day;
}

function formatMoney(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const high = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = 2 + index * 16;
    const y = 43 - value / high * 34;
    return x + "," + y.toFixed(1);
  }).join(" ");
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true" className="overview-mini-trend">
      <polygon points={points + " 98,48 2,48"} fill={color} opacity="0.06" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => (
        <circle key={index} cx={2 + index * 16} cy={43 - value / high * 34} r="1.7" fill={color} />
      ))}
    </svg>
  );
}

export default function DesktopOverviewPanel({
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
  const canAccessFinances = ["owner", "admin", "manager"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await loadOverviewSnapshot(
        organizationId,
        canAccessFinances,
        timeZone,
        enabledModules.includes("team"),
      );
      setSnapshot(next);
      setSnapshotNow(Date.now());
    } catch (cause) {
      console.error("Desktop overview:", cause);
      setError("Rezumatul businessului nu a putut fi încărcat.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, canAccessFinances, timeZone, enabledModules]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const computed = useMemo(() => {
    if (!snapshot || !snapshotNow) return null;
    const now = new Date(snapshotNow);
    const nowIso = now.toISOString();
    const today = dateKey(nowIso, timeZone);
    const activeLeads = snapshot.leads.filter(
      (lead) => lead.kind === "lead" && !["won", "lost"].includes(lead.stage),
    );
    const openTasks = snapshot.tasks.filter(
      (task) => !["done", "cancelled"].includes(task.status),
    );
    const todayEvents = snapshot.events.filter(
      (event) => event.status !== "cancelled" && dateKey(event.start_at, timeZone) === today,
    );

    const attention: Attention[] = [];
    for (const lead of activeLeads) {
      if (lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < snapshotNow) {
        attention.push({
          key: "lead-" + lead.id,
          module: "leads",
          recordId: lead.id,
          title: lead.name + " așteaptă follow-up",
          meta: "Termenul de revenire a trecut.",
          level: "urgent",
        });
      }
    }

    const operations: AutomationOperation[] = openTasks.map((task) => ({
      id: task.id,
      title: task.title,
      kind: task.kind,
      status: task.status as AutomationOperation["status"],
      priority: task.priority as AutomationOperation["priority"],
      assignee: task.assignee,
      clientId: task.client_id,
      scheduledAt: task.scheduled_at,
      dueAt: task.due_at,
      createdAt: task.created_at,
    }));
    const estimates: AutomationEstimate[] = snapshot.estimates.map((estimate) => ({
      id: estimate.id,
      reference: estimate.reference,
      title: estimate.title,
      status: estimate.status,
      validUntil: estimate.valid_until,
      clientId: estimate.client_id,
      taskId: estimate.task_id,
      updatedAt: estimate.updated_at,
    }));
    const events: AutomationEvent[] = snapshot.events.map((event) => ({
      id: event.id,
      title: event.title,
      status: event.status,
      startAt: event.start_at,
      endAt: event.end_at,
      assignee: event.assignee,
      clientId: event.client_id,
      taskId: event.task_id,
    }));

    const rules = new Set([
      "operation_overdue",
      "operation_blocked",
      "operation_unassigned",
      "operation_assignee_inactive",
      "execution_without_accepted_estimate",
      "estimate_follow_up",
      "calendar_conflict",
    ]);
    const signals = buildBusinessAutomationSignals({
      operations,
      estimates,
      events,
      now,
      locale,
      timeZone,
      inactiveAssigneeNames: snapshot.inactiveTeamNames,
    }).filter((signal) => rules.has(signal.rule));

    for (const signal of signals) {
      if (!signal.open.recordId) continue;
      attention.push({
        key: signal.key,
        module: signal.module,
        recordId: signal.open.recordId,
        title: signal.title,
        meta: signal.meta,
        level: signal.level === "urgent" ? "urgent" : "normal",
      });
    }

    const signaledTasks = new Set(
      signals.filter((signal) => signal.module === "tasks" && signal.open.recordId)
        .map((signal) => signal.open.recordId as string),
    );
    for (const task of openTasks) {
      if (task.priority !== "urgent" || signaledTasks.has(task.id)) continue;
      attention.push({
        key: "urgent-" + task.id,
        module: "tasks",
        recordId: task.id,
        title: task.title,
        meta: "Prioritate urgentă.",
        level: "urgent",
      });
    }

    const days = Array.from({ length: 7 }, (_, index) =>
      dateKey(new Date(snapshotNow - (6 - index) * 86400000).toISOString(), timeZone),
    );
    const trend = (values: string[]) =>
      days.map((day) => values.filter((value) => dateKey(value, timeZone) === day).length);
    const timeLabel = (value: string) =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      }).format(new Date(value));

    const todayQueue = [
      ...openTasks.flatMap((task) => {
        const scheduledToday = task.scheduled_at && dateKey(task.scheduled_at, timeZone) === today;
        const dueToday = task.due_at && dateKey(task.due_at, timeZone) === today;
        if (!scheduledToday && !dueToday) return [];
        const moments = [scheduledToday ? task.scheduled_at : null, dueToday ? task.due_at : null]
          .filter(Boolean) as string[];
        const meta = scheduledToday && dueToday
          ? "Programată " + timeLabel(task.scheduled_at!) + " · termen " + timeLabel(task.due_at!)
          : scheduledToday
            ? "Programată la " + timeLabel(task.scheduled_at!)
            : "Termen astăzi la " + timeLabel(task.due_at!);
        return [{
          key: "today-task-" + task.id,
          module: "tasks" as const,
          recordId: task.id,
          title: task.title,
          meta,
          sortAt: moments.sort()[0],
        }];
      }),
      ...todayEvents.map((event) => ({
        key: "today-event-" + event.id,
        module: "calendar" as const,
        recordId: event.id,
        title: event.title,
        meta: "Programare la " + timeLabel(event.start_at),
        sortAt: event.start_at,
      })),
    ].sort((a, b) => a.sortAt.localeCompare(b.sortAt)).slice(0, 5);

    return {
      todayEvents,
      monthIncome: snapshot.monthIncomeCents,
      monthExpenses: snapshot.monthExpensesCents,
      monthCashFlow: snapshot.monthIncomeCents - snapshot.monthExpensesCents,
      trends: {
        leads: trend(snapshot.trendDates.leads),
        tasks: trend(snapshot.trendDates.tasks),
        calendar: trend(snapshot.events.filter((event) => event.status !== "cancelled").map((event) => event.start_at)),
        estimates: trend(snapshot.trendDates.estimates),
      },
      attention: attention
        .filter((item) => enabledModules.includes(item.module))
        .sort((left, right) => left.level === right.level ? 0 : left.level === "urgent" ? -1 : 1),
      todayQueue,
    };
  }, [snapshot, snapshotNow, timeZone, locale, enabledModules]);

  if (loading && !snapshot) {
    return <div className="overview-loading">Se pregătește dashboardul...</div>;
  }

  const activeQuickActions = role === "viewer"
    ? []
    : QUICK_ACTIONS.filter((action) => enabledModules.includes(action.id));

  const workStages = [
    { label: "De făcut", count: snapshot?.taskStages.planned ?? 0, color: "#738bff" },
    { label: "În lucru", count: snapshot?.taskStages.in_progress ?? 0, color: "#66bff0" },
    { label: "Blocate", count: snapshot?.taskStages.blocked ?? 0, color: "#efad77" },
    { label: "Finalizate", count: snapshot?.taskStages.done ?? 0, color: "#6ed3ae" },
    { label: "Anulate", count: snapshot?.taskStages.cancelled ?? 0, color: "#64748b" },
  ];
  const workTotal = workStages.reduce((sum, stage) => sum + stage.count, 0);
  let angle = 0;
  const slices = workStages.filter((stage) => stage.count > 0).map((stage) => {
    const start = angle;
    angle += workTotal ? (stage.count / workTotal) * 360 : 0;
    return stage.color + " " + start + "deg " + angle + "deg";
  });
  const ring = workTotal
    ? "conic-gradient(" + slices.join(",") + ")"
    : "conic-gradient(#2a405e 0deg 360deg)";

  const workflow = [
    { id: "leads" as const, label: "Cereri active", count: snapshot?.activeLeadsCount ?? 0, color: "#7376f8" },
    { id: "tasks" as const, label: "Lucrări deschise", count: snapshot?.openTasksCount ?? 0, color: "#5b9cf9" },
    { id: "estimates" as const, label: "Oferte trimise", count: snapshot?.sentEstimatesCount ?? 0, color: "#7bd1f6" },
    { id: "calendar" as const, label: "Programări astăzi", count: computed?.todayEvents.length ?? 0, color: "#7ad8b7" },
  ].filter((step) => enabledModules.includes(step.id));
  const maxWorkflow = Math.max(1, ...workflow.map((step) => step.count));

  return (
    <div className="overview-v6">
      <section className="overview-v6-head">
        <div>
          <p className="eyebrow">ORBYVEN / OVERVIEW</p>
          <h2>Bună, {greetingName || "acolo"}.</h2>
          <p>{dateLabel} · Rezumatul firmei</p>
        </div>
        <div className="overview-head-actions">
          <span className="role-pill"><span className="online-dot" />{roleLabels[role]}</span>
          <button className="secondary" onClick={() => void load()}>↻ Actualizează</button>
        </div>
      </section>

      {error && <p className="overview-error" role="alert">{error}</p>}

      {snapshot && computed && (
        <>
          <section className="overview-v6-metrics">
            {[
              ["Cereri active", snapshot.activeLeadsCount, "Noi în ultimele 7 zile", computed.trends.leads, "#7c7afa", "leads"],
              ["Lucrări deschise", snapshot.openTasksCount, "Noi în ultimele 7 zile", computed.trends.tasks, "#66aaff", "tasks"],
              ["Programări astăzi", computed.todayEvents.length, "Programate în ultimele 7 zile", computed.trends.calendar, "#70d1eb", "calendar"],
              ["Oferte trimise", snapshot.sentEstimatesCount, "Create în ultimele 7 zile", computed.trends.estimates, "#7ad5b4", "estimates"],
            ].map(([label, value, note, trendValues, color, moduleId]) => {
              const id = moduleId as OrbyvenModuleId;
              const enabled = enabledModules.includes(id);
              return (
                <button key={label as string} disabled={!enabled} className="overview-metric-card"
                  onClick={() => onOpenModule(id)}>
                  <span className="metric-card-label">{label as string}<i style={{ background: enabled ? color as string : "var(--muted-2)" }} /></span>
                  <strong>{enabled ? String(value) : "—"}</strong>
                  <small>{enabled ? note as string : "Modul inactiv"}</small>
                  {enabled && <MiniTrend values={trendValues as number[]} color={color as string} />}
                </button>
              );
            })}
          </section>

          <section className="overview-v6-grid">
            <article className="surface overview-stage-card">
              <div className="panel-heading"><div><p className="eyebrow">OPERATIONS</p><h3>Lucrări după status</h3></div><small>{workTotal} total</small></div>
              <div className="stage-chart">
                <button className="stage-ring" onClick={() => enabledModules.includes("tasks") && onOpenModule("tasks")} style={{ background: ring }}>
                  <span className="stage-ring-inner"><strong>{workTotal}</strong><small>înregistrări</small></span>
                </button>
                <div className="stage-legend">
                  {workStages.map((stage) => (
                    <div key={stage.label}><span className="legend-dot" style={{ background: stage.color }} />{stage.label}<strong>{stage.count}</strong></div>
                  ))}
                </div>
              </div>
            </article>

            <article className="surface overview-workflow-card">
              <div className="panel-heading"><div><p className="eyebrow">WORKFLOW</p><h3>Fluxul afacerii</h3></div><small>Module active</small></div>
              <div className="workflow-list">
                {workflow.map((step) => (
                  <button key={step.id} className="workflow-row" onClick={() => onOpenModule(step.id)}>
                    <span>{step.label}</span><strong>{step.count}</strong>
                    <span className="workflow-track"><i style={{ width: Math.max(2, step.count / maxWorkflow * 100) + "%", background: step.color }} /></span>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section className="overview-v6-grid">
            <article className="surface overview-list-card">
              <div className="panel-heading"><div><p className="eyebrow">ASTĂZI</p><h3>Agenda zilei</h3></div><small>{computed.todayQueue.length}</small></div>
              <div className="overview-list">
                {computed.todayQueue.map((item) => (
                  <button key={item.key} className="overview-list-item"
                    onClick={() => onOpenModule(item.module, { recordId: item.recordId })}>
                    <span><strong>{item.title}</strong><small>{item.meta}</small></span><b>→</b>
                  </button>
                ))}
                {!computed.todayQueue.length && <p className="overview-empty">Nimic programat pentru astăzi.</p>}
              </div>
            </article>

            <article className="surface overview-list-card">
              <div className="panel-heading"><div><p className="eyebrow">ATENȚIE</p><h3>Ce merită verificat</h3></div><small>{computed.attention.length}</small></div>
              <div className="overview-list">
                {computed.attention.slice(0, 6).map((item) => (
                  <button key={item.key} className={"overview-list-item attention " + item.level}
                    onClick={() => onOpenModule(item.module, { recordId: item.recordId })}>
                    <i /><span><strong>{item.title}</strong><small>{item.meta}</small></span><b>→</b>
                  </button>
                ))}
                {!computed.attention.length && <p className="overview-empty">Nu există semnale urgente.</p>}
                {snapshot.attentionHasMore && <p className="overview-more">Există și alte elemente de verificat în module.</p>}
              </div>
            </article>
          </section>

          <section className="overview-v6-summary">
            {canAccessFinances && (
              <>
                <button onClick={() => enabledModules.includes("expenses") && onOpenModule("expenses")}><span>Încasări luna aceasta</span><strong>{formatMoney(computed.monthIncome, locale)}</strong></button>
                <button onClick={() => enabledModules.includes("expenses") && onOpenModule("expenses")}><span>Cashflow luna aceasta</span><strong>{formatMoney(computed.monthCashFlow, locale)}</strong></button>
              </>
            )}
            <button onClick={() => enabledModules.includes("documents") && onOpenModule("documents")}><span>Documente</span><strong>{snapshot.documentCount}</strong></button>
            <button onClick={() => enabledModules.includes("team") && onOpenModule("team")}><span>Echipă activă</span><strong>{snapshot.activeTeamCount}</strong></button>
            <div><span>Module active</span><strong>{enabledModules.filter((id) => id !== "overview").length}</strong></div>
          </section>

          {activeQuickActions.length > 0 && (
            <section className="overview-quick-actions">
              <span>ACȚIUNI RAPIDE</span>
              {activeQuickActions.map((action) => (
                <button key={action.id} onClick={() => onOpenModule(action.id, { create: true })}>{action.label}</button>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
