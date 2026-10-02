import { featuredTemplates } from "@/lib/featured-templates";
import { clientTemplateList } from "@/lib/client-template-catalog";

export const warpItems = [
  { id: "intro", label: "Intro", number: "01" },
  { id: "modular", label: "Workspace", number: "02" },
  { id: "templates", label: "Templates", number: "03" },
  { id: "services", label: "Services", number: "04" },
  { id: "pricing", label: "Pricing", number: "05" },
  { id: "start", label: "Start", number: "06" },
];

export const moduleShowcase = [
  {
    name: "Clients",
    note: "Requests and contacts in one place.",
    eyebrow: "CRM LIGHT",
    glyph: "◎",
    chips: ["Lead-uri", "Istoric", "Follow-up"],
    glow: "radial-gradient(circle at 25% 15%, rgba(83,70,255,.30), transparent 48%)",
  },
  {
    name: "Projects",
    note: "What needs to be done, by whom and by when.",
    eyebrow: "OPERATIONS",
    glyph: "↗",
    chips: ["Tasks", "Owners", "Status"],
    glow: "radial-gradient(circle at 72% 18%, rgba(82,139,255,.24), transparent 48%)",
  },
  {
    name: "Calendar",
    note: "Appointments and visits without separate calendars.",
    eyebrow: "SCHEDULE",
    glyph: "◷",
    chips: ["Visits", "Deadlines", "Appointments"],
    glow: "radial-gradient(circle at 35% 20%, rgba(117,83,255,.27), transparent 50%)",
  },
  {
    name: "Quotes",
    note: "Quotes connected directly to the client and project.",
    eyebrow: "SALES",
    glyph: "≡",
    chips: ["Quotes", "Values", "Conversion"],
    glow: "radial-gradient(circle at 75% 24%, rgba(170,76,255,.23), transparent 48%)",
  },
  {
    name: "Documents",
    note: "Files stay connected to their context.",
    eyebrow: "FILES",
    glyph: "□",
    chips: ["Files", "Context", "Quick access"],
    glow: "radial-gradient(circle at 28% 20%, rgba(76,151,255,.22), transparent 50%)",
  },
  {
    name: "Expenses",
    note: "Operational costs tracked simply.",
    eyebrow: "FINANCE",
    glyph: "∑",
    chips: ["Costs", "Categories", "History"],
    glow: "radial-gradient(circle at 70% 18%, rgba(92,82,255,.27), transparent 48%)",
  },
  {
    name: "Team",
    note: "Your people and their operational roles.",
    eyebrow: "PEOPLE",
    glyph: "◇",
    chips: ["Roles", "Team", "Ownership"],
    glow: "radial-gradient(circle at 38% 15%, rgba(132,73,255,.25), transparent 48%)",
  },
  {
    name: "Overview",
    note: "What needs attention now, not decorative charts.",
    eyebrow: "CONTROL",
    glyph: "⌁",
    chips: ["Priorities", "Signals", "Actions"],
    glow: "radial-gradient(circle at 72% 22%, rgba(74,91,255,.30), transparent 48%)",
  },
];

export const services = [
  {
    number: "01",
    title: "Website",
    note: "A clear, fast presence built around your business.",
    glow: "radial-gradient(circle at 18% 12%, rgba(92,73,255,.28), transparent 48%)",
  },
  {
    number: "02",
    title: "Landing page",
    note: "One offer, one direction and a simple path to conversion.",
    glow: "radial-gradient(circle at 82% 16%, rgba(65,126,255,.24), transparent 48%)",
  },
  {
    number: "03",
    title: "Redesign",
    note: "We keep what works and rebuild what slows you down.",
    glow: "radial-gradient(circle at 28% 78%, rgba(137,72,255,.25), transparent 52%)",
  },
  {
    number: "04",
    title: "Digital experience",
    note: "Microsites, invitations and interactions designed for the right context.",
    glow: "radial-gradient(circle at 80% 78%, rgba(88,71,255,.28), transparent 52%)",
  },
];

export const planMeta = {
  start: {
    eyebrow: "ESSENTIAL",
    audience: "For businesses that need a strong digital foundation and essential tools.",
    badge: "Simple start",
  },
  business: {
    eyebrow: "MOST BALANCED",
    audience: "For businesses working daily with clients, projects and appointments.",
    badge: "Recommended",
  },
  pro: {
    eyebrow: "FULL SYSTEM",
    audience: "For teams that want the complete ORBYVEN workspace.",
    badge: "Full ecosystem",
  },
} as const;

// Featured previews are shared with /templates; no duplicate manually maintained list.
export const homepageTemplates = [
  ...featuredTemplates.map((item) => ({ ...item, source: "featured" as const })),
  ...clientTemplateList.map((item) => ({ ...item, source: "catalog" as const })),
];

