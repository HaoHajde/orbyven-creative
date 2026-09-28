import { useCallback, useEffect, useState, type FormEvent } from "react";
import WorkspaceShell from "@/components/WorkspaceShell";
import {
  getCurrentWorkspace,
  getWorkspaceAccessState,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import type { WorkspacePresentationConfig } from "@/lib/workspace-ui";
import { OrbyvenBrand } from "./Brand";
import {
  initializeDesktopClient,
  orbyvenSupabase,
  refreshDesktopConfig,
  type DesktopConfig,
} from "./client";

type Screen = "loading" | "login" | "onboarding" | "access" | "workspace" | "error";
const DESKTOP_VERSION = "0.4.0";

const ACCESS_MESSAGES: Record<string, string> = {
  member_suspended: "Accesul contului este suspendat. Contactează administratorul.",
  organization_provisioning: "Compania este în curs de configurare.",
  organization_suspended: "Accesul companiei este suspendat.",
  organization_archived: "Compania a fost arhivată.",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [presentation, setPresentation] = useState<WorkspacePresentationConfig | null>(null);
  const [remoteConfig, setRemoteConfig] = useState<DesktopConfig | null>(null);
  const [accessState, setAccessState] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const initializeWorkspace = useCallback(async () => {
    const state = await getWorkspaceAccessState();
    setAccessState(state);
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
    if (!current) throw new Error("Workspace indisponibil.");
    setWorkspace(current);
    setScreen("workspace");
  }, []);

  useEffect(() => {
    let active = true;
    void initializeDesktopClient()
      .then(async ({ config }) => {
        if (!active) return;
        setRemoteConfig(config);
        setPresentation(config.workspaceUi);
        await initializeWorkspace();
      })
      .catch((cause) => {
        console.error("ORBYVEN Desktop initialization:", cause);
        if (!active) return;
        setError("Conexiunea ORBYVEN nu este disponibilă. Verifică internetul și reîncearcă.");
        setScreen("error");
      });
    return () => { active = false; };
  }, [initializeWorkspace]);

  useEffect(() => {
    if (screen !== "workspace") return;
    let active = true;
    const syncPresentation = async () => {
      try {
        const config = await refreshDesktopConfig();
        if (!active) return;
        setRemoteConfig(config);
        setPresentation(config.workspaceUi);
      } catch (cause) {
        console.warn("ORBYVEN live UI sync unavailable:", cause);
      }
    };
    const onFocus = () => void syncPresentation();
    const timer = window.setInterval(() => void syncPresentation(), 5 * 60 * 1000);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [screen]);

  async function login(event: FormEvent) {
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
  }

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await orbyvenSupabase.auth.signOut();
      if (authError) throw authError;
      setWorkspace(null);
      setScreen("login");
    } catch (cause) {
      console.error("Desktop sign out:", cause);
      setError("Delogarea a eșuat. Reîncearcă.");
    } finally {
      setBusy(false);
    }
  }

  async function onboard(event: FormEvent) {
    event.preventDefault();
    const slug = company.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
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
  }

  if (screen === "workspace" && workspace) {
    return (
      <div className="desktop-shared-shell">
        <WorkspaceShell
          initialWorkspace={workspace}
          presentation={presentation}
          brand={<OrbyvenBrand subtitle="CREATIVE" />}
          onLogout={logout}
        />
        <div className="desktop-sync-badge" title={"UI " + (presentation?.revision ?? "local")}>
          <span className="online-dot" />
          Live · {remoteConfig?.desktop.syncMode === "shared-shell-live-config" ? "web + desktop" : "ORBYVEN"}
        </div>
      </div>
    );
  }

  return (
    <div className="desktop dark">
      <main className="auth-background">
        <div className="auth-top"><OrbyvenBrand subtitle="CREATIVE" /></div>
        {screen === "loading" && (
          <section className="auth-card">
            <div className="spinner" />
            <h1>Se pregătește ORBYVEN.</h1>
            <p>Conectăm aplicația la contul și workspace-ul tău.</p>
          </section>
        )}
        {screen === "error" && (
          <section className="auth-card">
            <span className="eyebrow">CONEXIUNE</span>
            <h1>ORBYVEN nu este disponibil momentan.</h1>
            <p>{error}</p>
            <button className="primary" onClick={() => window.location.reload()}>Reîncearcă</button>
          </section>
        )}
        {screen === "access" && (
          <section className="auth-card">
            <span className="eyebrow">ACCES</span>
            <h1>Workspace indisponibil.</h1>
            <p>{ACCESS_MESSAGES[accessState] || "Contul nu poate accesa workspace-ul."}</p>
            <button className="secondary" onClick={() => void logout()}>Schimbă contul</button>
          </section>
        )}
        {screen === "login" && (
          <section className="auth-card">
            <span className="eyebrow">WORKSPACE · WINDOWS</span>
            <h1>Bine ai revenit.</h1>
            <p>Același cont ORBYVEN. Aceleași date. Același workspace ca pe web.</p>
            <form onSubmit={(event) => void login(event)} className="form">
              <label className="field"><span>Email</span>
                <input type="email" required autoComplete="username" value={credentials.email}
                  onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="field"><span>Parolă</span>
                <input type="password" required autoComplete="current-password" value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} />
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
              <label className="field"><span>Nume companie</span>
                <input required minLength={2} value={company} onChange={(event) => setCompany(event.target.value)} />
              </label>
              {error && <p role="alert" className="error">{error}</p>}
              <button type="submit" disabled={busy} className="primary">Creează workspace →</button>
            </form>
            <button className="text-button" onClick={() => void logout()}>Alt cont</button>
          </section>
        )}
        <footer className="auth-footer">
          ORBYVEN DESKTOP v{DESKTOP_VERSION}
          {remoteConfig?.desktop.latestVersion !== DESKTOP_VERSION ? " · actualizare disponibilă" : " · sincronizat"}
        </footer>
      </main>
    </div>
  );
}
