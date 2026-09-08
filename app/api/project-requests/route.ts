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

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

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
      return NextResponse.json({ error: "Modalitate comercială invalidă." }, { status: 400 });
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
      return NextResponse.json({ error: "Adresa de email nu este validă." }, { status: 400 });
    }

    if (raw.privacyAccepted !== true) {
      return NextResponse.json(
        { error: "Politica de confidențialitate trebuie acceptată." },
        { status: 400 }
      );
    }

    const client = serviceClient();
    const { data, error } = await client
      .from("project_requests")
      .insert({
        plan_id: planId,
        payment_mode: paymentMode,
        company_name: companyName || null,
        contact_name: contactName,
        email,
        phone: phone || null,
        project_title: projectTitle,
        project_details: projectDetails,
        source,
        privacy_accepted_at: new Date().toISOString(),
        marketing_consent: raw.marketingConsent === true,
      })
      .select("id,request_no")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      id: data.id,
      requestNumber: publicRequestNumber(Number(data.request_no)),
      next:
        paymentMode === "subscription"
          ? "/workspace"
          : null,
    });
  } catch (error) {
    console.error("ORBYVEN project request error", error);
    return NextResponse.json(
      { error: "Cererea nu a putut fi salvată momentan. Încearcă din nou." },
      { status: 500 }
    );
  }
}
