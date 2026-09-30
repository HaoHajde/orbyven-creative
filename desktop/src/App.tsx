import { useCallback, useEffect, useMemo, useState, type FormEvent, type CSSProperties } from "react";
import { fetchDesktopUiManifest, initializeDesktopClient, orbyvenSupabase, type DesktopUiManifest } from "./client";
import { getCurrentWorkspace, getWorkspaceAccessState, setOrganizationModuleEnabled, type OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { ModuleGlyph, OrbyvenBrand } from "./Brand";
import DesktopActivityCenter from "./ActivityCenter";
import DesktopIntelligence from "./Intelligence";
import DesktopInventoryPanel from "./InventoryPanel";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { CURRENT_DESKTOP_VERSION, WORKSPACE_CREATE_MODULES, WORKSPACE_LAYOUT, WORKSPACE_NAV_GROUPS, WORKSPACE_THEME, WORKSPACE_UI_REVISION } from "@/lib/workspace-visual-system";
import { loadOverviewSnapshot, type OverviewSnapshot } from "@/lib/modules/overview";
import { createCrmLead, listCrmLeads, updateCrmLead } from "@/lib/modules/leads";
import { createWorkTask, listWorkTasks, setWorkTaskStatus } from "@/lib/modules/tasks";
import { createCalendarEvent, listCalendarEvents, setCalendarEventStatus } from "@/lib/modules/calendar";
import { createEstimate, listEstimates, setEstimateStatus } from "@/lib/modules/estimates";
import { createDocumentSignedUrl, listDocuments, uploadDocument, type DocumentCategory } from "@/lib/modules/documents";
import { createExpense, listExpenses } from "@/lib/modules/expenses";

import { createTeamMember, listTeamMembers, updateTeamMember } from "@/lib/modules/team";

type Screen = "loading" | "login" | "onboarding" | "access" | "workspace" | "error";
type Row = Record<string, unknown>;
type Field = { name: string; label: string; type?: string; required?: boolean };
const LEAD_FIELDS: Field[] = [
  { name: "name", label: "Nume client", required: true },
  { name: "company", label: "Companie" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefon" },
  { name: "note", label: "Notițe" },
];
const TASK_FIELDS: Field[] = [
  { name: "title", label: "Lucrare sau task", required: true },
  { name: "description", label: "Descriere" },
  { name: "location", label: "Locație" },
];
const EVENT_FIELDS: Field[] = [
  { name: "title", label: "Denumire programare", required: true },
  { name: "startAt", label: "Început", type: "datetime-local", required: true },
  { name: "endAt", label: "Sfârșit", type: "datetime-local", required: true },
  { name: "location", label: "Locație" },
];
const ESTIMATE_FIELDS: Field[] = [
  { name: "title", label: "Titlu ofertă", required: true },
  { name: "item", label: "Poziție deviz", required: true },
  { name: "quantity", label: "Cantitate", type: "number", required: true },
  { name: "price", label: "Preț unitar (lei)", type: "number", required: true },
];
const EXPENSE_FIELDS: Field[] = [
  { name: "description", label: "Descriere cheltuială", required: true },
  { name: "category", label: "Categorie", required: true },
  { name: "vendor", label: "Furnizor" },
  { name: "amount", label: "Valoare (lei)", type: "number", required: true },
  { name: "occurredOn", label: "Data", type: "date", required: true },
];
const TEAM_FIELDS: Field[] = [
  { name: "name", label: "Nume membru", required: true },
  { name: "jobTitle", label: "Rol / funcție" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefon" },
];

const FORM_FIELDS: Partial<Record<OrbyvenModuleId, Field[]>> = {
  leads: LEAD_FIELDS, tasks: TASK_FIELDS, calendar: EVENT_FIELDS,
  estimates: ESTIMATE_FIELDS, expenses: EXPENSE_FIELDS, team: TEAM_FIELDS,
};
const TITLES: Record<OrbyvenModuleId, string> = {
  overview: "Prezentare generală", leads: "Clienți", tasks: "Lucrări",
  calendar: "Calendar", estimates: "Oferte & devize", documents: "Documente",
  inventory: "Stoc & achiziții", expenses: "Finanțe", thermal: "Planșă Termică", team: "Echipă",
};
const STATUS_OPTIONS: Partial<Record<OrbyvenModuleId, string[]>> = {
  leads: ["new", "contacted", "qualified", "proposal", "won", "lost"],
  tasks: ["planned", "in_progress", "blocked", "done", "cancelled"],
  calendar: ["scheduled", "completed", "cancelled"],
  estimates: ["draft", "sent", "accepted", "rejected", "expired"],
  team: ["active", "inactive"],
};
const ROLE_LABELS: Record<OrbyvenWorkspace["membership"]["role"], string> = {
  owner: "Proprietar", admin: "Administrator", manager: "Manager",
  member: "Membru", viewer: "Vizualizare",
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
  navGroups: WORKSPACE_NAV_GROUPS.map((group) => ({ label: group.label, ids: [...group.ids] })),
  createModules: [...WORKSPACE_CREATE_MODULES],
};

function formatNumber(value: number) { return new Intl.NumberFormat("ro-RO").format(value); }
function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined,
  }).format(date);
}
function currency(cents: unknown, code: unknown = "RON") {
  const value = typeof cents === "number" ? cents / 100 : 0;
  const unit = typeof code === "string" && /^[A-Z]{3}$/.test(code) ? code : "RON";
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency: unit }).format(value);
}
function rowLabel(row: Row, module: OrbyvenModuleId) {
  if (module === "estimates") return String(row.reference ?? "") + " · " + String(row.title ?? "");
  return String(row.title ?? row.name ?? row.description ?? row.display_name ?? "Înregistrare");
}
function rowSummary(row: Row, module: OrbyvenModuleId) {
  if (module === "leads") return [row.company, row.email, row.phone].filter(Boolean).join(" · ");
  if (module === "tasks") return [row.kind, row.priority, row.location].filter(Boolean).join(" · ");
  if (module === "calendar") return formatDate(row.start_at);
  if (module === "estimates") return currency(row.total_cents, row.currency);
  if (module === "documents") return [row.category, row.size_bytes ? Math.round(Number(row.size_bytes) / 1024) + " KB" : null].filter(Boolean).join(" · ");
  if (module === "inventory") return [row.on_hand !== undefined ? String(row.on_hand) + " " + String(row.unit ?? "") : null, row.state].filter(Boolean).join(" · ");
  if (module === "expenses") return currency(row.amount_cents, row.currency) + " · " + formatDate(row.occurred_on);
  if (module === "thermal") return ["rev. " + String(row.revision ?? 0), formatDate(row.updated_at)].filter(Boolean).join(" · ");
  if (module === "team") return [row.job_title, row.email].filter(Boolean).join(" · ");
  return "";
}
function FieldInput({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{field.label}</span>
      <input value={value} type={field.type || "text"} required={field.required}
        min={field.type === "number" ? "0" : undefined}
        step={field.type === "number" ? "any" : undefined}
        onChange={(event) => onChange(event.target.value)} />
    </label>
  );
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
  const [overview, setOverview] = useState<OverviewSnapshot | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("orbyven-desktop-theme") !== "light");
  const [refresh, setRefresh] = useState(0);
  const [panel, setPanel] = useState<"workspace" | "modules">("workspace");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [savingModule, setSavingModule] = useState<OrbyvenModuleId | null>(null);
  const [uiManifest, setUiManifest] = useState<DesktopUiManifest>(BUNDLED_UI_MANIFEST);
  const [liveUiSynced, setLiveUiSynced] = useState(false);

  const initializeWorkspace = useCallback(async () => {
    // An authoritative access-state RPC must run BEFORE any private data read.
    const state = await getWorkspaceAccessState();
    setAccessState(state);
    if (state === "login") {
      setRows([]); setOverview(null); setSelected(null); setWorkspace(null); setScreen("login");
      return;
    }
    if (state === "onboarding") {
      setWorkspace(null); setRows([]); setOverview(null); setScreen("onboarding");
      return;
    }
    if (state !== "workspace") {
      setWorkspace(null); setRows([]); setOverview(null); setScreen("access");
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
        if (!cancelled) {
          console.error("ORBYVEN Desktop initialization:", cause);
          setError("Conexiunea ORBYVEN nu este disponibilă. Verifică internetul și reîncearcă.");
          setScreen("error");
        }
      }
    };
    void start();
    return () => { cancelled = true; };
  }, [initializeWorkspace, syncLiveUi]);

  const canWrite = Boolean(workspace && workspace.membership.role !== "viewer");
  const canFinance = Boolean(workspace && ["owner", "admin", "manager"].includes(workspace.membership.role));
  const modules = useMemo(() => ORBYVEN_MODULES.filter((item) => workspace?.enabledModules.includes(item.id)), [workspace]);
  const canManageModules = Boolean(workspace && ["owner", "admin"].includes(workspace.membership.role));
  const createModules = modules.filter((module) => uiManifest.createModules.includes(module.id) && (module.id !== "expenses" || canFinance));
  const filteredModules = modules.filter((module) => (TITLES[module.id] + " " + module.name).toLocaleLowerCase("ro-RO").includes(commandQuery.trim().toLocaleLowerCase("ro-RO")));

  const loadModule = useCallback(async () => {
    if (!workspace) return;
    const org = workspace.organization.id;
    setError("");
    setBusy(true);
    setSelected(null);
    try {
      if (activeModule === "overview") {
        const snapshot = await loadOverviewSnapshot(org, canFinance, workspace.profile?.timezone || "Europe/Bucharest");
        setOverview(snapshot);
        setRows([]);
      } else {
        // All reads and writes call the existing ORBYVEN service functions, with org RLS enforced.
        // Finance data is never requested for a role that cannot access it.
        if (activeModule === "expenses" && !canFinance) {
          setRows([]);
          setError("Modulul financiar este disponibil doar pentru roluri autorizate.");
          return;
        }
        const result =
          activeModule === "leads" ? await listCrmLeads(org) :
          activeModule === "tasks" ? await listWorkTasks(org) :
          activeModule === "calendar" ? await listCalendarEvents(org,
            new Date(Date.now() - 365 * 86400000).toISOString(),
            new Date(Date.now() + 365 * 86400000).toISOString()) :
          activeModule === "estimates" ? await listEstimates(org) :
          activeModule === "documents" ? await listDocuments(org) :
          activeModule === "inventory" ? [] :
          activeModule === "expenses" ? await listExpenses(org) :
          activeModule === "thermal" ? await (async () => {
            const [works, sketchesResult] = await Promise.all([
              listWorkTasks(org),
              orbyvenSupabase.from("thermal_sketches")
                .select("task_id,revision,updated_at")
                .eq("organization_id", org)
                .order("updated_at", { ascending: false }),
            ]);
            if (sketchesResult.error) throw sketchesResult.error;
            const workById = new Map(works.map((work) => [work.id, work]));
            return (sketchesResult.data ?? []).map((sketch) => ({
              id: sketch.task_id,
              task_id: sketch.task_id,
              title: workById.get(sketch.task_id)?.title ?? "Planșă termică",
              client_id: workById.get(sketch.task_id)?.client_id ?? null,
              revision: sketch.revision,
              updated_at: sketch.updated_at,
              status: "salvată",
            }));
          })() :
          await listTeamMembers(org);
        setRows(result as unknown as Row[]);
      }
    } catch (cause) {
      console.error("ORBYVEN desktop load:", cause);
      setError("Nu am putut încărca datele. Verifică conexiunea sau permisiunile.");
    } finally {
      setBusy(false);
    }
  }, [workspace, activeModule, canFinance]);

  useEffect(() => { void loadModule(); }, [loadModule, refresh]);

  useEffect(() => {
    const onKeys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setCommandQuery(""); setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false); setCreateMenuOpen(false); setShowCreate(false); setSelected(null);
      }
    };
    window.addEventListener("keydown", onKeys);
    return () => window.removeEventListener("keydown", onKeys);
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible" && workspace && !showCreate && !selected) {
        setRefresh((value) => value + 1);
      }
    };
    const syncOnFocus = () => { void syncLiveUi(); };
    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("focus", syncOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("focus", syncOnFocus);
    };
  }, [workspace, showCreate, selected, syncLiveUi]);

  function chooseModule(id: OrbyvenModuleId) {
    if (!workspace?.enabledModules.includes(id)) return;
    if (id === "expenses" && !canFinance) return;
    setPanel("workspace"); setCommandOpen(false); setCreateMenuOpen(false);
    setActiveModule(id); setRows([]); setQuery(""); setShowCreate(false); setSelected(null); setForm({}); setFile(null);
  }

  async function toggleModule(id: OrbyvenModuleId) {
    if (!workspace || !canManageModules || savingModule || id === "overview") return;
    const enabled = workspace.enabledModules.includes(id);
    if (!enabled && !workspace.entitledModules.includes(id)) {
      setError("Acest modul necesită un abonament sau acces pilot aprobat.");
      return;
    }
    const previous = workspace.enabledModules;
    const next = enabled ? previous.filter((item) => item !== id) : [...previous, id];
    setError(""); setSavingModule(id);
    setWorkspace((current) => current ? { ...current, enabledModules: next } : current);
    if (enabled && activeModule === id) chooseModule("overview");
    try {
      await setOrganizationModuleEnabled(workspace.organization.id, id, !enabled);
      setRefresh((value) => value + 1);
    } catch (cause) {
      console.error("Desktop module toggle:", cause);
      setWorkspace((current) => current ? { ...current, enabledModules: previous } : current);
      setError("Modulul nu a putut fi actualizat. Am anulat modificarea.");
    } finally { setSavingModule(null); }
  }

  function openCreate(moduleId: OrbyvenModuleId) {
    if (!canWrite || !workspace?.enabledModules.includes(moduleId) || (moduleId === "expenses" && !canFinance)) return;
    chooseModule(moduleId);
    setForm({ occurredOn: new Date().toISOString().slice(0, 10), quantity: "1" });
    setFile(null); setError(""); setShowCreate(true);
  }
  async function login(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const { error: authError } = await orbyvenSupabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(), password: credentials.password,
      });
      if (authError) throw authError;
      setCredentials((old) => ({ ...old, password: "" }));
      await initializeWorkspace();
    } catch (cause) {
      console.error("Desktop sign in:", cause);
      setError("Autentificarea a eșuat. Verifică emailul, parola și conexiunea.");
    } finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError("");
    try {
      const { error: authError } = await orbyvenSupabase.auth.signOut();
      if (authError) throw authError;
      await initializeWorkspace();
      chooseModule("overview");
    } catch (cause) {
      console.error("Desktop sign out:", cause);
      setError("Delogarea a eșuat. Reîncearcă.");
    } finally { setBusy(false); }
  }
  async function onboard(event: FormEvent) {
    event.preventDefault();
    const slug = company.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    if (company.trim().length < 2 || slug.length < 3) { setError("Completează numele companiei."); return; }
    setBusy(true); setError("");
    try {
      const { error: rpcError } = await orbyvenSupabase.rpc("bootstrap_organization", {
        p_name: company.trim(), p_slug: slug, p_module_ids: ["overview", "leads", "tasks"],
      });
      if (rpcError) throw rpcError;
      await initializeWorkspace();
    } catch (cause) {
      console.error("Desktop onboarding:", cause);
      setError("Nu am putut crea compania. Verifică numele sau reîncearcă.");
    } finally { setBusy(false); }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!workspace || !canWrite || (activeModule === "expenses" && !canFinance) || busy) return;
    const org = workspace.organization.id;
    setBusy(true); setError("");
    try {
      if (activeModule === "leads") await createCrmLead(org, {
        name: form.name || "", company: form.company, email: form.email, phone: form.phone, note: form.note,
      });
      if (activeModule === "tasks") await createWorkTask(org, {
        title: form.title || "", kind: "work", description: form.description, location: form.location,
      });
      if (activeModule === "calendar") {
        const from = new Date(form.startAt || "");
        const to = new Date(form.endAt || "");
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
          throw new Error("Intervalul programării este invalid.");
        }
        await createCalendarEvent(org, {
          title: form.title || "", startAt: from.toISOString(), endAt: to.toISOString(),
          location: form.location,
        });
      }
      if (activeModule === "estimates") await createEstimate(org, {
        title: form.title || "", items: [{
          description: form.item || "", quantity: Number(form.quantity),
          unitPriceLei: Number(form.price),
        }],
      });
      if (activeModule === "documents") {
        if (!file) throw new Error("Selectează un document.");
        await uploadDocument(org, { file, category: "general" as DocumentCategory });
      }
      if (activeModule === "expenses") await createExpense(org, {
        description: form.description || "", category: form.category || "other",
        vendor: form.vendor, amountLei: Number(form.amount), occurredOn: form.occurredOn || "",
      });
      if (activeModule === "team") await createTeamMember(org, {
        displayName: form.name || "", jobTitle: form.jobTitle,
        contactEmail: form.email, phone: form.phone,
      });
      setShowCreate(false); setForm({}); setFile(null); setRefresh((n) => n + 1);
    } catch (cause) {
      console.error("ORBYVEN desktop write:", cause);
      setError(cause instanceof Error ? cause.message : "Nu am putut salva. Reîncearcă.");
    } finally { setBusy(false); }
  }
  async function changeStatus(row: Row, status: string) {
    if (!workspace || !canWrite || busy) return;
    const org = workspace.organization.id;
    setBusy(true); setError("");
    try {
      if (activeModule === "leads") await updateCrmLead(org, String(row.id), { stage: status as "new" | "contacted" | "qualified" | "proposal" | "won" | "lost" });
      if (activeModule === "tasks") await setWorkTaskStatus(org, String(row.id), status as "planned" | "in_progress" | "blocked" | "done" | "cancelled");
      if (activeModule === "calendar") await setCalendarEventStatus(org, String(row.id), status as "scheduled" | "completed" | "cancelled");
      if (activeModule === "estimates") await setEstimateStatus(org, String(row.id), status as "draft" | "sent" | "accepted" | "rejected" | "expired");
      if (activeModule === "team") await updateTeamMember(org, String(row.id), { status: status as "active" | "inactive" });
      setRefresh((n) => n + 1);
    } catch (cause) {
      console.error("ORBYVEN status update:", cause);
      setError("Statusul nu a putut fi salvat. Verifică drepturile de acces.");
    } finally { setBusy(false); }
  }
  async function downloadDocument(row: Row) {
    setError("");
    try {
      const signedUrl = await createDocumentSignedUrl(String(row.storage_path));
      // Keep the app on its local origin and avoid navigating the whole WebView to storage.
      const response = await fetch(signedUrl, { credentials: "omit" });
      if (!response.ok) throw new Error("Document unavailable");
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = String(row.name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (cause) {
      console.error("Document download:", cause);
      setError("Documentul nu poate fi descărcat momentan.");
    }
  }

  const visibleRows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("ro-RO");
    if (!term) return rows;
    return rows.filter((row) => [rowLabel(row, activeModule), rowSummary(row, activeModule)]
      .join(" ").toLocaleLowerCase("ro-RO").includes(term));
  }, [rows, query, activeModule]);

  const activeTheme = uiManifest.theme[isDark ? "dark" : "light"] ?? BUNDLED_UI_MANIFEST.theme[isDark ? "dark" : "light"];
  const desktopThemeVars = {
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
  const structuralUpdateAvailable = uiManifest.desktopVersion !== CURRENT_DESKTOP_VERSION;

  return (
    <div className={"desktop " + (isDark ? "dark" : "light")} style={desktopThemeVars}>
      {screen !== "workspace" ? (
        <main className="auth-background">
          <div className="auth-top"><OrbyvenBrand subtitle="CREATIVE" /></div>
          {screen === "loading" && <section className="auth-card"><div className="spinner" /><h1>Se pregătește ORBYVEN.</h1><p>Conectăm aplicația la spațiul tău de lucru.</p></section>}
          {screen === "error" && <section className="auth-card"><h1>Conexiune indisponibilă.</h1><p>{error}</p><button className="primary" onClick={() => window.location.reload()}>Reîncearcă</button></section>}
          {screen === "access" && <section className="auth-card"><h1>Acces indisponibil.</h1><p>{ACCESS_MESSAGES[accessState] || "Contul nu poate accesa workspace-ul."}</p><button className="secondary" onClick={() => void logout()}>Schimbă contul</button></section>}
          {screen === "login" && <section className="auth-card">
            <span className="eyebrow">WORKSPACE · WINDOWS</span><h1>Bine ai revenit.</h1>
            <p>Contul tău ORBYVEN. Aplicație locală, date sincronizate.</p>
            <form onSubmit={(event) => void login(event)} className="form">
              <label className="field"><span>Email</span><input type="email" required autoComplete="username"
                value={credentials.email} onChange={(event) => setCredentials((old) => ({ ...old, email: event.target.value }))} /></label>
              <label className="field"><span>Parolă</span><input type="password" required autoComplete="current-password"
                value={credentials.password} onChange={(event) => setCredentials((old) => ({ ...old, password: event.target.value }))} /></label>
              {error && <p role="alert" className="error">{error}</p>}
              <button type="submit" className="primary" disabled={busy}>{busy ? "Se verifică..." : "Intră în ORBYVEN →"}</button>
            </form></section>}
          {screen === "onboarding" && <section className="auth-card">
            <span className="eyebrow">PRIMUL PAS</span><h1>Compania ta.</h1>
            <p>Construiește primul spațiu de lucru și activează modulele de bază.</p>
            <form className="form" onSubmit={(event) => void onboard(event)}>
              <label className="field"><span>Nume companie</span><input required minLength={2} value={company} onChange={(event) => setCompany(event.target.value)} /></label>
              {error && <p role="alert" className="error">{error}</p>}
              <button type="submit" disabled={busy} className="primary">Creează workspace →</button>
            </form>
            <button className="text-button" onClick={() => void logout()}>Alt cont</button>
          </section>}
          <footer className="auth-footer">ORBYVEN DESKTOP v0.5.0 · WINDOWS</footer>
        </main>
      ) : workspace && (
        <div className="desktop-workspace">
          <header className="topbar">
            <OrbyvenBrand subtitle="CREATIVE" />
            <div className="topbar-organization">
              <strong>{workspace.profile?.display_name ?? workspace.organization.name}</strong>
              <small>Business workspace</small>
            </div>
            <button type="button" className="topbar-search" onClick={() => { setCommandQuery(""); setCommandOpen(true); }}
              aria-label="Caută module și deschide navigarea rapidă">
              <span>⌕ &nbsp; Caută în workspace...</span><kbd>Ctrl K</kbd>
            </button>
            <div className="top-actions">
              <span className={"live-ui-pill " + (liveUiSynced ? "synced" : "bundled")} title={"UI revision " + uiManifest.revision}>
                <span className="online-dot" /> {structuralUpdateAvailable ? "Update UI" : liveUiSynced ? "Live UI" : "Local UI"}
              </span>
              {canWrite && createModules.length > 0 && (
                <button className="primary topbar-create" type="button" onClick={() => setCreateMenuOpen(true)}>+ Creează</button>
              )}
              <button type="button" className="topbar-modules" onClick={() => { setPanel(panel === "modules" ? "workspace" : "modules"); setCommandOpen(false); }}>
                {panel === "modules" ? "Înapoi" : "Module"}
              </button>
              <DesktopIntelligence organizationId={workspace.organization.id} onOpenModule={chooseModule} />
              <DesktopActivityCenter
                organizationId={workspace.organization.id}
                locale={workspace.profile?.locale || "ro-RO"}
                timeZone={workspace.profile?.timezone || "Europe/Bucharest"}
                role={workspace.membership.role}
                enabledModules={workspace.enabledModules}
                onOpenModule={chooseModule}
              />
              <button title="Reîncarcă datele" aria-label="Reîncarcă datele" className="icon-button" onClick={() => setRefresh((n) => n + 1)} disabled={busy}>↻</button>
              <button title="Schimbă tema" aria-label="Schimbă tema" className="icon-button" onClick={() => {
                localStorage.setItem("orbyven-desktop-theme", isDark ? "light" : "dark"); setIsDark(!isDark);
              }}>{isDark ? "☀" : "☾"}</button>
              <button className="account account-avatar" title="Ieși din cont" aria-label="Delogare" onClick={() => void logout()} disabled={busy}>
                {(workspace.profile?.display_name ?? workspace.organization.name).trim().slice(0,2).toUpperCase()}
              </button>
            </div>
          </header>
          <div className="shell">
            <aside className="sidebar">
              <div className="company-label"><strong>{workspace.profile?.display_name ?? workspace.organization.name}</strong>
                <span>{ROLE_LABELS[workspace.membership.role]} · Workspace activ</span></div>
              <nav aria-label="Module">
                {uiManifest.navGroups.map((group) => {
                  const available = modules.filter((definition) => group.ids.includes(definition.id) &&
                    (definition.id !== "expenses" || canFinance));
                  if (!available.length) return null;
                  return <div className="nav-group" key={group.label}>
                    <p className="nav-label">{group.label}</p>
                    {available.map((item) => <button key={item.id}
                      type="button" className={"nav-item " + (panel === "workspace" && activeModule === item.id ? "active" : "")}
                      aria-current={panel === "workspace" && activeModule === item.id ? "page" : undefined}
                      onClick={() => chooseModule(item.id)}>
                      <ModuleGlyph id={item.id} /><span>{TITLES[item.id]}</span>
                    </button>)}
                  </div>;
                })}
              </nav>
              <button className="sidebar-customize" type="button" onClick={() => setPanel("modules")}>
                <strong>{canManageModules ? "Personalizează workspace-ul" : "Modulele tale"}</strong>
                <small>{canManageModules ? "Adaugă sau ascunde instrumente" : "Vezi instrumentele disponibile"}</small>
              </button>
            </aside>
            <main className="main-area">
              <div className="work-area">
              {(panel === "modules" || activeModule !== "inventory") && <section className="page-heading">
                <div><p className="eyebrow">{panel === "modules" ? "PERSONALIZARE" : "BUSINESS WORKSPACE"}</p>
                  <h1>{panel === "modules" ? "Modulele tale." : TITLES[activeModule] + "."}</h1>
                  <p className="subheading">{panel === "modules" ? "Alege doar instrumentele de care ai nevoie." :
                    activeModule === "overview" ? "Tot ce contează pentru afacerea ta, într-un singur loc." :
                    ORBYVEN_MODULES.find((m) => m.id === activeModule)?.description}</p></div>
                {panel === "workspace" && activeModule !== "overview" && activeModule !== "thermal" && activeModule !== "inventory" && canWrite && (activeModule !== "expenses" || canFinance) && (
                  <button className="primary add-button" onClick={() => openCreate(activeModule)}>+ Adaugă</button>
                )}
              </section>}
              {error && <div role="alert" className="error-banner">{error}<button onClick={() => setError("")}>×</button></div>}
              {panel === "modules" ? (
                <section className="module-store">
                  {ORBYVEN_MODULES.map((definition) => {
                    const enabled = workspace.enabledModules.includes(definition.id);
                    const locked = definition.id === "overview";
                    const entitled = workspace.entitledModules.includes(definition.id);
                    const blocked = !canManageModules || Boolean(savingModule) || locked || (!enabled && !entitled);
                    return <article key={definition.id} className="module-store-card">
                      <div className="module-store-head"><span className="module-store-icon"><ModuleGlyph id={definition.id} /></span>
                        {definition.badge && <span className="module-store-badge">{definition.badge}</span>}</div>
                      <h2>{definition.name}</h2><p>{definition.description}</p>
                      <div className="module-store-bottom"><span>{savingModule === definition.id ? "Se salvează..." : enabled ? "Activ" : "Neactivat"}</span>
                        <button type="button" className={enabled ? "primary" : "secondary"} disabled={blocked}
                          onClick={() => void toggleModule(definition.id)}>
                          {locked ? "Inclus" : !canManageModules ? "Blocat" : !enabled && !entitled ? "Necesită acces" : savingModule === definition.id ? "Salvare" : enabled ? "Elimină" : "Adaugă"}
                        </button></div>
                    </article>;
                  })}
                </section>
              ) : activeModule === "overview" ? (
                <div className="overview">
                  <section className="overview-greeting">
                    <div><p className="eyebrow">ORBYVEN / OVERVIEW</p>
                      <h2>Bună, {workspace.profile?.greeting_name || workspace.organization.name.split(" ")[0] || "acolo"}.</h2>
                      <p>{new Intl.DateTimeFormat(workspace.profile?.locale || "ro-RO", {
                        weekday: "long", day: "numeric", month: "long",
                        timeZone: workspace.profile?.timezone || "Europe/Bucharest",
                      }).format(new Date())} · Rezumatul firmei</p>
                    </div>
                    <span className="role-pill"><span className="online-dot" /> {ROLE_LABELS[workspace.membership.role]}</span>
                  </section>
                  {busy && !overview ? <p className="muted">Se încarcă rezumatul...</p> : overview && (
                    <>
                      <div className="metrics">
                        {([
                          ["Cereri active", overview.activeLeadsCount, "leads", "#7c7afa"],
                          ["Lucrări deschise", overview.openTasksCount, "tasks", "#66aaff"],
                          ["Programări astăzi", overview.events.filter((event) =>
                            event.status !== "cancelled" &&
                            new Intl.DateTimeFormat("en-CA", { timeZone: workspace.profile?.timezone || "Europe/Bucharest",
                              year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(event.start_at)) ===
                            new Intl.DateTimeFormat("en-CA", { timeZone: workspace.profile?.timezone || "Europe/Bucharest",
                              year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())).length, "calendar", "#70d1eb"],
                          ["Oferte trimise", overview.sentEstimatesCount, "estimates", "#7ad5b4"],
                        ] as const).map(([label, count, target, color]) => {
                          const available = workspace.enabledModules.includes(target);
                          return <button key={label} className="metric" disabled={!available}
                            onClick={() => chooseModule(target)} style={{ "--metric-color": color } as CSSProperties}>
                            <span>{label}</span><strong>{formatNumber(count)}</strong><small>{available ? "Deschide modulul ↗" : "Modul neactivat"}</small>
                          </button>;
                        })}
                      </div>
                      <div className="overview-bottom">
                        <article className="surface stage-panel">
                          <div className="panel-heading"><div><span className="eyebrow">OPERATIONS</span><h3>Lucrări după status</h3></div><small>Rezumat actualizat</small></div>
                          <div className="stage-chart">
                            <button type="button" className="stage-ring" disabled={!workspace.enabledModules.includes("tasks")}
                              onClick={() => chooseModule("tasks")} style={{
                                background: (() => {
                                  const stages = [
                                    ["planned", "#738bff"], ["in_progress", "#66bff0"],
                                    ["blocked", "#efad77"], ["done", "#6ed3ae"], ["cancelled", "#64748b"],
                                  ] as const;
                                  const total = stages.reduce((sum, [stage]) => sum + overview.taskStages[stage], 0);
                                  if (!total) return "conic-gradient(#2a405e 0 360deg)";
                                  let progress = 0;
                                  return "conic-gradient(" + stages.filter(([stage]) => overview.taskStages[stage] > 0)
                                    .map(([stage,color]) => { const start = progress; progress += overview.taskStages[stage] / total * 360;
                                      return color + " " + start + "deg " + progress + "deg"; }).join(",") + ")";
                                })(),
                              }}>
                              <span className="stage-ring-inner"><strong>{formatNumber(Object.values(overview.taskStages).reduce((sum, count) => sum + count, 0))}</strong><small>total înregistrări</small></span>
                            </button>
                            <div className="stage-legend">
                              {([
                                ["planned", "De făcut", "#738bff"], ["in_progress", "În lucru", "#66bff0"],
                                ["blocked", "Blocate", "#efad77"], ["done", "Finalizate", "#6ed3ae"], ["cancelled", "Anulate", "#64748b"],
                              ] as const).map(([id,label,color]) => <div key={id}><span className="legend-dot" style={{ background: color }} />{label}<strong>{overview.taskStages[id]}</strong></div>)}
                            </div>
                          </div>
                        </article>
                        <article className="surface workflow-panel">
                          <div className="panel-heading"><div><span className="eyebrow">WORKFLOW</span><h3>Fluxul afacerii</h3></div><small>Din modulele tale</small></div>
                          {([
                            ["leads", "Cereri active", overview.activeLeadsCount],
                            ["tasks", "Lucrări deschise", overview.openTasksCount],
                            ["calendar", "Programări astăzi", overview.events.filter((event) => event.status === "scheduled" && new Date(event.start_at).toDateString() === new Date().toDateString()).length],
                            ["estimates", "Oferte trimise", overview.sentEstimatesCount],
                          ] as const).filter(([id]) => workspace.enabledModules.includes(id)).map(([id,label,value]) =>
                            <button key={id} className="workflow-row" onClick={() => chooseModule(id)}>
                              <span>{label}</span><strong>{value}</strong><span className="workflow-track"><i style={{ width: Math.max(2, value / Math.max(1,overview.activeLeadsCount,overview.openTasksCount,overview.sentEstimatesCount) * 100) + "%" }} /></span>
                            </button>)}
                        </article>
                      </div>
                      <div className="overview-bottom activity-panels">
                        <article className="surface"><span className="eyebrow">ACTIVITATE</span><h3>Lucrări în desfășurare</h3>
                          {workspace.enabledModules.includes("tasks") && overview.tasks.slice(0, 5).map((task) =>
                            <button className="activity" key={task.id} onClick={() => chooseModule("tasks")}>
                              <span><strong>{task.title}</strong><small>{task.status} · {task.priority}</small></span><span>→</span></button>)}
                          {!overview.tasks.length && <p className="muted">Nicio lucrare recentă.</p>}
                        </article>
                        <article className="surface"><span className="eyebrow">URMĂTOARELE ZILE</span><h3>Programări</h3>
                          {workspace.enabledModules.includes("calendar") && overview.events.slice(0, 5).map((event) =>
                            <button className="activity" key={event.id} onClick={() => chooseModule("calendar")}>
                              <span><strong>{event.title}</strong><small>{formatDate(event.start_at)}</small></span><span>→</span></button>)}
                          {!overview.events.length && <p className="muted">Nu există programări apropiate.</p>}
                        </article>
                      </div>
                    </>
                  )}
                </div>
              ) : activeModule === "inventory" ? (
                <DesktopInventoryPanel
                  organizationId={workspace.organization.id}
                  locale={workspace.profile?.locale || "ro-RO"}
                  role={workspace.membership.role}
                />
              ) : (
                <section className="surface listing">
                  <div className="listing-tools"><div className="listing-title"><strong>Înregistrări</strong><span>{formatNumber(visibleRows.length)}</span></div>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută în modul..." aria-label="Caută în modul" /></div>
                  {busy && !rows.length && <p className="muted empty">Se încarcă...</p>}
                  {!busy && visibleRows.length === 0 && <div className="empty"><strong>Nicio înregistrare.</strong><p>Schimbă căutarea sau adaugă o înregistrare nouă.</p></div>}
                  <div className="records">{visibleRows.map((row) => (
                    <button key={String(row.id)} className="record" onClick={() => setSelected(row)}>
                      <span className="record-symbol">{rowLabel(row, activeModule).trim().charAt(0).toUpperCase() || "O"}</span>
                      <span className="record-text"><strong>{rowLabel(row, activeModule)}</strong><small>{rowSummary(row, activeModule)}</small></span>
                      <span className="status">{String(row.status ?? row.stage ?? row.kind ?? row.category ?? "")}</span><span className="chevron">›</span>
                    </button>
                  ))}</div>
                  <p className="hint">Datele sunt citite din contul tău ORBYVEN și filtrate după companie.</p>
                </section>
              )}
              <footer className="page-footer">ORBYVEN · Desktop Workspace <span>v0.5.0 · UI {uiManifest.revision}</span></footer>
            </div>
          </main>
          {commandOpen && <div className="overlay command-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCommandOpen(false);
          }}>
            <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title">
              <div className="command-top">
                <h2 id="command-title">Unde vrei să ajungi?</h2>
                <button className="icon-button" aria-label="Închide navigarea" onClick={() => setCommandOpen(false)}>×</button>
              </div>
              <input autoFocus aria-label="Caută un modul" placeholder="Caută un modul..." value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)} />
              <p className="eyebrow">MODULE DISPONIBILE</p>
              <div className="command-results">{filteredModules.filter((module) => module.id !== "expenses" || canFinance).map((module) =>
                <button key={module.id} className="command-item" onClick={() => chooseModule(module.id)}>
                  <span className="module-store-icon"><ModuleGlyph id={module.id} /></span>
                  <span><strong>{TITLES[module.id]}</strong><small>{module.description}</small></span>
                  <span className="command-arrow">→</span>
                </button>)}</div>
              {filteredModules.length === 0 && <p className="muted">Niciun modul găsit.</p>}
              <small className="command-hint">Ctrl K · caută rapid &nbsp; · &nbsp; Esc · închide</small>
            </section>
          </div>}
          {createMenuOpen && canWrite && <div className="overlay command-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreateMenuOpen(false);
          }}>
            <section className="command-dialog create-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-create-title">
              <div className="command-top"><div><p className="eyebrow">ACȚIUNE NOUĂ</p>
                <h2 id="quick-create-title">Ce vrei să creezi?</h2></div>
                <button className="icon-button" aria-label="Închide" onClick={() => setCreateMenuOpen(false)}>×</button></div>
              <div className="command-results">{createModules.map((module) =>
                <button key={module.id} className="command-item" onClick={() => openCreate(module.id)}>
                  <span className="module-store-icon"><ModuleGlyph id={module.id} /></span>
                  <strong>{module.id === "leads" ? "Cerere nouă" : module.id === "tasks" ? "Lucrare nouă" :
                    module.id === "calendar" ? "Programare nouă" : module.id === "estimates" ? "Ofertă nouă" :
                    module.id === "documents" ? "Document nou" : module.id === "expenses" ? "Cheltuială nouă" : "Membru nou"}</strong>
                  <span className="command-arrow">→</span>
                </button>)}</div>
            </section>
          </div>}
          {selected && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
            <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="record-title">
              <div className="drawer-top"><span className="eyebrow">DETALII · {TITLES[activeModule]}</span><button className="icon-button" aria-label="Închide" onClick={() => setSelected(null)}>×</button></div>
              <h2 id="record-title">{rowLabel(selected, activeModule)}</h2><p className="subheading">{rowSummary(selected, activeModule)}</p>
              {STATUS_OPTIONS[activeModule] && <label className="field"><span>Status</span>
                <select disabled={!canWrite || busy} value={String(selected.stage ?? selected.status ?? "")}
                  onChange={(event) => void changeStatus(selected, event.target.value)}>
                  {STATUS_OPTIONS[activeModule]?.map((status) => <option key={status} value={status}>{status}</option>)}
                </select></label>}
              <div className="detail-list">{Object.entries(selected).filter(([key, value]) => ![
                "id", "organization_id", "created_by", "updated_at", "storage_path", "linked_user_id",
              ].includes(key) && value !== null && typeof value !== "object").map(([key, value]) => (
                <div key={key}><small>{key.replaceAll("_", " ")}</small><span>{key.endsWith("_at") || key.endsWith("_on") ? formatDate(value) : String(value)}</span></div>
              ))}</div>
              {activeModule === "documents" && <button className="primary" onClick={() => void downloadDocument(selected)}>Descarcă documentul ↓</button>}
            </section>
          </div>}
          {showCreate && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
            <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="create-title">
              <div className="drawer-top"><span className="eyebrow">NOU / {TITLES[activeModule]}</span><button className="icon-button" aria-label="Închide" onClick={() => setShowCreate(false)}>×</button></div>
              <h2 id="create-title">Adaugă în {TITLES[activeModule].toLowerCase()}.</h2><p className="subheading">Salvare direct în workspace-ul firmei tale.</p>
              <form className="form" onSubmit={(event) => void create(event)}>
                {FORM_FIELDS[activeModule]?.map((field) => <FieldInput key={field.name} field={field}
                  value={form[field.name] ?? ""} onChange={(value) => setForm((old) => ({ ...old, [field.name]: value }))} />)}
                {activeModule === "documents" && <label className="field"><span>Document (max. 20 MB)</span>
                  <input type="file" required onChange={(event) => setFile(event.currentTarget.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" /></label>}
                {error && <p role="alert" className="error">{error}</p>}
                <button className="primary" type="submit" disabled={busy}>{busy ? "Se salvează..." : "Salvează în ORBYVEN →"}</button>
              </form>
            </section>
          </div>}
        </div>
        </div>
      )}
    </div>
  );
}
