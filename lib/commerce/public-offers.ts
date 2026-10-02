export type PublicOfferId = "invitation" | "web" | "advanced";

export const PUBLIC_OFFERS = {
  invitation: {
    id: "invitation",
    name: "Invitație online personalizată",
    priceLei: 299,
    billing: "one_time",
    shortPrice: "299 lei",
    priceNote: "plată unică",
    checkoutNote: "299 lei, o singură dată",
  },
  web: {
    id: "web",
    name: "Web design + 30 zile Dashboard",
    priceLei: 399,
    billing: "hybrid",
    shortPrice: "399 lei",
    priceNote: "acum · apoi 499 lei/lună după 30 zile",
    recurringLei: 499,
    trialDays: 30,
    checkoutNote: "399 lei acum · 30 zile Dashboard incluse · apoi 499 lei/lună",
  },
  advanced: {
    id: "advanced",
    name: "Web design + Dashboard + module personalizabile",
    priceLei: 599,
    billing: "subscription",
    shortPrice: "599 lei",
    priceNote: "pe lună",
    recurringLei: 599,
    checkoutNote: "599 lei/lună",
  },
} as const satisfies Record<
  PublicOfferId,
  {
    id: PublicOfferId;
    name: string;
    priceLei: number;
    billing: "one_time" | "hybrid" | "subscription";
    shortPrice: string;
    priceNote: string;
    recurringLei?: number;
    trialDays?: number;
    checkoutNote: string;
  }
>;

export function isPublicOfferId(value: unknown): value is PublicOfferId {
  return value === "invitation" || value === "web" || value === "advanced";
}


export const PUBLIC_CHECKOUT_MODE =
  process.env.NEXT_PUBLIC_ORBYVEN_CHECKOUT_MODE === "live" ? "live" : "demo";

export const PUBLIC_CHECKOUT_IS_DEMO = PUBLIC_CHECKOUT_MODE !== "live";
