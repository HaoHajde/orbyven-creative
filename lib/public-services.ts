export type Service = {
  number: string;
  title: string;
  line: string;
  href: string;
  linkLabel: string;
  tags: string[];
  gradient: string;
};

export const publicServices: Service[] = [
  {
    number: "01",
    title: "Website",
    line: "Prezență clară, rapidă și construită în jurul afacerii.",
    href: "/creare-site",
    linkLabel: "Creare site pentru firme",
    tags: ["Responsive", "SEO", "Formulare"],
    gradient: "radial-gradient(circle at 16% 18%, rgba(135,102,255,.34), transparent 31%), radial-gradient(circle at 82% 78%, rgba(67,46,130,.30), transparent 37%), linear-gradient(140deg,#0d0918,#17102a 58%,#08070d)",
  },
  {
    number: "02",
    title: "Landing page",
    line: "O ofertă, o direcție și un traseu simplu către conversie.",
    href: "/site-prezentare",
    linkLabel: "Site de prezentare și landing pages",
    tags: ["Campanii", "Conversie", "Analytics"],
    gradient: "radial-gradient(circle at 76% 18%, rgba(82,126,255,.31), transparent 31%), radial-gradient(circle at 16% 78%, rgba(89,61,176,.28), transparent 36%), linear-gradient(140deg,#090b18,#10162e 58%,#07080d)",
  },
  {
    number: "03",
    title: "Redesign",
    line: "Păstrăm ce funcționează și reconstruim experiența care te încetinește.",
    href: "/redesign-site",
    linkLabel: "Serviciu de redesign website",
    tags: ["UI", "UX", "Performanță"],
    gradient: "radial-gradient(circle at 22% 24%, rgba(190,88,255,.25), transparent 31%), radial-gradient(circle at 82% 72%, rgba(92,49,147,.28), transparent 36%), linear-gradient(140deg,#110914,#201027 58%,#09070b)",
  },
  {
    number: "04",
    title: "Experiență digitală",
    line: "Invitații, microsite-uri și interacțiuni construite pentru contextul.",
    href: "/invitatii-nunta",
    linkLabel: "Invitații și experiențe digitale",
    tags: ["RSVP", "Microsite", "Custom"],
    gradient: "radial-gradient(circle at 76% 24%, rgba(75,70,238,.36), transparent 34%), radial-gradient(circle at 22% 76%, rgba(161,91,255,.20), transparent 36%), linear-gradient(140deg,#0a0914,#171326 55%,#07070b)",
  },
  {
    number: "05",
    title: "AI Web Design",
    line: "Descrii business-ul și direcția. ORBYVEN generează, rafinează și compară variante de site.",
    href: "/ai-web-design",
    linkLabel: "Deschide AI Web Design ORBYVEN",
    tags: ["AI", "Preview live", "Design DNA"],
    gradient: "radial-gradient(circle at 18% 18%, rgba(116,92,255,.42), transparent 32%), radial-gradient(circle at 82% 74%, rgba(61,114,255,.25), transparent 38%), linear-gradient(140deg,#0b0916,#161126 56%,#08070d)",
  },
  {
    number: "06",
    title: "Video AI",
    line: "Transformă un brief de campanie într-un storyboard regizat și un pachet pregătit pentru randare AI.",
    href: "/video-ai",
    linkLabel: "Deschide Video AI ORBYVEN",
    tags: ["Storyboard", "Motion", "Video AI"],
    gradient: "radial-gradient(circle at 24% 18%, rgba(142,103,255,.40), transparent 31%), radial-gradient(circle at 78% 78%, rgba(77,63,185,.28), transparent 37%), linear-gradient(140deg,#0d0918,#18102b 58%,#07070c)",
  },
];
