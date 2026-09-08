import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isBillingPlanId } from "@/lib/billing/public-config";
import {
  isProjectPaymentMode,
  type PublicProjectRequestInput,
} from "@/lib/project-requests";

const MAX = {
  companyName: 160,
  contactName: 120,
  email: 254,
  phone: 60,
  projectTitle: 180,
  projectDetails: 5000,
  source: 120,
} as const;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requestGatewayClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("PROJECT_REQUEST_STORAGE_NOT_CONFIGURED");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function publicRequestNumber(requestNo: number) {
  return `OR-${String(requestNo).padStart(5, "0")}`;
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as Partial<PublicProjectRequestInput>;

    // Honeypot: bots often fill visually hidden website fields.
    if (typeof raw.website === "string" && raw.website.trim()) {
      return NextResponse.json({ ok: true, requestNumber: "OR-RECEIVED" });
    }

    const startedAt = typeof raw.startedAt === "number" ? raw.startedAt : 0;
    if (!startedAt || Date.now() - startedAt < 1200) {
      return NextResponse.json(
        { error: "Cererea a fost trimisă prea repede. Încearcă din nou." },
        { status: 429 }
      );
    }

    const paymentMode = raw.paymentMode;
    if (!isProjectPaymentMode(paymentMode)) {
      return NextResponse.json(
        { error: "Modalitate comercială invalidă." },
        { status: 400 }
      );
    }

    const planId = isBillingPlanId(raw.planId) ? raw.planId : null;
    if (paymentMode === "subscription" && !planId) {
      return NextResponse.json(
        { error: "Selectează un plan pentru abonament." },
        { status: 400 }
      );
    }

    const companyName = text(raw.companyName, MAX.companyName);
    const contactName = text(raw.contactName, MAX.contactName);
    const email = text(raw.email, MAX.email).toLowerCase();
    const phone = text(raw.phone, MAX.phone);
    const projectTitle = text(raw.projectTitle, MAX.projectTitle);
    const projectDetails = text(raw.projectDetails, MAX.projectDetails);
    const source = text(raw.source, MAX.source) || "public_site";

    if (!contactName || !email || !projectTitle || !projectDetails) {
      return NextResponse.json(
        { error: "Completează câmpurile obligatorii." },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresa de email nu este validă." },
        { status: 400 }
      );
    }

    if (raw.privacyAccepted !== true) {
      return NextResponse.json(
        { error: "Politica de confidențialitate trebuie acceptată." },
        { status: 400 }
      );
    }

    const client = requestGatewayClient();
    const { data, error } = await client.rpc("submit_project_request", {
      p_plan_id: planId,
      p_payment_mode: paymentMode,
      p_company_name: companyName || null,
      p_contact_name: contactName,
      p_email: email,
      p_phone: phone || null,
      p_project_title: projectTitle,
      p_project_details: projectDetails,
      p_source: source,
      p_privacy_accepted: true,
      p_marketing_consent: raw.marketingConsent === true,
    });

    if (error) {
      if (
        error.code === "P0001" &&
        error.message.toLowerCase().includes("too recently")
      ) {
        return NextResponse.json(
          { error: "Cererea a fost deja trimisă. Așteaptă câteva secunde și încearcă din nou." },
          { status: 429 }
        );
      }
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row?.id || row.request_no == null) {
      throw new Error("PROJECT_REQUEST_GATEWAY_EMPTY_RESPONSE");
    }

    return NextResponse.json({
      ok: true,
      id: row.id,
      requestNumber: publicRequestNumber(Number(row.request_no)),
      next: paymentMode === "subscription" ? "/workspace" : null,
    });
  } catch (error) {
    console.error("ORBYVEN project request error", error);
    return NextResponse.json(
      { error: "Cererea nu a putut fi salvată momentan. Încearcă din nou." },
      { status: 500 }
    );
  }
}
