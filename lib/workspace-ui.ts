import type { CSSProperties } from "react";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";

export type WorkspaceTheme = "light" | "dark";

export const WORKSPACE_UI_REVISION = "2026.09.28.1";

export const WORKSPACE_NAV_GROUPS: ReadonlyArray<{
  label: string;
  ids: readonly OrbyvenModuleId[];
}> = [
  { label: "OVERVIEW", ids: ["overview"] },
  { label: "BUSINESS", ids: ["leads", "tasks", "calendar", "estimates"] },
  { label: "OPERATIONS", ids: ["documents", "expenses", "team"] },
  { label: "SPECIALIZATE", ids: ["thermal"] },
];

export const WORKSPACE_ROLE_LABELS: Record<
  OrbyvenWorkspace["membership"]["role"],
  string
> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

export const WORKSPACE_THEME_TOKENS = {
  dark: {
    "--bg": "#070b16",
    "--surface": "#0d1728",
    "--surface-2": "#15233a",
    "--text": "#eef4ff",
    "--muted": "#a2b1cb",
    "--muted-2": "#8296b4",
    "--border": "rgba(167,190,246,0.16)",
    "--border-strong": "rgba(157,190,249,0.25)",
    "--button": "#477af3",
    "--button-text": "#ffffff",
    "--accent": "#7ba9ff",
    "--accent-soft": "rgba(86,134,244,0.17)",
  },
  light: {
    "--bg": "#f1f5fd",
    "--surface": "#ffffff",
    "--surface-2": "#eaf1fd",
    "--text": "#142746",
    "--muted": "#596d8c",
    "--muted-2": "#7183a1",
    "--border": "rgba(46,82,146,0.12)",
    "--border-strong": "rgba(46,82,146,0.24)",
    "--button": "#244caa",
    "--button-text": "#ffffff",
    "--accent": "#3561d8",
    "--accent-soft": "rgba(65,105,208,0.11)",
  },
} as const;

export const WORKSPACE_LAYOUT = {
  maxWidth: 1520,
  sidebarWidth: 206,
  headerHeight: 65,
  sidebarTop: 77,
} as const;

export function workspaceThemeVars(theme: WorkspaceTheme): CSSProperties {
  return WORKSPACE_THEME_TOKENS[theme] as CSSProperties;
}

export type WorkspacePresentationConfig = {
  revision: string;
  navGroups: Array<{ label: string; ids: OrbyvenModuleId[] }>;
  roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string>;
  themeTokens: Record<WorkspaceTheme, Record<string, string>>;
  layout: typeof WORKSPACE_LAYOUT;
};

export function getWorkspacePresentationConfig(): WorkspacePresentationConfig {
  return {
    revision: WORKSPACE_UI_REVISION,
    navGroups: WORKSPACE_NAV_GROUPS.map((group) => ({
      label: group.label,
      ids: [...group.ids],
    })),
    roleLabels: { ...WORKSPACE_ROLE_LABELS },
    themeTokens: {
      dark: { ...WORKSPACE_THEME_TOKENS.dark },
      light: { ...WORKSPACE_THEME_TOKENS.light },
    },
    layout: { ...WORKSPACE_LAYOUT },
  };
}
