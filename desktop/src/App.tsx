import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  desktopApiFetch,
  fetchDesktopUiManifest,
  initializeDesktopClient,
  orbyvenSupabase,
} from "./client";
import {
  getCurrentWorkspace,
  getWorkspaceAccessState,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import { CURRENT_DESKTOP_VERSION } from "@/lib/workspace-visual-system";
import WorkspaceShell from "@/components/WorkspaceShell";
import { OrbyvenBrand } from "./Brand";

type Screen = "loading" | "login" | "onboarding" | "access" | "workspace" | "error";

const ACCESS_MESSAGES: Record<string, string> = {
  member_suspended: "Accesul contului este suspendat. Contactează administratorul.",
  organization_provisioning: "Compania este în curs de configurare.",
  organization_suspended: "Accesul companiei este suspendat.",
  organization_archived: "Compania a fost arhivată.",
};

function desktopIntelligenceRequest(path: string, init?: RequestInit) {
  const desktopPath = path.replace(/^\/api\/ai\//, "/api/desktop/ai/");
  return desktopApiFetch(desktopPath, init);
}

function openDesktopOrbyvenPath(href: string) {
  try {
    const url = new URL(href, "https://orbyven.ro");
    if (url.protocol !== "https:" || url.hostname !== "orbyven.ro") return;
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch {
    // Ignore malformed paths emitted by external or stale data.
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [accessState, setAccessState] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [company, setCompany] = useState("");
  const [liveUiRevision, setLiveUiRevision] = useState("");
  const [latestDesktopVersion, setLatestDesktopVersion] = useState(CURRENT_DESKTOP_VERSION);

  const initializeWorkspace = useCallback(async () => {
    const state = await getWorkspaceAccessState();
    setAccessState(state);
    setError("");

    if (state === "login") {
      setWorkspace(null);
      setScreen("login");
      return;
    }
    if (state === "onboarding") {
      setWorkspace(null);
      setScreen("onboarding");
      return;
    }
    if (state !== "workspace") {
      setWorkspace(null);
      setScreen("access");
      return;
    }

    const current = await getCurrentWorkspace();
    if (!current) throw new Error("Nu există un workspace activ pentru contul tău.");
    setWorkspace(current);
    setScreen("workspace");
  }, []);

  const syncLiveUi = useCallback(async () => {
    try {
      const manifest = await fetchDesktopUiManifest();
      setLiveUiRevision(manifest.revision);
      setLatestDesktopVersion(manifest.desktopVersion);
    } catch (cause) {
      console.warn("ORBYVEN live UI manifest unavailable; bundled workspace remains active.", cause);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        await initializeDesktopClient();
        if (cancelled) return;
        await Promise.allSettled([syncLiveUi(), initializeWorkspace()]);
      } catch (cause) {
        if (cancelled) return;
        console.error("ORBYVEN Desktop initialization:", cause);
        setError("Conexiunea ORBYVEN nu este disponibilă. Verifică internetul și reîncearcă.");
        setScreen("error");
      }
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [initializeWorkspace, syncLiveUi]);

  useEffect(() => {
    const refreshManifest = () => {
      if (document.visibilityState === "visible") void syncLiveUi();
    };
    window.addEventListener("focus", refreshManifest);
    return () => window.removeEventListener("focus", refreshManifest);
  }, [syncLiveUi]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await orbyvenSupabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });
      if (authError) throw authError;
      setCredentials((current) => ({ ...current, password: "" }));
      await initializeWorkspace();
    } catch (cause) {
      console.error("Desktop sign in:", cause);
      setError("Autentificarea a eșuat. Verifică emailul, parola și conexiunea.");
    } finally {
      setBusy(false);
    }
  };

  const signOutToLogin = async () => {
    setBusy(true);
    setError("");
    try {
      await orbyvenSupabase.auth.signOut();
      setWorkspace(null);
      setScreen("login");
    } catch (cause) {
      console.error("Desktop sign out:", cause);
      setError("Delogarea a eșuat. Reîncearcă.");
    } finally {
      setBusy(false);
    }
  };

  const onboard = async (event: FormEvent) => {
    event.preventDefault();
    const slug = company
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    if (company.trim().length < 2 || slug.length < 3) {
      setError("Completează numele companiei.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { error: rpcError } = await orbyvenSupabase.rpc("bootstrap_organization", {
        p_name: company.trim(),
        p_slug: slug,
        p_module_ids: ["overview", "leads", "tasks"],
      });
      if (rpcError) throw rpcError;
      await initializeWorkspace();
    } catch (cause) {
      console.error("Desktop onboarding:", cause);
      setError("Nu am putut crea compania. Verifică numele sau reîncearcă.");
    } finally {
      setBusy(false);
    }
  };

  if (screen === "workspace" && workspace) {
    const structuralUpdateAvailable = latestDesktopVersion !== CURRENT_DESKTOP_VERSION;
    return (
      <div className="desktop-shell-host">
        <WorkspaceShell
          initialWorkspace={workspace}
          onUnauthenticated={() => {
            setWorkspace(null);
            setScreen("login");
          }}
          onSignedOut={() => {
            setWorkspace(null);
            setScreen("login");
          }}
          onOpenPath={openDesktopOrbyvenPath}
          intelligenceRequest={desktopIntelligenceRequest}
        />
        <div
          className={"desktop-sync-state " + (structuralUpdateAvailable ? "update" : "synced")}
          title={
            structuralUpdateAvailable
              ? "Site-ul ORBYVEN anunță o versiune Desktop mai nouă: " + latestDesktopVersion
              : "Workspace comun cu ORBYVEN web · UI " + (liveUiRevision || "local")
          }
        >
          <span className="online-dot" />
          {structuralUpdateAvailable ? "Update " + latestDesktopVersion : "Web parity"}
        </div>
      </div>
    );
  }

  return (
    <div className="desktop dark">
      <main className="auth-background">
        <div className="auth-top">
          <OrbyvenBrand subtitle="CREATIVE" />
        </div>

        {screen === "loading" && (
          <section className="auth-card">
            <div className="spinner" />
            <h1>Se pregătește ORBYVEN.</h1>
            <p>Conectăm aplicația la spațiul tău de lucru.</p>
          </section>
        )}

        {screen === "error" && (
          <section className="auth-card">
            <h1>Conexiune indisponibilă.</h1>
            <p>{error}</p>
            <button className="primary" onClick={() => window.location.reload()}>
              Reîncearcă
            </button>
          </section>
        )}

        {screen === "access" && (
          <section className="auth-card">
            <h1>Acces indisponibil.</h1>
            <p>{ACCESS_MESSAGES[accessState] || "Contul nu poate accesa workspace-ul."}</p>
            <button className="secondary" onClick={() => void signOutToLogin()}>
              Schimbă contul
            </button>
          </section>
        )}

        {screen === "login" && (
          <section className="auth-card">
            <span className="eyebrow">WORKSPACE · WINDOWS</span>
            <h1>Bine ai revenit.</h1>
            <p>Același cont ORBYVEN și același workspace ca pe web.</p>
            <form onSubmit={(event) => void login(event)} className="form">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={credentials.email}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Parolă</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              {error && <p role="alert" className="error">{error}</p>}
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Se verifică..." : "Intră în ORBYVEN →"}
              </button>
            </form>
          </section>
        )}

        {screen === "onboarding" && (
          <section className="auth-card">
            <span className="eyebrow">PRIMUL PAS</span>
            <h1>Compania ta.</h1>
            <p>Construiește primul spațiu de lucru și activează modulele de bază.</p>
            <form className="form" onSubmit={(event) => void onboard(event)}>
              <label className="field">
                <span>Nume companie</span>
                <input
                  required
                  minLength={2}
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                />
              </label>
              {error && <p role="alert" className="error">{error}</p>}
              <button type="submit" disabled={busy} className="primary">
                Creează workspace →
              </button>
            </form>
            <button className="text-button" onClick={() => void signOutToLogin()}>
              Alt cont
            </button>
          </section>
        )}

        <footer className="auth-footer">
          ORBYVEN DESKTOP v{CURRENT_DESKTOP_VERSION} · WINDOWS
        </footer>
      </main>
    </div>
  );
}
