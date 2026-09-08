import type { BillingPlanId } from "@/lib/billing/public-config";

export type ProjectPaymentMode =
  | "subscription"
  | "full_payment"
  | "custom_quote";

export type ProjectRequestStatus =
  | "submitted"
  | "qualified"
  | "quoted"
  | "payment_pending"
  | "converted"
  | "closed";

export const PROJECT_PAYMENT_OPTIONS: Record<
  ProjectPaymentMode,
  {
    id: ProjectPaymentMode;
    label: string;
    shortLabel: string;
    description: string;
    paymentLabel: string;
  }
> = {
  subscription: {
    id: "subscription",
    label: "Abonament lunar",
    shortLabel: "Abonament",
    description:
      "Plan ORBYVEN recurent. Checkout-ul se deschide din Dashboard după autentificare și acceptarea termenilor comerciali.",
    paymentLabel: "Plată online securizată · Stripe Checkout",
  },
  full_payment: {
    id: "full_payment",
    label: "Plată integrală",
    shortLabel: "Integral",
    description:
      "Pentru proiecte cu livrare unică. Confirmăm mai întâi suma finală, apoi plata se face integral.",
    paymentLabel: "Card online sau transfer · după confirmarea ofertei",
  },
  custom_quote: {
    id: "custom_quote",
    label: "Proiect personalizat",
    shortLabel: "Custom",
    description:
      "Pentru proiecte care trebuie analizate înainte de ofertare. Nu se solicită nicio plată la trimiterea cererii.",
    paymentLabel: "Fără plată acum · ofertare și plată ulterioară",
  },
};

export function isProjectPaymentMode(
  value: unknown
): value is ProjectPaymentMode {
  return (
    value === "subscription" ||
    value === "full_payment" ||
    value === "custom_quote"
  );
}

export type PublicProjectRequestInput = {
  planId: BillingPlanId | null;
  paymentMode: ProjectPaymentMode;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  projectTitle: string;
  projectDetails: string;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  source: string;
  website: string;
  startedAt: number;
};
