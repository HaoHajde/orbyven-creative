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
    features: ["Priorități", "Atenționări", "Rezumat cross-module"],
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
    features: ["Taskuri", "Priorități", "Checklist"],
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
    description: "Creează devize legate de client și lucrare și urmărește decizia clientului.",
    category: "sales",
    color: "#ad5b00",
    accent: "#fff4e7",
    features: ["Poziții deviz", "Calcul total", "Status aprobare"],
  },
  {
    id: "documents",
    name: "Documente",
    shortName: "Documente",
    description: "Fișiere private organizate lângă client, lucrare sau ofertă.",
    category: "operations",
    color: "#6e4ccf",
    accent: "#f1edff",
    features: ["Storage privat", "Legături context", "Link securizat"],
  },
  {
    id: "expenses",
    name: "Cheltuieli",
    shortName: "Cheltuieli",
    description: "Costuri operaționale legate de client, lucrare și document justificativ.",
    category: "finance",
    color: "#b42318",
    accent: "#fff0ee",
    features: ["Cheltuieli", "Categorii", "Rezumat lunar"],
  },
  {
    id: "team",
    name: "Echipă",
    shortName: "Echipă",
    description: "Oamenii operaționali ai firmei, inclusiv cei fără cont ORBYVEN.",
    category: "people",
    color: "#8b4a11",
    accent: "#fff1e5",
    features: ["Membri", "Date contact", "Legătură cont"],
  },
];

export const DEFAULT_ENABLED_MODULES = ORBYVEN_MODULES.filter(
  (module) => module.defaultEnabled
).map((module) => module.id);

export function getOrbyvenModule(id: OrbyvenModuleId) {
  return ORBYVEN_MODULES.find((module) => module.id === id);
}
