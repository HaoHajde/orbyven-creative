"use client";

import { useEffect } from "react";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function AppModeRuntime() {
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");

    const syncMode = () => {
      document.documentElement.dataset.appMode = isStandaloneMode()
        ? "standalone"
        : "browser";
    };

    const resume = () => {
      if (document.visibilityState === "visible") {
        window.dispatchEvent(new Event("orbyven:app-resume"));
      }
    };

    syncMode();
    media.addEventListener("change", syncMode);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);

    return () => {
      media.removeEventListener("change", syncMode);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
      delete document.documentElement.dataset.appMode;
    };
  }, []);

  return null;
}
