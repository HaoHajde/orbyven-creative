import type { PublicOfferId } from "@/lib/commerce/public-offers";

export const PUBLIC_OFFERS_EN = {
  invitation: {
    id: "invitation",
    name: "Custom digital invitation",
    priceLei: 299,
    billing: "one_time",
    shortPrice: "299 RON",
    priceNote: "one-time payment",
    checkoutNote: "299 RON, one time",
  },
  web: {
    id: "web",
    name: "Web design + 30-day Dashboard trial",
    priceLei: 399,
    billing: "hybrid",
    shortPrice: "399 RON",
    priceNote: "now · then 499 RON/month after 30 days",
    recurringLei: 499,
    trialDays: 30,
    checkoutNote: "399 RON now · 30 days of Dashboard included · then 499 RON/month",
  },
  advanced: {
    id: "advanced",
    name: "Web design + Dashboard + customizable modules",
    priceLei: 599,
    billing: "subscription",
    shortPrice: "599 RON",
    priceNote: "per month",
    recurringLei: 599,
    checkoutNote: "599 RON/month",
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
