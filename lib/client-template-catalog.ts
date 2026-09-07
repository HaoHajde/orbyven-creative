export type ClientTemplateSlug =
  | "instalatii"
  | "evenimente"
  | "beauty"
  | "clinica-dentara";

export type ClientTemplateConfig = {
  slug: ClientTemplateSlug;
  title: string;
  category: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  accent: string;
  accentSoft: string;
  surface: string;
  ink: string;
  heroTitle: string;
  heroCopy: string;
  primaryAction: string;
  secondaryAction: string;
  stats: { value: string; label: string }[];
  services: { title: string; copy: string; icon: string }[];
  process: { number: string; title: string; copy: string }[];
  testimonial: string;
  contactLine: string;
};

export const clientTemplateCatalog: Record<ClientTemplateSlug, ClientTemplateConfig> = {
  instalatii: {
    slug: "instalatii",
    title: "NordFlow",
    category: "Instalații · Servicii locale",
    eyebrow: "Confort. Siguranță. Eficiență.",
    subtitle: "Instalații termice & sanitare",
    description:
      "Un template construit pentru firme locale care au nevoie de încredere, servicii clare, ofertare rapidă și contact imediat.",
    accent: "#4b46ee",
    accentSoft: "#eeefff",
    surface: "#f7f8fb",
    ink: "#11121a",
    heroTitle: "Instalații care fac casa să funcționeze mai bine.",
    heroCopy:
      "Montaj, mentenanță și intervenții pentru instalații termice, sanitare și climatizare, prezentate clar și profesionist.",
    primaryAction: "Solicită ofertă",
    secondaryAction: "Vezi serviciile",
    stats: [
      { value: "10+", label: "ani experiență" },
      { value: "1.000+", label: "lucrări finalizate" },
      { value: "24h", label: "timp mediu răspuns" },
    ],
    services: [
      { title: "Instalații termice", copy: "Centrale, calorifere, încălzire în pardoseală și automatizări.", icon: "◌" },
      { title: "Instalații sanitare", copy: "Rețele, obiecte sanitare, renovări și intervenții complete.", icon: "⌁" },
      { title: "Climatizare", copy: "Aer condiționat, pompe de căldură și soluții eficiente.", icon: "✦" },
      { title: "Mentenanță", copy: "Revizii periodice și suport după finalizarea proiectului.", icon: "↻" },
    ],
    process: [
      { number: "01", title: "Discuție", copy: "Înțelegem rapid lucrarea și nevoile reale." },
      { number: "02", title: "Ofertă", copy: "Primești o estimare clară și transparentă." },
      { number: "03", title: "Execuție", copy: "Programăm echipa și urmărim lucrarea până la final." },
    ],
    testimonial:
      "Profesioniști, punctuali și foarte clari. Exact genul de firmă pe care vrei să o găsești când ai nevoie de o lucrare serioasă.",
    contactLine: "București · Ilfov · împrejurimi",
  },
  evenimente: {
    slug: "evenimente",
    title: "Lumière Events",
    category: "Evenimente · Wedding & private",
    eyebrow: "Momente care rămân.",
    subtitle: "Evenimente & experiențe",
    description:
      "Un template editorial și emoțional pentru organizatori de evenimente, decor, foto-video sau servicii premium pentru nunți.",
    accent: "#6f42ff",
    accentSoft: "#f4efff",
    surface: "#faf8f5",
    ink: "#241f20",
    heroTitle: "Evenimente memorabile, construite în jurul oamenilor.",
    heroCopy:
      "De la concept și decor până la coordonarea zilei, fiecare detaliu este prezentat ca parte dintr-o poveste coerentă.",
    primaryAction: "Rezervă o discuție",
    secondaryAction: "Vezi pachetele",
    stats: [
      { value: "120+", label: "evenimente" },
      { value: "4.9", label: "rating mediu" },
      { value: "8", label: "ani experiență" },
    ],
    services: [
      { title: "Organizare", copy: "Planificare completă și coordonare fără stres.", icon: "◇" },
      { title: "Decor", copy: "Direcție vizuală, floristică și styling pentru spațiu.", icon: "✣" },
      { title: "Foto & video", copy: "Parteneri selectați pentru o poveste vizuală coerentă.", icon: "◫" },
      { title: "Experiențe", copy: "Momente speciale, entertainment și activări pentru invitați.", icon: "✦" },
    ],
    process: [
      { number: "01", title: "Povestea", copy: "Pornim de la atmosfera pe care vrei să o creezi." },
      { number: "02", title: "Conceptul", copy: "Construim direcția și pachetul potrivit." },
      { number: "03", title: "Ziua evenimentului", copy: "Coordonăm detaliile, tu rămâi prezent în moment." },
    ],
    testimonial:
      "Totul a fost calm, elegant și foarte bine organizat. În ziua evenimentului am simțit că putem pur și simplu să ne bucurăm.",
    contactLine: "Evenimente în toată România",
  },
  beauty: {
    slug: "beauty",
    title: "Atelier Élan",
    category: "Beauty · Salon premium",
    eyebrow: "Îngrijire. Încredere. Tu.",
    subtitle: "Beauty & self-care",
    description:
      "Un template luminos și premium pentru saloane, clinici estetice și specialiști beauty, cu accent pe rezultate și programări.",
    accent: "#7653ee",
    accentSoft: "#f2edff",
    surface: "#fbf8f7",
    ink: "#241f25",
    heroTitle: "Frumusețea ta, pe mâini bune.",
    heroCopy:
      "Servicii premium, rezultate vizibile și programări simple, într-o experiență digitală calmă și feminină.",
    primaryAction: "Programează-te",
    secondaryAction: "Descoperă serviciile",
    stats: [
      { value: "5.000+", label: "tratamente" },
      { value: "98%", label: "cliente mulțumite" },
      { value: "4.9", label: "rating" },
    ],
    services: [
      { title: "Tratamente faciale", copy: "Curățare, hidratare și ritualuri personalizate.", icon: "◉" },
      { title: "Epilare", copy: "Tehnologie modernă și planuri adaptate fiecărei cliente.", icon: "✧" },
      { title: "Manichiură", copy: "Îngrijire atentă și design într-un stil curat.", icon: "◇" },
      { title: "Make-up", copy: "Machiaj profesional pentru momente importante.", icon: "✦" },
    ],
    process: [
      { number: "01", title: "Alege serviciul", copy: "Găsești rapid tratamentul potrivit." },
      { number: "02", title: "Alege ora", copy: "Vezi disponibilitatea și rezervi simplu." },
      { number: "03", title: "Confirmare", copy: "Primești detaliile programării instant." },
    ],
    testimonial:
      "Un salon superb, dar mai ales o experiență foarte atentă. Site-ul mi-a făcut programarea extrem de simplă.",
    contactLine: "București · Programări online",
  },
  "clinica-dentara": {
    slug: "clinica-dentara",
    title: "NovaSmile",
    category: "Medical · Clinică dentară",
    eyebrow: "Un zâmbet mai sănătos.",
    subtitle: "Dental clinic",
    description:
      "Un template medical modern care inspiră siguranță și claritate: servicii, echipă, recenzii și programare într-un singur parcurs.",
    accent: "#4b46ee",
    accentSoft: "#edf0ff",
    surface: "#f7f9fc",
    ink: "#10121a",
    heroTitle: "Stomatologie modernă pentru întreaga familie.",
    heroCopy:
      "Tratamente explicate simplu, medici prezentați uman și o programare rapidă care reduce fricțiunea înainte de prima vizită.",
    primaryAction: "Programează o consultație",
    secondaryAction: "Vezi tratamentele",
    stats: [
      { value: "12", label: "specialiști" },
      { value: "5.000+", label: "pacienți" },
      { value: "4.9", label: "rating" },
    ],
    services: [
      { title: "Stomatologie generală", copy: "Consultații, prevenție și tratamente pentru toată familia.", icon: "◯" },
      { title: "Implantologie", copy: "Soluții moderne pentru restaurarea funcției și zâmbetului.", icon: "⌬" },
      { title: "Ortodonție", copy: "Planuri de tratament pentru copii și adulți.", icon: "⌁" },
      { title: "Estetică dentară", copy: "Albire, fațete și soluții pentru un zâmbet natural.", icon: "✦" },
    ],
    process: [
      { number: "01", title: "Consultație", copy: "Înțelegem situația și explicăm opțiunile." },
      { number: "02", title: "Plan", copy: "Primești pași, costuri și durată într-o formă clară." },
      { number: "03", title: "Tratament", copy: "Urmărim progresul și confortul pe tot parcursul." },
    ],
    testimonial:
      "Explicații clare, atmosferă relaxată și o echipă foarte atentă. Pentru prima dată o vizită la dentist nu a părut complicată.",
    contactLine: "București · Consultații cu programare",
  },
};

export const clientTemplateList = Object.values(clientTemplateCatalog);
