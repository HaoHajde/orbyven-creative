import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  fetchDesktopUiManifest,
  initializeDesktopClient,
  orbyvenSupabase,
  type DesktopUiManifest,
} from "./client";
import {
  getCurrentWorkspace,
  getWorkspaceAccessState,
  setOrganizationModuleEnabled,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import {
  CURRENT_DESKTOP_VERSION,
  WORKSPACE_CREATE_MODULES,
  WORKSPACE_LAYOUT,
  WORKSPACE_NAV_GROUPS,
  WORKSPACE_THEME,
  WORKSPACE_UI_REVISION,
} from "@/lib/workspace-visual-system";
import type { WorkspaceNavigationIntent, WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { ModuleGlyph, OrbyvenBrand } from "./Brand";
import WorkspaceActivityCenter from "@/components/WorkspaceActivityCenter";
import WorkspaceSearch from "@/components/WorkspaceSearch";
import DesktopIntelligence from "./Intelligence";
import DesktopWorkspaceModules from "./WorkspaceModules";

type Screen = "loading" | "login" | "onboarding" | "access" | "workspace" | "error";
type Panel = "workspace" | "modules";

const ROLE_LABELS: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Proprietar",
  admin: "Administrator",
  manager: "Manager",
  member: "Membru",
  viewer: "Vizualizare",
};

const ACCESS_MESSAGES: Record<string, string> = {
  member_suspended: "Accesul contului este suspendat. Contactează administratorul.",
  organization_provisioning: "Compania este în curs de configurare.",
  organization_suspended: "Accesul companiei este suspendat.",
  organization_archived: "Compania a fost arhivată.",
};

const BUNDLED_UI_MANIFEST: DesktopUiManifest = {
  revision: WORKSPACE_UI_REVISION,
  desktopVersion: CURRENT_DESKTOP_VERSION,
  generatedAt: "bundled",
  theme: WORKSPACE_THEME as unknown as DesktopUiManifest["theme"],
  layout: WORKSPACE_LAYOUT,
  navGroups: WORKSPACE_NAV_GROUPS.map((group) => ({
    label: group.label,
    ids: [...group.ids],
  })),
  createModules: [...WORKSPACE_CREATE_MODULES],
  modules: ORBYVEN_MODULES,
};

function createLabel(id: OrbyvenModuleId) {
  if (id === "leads") return "Cerere nouă";
  if (id === "tasks") return "Lucrare nouă";
  if (id === "calendar") return "Programare nouă";
  if (id === "estimates") return "Ofertă nouă";
  if (id === "expenses") return "Înregistrare financiară";
  return "Creează";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [accessState, setAccessState] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [company, setCompany] = useState("");
  const [activeModule, setActiveModule] = useState<OrbyvenModuleId>("overview");
  const [navigation, setNavigation] = useState<WorkspaceNavigationIntent>({
    module: "overview",
    token: 0,
  });
  const [panel, setPanel] = useState<Panel>("workspace");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [savingModule, setSavingModule] = useState<OrbyvenModuleId | null>(null);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("orbyven-desktop-theme") !== "light",
  );
  const [uiManifest, setUiManifest] = useState<DesktopUiManifest>(BUNDLED_UI_MANIFEST);
  const [liveUiSynced, setLiveUiSynced] = useState(false);

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
      setUiManifest(manifest);
      setLiveUiSynced(true);
    } catch (cause) {
      console.warn("ORBYVEN live UI manifest unavailable; bundled UI remains active.", cause);
      setLiveUiSynced(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        await initializeDesktopClient();
        if (!cancelled) {
          await Promise.allSettled([syncLiveUi(), initializeWorkspace()]);
        }
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
    const onFocus = () => {
      if (document.visibilityState === "visible") void syncLiveUi();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [syncLiveUi]);

  useEffect(() => {
    const onKeys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandQuery("");
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setCreateMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeys);
    return () => window.removeEventListener("keydown", onKeys);
  }, []);

  const canWrite = Boolean(workspace && workspace.membership.role !== "viewer");
  const canFinance = Boolean(
    workspace && ["owner", "admin", "manager"].includes(workspace.membership.role),
  );
  const canManageModules = Boolean(
    workspace && ["owner", "admin"].includes(workspace.membership.role),
  );

  const runtimeModules = useMemo(
    () =>
      ORBYVEN_MODULES.map((bundled) => {
        const live = uiManifest.modules.find((candidate) => candidate.id === bundled.id);
        if (!live) return bundled;
        return {
          ...bundled,
          name: live.name,
          shortName: live.shortName,
          description: live.description,
          badge: live.badge,
          color: live.color,
          accent: live.accent,
          features: Array.isArray(live.features) ? live.features : bundled.features,
        };
      }),
    [uiManifest.modules],
  );

  const modules = useMemo(
    () =>
      runtimeModules.filter(
        (module) =>
          workspace?.enabledModules.includes(module.id) &&
          (module.id !== "expenses" || canFinance),
      ),
    [runtimeModules, workspace, canFinance],
  );

  const createModules = modules.filter(
    (module) => uiManifest.createModules.includes(module.id),
  );

  const filteredModules = modules.filter((module) =>
    (module.name + " " + module.shortName + " " + module.description)
      .toLocaleLowerCase("ro-RO")
      .includes(commandQuery.trim().toLocaleLowerCase("ro-RO")),
  );

  const chooseModule = useCallback(
    (id: OrbyvenModuleId, options: WorkspaceOpenOptions = {}) => {
      if (!workspace?.enabledModules.includes(id)) return;
      if (id === "expenses" && !canFinance) return;
      setPanel("workspace");
      setActiveModule(id);
      setCommandOpen(false);
      setCreateMenuOpen(false);
      setNavigation((current) => ({
        module: id,
        token: current.token + 1,
        ...options,
      }));
    },
    [workspace, canFinance],
  );

  const toggleModule = async (id: OrbyvenModuleId) => {
    if (!workspace || !canManageModules || savingModule || id === "overview") return;
    const enabled = workspace.enabledModules.includes(id);
    if (!enabled && !workspace.entitledModules.includes(id)) {
      setError("Acest modul necesită un abonament sau acces pilot aprobat.");
      return;
    }

    const previous = workspace.enabledModules;
    const next = enabled
      ? previous.filter((moduleId) => moduleId !== id)
      : [...previous, id];

    setError("");
    setSavingModule(id);
    setWorkspace((current) =>
      current ? { ...current, enabledModules: next } : current,
    );

    if (enabled && activeModule === id) chooseModule("overview");

    try {
      await setOrganizationModuleEnabled(workspace.organization.id, id, !enabled);
    } catch (cause) {
      console.error("Desktop module toggle:", cause);
      setWorkspace((current) =>
        current ? { ...current, enabledModules: previous } : current,
      );
      setError("Modulul nu a putut fi actualizat. Am anulat modificarea.");
    } finally {
      setSavingModule(null);
    }
  };

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

  const logout = async () => {
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await orbyvenSupabase.auth.signOut();
      if (authError) throw authError;
      setWorkspace(null);
      setActiveModule("overview");
      setNavigation((current) => ({ module: "overview", token: current.token + 1 }));
      await initializeWorkspace();
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

  const activeTheme =
    uiManifest.theme[isDark ? "dark" : "light"] ??
    BUNDLED_UI_MANIFEST.theme[isDark ? "dark" : "light"];

  const themeVars = {
    "--bg": activeTheme.bg,
    "--surface": activeTheme.surface,
    "--surface-2": activeTheme.surface2,
    "--text": activeTheme.text,
    "--muted": activeTheme.muted,
    "--muted-2": activeTheme.muted2,
    "--border": activeTheme.border,
    "--border-strong": activeTheme.borderStrong,
    "--button": activeTheme.button,
    "--button-text": activeTheme.buttonText,
    "--accent": activeTheme.accent,
    "--accent-soft": activeTheme.accentSoft,
  } as CSSProperties;

  const structuralUpdateAvailable =
    uiManifest.desktopVersion !== CURRENT_DESKTOP_VERSION;

  const locale = workspace?.profile?.locale || "ro-RO";
  const timeZone = workspace?.profile?.timezone || "Europe/Bucharest";
  const greetingName =
    workspace?.profile?.greeting_name ||
    workspace?.organization.name.split(" ")[0] ||
    "";
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date());

  return (
    <div className={"desktop " + (isDark ? "dark" : "light")} style={themeVars}>
      {screen !== "workspace" ? (
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
              <button className="secondary" onClick={() => void logout()}>
                Schimbă contul
              </button>
            </section>
          )}

          {screen === "login" && (
            <section className="auth-card">
              <span className="eyebrow">WORKSPACE · WINDOWS</span>
              <h1>Bine ai revenit.</h1>
              <p>Același cont ORBYVEN și aceleași module ca în workspace-ul web.</p>
              <form onSubmit={(event) => void login(event)} className="form">
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={credentials.email}
                    onChange={(event) =>
                      setCredentials((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
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
                      setCredentials((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
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
              <button className="text-button" onClick={() => void logout()}>
                Alt cont
              </button>
            </section>
          )}

          <footer className="auth-footer">
            ORBYVEN DESKTOP v{CURRENT_DESKTOP_VERSION} · WINDOWS
          </footer>
        </main>
      ) : workspace ? (
        <div className="desktop-workspace">
          <header className="topbar">
            <OrbyvenBrand subtitle="CREATIVE" />
            <div className="topbar-organization">
              <strong>{workspace.profile?.display_name ?? workspace.organization.name}</strong>
              <small>Business workspace</small>
            </div>

            <WorkspaceSearch
              organizationId={workspace.organization.id}
              enabledModules={workspace.enabledModules}
              onOpenModule={chooseModule}
              onOpenCommands={() => {
                setCommandQuery("");
                setCommandOpen(true);
              }}
            />

            <div className="top-actions">
              <span
                className={"live-ui-pill " + (liveUiSynced ? "synced" : "bundled")}
                title={"UI revision " + uiManifest.revision}
              >
                <span className="online-dot" />
                {structuralUpdateAvailable
                  ? "Update UI"
                  : liveUiSynced
                    ? "Live UI"
                    : "Local UI"}
              </span>

              {canWrite && createModules.length > 0 && (
                <button
                  className="primary topbar-create"
                  type="button"
                  onClick={() => setCreateMenuOpen(true)}
                >
                  + Creează
                </button>
              )}

              <button
                type="button"
                className="topbar-modules"
                onClick={() => {
                  setPanel(panel === "modules" ? "workspace" : "modules");
                  setCommandOpen(false);
                }}
              >
                {panel === "modules" ? "Înapoi" : "Module"}
              </button>

              <DesktopIntelligence
                organizationId={workspace.organization.id}
                onOpenModule={chooseModule}
              />
              <WorkspaceActivityCenter
                organizationId={workspace.organization.id}
                locale={locale}
                timeZone={timeZone}
                role={workspace.membership.role}
                enabledModules={workspace.enabledModules}
                onOpenModule={chooseModule}
              />

              <button
                title="Schimbă tema"
                aria-label="Schimbă tema"
                className="icon-button"
                onClick={() => {
                  const next = isDark ? "light" : "dark";
                  localStorage.setItem("orbyven-desktop-theme", next);
                  document.documentElement.style.colorScheme = next;
                  setIsDark(!isDark);
                }}
              >
                {isDark ? "☀" : "☾"}
              </button>

              <button
                className="account account-avatar"
                title="Ieși din cont"
                aria-label="Delogare"
                onClick={() => void logout()}
                disabled={busy}
              >
                {(workspace.profile?.display_name ?? workspace.organization.name)
                  .trim()
                  .slice(0, 2)
                  .toUpperCase()}
              </button>
            </div>
          </header>

          <div className="shell">
            <aside className="sidebar">
              <div className="company-label">
                <strong>{workspace.profile?.display_name ?? workspace.organization.name}</strong>
                <span>{ROLE_LABELS[workspace.membership.role]} · Workspace activ</span>
              </div>

              <nav aria-label="Module">
                {uiManifest.navGroups.map((group) => {
                  const available = modules.filter((definition) =>
                    group.ids.includes(definition.id),
                  );
                  if (!available.length) return null;

                  return (
                    <div className="nav-group" key={group.label}>
                      <p className="nav-label">{group.label}</p>
                      {available.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={
                            "nav-item " +
                            (panel === "workspace" && activeModule === item.id
                              ? "active"
                              : "")
                          }
                          aria-current={
                            panel === "workspace" && activeModule === item.id
                              ? "page"
                              : undefined
                          }
                          onClick={() => chooseModule(item.id)}
                        >
                          <ModuleGlyph id={item.id} />
                          <span>{item.shortName}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </nav>

              <button
                className="sidebar-customize"
                type="button"
                onClick={() => setPanel("modules")}
              >
                <strong>
                  {canManageModules
                    ? "Personalizează workspace-ul"
                    : "Modulele tale"}
                </strong>
                <small>
                  {canManageModules
                    ? "Adaugă sau ascunde instrumente"
                    : "Vezi instrumentele disponibile"}
                </small>
              </button>
            </aside>

            <main className="main-area">
              <div className="work-area shared-work-area">
                {error && (
                  <div role="alert" className="error-banner">
                    {error}
                    <button onClick={() => setError("")}>×</button>
                  </div>
                )}

                {panel === "modules" ? (
                  <>
                    <section className="page-heading module-store-heading">
                      <div>
                        <p className="eyebrow">PERSONALIZARE</p>
                        <h1>Modulele tale.</h1>
                        <p className="subheading">
                          Alege doar instrumentele de care ai nevoie.
                        </p>
                      </div>
                    </section>

                    <section className="module-store">
                      {runtimeModules.map((definition) => {
                        const enabled = workspace.enabledModules.includes(definition.id);
                        const locked = definition.id === "overview";
                        const entitled = workspace.entitledModules.includes(definition.id);
                        const blocked =
                          !canManageModules ||
                          Boolean(savingModule) ||
                          locked ||
                          (!enabled && !entitled);

                        return (
                          <article key={definition.id} className="module-store-card">
                            <div className="module-store-head">
                              <span className="module-store-icon">
                                <ModuleGlyph id={definition.id} />
                              </span>
                              {definition.badge && (
                                <span className="module-store-badge">
                                  {definition.badge}
                                </span>
                              )}
                            </div>
                            <h2>{definition.name}</h2>
                            <p>{definition.description}</p>
                            <div className="module-store-bottom">
                              <span>
                                {savingModule === definition.id
                                  ? "Se salvează..."
                                  : enabled
                                    ? "Activ"
                                    : "Neactivat"}
                              </span>
                              <button
                                type="button"
                                className={enabled ? "primary" : "secondary"}
                                disabled={blocked}
                                onClick={() => void toggleModule(definition.id)}
                              >
                                {locked
                                  ? "Inclus"
                                  : !canManageModules
                                    ? "Blocat"
                                    : !enabled && !entitled
                                      ? "Necesită acces"
                                      : savingModule === definition.id
                                        ? "Salvare"
                                        : enabled
                                          ? "Elimină"
                                          : "Adaugă"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </section>
                  </>
                ) : (
                  <DesktopWorkspaceModules
                    activeModule={activeModule}
                    navigation={navigation}
                    organizationId={workspace.organization.id}
                    locale={locale}
                    timeZone={timeZone}
                    greetingName={greetingName}
                    dateLabel={dateLabel}
                    enabledModules={workspace.enabledModules}
                    role={workspace.membership.role}
                    onOpenModule={chooseModule}
                  />
                )}

                <footer className="page-footer">
                  ORBYVEN · Desktop Workspace
                  <span>
                    v{CURRENT_DESKTOP_VERSION} · UI {uiManifest.revision}
                  </span>
                </footer>
              </div>
            </main>
          </div>

          {commandOpen && (
            <div
              className="overlay command-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setCommandOpen(false);
              }}
            >
              <section
                className="command-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="command-title"
              >
                <div className="command-top">
                  <h2 id="command-title">Unde vrei să ajungi?</h2>
                  <button
                    className="icon-button"
                    aria-label="Închide navigarea"
                    onClick={() => setCommandOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <input
                  autoFocus
                  aria-label="Caută un modul"
                  placeholder="Caută un modul..."
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                />
                <p className="eyebrow">MODULE DISPONIBILE</p>
                <div className="command-results">
                  {filteredModules.map((module) => (
                    <button
                      key={module.id}
                      className="command-item"
                      onClick={() => chooseModule(module.id)}
                    >
                      <span className="module-store-icon">
                        <ModuleGlyph id={module.id} />
                      </span>
                      <span>
                        <strong>{module.shortName}</strong>
                        <small>{module.description}</small>
                      </span>
                      <span className="command-arrow">→</span>
                    </button>
                  ))}
                </div>
                {!filteredModules.length && (
                  <p className="muted">Niciun modul găsit.</p>
                )}
                <small className="command-hint">
                  Ctrl K · navigare rapidă &nbsp; · &nbsp; Ctrl F · caută în firmă
                </small>
              </section>
            </div>
          )}

          {createMenuOpen && canWrite && (
            <div
              className="overlay command-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setCreateMenuOpen(false);
              }}
            >
              <section
                className="command-dialog create-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="quick-create-title"
              >
                <div className="command-top">
                  <div>
                    <p className="eyebrow">ACȚIUNE NOUĂ</p>
                    <h2 id="quick-create-title">Ce vrei să creezi?</h2>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Închide"
                    onClick={() => setCreateMenuOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="command-results">
                  {createModules.map((module) => (
                    <button
                      key={module.id}
                      className="command-item"
                      onClick={() => chooseModule(module.id, { create: true })}
                    >
                      <span className="module-store-icon">
                        <ModuleGlyph id={module.id} />
                      </span>
                      <strong>{createLabel(module.id)}</strong>
                      <span className="command-arrow">→</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
