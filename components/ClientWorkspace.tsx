"use client";

import BrandLogo from "@/components/BrandLogo";
import WorkspaceContent from "@/components/WorkspaceContent";
import WorkspaceModuleStore from "@/components/WorkspaceModuleStore";
import WorkspaceStateScreen from "@/components/WorkspaceStateScreen";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import {
  getCurrentWorkspace,
  setOrganizationModuleEnabled,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

type Theme = "light" | "dark";
type Panel = "workspace" | "modules";

const roleLabels: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membru",
  viewer: "Viewer",
};

export default function ClientWorkspace() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [panel, setPanel] = useState<Panel>("workspace");
  const [activeModule, setActiveModule] = useState<OrbyvenModuleId>("overview");
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingModule, setSavingModule] = useState<OrbyvenModuleId | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data: authData } = await orbyvenSupabase.auth.getUser();
      if (!authData.user) {
        router.replace("/workspace/login");
        return;
      }

      const nextWorkspace = await getCurrentWorkspace();
      if (!nextWorkspace) {
        setLoadError("Contul este autentificat, dar nu are încă un workspace ORBYVEN atribuit.");
        setLoading(false);
        return;
      }

      setWorkspace(nextWorkspace);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoadError("Workspace-ul nu a putut fi încărcat. Încearcă din nou.");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: Theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : prefersDark
          ? "dark"
          : "light";

    document.documentElement.style.colorScheme = nextTheme;
    const themeTimer = window.setTimeout(() => setTheme(nextTheme), 0);
    const workspaceTimer = window.setTimeout(() => void loadWorkspace(), 0);

    return () => {
      window.clearTimeout(themeTimer);
      window.clearTimeout(workspaceTimer);
    };
  }, [loadWorkspace]);

  const enabledModules = useMemo<OrbyvenModuleId[]>(
    () => workspace?.enabledModules ?? ["overview"],
    [workspace]
  );

  const enabledDefinitions = useMemo(
    () => ORBYVEN_MODULES.filter((definition) => enabledModules.includes(definition.id)),
    [enabledModules]
  );

  const activeDefinition =
    ORBYVEN_MODULES.find((definition) => definition.id === activeModule) ?? ORBYVEN_MODULES[0];

  const canManageModules =
    workspace?.membership.role === "owner" || workspace?.membership.role === "admin";

  const organizationName =
    workspace?.profile?.display_name ?? workspace?.organization.name ?? "ORBYVEN";
  const greetingName =
    workspace?.profile?.greeting_name ?? workspace?.organization.name.split(" ")[0] ?? "";
  const locale = workspace?.profile?.locale ?? "ro-RO";
  const timeZone = workspace?.profile?.timezone ?? "Europe/Bucharest";
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const dateLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [locale, timeZone]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const openModule = useCallback((id: OrbyvenModuleId) => {
    setPanel("workspace");
    setActiveModule(id);
  }, []);

  const toggleModule = async (id: OrbyvenModuleId) => {
    if (id === "overview" || !workspace || !canManageModules || savingModule) return;

    const currentlyEnabled = workspace.enabledModules.includes(id);
    const previousModules = workspace.enabledModules;
    const nextModules = currentlyEnabled
      ? previousModules.filter((moduleId) => moduleId !== id)
      : [...previousModules, id];

    setActionError("");
    setSavingModule(id);
    setWorkspace((current) =>
      current ? { ...current, enabledModules: nextModules } : current
    );

    if (currentlyEnabled && activeModule === id) setActiveModule("overview");

    try {
      await setOrganizationModuleEnabled(workspace.organization.id, id, !currentlyEnabled);
    } catch (error) {
      console.error(error);
      setWorkspace((current) =>
        current ? { ...current, enabledModules: previousModules } : current
      );
      setActionError("Modulul nu a putut fi actualizat. Modificarea a fost anulată.");
    } finally {
      setSavingModule(null);
    }
  };

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/workspace/login");
  };

  const vars = {
    "--bg": theme === "dark" ? "#09090a" : "#ffffff",
    "--surface": theme === "dark" ? "#111113" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#19191b" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#85858a" : "#86868b",
    "--border": theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft": theme === "dark" ? "rgba(75,70,238,0.20)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  if (loading) {
    return <WorkspaceStateScreen vars={vars} theme={theme} title="Se pregătește workspace-ul..." />;
  }

  if (loadError || !workspace) {
    return (
      <WorkspaceStateScreen
        vars={vars}
        theme={theme}
        title="Workspace indisponibil"
        description={loadError}
        actionLabel="Încearcă din nou"
        onAction={loadWorkspace}
        secondaryLabel="Delogare"
        onSecondary={logout}
      />
    );
  }

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg)]/94 md:backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo compact theme={theme} />
            <div className="hidden h-6 w-px bg-[var(--border)] md:block" />
            <button type="button" onClick={() => setPanel("workspace")} className="hidden text-sm font-medium text-[var(--muted)] md:block">Workspace</button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPanel(panel === "modules" ? "workspace" : "modules")} className="hidden h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold sm:block">{panel === "modules" ? "Înapoi" : "Module"}</button>
            <button type="button" onClick={toggleTheme} aria-label="Schimbă tema" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-sm">{theme === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={logout} className="hidden h-10 rounded-full px-3 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface)] sm:block">Ieșire</button>
            <button type="button" onClick={logout} aria-label="Delogare" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--button)] text-xs font-semibold text-[var(--button-text)]">{initials || "OR"}</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-72px)] border-r border-[var(--border)] px-4 py-6 md:flex md:flex-col">
          <div className="px-3">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">{organizationName}</p>
            <p className="mt-2 text-sm font-semibold">Spațiul tău de lucru</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{roleLabels[workspace.membership.role]}</p>
          </div>

          <nav className="mt-7 space-y-1.5">
            {enabledDefinitions.map((definition) => {
              const active = panel === "workspace" && activeModule === definition.id;
              return (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => openModule(definition.id)}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm transition ${active ? "bg-[var(--surface)] font-semibold" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: definition.color }} />
                  <span>{definition.shortName}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button type="button" onClick={() => setPanel("modules")} className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-xs font-medium text-[var(--muted)]">
              {canManageModules ? "+ Adaugă sau elimină module" : "Vezi modulele active"}
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-7 md:px-9 md:py-10 lg:px-12 xl:px-14">
          {panel === "modules" ? (
            <WorkspaceModuleStore
              enabledModules={enabledModules}
              onToggle={toggleModule}
              onClose={() => setPanel("workspace")}
              canManage={canManageModules}
              savingModule={savingModule}
              error={actionError}
            />
          ) : (
            <WorkspaceContent
              activeModule={activeDefinition.id}
              organizationId={workspace.organization.id}
              locale={locale}
              timeZone={timeZone}
              greetingName={greetingName}
              dateLabel={dateLabel}
              enabledModules={enabledModules}
              role={workspace.membership.role}
              onOpenModule={openModule}
            />
          )}
        </section>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 overflow-x-auto rounded-[22px] border border-[var(--border)] bg-[color:var(--bg)]/96 p-2 shadow-2xl md:hidden">
        <div className="flex min-w-max items-center gap-1">
          {enabledDefinitions.map((definition) => (
            <button
              key={definition.id}
              type="button"
              onClick={() => openModule(definition.id)}
              className={`flex min-w-[72px] flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[10px] ${panel === "workspace" && activeModule === definition.id ? "bg-[var(--surface)] font-semibold" : "text-[var(--muted)]"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: definition.color }} />
              <span className="max-w-[68px] truncate">{definition.shortName}</span>
            </button>
          ))}
          <button type="button" onClick={() => setPanel("modules")} className={`flex min-w-[72px] flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[10px] ${panel === "modules" ? "bg-[var(--surface)] font-semibold" : "text-[var(--muted)]"}`}>
            <span className="text-base leading-none">＋</span>
            <span>Module</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
