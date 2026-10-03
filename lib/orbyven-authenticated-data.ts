import { createClient } from "@supabase/supabase-js";

import { requireOrbyvenAccessToken } from "@/lib/orbyven-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Lipsesc NEXT_PUBLIC_SUPABASE_URL sau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY din .env.local"
  );
}

/**
 * Create a short-lived browser data client pinned to the already validated
 * workspace JWT. This avoids high-fanout reads silently falling back to the
 * publishable key when the long-lived global client loses its auth binding.
 */
export async function createAuthenticatedOrbyvenDataClient() {
  const accessToken = await requireOrbyvenAccessToken();

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
