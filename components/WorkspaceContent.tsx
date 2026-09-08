"use client";

import CalendarModule from "@/components/modules/CalendarModule";
import DocumentsModule from "@/components/modules/DocumentsModule";
import EstimatesModule from "@/components/modules/EstimatesModule";
import ExpensesModule from "@/components/modules/ExpensesModule";
import LeadsModule from "@/components/modules/LeadsModule";
import OverviewModule from "@/components/modules/OverviewModule";
import TasksModule from "@/components/modules/TasksModule";
import TeamModule from "@/components/modules/TeamModule";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";

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
