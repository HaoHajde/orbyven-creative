import type { FeaturedPreviewKind } from "@/components/FeaturedTemplatePreview";

export type FeaturedTemplate = {
  href: string;
  label: string;
  meta: string;
  title: string;
  subtitle: string;
  kind: FeaturedPreviewKind;
};

export const featuredTemplates: FeaturedTemplate[] = [
  {
    href: "/templates/obsidian-moments",
    label: "Pilot #001 · Events",
    meta: "360° · foto · efecte",
    title: "Obsidian Moments",
    subtitle: "Experiență premium pentru evenimente.",
    kind: "obsidian",
  },
  {
    href: "/templates/asfaltari-bucuresti",
    label: "Pilot #003 · Infrastructură",
    meta: "București + Ilfov",
    title: "VIAFORTE",
    subtitle: "Asfaltări, lucrări și transparență operațională.",
    kind: "asphalt",
  },
  {
    href: "/templates/florarie-bragadiru",
    label: "Pilot #004 · Florărie",
    meta: "Bragadiru",
    title: "Maison Fleur",
    subtitle: "Florărie online cu personalizare și comandă.",
    kind: "florist",
  },
  {
    href: "/templates/haos-customs",
    label: "Pilot #005 · Auto detailing",
    meta: "Luxury black & gold",
    title: "Hao's Customs",
    subtitle: "Detailing, before/after, prețuri și programare.",
    kind: "hao",
  },
  {
    href: "/templates/barbershop",
    label: "Model · Barbershop",
    meta: "Booking-first · urban editorial",
    title: "NOIR CUTS",
    subtitle: "Programări rapide, servicii, echipă și lookbook.",
    kind: "barber",
  },
  {
    href: "/templates/pilot-006-barbershop",
    label: "Pilot #006 · Barbershop",
    meta: "Demo · booking-first",
    title: "FORMA Barber Club",
    subtitle: "Servicii, echipă și programări demonstrative.",
    kind: "demo006",
  },
  {
    href: "/templates/pilot-007-restaurant",
    label: "Pilot #007 · Restaurant",
    meta: "Demo · menu-first",
    title: "TAVOLA",
    subtitle: "Meniu filtrabil, coș și rezervare de masă simulată.",
    kind: "demo007",
  },
  {
    href: "/templates/pilot-008-real-estate",
    label: "Pilot #008 · Imobiliare",
    meta: "Demo · listings-first",
    title: "CADRU.",
    subtitle: "Proprietăți, filtre, comparații și vizionări simulate.",
    kind: "demo008",
  },
  {
    href: "/templates/pilot-009-auto-service",
    label: "Pilot #009 · Service auto",
    meta: "Demo · estimate-first",
    title: "TORQ. Auto Lab",
    subtitle: "Diagnostic ghidat și deviz orientativ demonstrativ.",
    kind: "demo009",
  },
  {
    href: "/templates/pilot-010-dental-clinic",
    label: "Pilot #010 · Medical",
    meta: "Demo · trust-first",
    title: "LUMEN. Atelier Dentar",
    subtitle: "Specialiști, servicii și programări simulate.",
    kind: "demo010",
  },
  {
    href: "/templates/pilot-011-retreat",
    label: "Pilot #011 · Ospitalitate",
    meta: "Demo · stay-first",
    title: "SENIN Retreat",
    subtitle: "Camere, perioade și calculul unui sejur fictiv.",
    kind: "demo011",
  },
  {
    href: "/templates/pilot-012-movement",
    label: "Pilot #012 · Fitness",
    meta: "Demo · membership-first",
    title: "RITM Movement Club",
    subtitle: "Clase, recomandări, program și abonamente fictive.",
    kind: "demo012",
  },
  {
    href: "/templates/pilot-013-construction",
    label: "Pilot #013 · Construcții",
    meta: "Demo · project-first",
    title: "STRUCT. STUDIO",
    subtitle: "Portofoliu, estimator, deviz și necesar de materiale.",
    kind: "demo013",
  },
  {
    href: "/demo/nunta/elegant",
    label: "Template · Nuntă",
    meta: "Invitație digitală",
    title: "Mire & Mireasă",
    subtitle: "Invitație elegantă, RSVP și detalii de eveniment.",
    kind: "wedding",
  },
  {
    href: "/templates/botez-fetita",
    label: "Template · Botez",
    meta: "Fetiță · invitație digitală",
    title: "Botezul micuței",
    subtitle: "Invitație pastel, program, galerie și RSVP pentru botez.",
    kind: "baptismGirl",
  },
  {
    href: "/templates/botez-baietel",
    label: "Template · Botez",
    meta: "Băiețel · invitație digitală",
    title: "Botezul micuțului",
    subtitle: "Invitație bleu, program, galerie și RSVP pentru botez.",
    kind: "baptismBoy",
  },
  {
    href: "/templates/majorat",
    label: "Template · Majorat",
    meta: "18 ani · invitație digitală",
    title: "MIDNIGHT 18",
    subtitle: "Invitație dark luxury, countdown, dress code, party plan și RSVP.",
    kind: "birthday18",
  },
];
