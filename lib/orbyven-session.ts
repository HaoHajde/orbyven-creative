import { orbyvenSupabase } from "@/lib/orbyven-supabase";

const REFRESH_MARGIN_MS = 90_000;

let sessionGatePromise: Promise<boolean> | null = null;

/**
 * Ensure browser-side workspace reads never fan out while the Supabase session
 * is absent or close enough to expiry that a focus/auto-refresh race can send
 * PostgREST requests without a usable JWT.
 *
 * Multiple callers share one refresh operation.
 */
export async function ensureOrbyvenSession(): Promise<boolean> {
  if (sessionGatePromise) return sessionGatePromise;

  sessionGatePromise = (async () => {
    const { data, error } = await orbyvenSupabase.auth.getSession();
    if (error) throw error;

    const session = data.session;
    if (!session) return false;

    const expiresAtMs =
      typeof session.expires_at === "number"
        ? session.expires_at * 1000
        : null;

    if (!expiresAtMs || expiresAtMs - Date.now() > REFRESH_MARGIN_MS) {
      return true;
    }

    const refreshed = await orbyvenSupabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    return Boolean(refreshed.data.session);
  })();

  try {
    return await sessionGatePromise;
  } finally {
    sessionGatePromise = null;
  }
}

export async function requireOrbyvenSession() {
  const available = await ensureOrbyvenSession();
  if (!available) {
    throw new Error("ORBYVEN_SESSION_REQUIRED");
  }
}


export async function requireOrbyvenAccessToken(): Promise<string> {
  await requireOrbyvenSession();

  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error) throw error;

  const accessToken = data.session?.access_token?.trim();
  if (!accessToken) {
    throw new Error("ORBYVEN_ACCESS_TOKEN_REQUIRED");
  }

  return accessToken;
}
