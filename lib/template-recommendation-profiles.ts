/**
 * Explainable template recommendations. These descriptors are supervised design
 * examples / retrieval metadata, NOT evidence of model training or conversions.
 * Add observed analytics only with user consent and real measured events.
 */
export type TemplateArchetype = "booking-first" | "menu-commerce-first" | "listings-first" | "estimate-process-first" | "trust-first";
export type TemplateVisualStyle = "urban-editorial" | "warm-editorial" | "minimal-property" | "industrial" | "calm-clinical";
export type TemplateRecommendationProfile = {
  id: string;
  slug: string;
  archetype: TemplateArchetype;
  industries: string[];
  primaryGoal: "booking" | "commerce" | "listings" | "quote" | "consultation";
  visualStyle: TemplateVisualStyle;
  contentDensity: "low" | "medium" | "high";
  primaryCTA: string;
  modules: string[];
  recommendationSignals: string[];
  alternativeStyles: string[];
  personalizationSlots: string[];
  constraints: string[];
};

/** First full booking-first training/example profile; more archetypes can be added independently. */
export const templateRecommendationProfiles: TemplateRecommendationProfile[] = [
  {
    id: "pilot-006",
    slug: "barbershop",
    archetype: "booking-first",
    industries: ["barbershop", "frizerie", "salon", "hair studio", "grooming", "beauty"],
    primaryGoal: "booking",
    visualStyle: "urban-editorial",
    contentDensity: "low",
    primaryCTA: "Programează-te",
    modules: ["service-catalog", "staff-picker", "availability-calendar", "gallery", "price-summary", "booking"],
    recommendationSignals: [
      "programări individuale",
      "servicii cu durată definită",
      "personal la alegere",
      "clienți recurenți",
      "preț fix per serviciu",
      "portofoliu vizual",
    ],
    alternativeStyles: ["minimal-light", "street-monochrome", "classic-heritage"],
    personalizationSlots: ["brand-name", "logo", "accent", "hero", "services", "team", "availability", "address"],
    constraints: ["do-not-invent-reviews", "demo-booking-is-not-confirmed", "mobile-first", "reduced-motion"],
  },
];

export function getTemplateRecommendationProfile(slug: string) {
  return templateRecommendationProfiles.find((profile) => profile.slug === slug);
}

/** Deterministic explainable baseline; no visitor profiling and no fabricated conversion metrics. */
export function recommendTemplateProfiles(input: { industry?: string; goals?: string[]; needs?: string[] }) {
  const signals = [input.industry ?? "", ...(input.goals ?? []), ...(input.needs ?? [])]
    .join(" ")
    .toLocaleLowerCase("ro-RO");
  return templateRecommendationProfiles
    .map((profile) => {
      const matched = [...profile.industries, ...profile.recommendationSignals].filter((signal) =>
        signals.includes(signal.toLocaleLowerCase("ro-RO")),
      );
      return { profile, matchedSignals: matched, matches: matched.length };
    })
    .filter((item) => item.matches > 0)
    .sort((a, b) => b.matches - a.matches || a.profile.id.localeCompare(b.profile.id));
}
