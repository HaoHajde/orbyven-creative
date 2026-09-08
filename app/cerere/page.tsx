import type { Metadata } from "next";

import ProjectRequestFlow from "@/components/ProjectRequestFlow";
import { isBillingPlanId } from "@/lib/billing/public-config";
import {
  isProjectPaymentMode,
  type ProjectPaymentMode,
} from "@/lib/project-requests";

export const metadata: Metadata = {
  title: "Cerere proiect | ORBYVEN",
  description:
    "Alege modul de colaborare și trimite cererea pentru proiectul tău ORBYVEN.",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectRequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const planValue = first(params.plan);
  const paymentValue = first(params.payment);
  const sourceValue = first(params.source);

  const initialPlan = isBillingPlanId(planValue) ? planValue : null;
  const initialPaymentMode: ProjectPaymentMode = isProjectPaymentMode(paymentValue)
    ? paymentValue
    : initialPlan
      ? "subscription"
      : "custom_quote";

  return (
    <ProjectRequestFlow
      initialPlan={initialPlan}
      initialPaymentMode={initialPaymentMode}
      initialSource={sourceValue?.slice(0, 120) || "public_site"}
    />
  );
}
