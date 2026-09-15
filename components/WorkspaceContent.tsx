"use client";

import dynamic from "next/dynamic";
import OverviewModule from "@/components/modules/OverviewModule";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";

function ModuleLoading() {
  return <div role="status" className="min-h-48 pb-24 text-sm text-[var(--muted)]">Se încarcă modulul…</div>;
}

const CalendarModule = dynamic(() => import("@/components/modules/CalendarModule"), { loading: ModuleLoading });
const DocumentsModule = dynamic(() => import("@/components/modules/DocumentsModule"), { loading: ModuleLoading });
const EstimatesModule = dynamic(() => import("@/components/modules/EstimatesModule"), { loading: ModuleLoading });
const ExpensesModule = dynamic(() => import("@/components/modules/ExpensesModule"), { loading: ModuleLoading });
const LeadsModule = dynamic(() => import("@/components/modules/LeadsModule"), { loading: ModuleLoading });
const TasksModule = dynamic(() => import("@/components/modules/TasksModule"), { loading: ModuleLoading });
const TeamModule = dynamic(() => import("@/components/modules/TeamModule"), { loading: ModuleLoading });

type Props = {
  activeModule: OrbyvenModuleId;
  organizationId: string;
  locale: string;
  timeZone: string;
  greetingName: string;
  dateLabel: string;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
  onOpenModule: (moduleId: OrbyvenModuleId) => void;
};

export default function WorkspaceContent({
  activeModule,
  organizationId,
  locale,
  timeZone,
  greetingName,
  dateLabel,
  enabledModules,
  role,
  onOpenModule,
}: Props) {
  if (activeModule === "overview") {
    return (
      <OverviewModule
        organizationId={organizationId}
        locale={locale}
        timeZone={timeZone}
        greetingName={greetingName}
        dateLabel={dateLabel}
        enabledModules={enabledModules}
        role={role}
        onOpenModule={onOpenModule}
      />
    );
  }

  if (activeModule === "leads") {
    return <LeadsModule organizationId={organizationId} locale={locale} />;
  }

  if (activeModule === "tasks") {
    return <TasksModule organizationId={organizationId} locale={locale} role={role} />;
  }

  if (activeModule === "calendar") {
    return (
      <CalendarModule
        organizationId={organizationId}
        locale={locale}
        timeZone={timeZone}
        role={role}
      />
    );
  }

  if (activeModule === "estimates") {
    return <EstimatesModule organizationId={organizationId} locale={locale} role={role} />;
  }

  if (activeModule === "documents") {
    return <DocumentsModule organizationId={organizationId} locale={locale} role={role} />;
  }

  if (activeModule === "expenses") {
    return <ExpensesModule organizationId={organizationId} locale={locale} role={role} />;
  }

  return <TeamModule organizationId={organizationId} role={role} />;
}
