"use client";

import { useEffect } from "react";

const RUNTIME_VERSION_KEY = "orbyven-runtime-version";
const VERSION_CHECK_MIN_INTERVAL_MS = 60_000;

type RuntimeVersionPayload = {
  version?: string;
};

type NativeBridgeWindow = Window & {
  ReactNativeWebView?: { postMessage: (message: string) => void };
};

type RuntimeUpdateEvent = CustomEvent<{ version?: string }>;

function getNativeBridge() {
  return (window as NativeBridgeWindow).ReactNativeWebView;
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let disposed = false;
    let lastVersionCheckAt = 0;
    let versionCheckPromise: Promise<void> | null = null;

    const checkRuntimeVersion = async () => {
      if (disposed) return;
      const now = Date.now();
      if (now - lastVersionCheckAt < VERSION_CHECK_MIN_INTERVAL_MS) return;
      if (versionCheckPromise) return versionCheckPromise;

      lastVersionCheckAt = now;
      versionCheckPromise = (async () => {
        try {
          const response = await fetch("/api/runtime-version", {
            cache: "no-store",
            headers: { "cache-control": "no-cache" },
          });
          if (!response.ok || disposed) return;

          const payload = (await response.json()) as RuntimeVersionPayload;
          const serverVersion = payload.version?.trim();
          if (!serverVersion || disposed) return;

          const currentVersion = window.sessionStorage.getItem(RUNTIME_VERSION_KEY);
          if (!currentVersion) {
            window.sessionStorage.setItem(RUNTIME_VERSION_KEY, serverVersion);
            return;
          }

          if (currentVersion === serverVersion) return;

          const nativeBridge = getNativeBridge();
          if (nativeBridge) {
            nativeBridge.postMessage(JSON.stringify({
              type: "orbyven:runtime-update-available",
              runtimeVersion: serverVersion,
            }));
            return;
          }

          // Browser/PWA runtimes can refresh immediately because they do not have
          // a native shell that can protect in-flight workspace state.
          window.sessionStorage.setItem(RUNTIME_VERSION_KEY, serverVersion);
          window.location.reload();
        } catch {
          // Runtime freshness is progressive hardening; network/offline failures
          // must never block normal ORBYVEN usage.
        }
      })();

      try {
        await versionCheckPromise;
      } finally {
        versionCheckPromise = null;
      }
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await registration.update();
      } catch {
        // PWA support is progressive enhancement; the web app remains functional.
      }

      void checkRuntimeVersion();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkRuntimeVersion();
      }
    };

    const onFocus = () => void checkRuntimeVersion();

    const applyRuntimeUpdate = (event: Event) => {
      const version = (event as RuntimeUpdateEvent).detail?.version?.trim();
      if (!version) return;

      // Persist first so the refreshed runtime cannot loop on the same deploy.
      window.sessionStorage.setItem(RUNTIME_VERSION_KEY, version);
      window.location.reload();
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    window.addEventListener("orbyven:apply-runtime-update", applyRuntimeUpdate);

    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener("orbyven:apply-runtime-update", applyRuntimeUpdate);
    };
  }, []);

  return null;
}
