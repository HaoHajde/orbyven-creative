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
import type { WorkspaceNavigationIntent, WorkspaceOpenOptions } from "@/lib/workspace-navigation";

type Props = {
  activeModule: OrbyvenModuleId;
  navigation: WorkspaceNavigationIntent;
  organizationId: string;
  locale: string;
  timeZone: string;
  greetingName: string;
  dateLabel: string;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

export default function WorkspaceContent({
  activeModule,
  navigation,
  organizationId,
  locale,
  timeZone,
  greetingName,
  dateLabel,
  enabledModules,
  role,
  onOpenModule,
}: Props) {
  const intent = navigation.module === activeModule ? navigation : null;
  const initialCreate = Boolean(intent?.create);

  if (activeModule === "overview") {
    return (
      <OverviewModule
        key={navigation.token}
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
    return <LeadsModule key={navigation.token} organizationId={organizationId} locale={locale} role={role} enabledModules={enabledModules} onOpenModule={onOpenModule} initialCreate={initialCreate} initialRecordId={intent?.recordId} />;
  }

  if (activeModule === "tasks") {
    return <TasksModule key={navigation.token} organizationId={organizationId} locale={locale} role={role} enabledModules={enabledModules} onOpenModule={onOpenModule} initialCreate={initialCreate} initialRecordId={intent?.recordId} initialClientId={intent?.clientId} />;
  }

  if (activeModule === "calendar") {
    return (
      <CalendarModule
        key={navigation.token}
        initialCreate={initialCreate}
        initialClientId={intent?.clientId}
        initialTaskId={intent?.taskId}
        organizationId={organizationId}
        locale={locale}
        timeZone={timeZone}
        role={role}
        enabledModules={enabledModules}
        onOpenModule={onOpenModule}
      />
    );
  }

  if (activeModule === "estimates") {
    return <EstimatesModule key={navigation.token} organizationId={organizationId} locale={locale} role={role} enabledModules={enabledModules} onOpenModule={onOpenModule} initialCreate={initialCreate} initialRecordId={intent?.recordId} initialClientId={intent?.clientId} initialTaskId={intent?.taskId} />;
  }

  if (activeModule === "documents") {
    return <DocumentsModule organizationId={organizationId} locale={locale} role={role} />;
  }

  if (activeModule === "expenses") {
    return <ExpensesModule key={navigation.token} organizationId={organizationId} locale={locale} role={role} initialCreate={initialCreate} initialClientId={intent?.clientId} initialTaskId={intent?.taskId} initialEstimateId={intent?.estimateId} />;
  }

  return <TeamModule organizationId={organizationId} role={role} />;
}
