import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { OrbyvenModuleDefinition, OrbyvenModuleId } from "@/lib/orbyven-modules";

export let orbyvenSupabase: SupabaseClient;
let desktopConfig: DesktopConfig | null = null;

type DesktopConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export type DesktopUiManifest = {
  revision: string;
  desktopVersion: string;
  generatedAt: string;
  theme: {
    dark: Record<string, string>;
    light: Record<string, string>;
  };
  layout: {
    maxWidth: number;
    headerHeight: number;
    sidebarWidth: number;
    shellGap: number;
    panelRadius: number;
  };
  navGroups: Array<{ label: string; ids: OrbyvenModuleId[] }>;
  createModules: OrbyvenModuleId[];
  modules: OrbyvenModuleDefinition[];
};

const ORBYVEN_ORIGIN = "https://orbyven.ro";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(ORBYVEN_ORIGIN + path, {
    method: "GET",
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("ORBYVEN endpoint unavailable: " + path);
  return response.json() as Promise<T>;
}

/**
 * Remote bootstrap returns only the SAME PUBLIC values shipped to web browsers.
 * The complete UI stays bundled locally. No privileged API key goes into the installer.
 */
export async function initializeDesktopClient() {
  const config = await fetchJson<DesktopConfig>("/api/desktop/config");
  const { supabaseUrl, supabasePublishableKey } = config;
  if (!supabaseUrl || !supabasePublishableKey || !supabaseUrl.startsWith("https://")) {
    throw new Error("Configurația publică ORBYVEN este invalidă.");
  }
  desktopConfig = config;
  orbyvenSupabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "orbyven-desktop-auth-v1",
    },
  });
  return orbyvenSupabase;
}

export function createOrbyvenAuthenticatedClient(accessToken: string) {
  const token = accessToken.trim();
  if (!token) throw new Error("ORBYVEN_SESSION_REQUIRED");
  if (!desktopConfig) throw new Error("ORBYVEN_DESKTOP_CONFIG_REQUIRED");

  return createClient(
    desktopConfig.supabaseUrl,
    desktopConfig.supabasePublishableKey,
    {
      accessToken: async () => token,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export async function desktopApiFetch(path: string, init: RequestInit = {}) {
  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sesiunea a expirat. Reautentifică-te.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + data.session.access_token);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(ORBYVEN_ORIGIN + path, {
    ...init,
    headers,
    credentials: "omit",
    cache: "no-store",
  });
}

export async function fetchDesktopUiManifest() {
  return fetchJson<DesktopUiManifest>("/api/desktop/ui");
}
