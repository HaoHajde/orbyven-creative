import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type WorkspaceUiTheme = {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  muted2: string;
  border: string;
  borderStrong: string;
  button: string;
  buttonText: string;
  accent: string;
  accentSoft: string;
};

export type WorkspaceUiContract = {
  schemaVersion: 1;
  revision: string;
  navigationGroups: { label: string; ids: OrbyvenModuleId[] }[];
  createModuleIds: OrbyvenModuleId[];
  financeRoles: string[];
  moduleManagerRoles: string[];
  themes: {
    dark: WorkspaceUiTheme;
    light: WorkspaceUiTheme;
  };
  layout: {
    maxWidth: number;
    headerHeight: number;
    sidebarWidth: number;
    surfaceRadius: number;
  };
  copy: {
    workspaceLabel: string;
    moduleStoreTitle: string;
    moduleStoreDescription: string;
    searchPlaceholder: string;
    createLabel: string;
  };
};

export const WORKSPACE_UI_CONTRACT: WorkspaceUiContract = {
  schemaVersion: 1,
  revision: "2026-09-28.1",
  navigationGroups: [
    { label: "OVERVIEW", ids: ["overview"] },
    { label: "BUSINESS", ids: ["leads", "tasks", "calendar", "estimates"] },
    { label: "OPERATIONS", ids: ["documents", "expenses", "team"] },
    { label: "SPECIALIZATE", ids: ["thermal"] },
  ],
  createModuleIds: ["leads", "tasks", "calendar", "estimates", "expenses"],
  financeRoles: ["owner", "admin", "manager"],
  moduleManagerRoles: ["owner", "admin"],
  themes: {
    dark: {
      bg: "#070b16",
      surface: "#0d1728",
      surface2: "#15233a",
      text: "#eef4ff",
      muted: "#a2b1cb",
      muted2: "#8296b4",
      border: "rgba(167,190,246,0.16)",
      borderStrong: "rgba(157,190,249,0.25)",
      button: "#477af3",
      buttonText: "#ffffff",
      accent: "#7ba9ff",
      accentSoft: "rgba(86,134,244,0.17)",
    },
    light: {
      bg: "#f1f5fd",
      surface: "#ffffff",
      surface2: "#eaf1fd",
      text: "#142746",
      muted: "#596d8c",
      muted2: "#7183a1",
      border: "rgba(46,82,146,0.12)",
      borderStrong: "rgba(46,82,146,0.24)",
      button: "#244caa",
      buttonText: "#ffffff",
      accent: "#3561d8",
      accentSoft: "rgba(65,105,208,0.11)",
    },
  },
  layout: {
    maxWidth: 1520,
    headerHeight: 65,
    sidebarWidth: 206,
    surfaceRadius: 16,
  },
  copy: {
    workspaceLabel: "Business workspace",
    moduleStoreTitle: "Modulele tale.",
    moduleStoreDescription: "Alege instrumentele de care ai nevoie. Restul rămân ascunse, ca workspace-ul să fie simplu.",
    searchPlaceholder: "Caută în workspace...",
    createLabel: "+ Creează",
  },
};

export function isWorkspaceUiContract(value: unknown): value is WorkspaceUiContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (data.schemaVersion !== 1 || typeof data.revision !== "string") return false;
  if (!Array.isArray(data.navigationGroups) || !Array.isArray(data.createModuleIds)) return false;
  if (!data.themes || typeof data.themes !== "object" || !data.layout || typeof data.layout !== "object") return false;
  return true;
}
