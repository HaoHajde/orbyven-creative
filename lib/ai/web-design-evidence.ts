import type { EditableSite } from "@/lib/ai/site-editor";

export type WebDesignEvidenceConcept =
  | "credentials"
  | "guarantee"
  | "free_delivery"
  | "nonstop"
  | "market_leader"
  | "free_consultation"
  | "same_day"
  | "insured"
  | "official_partner"
  | "emergency_service"
  | "money_back";

export type WebDesignEvidenceGuardReport = {
  revertedFields: string[];
  unsupportedConcepts: WebDesignEvidenceConcept[];
};

export type WebDesignEvidenceGuardResult = {
  draft: EditableSite;
  report: WebDesignEvidenceGuardReport;
};

const CONCEPT_TERMS: Record<WebDesignEvidenceConcept, string[]> = {
  credentials: [
    "autorizat",
    "autorizata",
    "autorizati",
    "acreditat",
    "acreditata",
    "certificat",
    "certificata",
    "licensed",
    "certified",
    "accredited",
  ],
  guarantee: ["garantie", "garantat", "garantata", "warranty", "guaranteed"],
  free_delivery: [
    "livrare gratuita",
    "transport gratuit",
    "free delivery",
    "free shipping",
  ],
  nonstop: ["non stop", "nonstop", "program permanent", "deschis permanent"],
  market_leader: [
    "lider de piata",
    "market leader",
    "numarul unu",
    "number one",
    "cel mai bun din",
  ],
  free_consultation: [
    "consultatie gratuita",
    "consultanta gratuita",
    "evaluare gratuita",
    "free consultation",
    "free assessment",
  ],
  same_day: ["in aceeasi zi", "same day", "livrare in ziua comenzii"],
  insured: ["asigurat complet", "firma asigurata", "fully insured"],
  official_partner: ["partener oficial", "official partner"],
  emergency_service: [
    "interventie de urgenta",
    "serviciu de urgenta",
    "emergency service",
    "emergency response",
  ],
  money_back: [
    "banii inapoi",
    "returnarea banilor",
    "money back",
    "money-back",
  ],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function siteCopy(site: EditableSite) {
  return [
    site.brand,
    site.eyebrow,
    site.headline,
    site.description,
    site.cta,
    site.servicesTitle,
    ...site.services.flatMap((item) => [item.title, item.description]),
    site.benefitsTitle,
    ...site.benefits.flatMap((item) => [item.title, item.description]),
    site.aboutTitle,
    site.aboutDescription,
    site.galleryTitle,
    ...site.gallery.flatMap((item) => [item.title, item.description]),
    site.processTitle,
    ...site.process.flatMap((item) => [item.title, item.description]),
    site.faqTitle,
    ...site.faq.flatMap((item) => [item.question, item.answer]),
    site.contactTitle,
    site.contactDescription,
  ].join("\n");
}

function conceptsIn(value: string) {
  const normalized = normalize(value);
  return (Object.entries(CONCEPT_TERMS) as Array<
    [WebDesignEvidenceConcept, string[]]
  >)
    .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
    .map(([concept]) => concept);
}

function unsupportedConcepts(value: string, evidence: string) {
  const generatedConcepts = conceptsIn(value);
  const evidenceConcepts = new Set(conceptsIn(evidence));
  return generatedConcepts.filter((concept) => !evidenceConcepts.has(concept));
}

export function guardWebDesignEvidence(
  candidate: EditableSite,
  current: EditableSite,
  prompt: string
): WebDesignEvidenceGuardResult {
  const evidence = [prompt, siteCopy(current)].join("\n");
  const revertedFields: string[] = [];
  const concepts = new Set<WebDesignEvidenceConcept>();

  const safe = (
    generated: string,
    fallback: string,
    path: string
  ) => {
    const unsupported = unsupportedConcepts(generated, evidence);
    if (!unsupported.length) return generated;

    revertedFields.push(path);
    unsupported.forEach((concept) => concepts.add(concept));
    return fallback;
  };

  const draft: EditableSite = {
    ...candidate,
    eyebrow: safe(candidate.eyebrow, current.eyebrow, "hero.eyebrow"),
    headline: safe(candidate.headline, current.headline, "hero.headline"),
    description: safe(
      candidate.description,
      current.description,
      "hero.description"
    ),
    cta: safe(candidate.cta, current.cta, "hero.cta"),
    servicesTitle: safe(
      candidate.servicesTitle,
      current.servicesTitle,
      "services.title"
    ),
    services: candidate.services.map((item, index) => {
      const fallback = current.services[index];
      return {
        title: safe(
          item.title,
          fallback?.title ?? "Serviciu",
          `services.${index}.title`
        ),
        description: safe(
          item.description,
          fallback?.description ?? "Detalii disponibile la cerere.",
          `services.${index}.description`
        ),
      };
    }),
    benefitsTitle: safe(
      candidate.benefitsTitle,
      current.benefitsTitle,
      "benefits.title"
    ),
    benefits: candidate.benefits.map((item, index) => {
      const fallback = current.benefits[index];
      return {
        title: safe(
          item.title,
          fallback?.title ?? "Beneficiu",
          `benefits.${index}.title`
        ),
        description: safe(
          item.description,
          fallback?.description ?? "Detalii disponibile la cerere.",
          `benefits.${index}.description`
        ),
      };
    }),
    aboutTitle: safe(candidate.aboutTitle, current.aboutTitle, "about.title"),
    aboutDescription: safe(
      candidate.aboutDescription,
      current.aboutDescription,
      "about.description"
    ),
    galleryTitle: safe(
      candidate.galleryTitle,
      current.galleryTitle,
      "gallery.title"
    ),
    gallery: candidate.gallery.map((item, index) => {
      const fallback = current.gallery[index];
      return {
        title: safe(
          item.title,
          fallback?.title ?? "Exemplu vizual",
          `gallery.${index}.title`
        ),
        description: safe(
          item.description,
          fallback?.description ?? "Înlocuiește cu un proiect real.",
          `gallery.${index}.description`
        ),
      };
    }),
    processTitle: safe(
      candidate.processTitle,
      current.processTitle,
      "process.title"
    ),
    process: candidate.process.map((item, index) => {
      const fallback = current.process[index];
      return {
        title: safe(
          item.title,
          fallback?.title ?? "Etapă",
          `process.${index}.title`
        ),
        description: safe(
          item.description,
          fallback?.description ?? "Detalii disponibile la cerere.",
          `process.${index}.description`
        ),
      };
    }),
    faqTitle: safe(candidate.faqTitle, current.faqTitle, "faq.title"),
    faq: candidate.faq.map((item, index) => {
      const fallback = current.faq[index];
      return {
        question: safe(
          item.question,
          fallback?.question ?? "Întrebare",
          `faq.${index}.question`
        ),
        answer: safe(
          item.answer,
          fallback?.answer ?? "Detalii disponibile la cerere.",
          `faq.${index}.answer`
        ),
      };
    }),
    contactTitle: safe(
      candidate.contactTitle,
      current.contactTitle,
      "contact.title"
    ),
    contactDescription: safe(
      candidate.contactDescription,
      current.contactDescription,
      "contact.description"
    ),
    sectionOrder: [...candidate.sectionOrder],
    hiddenSections: [...candidate.hiddenSections],
    variants: { ...candidate.variants },
  };

  return {
    draft,
    report: {
      revertedFields: [...new Set(revertedFields)].slice(0, 30),
      unsupportedConcepts: [...concepts],
    },
  };
}
