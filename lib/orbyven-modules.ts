export type OrbyvenModuleId =
  | "overview"
  | "leads"
  | "tasks"
  | "calendar"
  | "estimates"
  | "documents"
  | "expenses"
  | "team";

export type OrbyvenModuleCategory =
  | "core"
  | "sales"
  | "operations"
  | "finance"
  | "people";

export type OrbyvenModuleDefinition = {
  id: OrbyvenModuleId;
  name: string;
  shortName: string;
  description: string;
  category: OrbyvenModuleCategory;
  badge?: string;
  defaultEnabled?: boolean;
  color: string;
  accent: string;
  features: string[];
};

export const ORBYVEN_MODULES: OrbyvenModuleDefinition[] = [
  {
    id: "overview",
    name: "Overview",
    shortName: "Overview",
    description: "Imaginea de ansamblu a businessului, fără zgomot.",
    category: "core",
    badge: "Core",
    defaultEnabled: true,
    color: "#1d1d1f",
    accent: "#f5f5f7",
    features: ["Rezumat zilnic", "Priorități", "Activitate recentă"],
  },
  {
    id: "leads",
    name: "Clienți & cereri",
    shortName: "Clienți",
    description: "Centralizează cererile, contactele și progresul comercial.",
    category: "sales",
    badge: "Sales",
    defaultEnabled: true,
    color: "#4b46ee",
    accent: "#efefff",
    features: ["Lead-uri", "Status", "Istoric contact"],
  },
  {
    id: "tasks",
    name: "Lucrări & taskuri",
    shortName: "Lucrări",
    description: "Ce trebuie făcut, de cine și până când.",
    category: "operations",
    badge: "Popular",
    defaultEnabled: true,
    color: "#0f7b6c",
    accent: "#e8f6f3",
    features: ["Taskuri", "Priorități", "Responsabili"],
  },
  {
    id: "calendar",
    name: "Programări",
    shortName: "Calendar",
    description: "Programări, vizite și intervenții într-un singur calendar.",
    category: "operations",
    color: "#0b67c2",
    accent: "#eaf4ff",
    features: ["Calendar", "Vizite", "Remindere"],
  },
  {
    id: "estimates",
    name: "Oferte & devize",
    shortName: "Oferte",
    description: "Creează și urmărește oferte comerciale fără foi împrăștiate.",
    category: "sales",
    color: "#ad5b00",
    accent: "#fff4e7",
    features: ["Devize", "Oferte", "Status aprobare"],
  },
  {
    id: "documents",
    name: "Documente",
    shortName: "Documente",
    description: "Fișierele firmei organizate lângă contextul lor real.",
    category: "operations",
    color: "#6e4ccf",
    accent: "#f1edff",
    features: ["Fișiere", "Categorii", "Istoric"],
  },
  {
    id: "expenses",
    name: "Cheltuieli",
    shortName: "Cheltuieli",
    description: "O vedere simplă asupra costurilor și ieșirilor de bani.",
    category: "finance",
    color: "#b42318",
    accent: "#fff0ee",
    features: ["Cheltuieli", "Categorii", "Rezumat lunar"],
  },
  {
    id: "team",
    name: "Echipă",
    shortName: "Echipă",
    description: "Responsabilități și activitate pentru oamenii din teren.",
    category: "people",
    color: "#8b4a11",
    accent: "#fff1e5",
    features: ["Membri", "Roluri", "Activitate"],
  },
];

export const DEFAULT_ENABLED_MODULES = ORBYVEN_MODULES.filter(
  (module) => module.defaultEnabled
).map((module) => module.id);

export function getOrbyvenModule(id: OrbyvenModuleId) {
  return ORBYVEN_MODULES.find((module) => module.id === id);
}
