export const warpItems = [
  { id: "intro", label: "Intro", number: "01" },
  { id: "modular", label: "Workspace", number: "02" },
  { id: "templates", label: "Templates", number: "03" },
  { id: "services", label: "Servicii", number: "04" },
  { id: "pricing", label: "Prețuri", number: "05" },
  { id: "start", label: "Start", number: "06" },
];

export const moduleShowcase = [
  {
    name: "Clienți",
    note: "Cereri și contacte într-un singur loc.",
    eyebrow: "CRM LIGHT",
    glyph: "◎",
    chips: ["Lead-uri", "Istoric", "Follow-up"],
    glow: "radial-gradient(circle at 25% 15%, rgba(83,70,255,.30), transparent 48%)",
  },
  {
    name: "Lucrări",
    note: "Ce este de făcut, de cine și până când.",
    eyebrow: "OPERATIONS",
    glyph: "↗",
    chips: ["Task-uri", "Responsabili", "Status"],
    glow: "radial-gradient(circle at 72% 18%, rgba(82,139,255,.24), transparent 48%)",
  },
  {
    name: "Calendar",
    note: "Programări și vizite fără agende separate.",
    eyebrow: "SCHEDULE",
    glyph: "◷",
    chips: ["Vizite", "Termene", "Programări"],
    glow: "radial-gradient(circle at 35% 20%, rgba(117,83,255,.27), transparent 50%)",
  },
  {
    name: "Oferte",
    note: "Devize legate direct de client și lucrare.",
    eyebrow: "SALES",
    glyph: "≡",
    chips: ["Devize", "Valori", "Conversie"],
    glow: "radial-gradient(circle at 75% 24%, rgba(170,76,255,.23), transparent 48%)",
  },
  {
    name: "Documente",
    note: "Fișierele rămân lângă contextul lor.",
    eyebrow: "FILES",
    glyph: "□",
    chips: ["Fișiere", "Context", "Acces rapid"],
    glow: "radial-gradient(circle at 28% 20%, rgba(76,151,255,.22), transparent 50%)",
  },
  {
    name: "Cheltuieli",
    note: "Costuri operaționale urmărite simplu.",
    eyebrow: "FINANCE",
    glyph: "∑",
    chips: ["Costuri", "Categorii", "Istoric"],
    glow: "radial-gradient(circle at 70% 18%, rgba(92,82,255,.27), transparent 48%)",
  },
  {
    name: "Echipă",
    note: "Oamenii din teren și rolul lor operațional.",
    eyebrow: "PEOPLE",
    glyph: "◇",
    chips: ["Roluri", "Echipă", "Responsabilitate"],
    glow: "radial-gradient(circle at 38% 15%, rgba(132,73,255,.25), transparent 48%)",
  },
  {
    name: "Overview",
    note: "Ce necesită atenție acum, nu grafice de decor.",
    eyebrow: "CONTROL",
    glyph: "⌁",
    chips: ["Priorități", "Semnale", "Acțiuni"],
    glow: "radial-gradient(circle at 72% 22%, rgba(74,91,255,.30), transparent 48%)",
  },
];

export const services = [
  {
    number: "01",
    title: "Website",
    note: "Prezență clară, rapidă și construită în jurul afacerii tale.",
    glow: "radial-gradient(circle at 18% 12%, rgba(92,73,255,.28), transparent 48%)",
  },
  {
    number: "02",
    title: "Landing page",
    note: "O ofertă, o direcție și un traseu simplu către conversie.",
    glow: "radial-gradient(circle at 82% 16%, rgba(65,126,255,.24), transparent 48%)",
  },
  {
    number: "03",
    title: "Redesign",
    note: "Păstrăm ce funcționează și reconstruim experiența care te ține în urmă.",
    glow: "radial-gradient(circle at 28% 78%, rgba(137,72,255,.25), transparent 52%)",
  },
  {
    number: "04",
    title: "Experiență digitală",
    note: "Microsite-uri, invitații și interacțiuni făcute special pentru context.",
    glow: "radial-gradient(circle at 80% 78%, rgba(88,71,255,.28), transparent 52%)",
  },
];

export const planMeta = {
  start: {
    eyebrow: "ESSENTIAL",
    audience: "Pentru firme care vor fundația digitală și primele instrumente.",
    badge: "Start simplu",
  },
  business: {
    eyebrow: "MOST BALANCED",
    audience: "Pentru firme care lucrează zilnic cu clienți, lucrări și programări.",
    badge: "Recomandat",
  },
  pro: {
    eyebrow: "FULL SYSTEM",
    audience: "Pentru echipe care vor întregul workspace ORBYVEN disponibil.",
    badge: "Tot ecosistemul",
  },
} as const;
