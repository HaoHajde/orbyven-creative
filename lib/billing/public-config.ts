import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type BillingPlanId = "start" | "business" | "pro";

export const LEGAL_DOCUMENT_VERSION = "2026-09-07-v1";
export const BILLING_COMMITMENT_MONTHS = 12;
export const BILLING_GRACE_DAYS = 7;

export const ALL_BILLING_MODULE_IDS: OrbyvenModuleId[] = [
  "overview",
  "leads",
  "tasks",
  "calendar",
  "estimates",
  "documents",
  "expenses",
  "team",
];

export const BILLING_PLANS: Record<
  BillingPlanId,
  {
    id: BillingPlanId;
    name: string;
    priceLei: number;
    description: string;
    entitlements: OrbyvenModuleId[];
  }
> = {
  start: {
    id: "start",
    name: "START",
    priceLei: 149,
    description: "Fundația ORBYVEN pentru o prezență și un workspace simplu.",
    entitlements: ["overview", "leads"],
  },
  business: {
    id: "business",
    name: "BUSINESS",
    priceLei: 249,
    description: "Instrumentele operaționale esențiale pentru o firmă în creștere.",
    entitlements: ["overview", "leads", "tasks", "calendar", "estimates"],
  },
  pro: {
    id: "pro",
    name: "PRO",
    priceLei: 399,
    description: "Acces extins la întregul set de module portabile ORBYVEN.",
    entitlements: [...ALL_BILLING_MODULE_IDS],
  },
};

export const PUBLIC_PRICE_TAX_LABEL =
  process.env.NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL?.trim() ||
  "tratament TVA de configurat";

export const ENTITLEMENT_ENFORCEMENT_ENABLED =
  process.env.NEXT_PUBLIC_BILLING_ENTITLEMENTS_ENFORCED === "true";

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return value === "start" || value === "business" || value === "pro";
}
