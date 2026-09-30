import LeadsModule from "@/components/modules/LeadsModule";
import TasksModule from "@/components/modules/TasksModule";
import CalendarModule from "@/components/modules/CalendarModule";
import EstimatesModule from "@/components/modules/EstimatesModule";
import DocumentsModule from "@/components/modules/DocumentsModule";
import InventoryModule from "@/components/modules/InventoryModule";
import ExpensesModule from "@/components/modules/ExpensesModule";
import TeamModule from "@/components/modules/TeamModule";
import OverviewModule from "@/components/modules/OverviewModule";
import DesktopThermalModule from "./ThermalModule";
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

export default function DesktopWorkspaceModules({
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
    return (
      <LeadsModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        enabledModules={enabledModules}
        onOpenModule={onOpenModule}
        initialCreate={initialCreate}
        initialRecordId={intent?.recordId}
      />
    );
  }

  if (activeModule === "tasks") {
    return (
      <TasksModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        enabledModules={enabledModules}
        onOpenModule={onOpenModule}
        initialCreate={initialCreate}
        initialRecordId={intent?.recordId}
        initialClientId={intent?.clientId}
      />
    );
  }

  if (activeModule === "calendar") {
    return (
      <CalendarModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        timeZone={timeZone}
        role={role}
        enabledModules={enabledModules}
        onOpenModule={onOpenModule}
        initialCreate={initialCreate}
        initialRecordId={intent?.recordId}
        initialClientId={intent?.clientId}
        initialTaskId={intent?.taskId}
      />
    );
  }

  if (activeModule === "estimates") {
    return (
      <EstimatesModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        enabledModules={enabledModules}
        onOpenModule={onOpenModule}
        initialCreate={initialCreate}
        initialRecordId={intent?.recordId}
        initialClientId={intent?.clientId}
        initialTaskId={intent?.taskId}
      />
    );
  }

  if (activeModule === "documents") {
    return (
      <DocumentsModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        initialCreate={initialCreate}
        initialRecordId={intent?.recordId}
        initialTaskId={intent?.taskId}
      />
    );
  }

  if (activeModule === "inventory") {
    return (
      <InventoryModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        onOpenModule={onOpenModule}
        initialRecordId={intent?.recordId}
        initialTaskId={intent?.taskId}
      />
    );
  }

  if (activeModule === "expenses") {
    if (!["owner", "admin", "manager"].includes(role)) {
      return (
        <div role="status" className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
          Finanțele firmei sunt disponibile doar administratorilor și managerilor.
        </div>
      );
    }
    return (
      <ExpensesModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        initialCreate={initialCreate}
        initialClientId={intent?.clientId}
        initialTaskId={intent?.taskId}
        initialEstimateId={intent?.estimateId}
      />
    );
  }

  if (activeModule === "thermal") {
    return (
      <DesktopThermalModule
        key={navigation.token}
        organizationId={organizationId}
        locale={locale}
        role={role}
        enabledModules={enabledModules}
        onOpenModule={onOpenModule}
        initialTaskId={intent?.taskId}
      />
    );
  }

  return <TeamModule key={navigation.token} organizationId={organizationId} role={role} />;
}
