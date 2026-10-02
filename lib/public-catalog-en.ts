import { featuredTemplates, type FeaturedTemplate } from "@/lib/featured-templates";
import { clientTemplateList, type ClientTemplateConfig, type ClientTemplateSlug } from "@/lib/client-template-catalog";

const featuredOverrides: Record<string, Partial<FeaturedTemplate>> = {
  "/templates/obsidian-moments": { meta: "360° · photo · effects", subtitle: "A premium event experience." },
  "/templates/asfaltari-bucuresti": { label: "Pilot #003 · Infrastructure", meta: "Bucharest + Ilfov", subtitle: "Roadworks, projects and operational transparency." },
  "/templates/florarie-bragadiru": { label: "Pilot #004 · Florist", subtitle: "Online florist with customization and ordering." },
  "/templates/haos-customs": { subtitle: "Detailing, before/after, pricing and booking." },
  "/templates/barbershop": { label: "Template · Barbershop", subtitle: "Fast booking, services, team and lookbook." },
  "/templates/pilot-006-barbershop": { subtitle: "Demo services, team and booking experience." },
  "/templates/pilot-007-restaurant": { subtitle: "Filterable menu, cart and simulated table booking." },
  "/templates/pilot-008-real-estate": { label: "Pilot #008 · Real estate", subtitle: "Listings, filters, comparisons and simulated viewings." },
  "/templates/pilot-009-auto-service": { label: "Pilot #009 · Auto service", subtitle: "Guided diagnostics and a simulated estimate." },
  "/templates/pilot-010-dental-clinic": { title: "LUMEN. Dental Studio", subtitle: "Specialists, services and simulated appointments." },
  "/templates/pilot-011-retreat": { label: "Pilot #011 · Hospitality", subtitle: "Rooms, dates and a simulated stay calculator." },
  "/templates/pilot-012-movement": { subtitle: "Classes, recommendations, schedule and demo memberships." },
  "/templates/pilot-013-construction": { label: "Pilot #013 · Construction", subtitle: "Portfolio, estimator, quote and material requirements." },
  "/demo/nunta/elegant": { label: "Template · Wedding", meta: "Digital invitation", title: "Bride & Groom", subtitle: "Elegant invitation, RSVP and event details." },
  "/templates/botez-fetita": { label: "Template · Celebration", meta: "Digital invitation", title: "Soft Celebration", subtitle: "Pastel invitation with schedule, gallery and RSVP." },
  "/templates/botez-baietel": { label: "Template · Celebration", meta: "Digital invitation", title: "Blue Celebration", subtitle: "Blue invitation with schedule, gallery and RSVP." },
  "/templates/majorat": { label: "Template · Birthday", meta: "18th · digital invitation", subtitle: "Dark-luxury invitation with countdown, dress code, party plan and RSVP." },
};

const clientOverrides: Record<ClientTemplateSlug, Partial<ClientTemplateConfig>> = {
  instalatii: {
    category: "Home systems · Local services",
    eyebrow: "Comfort. Safety. Efficiency.",
    subtitle: "Heating & plumbing services",
    description: "Reliable work, clear services and fast contact.",
  },
  "pilot-002": {
    category: "Pilot #002 · Heating & plumbing",
    eyebrow: "Field service · residential systems",
    subtitle: "Room-by-room comfort and control",
    description: "Heating, plumbing, field work and fast WhatsApp contact.",
  },
  evenimente: {
    category: "Events · Planning",
    eyebrow: "Moments worth remembering.",
    subtitle: "Events with a coherent story",
    description: "Events presented through atmosphere, services and direct contact.",
  },
  beauty: {
    category: "Beauty · Lifestyle",
    eyebrow: "Care that feels personal.",
    subtitle: "Beauty rituals and easy booking",
    description: "Beauty services, visible results and frictionless booking.",
  },
  "clinica-dentara": {
    category: "Medical · Dental clinic",
    eyebrow: "Dentistry, explained simply.",
    subtitle: "Clear treatment. Simple booking.",
    description: "Clearly explained treatments and easy appointment booking.",
  },
};

export const featuredTemplatesEn: FeaturedTemplate[] = featuredTemplates.map((item) => ({
  ...item,
  ...(featuredOverrides[item.href] ?? {}),
}));

export const clientTemplateListEn: ClientTemplateConfig[] = clientTemplateList.map((item) => ({
  ...item,
  ...(clientOverrides[item.slug] ?? {}),
}));
