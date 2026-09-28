import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WorkspacePresentationConfig } from "@/lib/workspace-ui";

export let orbyvenSupabase: SupabaseClient;
export let desktopConfig: DesktopConfig | null = null;

export type DesktopConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  workspaceUi: WorkspacePresentationConfig;
  desktop: {
    latestVersion: string;
    webWorkspacePath: string;
    syncMode: string;
  };
};

async function fetchDesktopConfig() {
  const response = await fetch("https://orbyven.ro/api/desktop/config", {
    method: "GET",
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Nu putem conecta aplicația la ORBYVEN.");
  const config = (await response.json()) as DesktopConfig;
  if (
    !config.supabaseUrl ||
    !config.supabasePublishableKey ||
    !config.supabaseUrl.startsWith("https://") ||
    !config.workspaceUi?.revision
  ) {
    throw new Error("Configurația publică ORBYVEN este invalidă.");
  }
  desktopConfig = config;
  return config;
}

/**
 * The desktop UI is bundled locally, but its public presentation tokens/grouping
 * are refreshed from orbyven.ro so web + Windows stay visually correlated.
 * No service-role or private token is ever returned by this endpoint.
 */
export async function initializeDesktopClient() {
  const config = await fetchDesktopConfig();
  if (!orbyvenSupabase) {
    orbyvenSupabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "orbyven-desktop-auth-v1",
      },
    });
  }
  return { client: orbyvenSupabase, config };
}

export async function refreshDesktopConfig() {
  return fetchDesktopConfig();
}
