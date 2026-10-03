import { orbyvenSupabase } from "@/lib/orbyven-supabase";

const REFRESH_MARGIN_MS = 90_000;

let sessionGatePromise: Promise<string | null> | null = null;

/**
 * Resolve the access token that browser-side workspace reads must use.
 *
 * Returning the token (instead of only a boolean) lets high-fanout read models
 * bind every PostgREST request in one batch to the exact validated session.
 * This avoids a refresh race where the shared browser client temporarily falls
 * back to the publishable key between getSession()/refreshSession() and fetch.
 *
 * Multiple callers share one refresh operation.
 */
export async function ensureOrbyvenSession(): Promise<string | null> {
  if (sessionGatePromise) return sessionGatePromise;

  sessionGatePromise = (async () => {
    const { data, error } = await orbyvenSupabase.auth.getSession();
    if (error) throw error;

    const session = data.session;
    if (!session?.access_token) return null;

    const expiresAtMs =
      typeof session.expires_at === "number"
        ? session.expires_at * 1000
        : null;

    if (!expiresAtMs || expiresAtMs - Date.now() > REFRESH_MARGIN_MS) {
      return session.access_token;
    }

    const refreshed = await orbyvenSupabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    return refreshed.data.session?.access_token ?? null;
  })();

  try {
    return await sessionGatePromise;
  } finally {
    sessionGatePromise = null;
  }
}

export async function requireOrbyvenSession(): Promise<string> {
  const accessToken = await ensureOrbyvenSession();
  if (!accessToken) {
    throw new Error("ORBYVEN_SESSION_REQUIRED");
  }
  return accessToken;
}
