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
    violet: "#8b7cff",
    violetSoft: "rgba(139,124,255,0.10)",
    violetLine: "rgba(139,124,255,0.18)",
    panelHighlight: "rgba(139,124,255,0.05)",
  },
  light: {
    // Light mode is intentionally cool/lavender instead of paper-white:
    // less glare when switching from dark mode, while preserving contrast.
    bg: "#e9ecf5",
    surface: "#f7f7fb",
    surface2: "#eeedf7",
    text: "#172038",
    muted: "#5d6680",
    muted2: "#737b96",
    border: "rgba(89,75,154,0.14)",
    borderStrong: "rgba(91,72,172,0.26)",
    button: "#5d55cf",
    buttonText: "#ffffff",
    accent: "#6859d6",
    accentSoft: "rgba(104,89,214,0.12)",
    violet: "#7458d7",
    violetSoft: "rgba(116,88,215,0.09)",
    violetLine: "rgba(116,88,215,0.19)",
    panelHighlight: "rgba(116,88,215,0.055)",
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
    "--violet": t.violet,
    "--violet-soft": t.violetSoft,
    "--violet-line": t.violetLine,
    "--panel-highlight": t.panelHighlight,
  } as Record<string, string>;
}
