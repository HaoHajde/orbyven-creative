export type ModulePreview = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  note: string;
  rows: string[];
};

export const serviceModulePreviews: ModulePreview[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "CONTROL",
    title: "Ce cere atenție acum.",
    note: "Semnale și acțiuni, nu grafice de decor.",
    rows: ["Cereri noi", "Lucrări apropiate de termen", "Oferte de urmărit"],
  },
  {
    id: "clients",
    label: "Clienți",
    eyebrow: "CRM LIGHT",
    title: "Istoricul rămâne lângă client.",
    note: "Cerere, contact, lucrare și follow-up în același contextul.",
    rows: ["Lead nou · WhatsApp", "Vizită programată", "Ofertă trimisă"],
  },
  {
    id: "work",
    label: "Lucrări",
    eyebrow: "OPERATIONS",
    title: "De la cerere la execuție.",
    note: "Responsabili, status și următorul pas fără foi separate.",
    rows: ["Montaj · în lucru", "Recepție · programată", "Materiale · verificate"],
  },
  {
    id: "calendar",
    label: "Calendar",
    eyebrow: "SCHEDULE",
    title: "Programări cu contextul.",
    note: "Fiecare vizită știe clientul, lucrarea și oamenii implicați.",
    rows: ["09:30 · evaluare", "12:00 · montaj", "16:30 · recepție"],
  },
  {
    id: "offers",
    label: "Oferte",
    eyebrow: "COMMERCIAL",
    title: "Oferta continuă fluxul.",
    note: "Devizul nu mai este un document izolat de client și lucrare.",
    rows: ["Draft pregătit", "Trimis clientului", "Acceptat → lucrare"],
  },
];
