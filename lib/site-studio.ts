import { clientTemplateCatalog, type ClientTemplateSlug } from "@/lib/client-template-catalog";

export type StudioService = { title: string; copy: string };
export type StudioDraft = {
  brandName: string;
  eyebrow: string;
  headline: string;
  description: string;
  buttonText: string;
  contactLine: string;
  accent: string;
  background: string;
  foreground: string;
  services: StudioService[];
};

export const studioTemplateSlugs = Object.keys(clientTemplateCatalog) as ClientTemplateSlug[];

export function isStudioTemplate(value: unknown): value is ClientTemplateSlug {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(clientTemplateCatalog, value);
}

export function studioSeed(slug: ClientTemplateSlug, organizationName?: string): StudioDraft {
  const template = clientTemplateCatalog[slug];
  const dark = template.style === "field-service" || template.style === "editorial";
  return {
    brandName: organizationName?.slice(0, 85) || template.title,
    eyebrow: template.eyebrow,
    headline: template.heroTitle,
    description: template.heroCopy,
    buttonText: template.primaryAction,
    contactLine: template.contactLine,
    accent: template.accent,
    background: dark ? "#10151e" : "#f7f7f8",
    foreground: dark ? "#ffffff" : "#18181d",
    services: template.services.slice(0, 3).map(({ title, copy }) => ({ title, copy })),
  };
}

const limits: Record<Exclude<keyof StudioDraft, "services" | "accent" | "background" | "foreground">, number> = {
  brandName: 85, eyebrow: 110, headline: 150, description: 320,
  buttonText: 45, contactLine: 180,
};

export function sanitizeStudioDraft(candidate: unknown, fallback: StudioDraft): StudioDraft {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return fallback;
  const object = candidate as Record<string, unknown>;
  const next = { ...fallback, services: fallback.services.map((item) => ({ ...item })) };

  for (const [field, length] of Object.entries(limits)) {
    const incoming = object[field];
    if (typeof incoming === "string" && incoming.trim()) {
      (next as unknown as Record<string, unknown>)[field] = incoming.trim().slice(0, length);
    }
  }

  for (const color of ["accent", "background", "foreground"] as const) {
    const incoming = object[color];
    if (typeof incoming === "string" && /^#[0-9a-fA-F]{6}$/.test(incoming)) {
      next[color] = incoming;
    }
  }

  const incomingServices = object.services;
  if (Array.isArray(incomingServices)) {
    next.services = fallback.services.map((service, index) => {
      const incoming = incomingServices[index];
      if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return service;
      const candidateService = incoming as Record<string, unknown>;
      const title = typeof candidateService.title === "string" ? candidateService.title.trim().slice(0, 70) : "";
      const copy = typeof candidateService.copy === "string" ? candidateService.copy.trim().slice(0, 180) : "";
      return { title: title || service.title, copy: copy || service.copy };
    });
  }

  return next;
}
