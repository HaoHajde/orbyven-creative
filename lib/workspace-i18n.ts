import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type WorkspaceUiLanguage = "ro" | "en";

export const WORKSPACE_LANGUAGE_STORAGE_KEY = "orbyven-ui-language";

export const workspaceShellCopy = {
  ro: {
    workspaceActive: "Workspace activ",
    create: "+ Creează",
    createRecord: "Creează o înregistrare",
    back: "Înapoi",
    modules: "Module",
    changeTheme: "Schimbă tema",
    signOut: "Delogare",
    aiNote: "Generează și rafinează website-ul →",
    textSize: "Dimensiune text",
    resetText: "Revino la dimensiunea textului 100%",
    smallerText: "Micșorează textul",
    largerText: "Mărește textul",
    customizeWorkspace: "Personalizează workspace-ul",
    yourModules: "Modulele tale",
    addHideTools: "Adaugă sau ascunde instrumente",
    viewTools: "Vezi instrumentele disponibile",
    newAction: "Acțiune nouă",
    whatCreate: "Ce vrei să creezi?",
    close: "Închide",
    manageModules: "Gestionează modulele",
    viewModuleConfig: "Vezi configurația modulelor",
    loading: "Se pregătește workspace-ul...",
    unavailable: "Workspace indisponibil",
    retry: "Încearcă din nou",
    noWorkspace: "Contul este autentificat, dar nu are încă un workspace ORBYVEN atribuit.",
    loadError: "Workspace-ul nu a putut fi încărcat. Încearcă din nou.",
    moduleRequiresPlan: "Acest modul necesită un abonament sau acces pilot aprobat.",
    moduleUpdateError: "Modulul nu a putut fi actualizat. Modificarea a fost anulată.",
    businessWorkspace: "Business workspace",
  },
  en: {
    workspaceActive: "Active workspace",
    create: "+ Create",
    createRecord: "Create a record",
    back: "Back",
    modules: "Modules",
    changeTheme: "Change theme",
    signOut: "Sign out",
    aiNote: "Generate and refine your website →",
    textSize: "Text size",
    resetText: "Reset text size to 100%",
    smallerText: "Decrease text size",
    largerText: "Increase text size",
    customizeWorkspace: "Customize workspace",
    yourModules: "Your modules",
    addHideTools: "Add or hide tools",
    viewTools: "View available tools",
    newAction: "New action",
    whatCreate: "What do you want to create?",
    close: "Close",
    manageModules: "Manage modules",
    viewModuleConfig: "View module configuration",
    loading: "Preparing your workspace...",
    unavailable: "Workspace unavailable",
    retry: "Try again",
    noWorkspace: "The account is signed in but does not have an ORBYVEN workspace assigned yet.",
    loadError: "The workspace could not be loaded. Try again.",
    moduleRequiresPlan: "This module requires a subscription or approved pilot access.",
    moduleUpdateError: "The module could not be updated. The change was reverted.",
    businessWorkspace: "Business workspace",
  },
} as const;

const moduleShortNames: Record<OrbyvenModuleId, Record<WorkspaceUiLanguage, string>> = {
  overview: { ro: "Overview", en: "Overview" },
  leads: { ro: "Clienți", en: "Clients" },
  tasks: { ro: "Lucrări", en: "Projects" },
  calendar: { ro: "Calendar", en: "Calendar" },
  estimates: { ro: "Oferte", en: "Quotes" },
  documents: { ro: "Documente", en: "Documents" },
  inventory: { ro: "Stoc", en: "Inventory" },
  expenses: { ro: "Finanțe", en: "Finance" },
  thermal: { ro: "Planșă", en: "Canvas" },
  team: { ro: "Echipă", en: "Team" },
};

const createLabels: Partial<Record<OrbyvenModuleId, Record<WorkspaceUiLanguage, string>>> = {
  leads: { ro: "Cerere nouă", en: "New request" },
  tasks: { ro: "Lucrare nouă", en: "New project" },
  calendar: { ro: "Programare nouă", en: "New appointment" },
  estimates: { ro: "Ofertă nouă", en: "New quote" },
  expenses: { ro: "Înregistrare financiară", en: "New financial entry" },
};

const roleLabels = {
  owner: { ro: "Owner", en: "Owner" },
  admin: { ro: "Admin", en: "Admin" },
  manager: { ro: "Manager", en: "Manager" },
  member: { ro: "Membru", en: "Member" },
  viewer: { ro: "Viewer", en: "Viewer" },
} as const;

export function normalizeWorkspaceLanguage(value: string | null | undefined): WorkspaceUiLanguage {
  return value?.toLowerCase().startsWith("en") ? "en" : "ro";
}

export function workspaceIntlLocale(language: WorkspaceUiLanguage) {
  return language === "en" ? "en-US" : "ro-RO";
}

export function workspaceModuleShortName(
  id: OrbyvenModuleId,
  language: WorkspaceUiLanguage,
) {
  return moduleShortNames[id][language];
}

export function workspaceCreateLabel(
  id: OrbyvenModuleId,
  language: WorkspaceUiLanguage,
) {
  return createLabels[id]?.[language] ?? moduleShortNames[id][language];
}

export function workspaceRoleLabel(
  role: keyof typeof roleLabels,
  language: WorkspaceUiLanguage,
) {
  return roleLabels[role][language];
}

export function workspaceGroupLabel(label: string, language: WorkspaceUiLanguage) {
  if (language === "ro") return label;
  if (label === "SPECIALIZATE") return "SPECIALIZED";
  return label;
}
