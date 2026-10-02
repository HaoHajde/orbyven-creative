export type Service = {
  number: string;
  title: string;
  line: string;
  href: string;
  linkLabel: string;
  tags: string[];
  gradient: string;
};

export type ModulePreview = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  note: string;
  rows: string[];
};

export const services: Service[] = [
  {
    number: "01",
    title: "Website",
    line: "A clear, fast presence built around your business.",
    href: "/creare-site",
    linkLabel: "Business website design",
    tags: ["Responsive", "SEO", "Forms"],
    gradient: "radial-gradient(circle at 16% 18%, rgba(135,102,255,.34), transparent 31%), radial-gradient(circle at 82% 78%, rgba(67,46,130,.30), transparent 37%), linear-gradient(140deg,#0d0918,#17102a 58%,#08070d)",
  },
  {
    number: "02",
    title: "Landing page",
    line: "One offer, one direction and a simple path to conversion.",
    href: "/site-prezentare",
    linkLabel: "Business websites and landing pages",
    tags: ["Campaigns", "Conversion", "Analytics"],
    gradient: "radial-gradient(circle at 76% 18%, rgba(82,126,255,.31), transparent 31%), radial-gradient(circle at 16% 78%, rgba(89,61,176,.28), transparent 36%), linear-gradient(140deg,#090b18,#10162e 58%,#07080d)",
  },
  {
    number: "03",
    title: "Redesign",
    line: "We keep what works and rebuild what slows you down.",
    href: "/redesign-site",
    linkLabel: "Website redesign service",
    tags: ["UI", "UX", "Performance"],
    gradient: "radial-gradient(circle at 22% 24%, rgba(190,88,255,.25), transparent 31%), radial-gradient(circle at 82% 72%, rgba(92,49,147,.28), transparent 36%), linear-gradient(140deg,#110914,#201027 58%,#09070b)",
  },
  {
    number: "04",
    title: "Digital experience",
    line: "Invitations, microsites and interactions built for context.",
    href: "/invitatii-nunta",
    linkLabel: "Invitations and digital experiences",
    tags: ["RSVP", "Microsite", "Custom"],
    gradient: "radial-gradient(circle at 76% 24%, rgba(75,70,238,.36), transparent 34%), radial-gradient(circle at 22% 76%, rgba(161,91,255,.20), transparent 36%), linear-gradient(140deg,#0a0914,#171326 55%,#07070b)",
  },
  {
    number: "05",
    title: "AI Web Design",
    line: "Describe your business and direction. ORBYVEN generates, refines and compares website directions.",
    href: "/ai-web-design",
    linkLabel: "Open ORBYVEN AI Web Design",
    tags: ["AI", "Preview live", "Design DNA"],
    gradient: "radial-gradient(circle at 18% 18%, rgba(116,92,255,.42), transparent 32%), radial-gradient(circle at 82% 74%, rgba(61,114,255,.25), transparent 38%), linear-gradient(140deg,#0b0916,#161126 56%,#08070d)",
  },
];

export const modulePreviews: ModulePreview[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "CONTROL",
    title: "What needs attention now.",
    note: "Signals and actions, not decorative charts.",
    rows: ["New requests", "Projects nearing deadline", "Quotes to follow up"],
  },
  {
    id: "clients",
    label: "Clients",
    eyebrow: "CRM LIGHT",
    title: "History stays connected to the client.",
    note: "Request, contact, project and follow-up in one context.",
    rows: ["New lead · WhatsApp", "Visit scheduled", "Quote sent"],
  },
  {
    id: "work",
    label: "Projects",
    eyebrow: "OPERATIONS",
    title: "From request to delivery.",
    note: "Owners, status and next step without separate spreadsheets.",
    rows: ["Installation · in progress", "Handover · scheduled", "Materials · checked"],
  },
  {
    id: "calendar",
    label: "Calendar",
    eyebrow: "SCHEDULE",
    title: "Scheduling with context.",
    note: "Every visit keeps the client, project and people connected.",
    rows: ["09:30 · assessment", "12:00 · installation", "16:30 · handover"],
  },
  {
    id: "offers",
    label: "Quotes",
    eyebrow: "COMMERCIAL",
    title: "The quote continues the workflow.",
    note: "The estimate is no longer disconnected from the client and project.",
    rows: ["Draft ready", "Sent to client", "Accepted → project"],
  },
];

export const tableLayout = [
  { id: "01", x: "11%", y: "19%", guests: 8 },
  { id: "02", x: "42%", y: "13%", guests: 9 },
  { id: "03", x: "71%", y: "21%", guests: 8 },
  { id: "04", x: "18%", y: "58%", guests: 10 },
  { id: "05", x: "49%", y: "53%", guests: 9 },
  { id: "06", x: "76%", y: "61%", guests: 8 },
] as const;
