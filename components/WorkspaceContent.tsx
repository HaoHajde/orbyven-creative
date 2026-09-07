"use client";

import LeadsModule from "@/components/modules/LeadsModule";
import TasksModule from "@/components/modules/TasksModule";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";

const roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

const liveModuleIds = new Set<OrbyvenModuleId>(["leads", "tasks"]);

type Props = {
  activeModule: OrbyvenModuleId;
  organizationId: string;
  locale: string;
  greetingName: string;
  dateLabel: string;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
};

export default function WorkspaceContent({
  activeModule,
  organizationId,
  locale,
  greetingName,
  dateLabel,
  enabledModules,
  role,
}: Props) {
  if (activeModule === "leads") {
    return <LeadsModule organizationId={organizationId} locale={locale} />;
  }

  if (activeModule === "tasks") {
    return <TasksModule organizationId={organizationId} locale={locale} role={role} />;
  }

  if (activeModule !== "overview") {
    const definition = ORBYVEN_MODULES.find((item) => item.id === activeModule)!;
    return (
      <div className="pb-24 md:pb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Modul activ</p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px]">{definition.name}</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">{definition.description}</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {definition.features.map((feature, index) => (
            <article key={feature} className="min-h-[190px] rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold" style={{ backgroundColor: definition.accent, color: definition.color }}>0{index + 1}</div>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em]">{feature}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Modul portabil conectat la organizația curentă prin ORBYVEN Core.</p>
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-[28px] border border-dashed border-[var(--border-strong)] p-7 text-sm leading-6 text-[var(--muted)]">
          Următoarele module sunt implementate pe rând peste același contract tenant-scoped, fără logică specifică unui client.
        </div>
      </div>
    );
  }

  const businessModules: OrbyvenModuleId[] = enabledModules.filter((moduleId) => moduleId !== "overview");
  const activeDefinitions = ORBYVEN_MODULES.filter((definition) => businessModules.includes(definition.id)).slice(0, 4);
  const liveEnabledCount = businessModules.filter((moduleId) => liveModuleIds.has(moduleId)).length;

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">{dateLabel}</p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px] lg:text-[70px]">Bună, {greetingName || "acolo"}.</h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">Workspace-ul începe să devină unealtă de lucru: clienții și lucrările sunt conectate la date reale, în contextul organizației tale.</p>
        </div>
        <span className="inline-flex h-11 self-start items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-xs font-semibold text-[var(--muted)]">Workspace · Live</span>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Module active" value={String(businessModules.length)} note="configurate pentru firmă" />
        <Metric label="Module live" value={String(liveEnabledCount)} note="date și acțiuni reale" />
        <Metric label="Acces" value={roleLabels[role]} note="rol în organizație" />
        <Metric label="Izolare date" value="RLS" note="tenant scoped" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Workspace</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Instrumentele firmei</h2>
            </div>
            <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">{businessModules.length} active</span>
          </div>
          <div className="mt-7 space-y-3">
            {activeDefinitions.length ? activeDefinitions.map((definition) => <Priority key={definition.id} title={definition.name} meta={liveModuleIds.has(definition.id) ? "Live · date reale" : "Activ · în pregătire"} />) : <p className="rounded-[20px] bg-[var(--bg)] p-5 text-sm text-[var(--muted)]">Nu există încă module business active.</p>}
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-6 sm:p-8">
          <p className="text-xs font-medium text-[var(--muted)]">Contract module</p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Portabil implicit</h2>
          <div className="mt-7 space-y-5">
            <StatusItem title="available" meta="definit exclusiv în registry" />
            <StatusItem title="enabled" meta="consumat de Client Workspace" />
            <StatusItem title="entitled" meta="contract viitor furnizat de Chat 3" />
          </div>
        </article>
      </section>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-6 text-[38px] font-semibold leading-none tracking-[-0.055em]">{value}</p><p className="mt-3 text-xs text-[var(--muted-2)]">{note}</p></article>;
}

function Priority({ title, meta }: { title: string; meta: string }) {
  return <div className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-[var(--bg)] p-4 text-left"><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{meta}</p></div><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]" /></div>;
}

function StatusItem({ title, meta }: { title: string; meta: string }) {
  return <div className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" /><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-[var(--muted)]">{meta}</p></div></div>;
}
