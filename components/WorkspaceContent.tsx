"use client";

import dynamic from "next/dynamic";









import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { WorkspaceNavigationIntent, WorkspaceOpenOptions } from "@/lib/workspace-navigation";

/**
 * Alpha 0.6: keep only the active workspace module in the initial client path.
 * next/dynamic must stay at module scope with literal import paths for chunk matching.
 * Preserve SSR of the currently selected module and the existing navigation/props.
 */
function WorkspaceModuleLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[260px] items-center justify-center text-sm text-[var(--muted)]">
      Se încarcă modulul...
    </div>
  );
}

const CalendarModule = dynamic(() => import("@/components/modules/CalendarModule"), {
  loading: WorkspaceModuleLoading,
});
const DocumentsModule = dynamic(() => import("@/components/modules/DocumentsModule"), {
  loading: WorkspaceModuleLoading,
});
const EstimatesModule = dynamic(() => import("@/components/modules/EstimatesModule"), {
  loading: WorkspaceModuleLoading,
});
const ExpensesModule = dynamic(() => import("@/components/modules/ExpensesModule"), {
  loading: WorkspaceModuleLoading,
});
const LeadsModule = dynamic(() => import("@/components/modules/LeadsModule"), {
  loading: WorkspaceModuleLoading,
});
const OverviewModule = dynamic(() => import("@/components/modules/OverviewModule"), {
  loading: WorkspaceModuleLoading,
});
const TasksModule = dynamic(() => import("@/components/modules/TasksModule"), {
  loading: WorkspaceModuleLoading,
});
const TeamModule = dynamic(() => import("@/components/modules/TeamModule"), {
  loading: WorkspaceModuleLoading,
});

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
    return <ExpensesModule key={navigation.token} organizationId={organizationId} locale={locale} role={role} initialCreate={initialCreate} initialClientId={intent?.clientId} initialTaskId={intent?.taskId} />;
  }

  return <TeamModule organizationId={organizationId} role={role} />;
}
