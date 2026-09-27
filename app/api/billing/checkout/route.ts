import { NextResponse } from "next/server";
import {
  LEGAL_DOCUMENT_VERSION,isBillingPlanId,
} from "@/lib/billing/public-config";
import { requireCheckoutReady } from "@/lib/billing/server-config";
import { legalConfig } from "@/lib/legal-config";
import {
  authenticateBillingActor,createBillingServiceClient,
} from "@/lib/billing/supabase-server";
import { createStripeCheckoutSession,retrieveStripePlanPrice } from "@/lib/billing/stripe-rest";
import {
  createOrderOfferSnapshot,hashOrderOffer,requirePublishedStripePrice,
} from "@/lib/billing/order-evidence";

export const runtime="nodejs";

export async function POST(request: Request) {
  let orderId:string|null=null;
  let client:ReturnType<typeof createBillingServiceClient>|null=null;
  try {
    requireCheckoutReady();
    const body=(await request.json()) as {
      organizationId?:unknown;planId?:unknown;acceptedLegalVersion?:unknown;
    };
    const organizationId=typeof body.organizationId==="string"
      ?body.organizationId:undefined;
    if(!isBillingPlanId(body.planId)) {
      return NextResponse.json({error:"Plan invalid."},{status:400});
    }
    if(body.acceptedLegalVersion!==LEGAL_DOCUMENT_VERSION) {
      return NextResponse.json({error:"Termenii trebuie acceptați înainte de checkout."},{status:400});
    }
    const actor=await authenticateBillingActor(request,organizationId,true);
    client=createBillingServiceClient();
    const {data:activeSubscriptions,error:activeError}=await client
      .from("subscriptions").select("id,status").eq("organization_id",actor.organizationId)
      .in("status",["active","trialing","past_due","unpaid","incomplete"]).limit(1);
    if(activeError)throw activeError;
    if((activeSubscriptions??[]).length>0) {
      return NextResponse.json({
        error:"Organizația are deja un abonament. Folosește administrarea abonamentului.",
      },{status:409});
    }
    // Fail closed before recording an acceptance if the published plan and Stripe price differ.
    const stripePrice=requirePublishedStripePrice(
      body.planId,await retrieveStripePlanPrice(body.planId)
    );
    const {data:account,error:accountError}=await client.from("billing_accounts")
      .select("stripe_customer_id").eq("organization_id",actor.organizationId)
      .maybeSingle();
    if(accountError)throw accountError;

    const acceptedAt=new Date().toISOString();
    const {data:acceptances,error:acceptanceError}=await client
      .from("billing_terms_acceptances").insert(
        (["terms","subscription_terms"] as const).map(document_type=>({
          organization_id:actor.organizationId,
          user_id:actor.userId,
          document_type,
          document_version:LEGAL_DOCUMENT_VERSION,
          accepted_from:"workspace_billing",
          accepted_at:acceptedAt,
          merchant_key:legalConfig.entityKey||null,
          merchant_type:legalConfig.entityType,
          merchant_legal_name:legalConfig.legalName||null,
          merchant_tax_id:legalConfig.taxId||null,
        }))
      ).select("id,document_type");
    if(acceptanceError)throw acceptanceError;
    const termsId=acceptances?.find(a=>a.document_type==="terms")?.id;
    const subscriptionId=acceptances?.find(a=>a.document_type==="subscription_terms")?.id;
    if(!termsId||!subscriptionId)throw new Error("Unable to anchor checkout acceptances.");

    const offer=createOrderOfferSnapshot(body.planId,stripePrice);
    const {data:order,error:orderError}=await client.from("billing_order_evidence")
      .insert({
        organization_id:actor.organizationId,
        actor_user_id:actor.userId,
        terms_acceptance_id:termsId,
        subscription_acceptance_id:subscriptionId,
        plan_id:body.planId,
        stripe_price_id:stripePrice.id,
        offer_snapshot:offer,
        offer_sha256:hashOrderOffer(offer),
        accepted_at:acceptedAt,
      })
      .select("id").single();
    if(orderError)throw orderError;
    orderId=order.id;

    const session=await createStripeCheckoutSession({
      organizationId:actor.organizationId,
      planId:body.planId,
      orderEvidenceId:order.id,
      customerId:account?.stripe_customer_id??null,
      email:actor.email,
    });
    if(!session.id||!session.url)throw new Error("Stripe checkout did not return a complete session.");

    const {data:created,error:sessionError}=await client.from("billing_order_evidence")
      .update({
        stripe_checkout_session_id:session.id,status:"checkout_created",
      }).eq("id",order.id).eq("status","accepted")
      .is("stripe_checkout_session_id",null)
      .select("id,stripe_checkout_session_id").maybeSingle();
    if(sessionError)throw sessionError;

    // Stripe may deliver the signed completion webhook before this response is persisted.
    if(!created) {
      const {data:existing,error:lookupError}=await client.from("billing_order_evidence")
        .select("stripe_checkout_session_id,status").eq("id",order.id).single();
      if(lookupError || existing?.stripe_checkout_session_id!==session.id ||
          existing.status!=="checkout_completed") {
        throw new Error("Unable to persist the Stripe checkout session evidence.");
      }
    }
    return NextResponse.json({url:session.url},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    // A failed attempt stays in the historical dossier. Never touch a completed row.
    if(client&&orderId) {
      const {error:failureError}=await client.from("billing_order_evidence")
        .update({status:"checkout_failed"}).eq("id",orderId)
        .in("status",["accepted","checkout_created"]);
      if(failureError)console.error("Unable to record failed checkout attempt.",failureError);
    }
    const message=error instanceof Error?error.message:"UNKNOWN";
    const status=message==="AUTH_REQUIRED"?401
      :message==="ORG_ACCESS_REQUIRED"||message==="BILLING_ADMIN_REQUIRED"?403
      :message.includes("not configured")?503:500;
    console.error("Checkout could not complete its evidence workflow.",message);
    return NextResponse.json({error:"Checkout indisponibil momentan."},{status});
  }
}
