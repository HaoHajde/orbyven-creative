"use client";

import { loadOverviewSnapshot, type OverviewSnapshot } from "@/lib/modules/overview";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { ModuleEmpty, ModuleError, ModuleMetric } from "@/components/modules/ModuleKit";
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

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

function todayKey(timeZone: string) {
  const p = zonedParts(new Date(), timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function dateKey(value: string, timeZone: string) {
  const p = zonedParts(new Date(value), timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function formatMoney(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(cents / 100);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await loadOverviewSnapshot(organizationId));
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
    if (!snapshot) return null;
    const today = todayKey(timeZone);
    const now = Date.now();
    const currentMonth = today.slice(0, 7);
    const activeLeads = snapshot.leads.filter((lead) => lead.kind === "lead" && !["won", "lost"].includes(lead.stage));
    const openTasks = snapshot.tasks.filter((task) => !["done", "cancelled"].includes(task.status));
    const todayEvents = snapshot.events.filter((event) => event.status !== "cancelled" && dateKey(event.start_at, timeZone) === today);
    const sentEstimates = snapshot.estimates.filter((estimate) => estimate.status === "sent");
    const monthExpenses = snapshot.expenses
      .filter((expense) => expense.occurred_on.slice(0, 7) === currentMonth)
      .reduce((sum, expense) => sum + expense.amount_cents, 0);

    const attention: Attention[] = [];
    for (const lead of activeLeads) {
      if (lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < now) {
        attention.push({ key: `lead-${lead.id}`, module: "leads", title: `${lead.name} așteaptă follow-up`, meta: "Termenul de revenire a trecut.", level: "urgent" });
      }
    }
    for (const task of openTasks) {
      if (task.due_at && new Date(task.due_at).getTime() < now) {
        attention.push({ key: `task-${task.id}`, module: "tasks", title: task.title, meta: "Lucrare / task întârziat.", level: "urgent" });
      } else if (task.priority === "urgent") {
        attention.push({ key: `urgent-${task.id}`, module: "tasks", title: task.title, meta: "Prioritate urgentă.", level: "urgent" });
      }
    }
    for (const estimate of sentEstimates.slice(0, 4)) {
      const ageDays = Math.floor((now - new Date(estimate.updated_at).getTime()) / 86400000);
      if (ageDays >= 3) {
        attention.push({ key: `estimate-${estimate.id}`, module: "estimates", title: `${estimate.reference} · ${estimate.title}`, meta: `Trimisă de ${ageDays} zile fără răspuns.`, level: "normal" });
      }
    }

    return { activeLeads, openTasks, todayEvents, sentEstimates, monthExpenses, attention: attention.slice(0, 8) };
  }, [snapshot, timeZone]);

  if (loading) return <div className="pb-24 text-sm text-[var(--muted)]">Se pregătește rezumatul…</div>;

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">{dateLabel}</p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px] lg:text-[70px]">Bună, {greetingName || "acolo"}.</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">Aici nu sunt grafice de decor. ORBYVEN adună ce necesită atenție din modulele firmei și îți arată ce merită făcut acum.</p>
        </div>
        <div className="flex gap-2"><span className="inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--muted)]">{roleLabels[role]}</span><button type="button" onClick={() => void load()} className="h-10 rounded-full border border-[var(--border)] px-4 text-xs font-semibold">Actualizează</button></div>
      </section>

      <div className="mt-7"><ModuleError message={error} /></div>

      {snapshot && computed ? (
        <>
          <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <button type="button" onClick={() => onOpenModule("leads")} className="text-left"><ModuleMetric label="Cereri active" value={String(computed.activeLeads.length)} note="de urmărit comercial" /></button>
            <button type="button" onClick={() => onOpenModule("tasks")} className="text-left"><ModuleMetric label="Lucrări deschise" value={String(computed.openTasks.length)} note="nefinalizate" /></button>
            <button type="button" onClick={() => onOpenModule("calendar")} className="text-left"><ModuleMetric label="Astăzi" value={String(computed.todayEvents.length)} note="programări / vizite" /></button>
            <button type="button" onClick={() => onOpenModule("estimates")} className="text-left"><ModuleMetric label="Oferte în așteptare" value={String(computed.sentEstimates.length)} note="trimise clientului" /></button>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs text-[var(--muted)]">Atenție acum</p><h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Ce riști să uiți</h2></div><span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">{computed.attention.length}</span></div>
              {computed.attention.length ? (
                <div className="mt-6 space-y-2">
                  {computed.attention.map((item) => (
                    <button key={item.key} type="button" onClick={() => onOpenModule(item.module)} className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-[var(--bg)] p-4 text-left">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.meta}</p></div><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.level === "urgent" ? "bg-red-500" : "bg-amber-500"}`} />
                    </button>
                  ))}
                </div>
              ) : <div className="mt-6"><ModuleEmpty title="Nimic critic acum" description="Nu există follow-up-uri sau lucrări întârziate în datele curente." /></div>}
            </article>

            <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
              <p className="text-xs text-[var(--muted)]">Business snapshot</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">În spatele zilei de azi</h2>
              <div className="mt-6 space-y-3">
                <SnapshotRow label="Cheltuieli luna curentă" value={formatMoney(computed.monthExpenses, locale)} onClick={() => onOpenModule("expenses")} enabled={enabledModules.includes("expenses")} />
                <SnapshotRow label="Documente" value={String(snapshot.documentCount)} onClick={() => onOpenModule("documents")} enabled={enabledModules.includes("documents")} />
                <SnapshotRow label="Echipă activă" value={String(snapshot.activeTeamCount)} onClick={() => onOpenModule("team")} enabled={enabledModules.includes("team")} />
                <SnapshotRow label="Module business active" value={String(enabledModules.filter((id) => id !== "overview").length)} enabled />
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function SnapshotRow({ label, value, onClick, enabled }: { label: string; value: string; onClick?: () => void; enabled: boolean }) {
  const content = <><span className="text-sm text-[var(--muted)]">{label}</span><span className="text-sm font-semibold">{enabled ? value : "Inactiv"}</span></>;
  return onClick && enabled ? <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-4 rounded-[18px] bg-[var(--bg)] px-4 py-4 text-left">{content}</button> : <div className="flex items-center justify-between gap-4 rounded-[18px] bg-[var(--bg)] px-4 py-4">{content}</div>;
}
