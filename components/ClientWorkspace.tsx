"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";
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
  const [activeModule, setActiveModule] =
    useState<OrbyvenModuleId>("overview");
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
        setLoadError(
          "Contul este autentificat, dar nu are încă un workspace ORBYVEN atribuit."
        );
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
    void loadWorkspace();

    return () => window.clearTimeout(themeTimer);
  }, [loadWorkspace]);

  const enabledModules = useMemo<OrbyvenModuleId[]>(
    () => workspace?.enabledModules ?? ["overview"],
    [workspace]
  );

  const enabledDefinitions = useMemo(
    () =>
      ORBYVEN_MODULES.filter((definition) =>
        enabledModules.includes(definition.id)
      ),
    [enabledModules]
  );

  const activeDefinition =
    ORBYVEN_MODULES.find((definition) => definition.id === activeModule) ??
    ORBYVEN_MODULES[0];

  const canManageModules =
    workspace?.membership.role === "owner" ||
    workspace?.membership.role === "admin";

  const organizationName =
    workspace?.profile?.display_name ?? workspace?.organization.name ?? "ORBYVEN";
  const greetingName =
    workspace?.profile?.greeting_name ??
    workspace?.organization.name.split(" ")[0] ??
    "";
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const dateLabel = useMemo(() => {
    const locale = workspace?.profile?.locale ?? "ro-RO";
    const timeZone = workspace?.profile?.timezone ?? "Europe/Bucharest";
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }).format(new Date());

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [workspace]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const toggleModule = async (id: OrbyvenModuleId) => {
    if (
      id === "overview" ||
      !workspace ||
      !canManageModules ||
      savingModule
    ) {
      return;
    }

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

    if (currentlyEnabled && activeModule === id) {
      setActiveModule("overview");
    }

    try {
      await setOrganizationModuleEnabled(
        workspace.organization.id,
        id,
        !currentlyEnabled
      );
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
    "--border":
      theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft":
      theme === "dark" ? "rgba(75,70,238,0.20)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  if (loading) {
    return (
      <WorkspaceStateScreen
        vars={vars}
        theme={theme}
        title="Se pregătește workspace-ul..."
      />
    );
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
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg)]/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo compact theme={theme} />
            <div className="hidden h-6 w-px bg-[var(--border)] md:block" />
            <button
              type="button"
              onClick={() => setPanel("workspace")}
              className="hidden text-sm font-medium text-[var(--muted)] md:block"
            >
              Workspace
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPanel(panel === "modules" ? "workspace" : "modules")
              }
              className="hidden h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold sm:block"
            >
              {panel === "modules" ? "Înapoi" : "Module"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Schimbă tema"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-sm"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden h-10 rounded-full px-3 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface)] sm:block"
            >
              Ieșire
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label="Delogare"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--button)] text-xs font-semibold text-[var(--button-text)]"
            >
              {initials || "OR"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-72px)] border-r border-[var(--border)] px-4 py-6 md:flex md:flex-col">
          <div className="px-3">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              {organizationName}
            </p>
            <p className="mt-2 text-sm font-semibold">Spațiul tău de lucru</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              {roleLabels[workspace.membership.role]}
            </p>
          </div>

          <nav className="mt-7 space-y-1.5">
            {enabledDefinitions.map((definition) => {
              const active =
                panel === "workspace" && activeModule === definition.id;
              return (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => {
                    setPanel("workspace");
                    setActiveModule(definition.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm transition ${
                    active
                      ? "bg-[var(--surface)] font-semibold"
                      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: definition.color }}
                  />
                  <span>{definition.shortName}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => setPanel("modules")}
              className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left text-xs font-medium text-[var(--muted)]"
            >
              {canManageModules
                ? "+ Adaugă sau elimină module"
                : "Vezi modulele active"}
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-7 md:px-9 md:py-10 lg:px-12 xl:px-14">
          {panel === "modules" ? (
            <ModuleStore
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
              greetingName={greetingName}
              dateLabel={dateLabel}
              enabledModules={enabledModules}
              role={workspace.membership.role}
            />
          )}
        </section>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-[color:var(--bg)]/90 p-2 shadow-2xl backdrop-blur-2xl md:hidden">
        {enabledDefinitions.slice(0, 4).map((definition) => (
          <button
            key={definition.id}
            type="button"
            onClick={() => {
              setPanel("workspace");
              setActiveModule(definition.id);
            }}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[10px] ${
              panel === "workspace" && activeModule === definition.id
                ? "bg-[var(--surface)] font-semibold"
                : "text-[var(--muted)]"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: definition.color }}
            />
            <span className="truncate">{definition.shortName}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPanel("modules")}
          className="flex flex-1 flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[10px] text-[var(--muted)]"
        >
          <span className="text-base leading-none">＋</span>
          <span>Module</span>
        </button>
      </nav>
    </main>
  );
}

function WorkspaceContent({
  activeModule,
  greetingName,
  dateLabel,
  enabledModules,
  role,
}: {
  activeModule: OrbyvenModuleId;
  greetingName: string;
  dateLabel: string;
  enabledModules: OrbyvenModuleId[];
  role: OrbyvenWorkspace["membership"]["role"];
}) {
  if (activeModule !== "overview") {
    const definition = ORBYVEN_MODULES.find(
      (item) => item.id === activeModule
    )!;

    return (
      <div className="pb-24 md:pb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Modul activ
          </p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px]">
            {definition.name}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            {definition.description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {definition.features.map((feature, index) => (
            <article
              key={feature}
              className="min-h-[190px] rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: definition.accent,
                  color: definition.color,
                }}
              >
                0{index + 1}
              </div>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em]">
                {feature}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Modul portabil conectat la organizația curentă prin ORBYVEN Core.
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-[28px] border border-dashed border-[var(--border-strong)] p-7 text-sm leading-6 text-[var(--muted)]">
          Configurația acestui modul vine acum din Supabase. Când logica specifică modulului este conectată, toate datele vor fi filtrate automat după organizația clientului.
        </div>
      </div>
    );
  }

  const businessModules = enabledModules.filter(
    (moduleId) => moduleId !== "overview"
  );
  const activeNames = ORBYVEN_MODULES.filter((definition) =>
    businessModules.includes(definition.id)
  )
    .slice(0, 3)
    .map((definition) => definition.name);

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            {dateLabel}
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px] lg:text-[70px]">
            Bună, {greetingName || "acolo"}.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            Workspace-ul este acum legat de firma ta. Vezi doar instrumentele active pentru organizația ta.
          </p>
        </div>
        <span className="inline-flex h-11 self-start items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-xs font-semibold text-[var(--muted)]">
          Supabase · Live
        </span>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Module active"
          value={String(businessModules.length)}
          note="configurate pentru firmă"
        />
        <Metric
          label="Acces"
          value={roleLabels[role]}
          note="rol în organizație"
        />
        <Metric label="Izolare date" value="RLS" note="activă pe organizație" />
        <Metric label="Configurație" value="Live" note="sincronizată din backend" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Workspace</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">
                Instrumentele firmei
              </h2>
            </div>
            <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">
              {businessModules.length} active
            </span>
          </div>

          <div className="mt-7 space-y-3">
            {activeNames.length ? (
              activeNames.map((name) => (
                <Priority
                  key={name}
                  title={name}
                  meta="Activ · conectat la workspace"
                />
              ))
            ) : (
              <p className="rounded-[20px] bg-[var(--bg)] p-5 text-sm text-[var(--muted)]">
                Nu există încă module business active.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-6 sm:p-8">
          <p className="text-xs font-medium text-[var(--muted)]">ORBYVEN Core</p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">
            Sistem pregătit
          </h2>
          <div className="mt-7 space-y-5">
            <StatusItem
              title="Organizație încărcată"
              meta="Identitate și profil din backend"
            />
            <StatusItem
              title="Module sincronizate"
              meta={`${businessModules.length} instrumente disponibile`}
            />
            <StatusItem title="RLS activ" meta="Date izolate între clienți" />
          </div>
        </article>
      </section>
    </div>
  );
}

function ModuleStore({
  enabledModules,
  onToggle,
  onClose,
  canManage,
  savingModule,
  error,
}: {
  enabledModules: OrbyvenModuleId[];
  onToggle: (id: OrbyvenModuleId) => void;
  onClose: () => void;
  canManage: boolean;
  savingModule: OrbyvenModuleId | null;
  error: string;
}) {
  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Module ORBYVEN
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-[60px]">
            Doar ce îți trebuie.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            {canManage
              ? "Activezi instrumentele utile firmei tale. Modificarea este salvată direct în configurația organizației."
              : "Poți vedea instrumentele firmei. Doar un owner sau admin poate schimba configurația."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-11 self-start rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
        >
          Gata
        </button>
      </section>

      {error && (
        <div className="mt-6 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ORBYVEN_MODULES.map((definition) => {
          const enabled = enabledModules.includes(definition.id);
          const locked = definition.id === "overview";
          const saving = savingModule === definition.id;

          return (
            <article
              key={definition.id}
              className="flex min-h-[270px] flex-col rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[16px] text-sm font-semibold"
                  style={{
                    backgroundColor: definition.accent,
                    color: definition.color,
                  }}
                >
                  {definition.shortName.slice(0, 2).toUpperCase()}
                </div>
                {definition.badge && (
                  <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                    {definition.badge}
                  </span>
                )}
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.045em]">
                {definition.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {definition.description}
              </p>

              <div className="mt-auto flex items-center justify-between gap-4 pt-7">
                <span className="text-xs text-[var(--muted)]">
                  {saving ? "Se salvează..." : enabled ? "Activ" : "Neactivat"}
                </span>
                <button
                  type="button"
                  disabled={locked || !canManage || Boolean(savingModule)}
                  onClick={() => onToggle(definition.id)}
                  className={`h-10 rounded-full px-4 text-xs font-semibold transition ${
                    enabled
                      ? "bg-[var(--button)] text-[var(--button-text)]"
                      : "border border-[var(--border-strong)]"
                  } disabled:cursor-default disabled:opacity-60`}
                >
                  {locked
                    ? "Inclus"
                    : !canManage
                      ? "Blocat"
                      : saving
                        ? "Salvare"
                        : enabled
                          ? "Elimină"
                          : "Adaugă"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceStateScreen({
  vars,
  theme,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  vars: CSSProperties;
  theme: Theme;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6 py-6 md:px-10">
        <BrandLogo compact theme={theme} />
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="max-w-lg text-center">
            <div className="mx-auto h-3 w-3 rounded-full bg-[var(--accent)]" />
            <h1 className="mt-6 text-[38px] font-semibold tracking-[-0.05em]">
              {title}
            </h1>
            {description && (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            )}
            {(actionLabel || secondaryLabel) && (
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {actionLabel && onAction && (
                  <button
                    type="button"
                    onClick={onAction}
                    className="h-11 rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
                  >
                    {actionLabel}
                  </button>
                )}
                {secondaryLabel && onSecondary && (
                  <button
                    type="button"
                    onClick={onSecondary}
                    className="h-11 rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
                  >
                    {secondaryLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-6 text-[38px] font-semibold leading-none tracking-[-0.055em]">
        {value}
      </p>
      <p className="mt-3 text-xs text-[var(--muted-2)]">{note}</p>
    </article>
  );
}

function Priority({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-[var(--bg)] p-4 text-left">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-xs text-[var(--muted)]">{meta}</p>
      </div>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]" />
    </div>
  );
}

function StatusItem({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{meta}</p>
      </div>
    </div>
  );
}
