import { createClient } from "@supabase/supabase-js";

export { orbitaSupabase as orbyvenSupabase } from "@/lib/orbita-supabase";

export function createOrbyvenAuthenticatedClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase public configuration is missing.");
  }

  const token = accessToken.trim();
  if (!token) throw new Error("ORBYVEN_SESSION_REQUIRED");

  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
