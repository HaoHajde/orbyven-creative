"use client";

import { useEffect } from "react";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type OrbyvenNativeRuntime = {
  platform?: string;
  version?: string;
  capabilities?: string[];
};

type WindowWithNativeRuntime = Window & {
  __ORBYVEN_NATIVE__?: OrbyvenNativeRuntime;
  ReactNativeWebView?: { postMessage: (message: string) => void };
};

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getNativeRuntime() {
  return (window as WindowWithNativeRuntime).__ORBYVEN_NATIVE__ ?? null;
}

export default function AppModeRuntime() {
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");

    const syncMode = () => {
      const nativeRuntime = getNativeRuntime();
      const root = document.documentElement;

      root.dataset.appMode = nativeRuntime
        ? "native"
        : isStandaloneMode()
          ? "standalone"
          : "browser";

      if (nativeRuntime) {
        root.dataset.nativePlatform = nativeRuntime.platform || "ios";
        if (nativeRuntime.version) root.dataset.nativeVersion = nativeRuntime.version;
      } else {
        delete root.dataset.nativePlatform;
        delete root.dataset.nativeVersion;
      }
    };

    let hiddenAt: number | null =
      document.visibilityState === "hidden" ? Date.now() : null;

    const resume = () => {
      if (document.visibilityState === "hidden") {
        if (hiddenAt === null) hiddenAt = Date.now();
        return;
      }

      if (document.visibilityState !== "visible") return;

      const backgroundMs =
        hiddenAt === null ? 0 : Math.max(0, Date.now() - hiddenAt);
      hiddenAt = null;

      // In the native app the React Native shell owns the resume event and
      // includes the authoritative background duration. Browser/PWA mode
      // synthesizes the same contract here.
      if (!getNativeRuntime()) {
        window.dispatchEvent(
          new CustomEvent("orbyven:app-resume", {
            detail: { backgroundMs },
          })
        );
      }
    };

    const postWebReady = () => {
      const bridge = (window as WindowWithNativeRuntime).ReactNativeWebView;
      bridge?.postMessage(JSON.stringify({
        type: "orbyven:web-ready",
        href: window.location.href,
      }));
    };

    const handlePageShow = () => {
      resume();
      postWebReady();
    };

    const syncNativeNetwork = (event: Event) => {
      const online = (event as CustomEvent<{ online?: boolean }>).detail?.online;
      if (typeof online !== "boolean") return;
      document.documentElement.dataset.nativeNetwork = online ? "online" : "offline";
    };

    syncMode();
    postWebReady();
    media.addEventListener("change", syncMode);
    window.addEventListener("orbyven:native-ready", syncMode);
    window.addEventListener("orbyven:native-network-change", syncNativeNetwork);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      media.removeEventListener("change", syncMode);
      window.removeEventListener("orbyven:native-ready", syncMode);
      window.removeEventListener("orbyven:native-network-change", syncNativeNetwork);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", handlePageShow);
      delete document.documentElement.dataset.appMode;
      delete document.documentElement.dataset.nativePlatform;
      delete document.documentElement.dataset.nativeVersion;
      delete document.documentElement.dataset.nativeNetwork;
    };
  }, []);

  return null;
}
