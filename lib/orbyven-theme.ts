import type { CSSProperties } from "react";

export type OrbyvenTheme = "light" | "dark";
export type OrbyvenThemeVars = CSSProperties & Record<`--${string}`, string>;

export const PUBLIC_THEME = {
  dark: {
    bg: "#09090d",
    surface: "#101014",
    surface2: "#17171c",
    text: "#f5f5f7",
    muted: "#aaaab2",
    muted2: "#777781",
    border: "rgba(255,255,255,.085)",
    borderStrong: "rgba(255,255,255,.15)",
    button: "#f5f5f7",
    buttonText: "#09090d",
    accent: "#4b46ee",
    accentSoft: "rgba(126,93,255,.14)",
    accentSoft2: "rgba(111,66,255,.10)",
    panel: "rgba(14,14,19,.90)",
    gridLine: "rgba(255,255,255,.045)",
    canvas: "#09090d",
    homeViolet: "#a58bff",
    homeFlowStart: "#0b0b0e",
    homeFlow: "linear-gradient(180deg, #0b0b0e 0%, #111117 45%, #0e0e13 100%)",
  },
  light: {
    // Deliberately lavender-tinted rather than white: switching from dark
    // should feel softer while preserving the clean ORBYVEN visual language.
    bg: "#f1eef8",
    surface: "#fbfaff",
    surface2: "#ebe7f4",
    text: "#201b2d",
    muted: "#665f75",
    muted2: "#81798f",
    border: "rgba(88,69,146,.14)",
    borderStrong: "rgba(88,69,146,.24)",
    button: "#352d55",
    buttonText: "#ffffff",
    accent: "#5b4dde",
    accentSoft: "rgba(91,77,222,.105)",
    accentSoft2: "rgba(126,93,255,.065)",
    panel: "rgba(249,247,253,.91)",
    gridLine: "rgba(91,77,222,.055)",
    canvas: "#f3f0f9",
    homeViolet: "#6757d8",
    homeFlowStart: "#f3f0f9",
    homeFlow: "linear-gradient(180deg, #f3f0f9 0%, #ece8f5 46%, #f2eff8 100%)",
  },
} as const;

export function publicThemeVars(theme: OrbyvenTheme): OrbyvenThemeVars {
  const t = PUBLIC_THEME[theme];
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
    "--accent-soft-2": t.accentSoft2,
    "--panel": t.panel,
    "--grid-line": t.gridLine,
    "--template-canvas": t.canvas,
    "--home-violet": t.homeViolet,
    "--home-flow-start": t.homeFlowStart,
    "--home-flow": t.homeFlow,
  } as OrbyvenThemeVars;
}

export function themeBodyBackground(theme: OrbyvenTheme) {
  return PUBLIC_THEME[theme].bg;
}
