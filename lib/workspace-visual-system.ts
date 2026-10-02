import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export const WORKSPACE_UI_REVISION = "2026.10.02.2";
export const CURRENT_DESKTOP_VERSION = "0.8.0";

export const WORKSPACE_THEME = {
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
    bg: "#eeebf6",
    surface: "#f9f7fd",
    surface2: "#e9e4f2",
    text: "#201b31",
    muted: "#625c72",
    muted2: "#7c748c",
    border: "rgba(92,72,148,0.15)",
    borderStrong: "rgba(92,72,148,0.27)",
    button: "#5b4dde",
    buttonText: "#ffffff",
    accent: "#6757df",
    accentSoft: "rgba(103,87,223,0.11)",
  },
} as const;

export const WORKSPACE_LAYOUT = {
  maxWidth: 1520,
  headerHeight: 65,
  sidebarWidth: 206,
  shellGap: 12,
  panelRadius: 16,
} as const;

export const WORKSPACE_NAV_GROUPS: ReadonlyArray<{ label: string; ids: readonly OrbyvenModuleId[] }> = [
  { label: "OVERVIEW", ids: ["overview"] },
  { label: "BUSINESS", ids: ["leads", "tasks", "calendar", "estimates"] },
  { label: "OPERATIONS", ids: ["inventory", "documents", "team"] },
  { label: "FINANCE", ids: ["expenses"] },
  { label: "SPECIALIZATE", ids: ["thermal"] },
];

export const WORKSPACE_CREATE_MODULES: readonly OrbyvenModuleId[] = [
  "leads", "tasks", "calendar", "estimates", "expenses",
];

export function themeToCssVars(theme: "light" | "dark") {
  const t = WORKSPACE_THEME[theme];
  return {
    "--bg": t.bg,
    "--surface": t.surface,
    "--surface-2": t.surface2,
    "--text": t.text,
    "--muted": t.muted,
    "--muted-2": t.muted2,
    "--border": t.border,
    "--border-strong": t.borderStrong,
    "--button": t.button,
    "--button-text": t.buttonText,
    "--accent": t.accent,
    "--accent-soft": t.accentSoft,
  } as Record<string, string>;
}
