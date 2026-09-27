import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export let orbyvenSupabase: SupabaseClient;

type DesktopConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

/**
 * Remote bootstrap returns only the SAME PUBLIC values shipped to web browsers.
 * The complete UI is bundled locally. No privileged API key goes into the installer.
 */
export async function initializeDesktopClient() {
  const response = await fetch("https://orbyven.ro/api/desktop/config", {
    method: "GET",
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Nu putem conecta aplicația la ORBYVEN.");
  const config: DesktopConfig = await response.json();
  const { supabaseUrl, supabasePublishableKey } = config;
  if (!supabaseUrl || !supabasePublishableKey || !supabaseUrl.startsWith("https://")) {
    throw new Error("Configurația publică ORBYVEN este invalidă.");
  }
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
