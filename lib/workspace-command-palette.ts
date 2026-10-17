import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { WORKSPACE_CREATE_MODULES } from "@/lib/workspace-visual-system";
import {
  workspaceCreateLabel,
  workspaceModuleShortName,
  type WorkspaceUiLanguage,
} from "@/lib/workspace-i18n";

export type WorkspaceCommandRole = "owner" | "admin" | "manager" | "member" | "viewer";
export type WorkspaceCommandKind = "navigate" | "create";

export type WorkspaceCommandPaletteItem = {
  id: string;
  kind: WorkspaceCommandKind;
  moduleId: OrbyvenModuleId;
  label: string;
  description: string;
  keywords: string[];
};

type BuildWorkspaceCommandItemsInput = {
  enabledModules: readonly OrbyvenModuleId[];
  role: WorkspaceCommandRole;
  language: WorkspaceUiLanguage;
};

const CREATE_ROLES = new Set<WorkspaceCommandRole>([
  "owner",
  "admin",
  "manager",
  "member",
]);
const FINANCE_CREATE_ROLES = new Set<WorkspaceCommandRole>([
  "owner",
  "admin",
  "manager",
]);

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro-RO")
    .trim();
}

function canCreateInModule(moduleId: OrbyvenModuleId, role: WorkspaceCommandRole) {
  if (!CREATE_ROLES.has(role) || !WORKSPACE_CREATE_MODULES.includes(moduleId)) {
    return false;
  }

  return moduleId !== "expenses" || FINANCE_CREATE_ROLES.has(role);
}

export function buildWorkspaceCommandPaletteItems({
  enabledModules,
  role,
  language,
}: BuildWorkspaceCommandItemsInput): WorkspaceCommandPaletteItem[] {
  const enabled = new Set(enabledModules);
  const definitions = ORBYVEN_MODULES.filter((module) => enabled.has(module.id));
  const navigateLabel = language === "en" ? "Open" : "Deschide";
  const navigateDescription = language === "en"
    ? "Go to this workspace module"
    : "Mergi direct la acest modul din workspace";
  const createDescription = language === "en"
    ? "Start a new record without saving anything yet"
    : "Pornește o înregistrare nouă fără să salvezi încă nimic";

  const navigationItems = definitions.map<WorkspaceCommandPaletteItem>((module) => ({
    id: `navigate:${module.id}`,
    kind: "navigate",
    moduleId: module.id,
    label: `${navigateLabel} ${workspaceModuleShortName(module.id, language)}`,
    description: navigateDescription,
    keywords: [
      module.name,
      module.shortName,
      module.description,
      module.category,
      ...module.features,
    ],
  }));

  const createItems = definitions
    .filter((module) => canCreateInModule(module.id, role))
    .map<WorkspaceCommandPaletteItem>((module) => ({
      id: `create:${module.id}`,
      kind: "create",
      moduleId: module.id,
      label: workspaceCreateLabel(module.id, language),
      description: createDescription,
      keywords: [
        language === "en" ? "create new add" : "creeaza nou adauga",
        module.name,
        module.shortName,
        ...module.features,
      ],
    }));

  return [...createItems, ...navigationItems];
}

export function filterWorkspaceCommandPaletteItems(
  items: readonly WorkspaceCommandPaletteItem[],
  query: string,
) {
  const needle = normalizeSearchValue(query);
  if (!needle) return [...items];

  return items.filter((item) => {
    const haystack = normalizeSearchValue([
      item.label,
      item.description,
      ...item.keywords,
    ].join(" "));
    return haystack.includes(needle);
  });
}
