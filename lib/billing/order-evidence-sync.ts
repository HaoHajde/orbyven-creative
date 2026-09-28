import type { SupabaseClient } from "@supabase/supabase-js";
import { hashOrderOffer } from "@/lib/billing/order-offer-hash";
import {
  OrderEvidenceError,parseVerifiedCheckoutOutcome,
} from "@/lib/billing/order-evidence-guards";
import { metadataValue,stringValue } from "@/lib/billing/stripe-webhook";

/**
 * Only a Stripe-signature-verified checkout.session.completed webhook may
 * record the payment provider's final total; completion is NOT proof payment
 * settled (payment_status is recorded separately).
 */
export async function syncCheckoutOrderEvidence(
  client:SupabaseClient,object:Record<string,unknown>,eventId:string,verifiedMerchantKey:string,
) {
  const evidenceId=metadataValue(object,"order_evidence_id");
  // Historical sessions predate this feature. Never invent a retroactive offer.
  if(!evidenceId)return;

  const {data:existing,error:lookupError}=await client.from("billing_order_evidence")
    .select("id,organization_id,plan_id,stripe_price_id,offer_snapshot,offer_sha256,status,stripe_checkout_session_id,checkout_final_amount_minor,checkout_currency")
    .eq("id",evidenceId).maybeSingle();
  if(lookupError||!existing)throw new OrderEvidenceError("Checkout evidence record was not found.");

  const sessionId=stringValue(object.id);
  const organizationId=metadataValue(object,"organization_id");
  const planId=metadataValue(object,"plan_id");
  const priceId=metadataValue(object,"price_id");
  const merchantKey=metadataValue(object,"merchant_key");
  const snapshot=existing.offer_snapshot as Record<string,unknown>|null;
  if(!sessionId || organizationId!==existing.organization_id ||
    planId!==existing.plan_id || priceId!==existing.stripe_price_id ||
    !snapshot || !Number.isSafeInteger(snapshot.displayed_monthly_amount_minor) ||
    snapshot.stripe_price_id!==existing.stripe_price_id ||
    merchantKey!==verifiedMerchantKey ||
    snapshot.merchant_key!== (merchantKey==="prelaunch"?null:merchantKey) ||
    hashOrderOffer(snapshot)!==existing.offer_sha256 ||
    (existing.stripe_checkout_session_id && existing.stripe_checkout_session_id!==sessionId)) {
    throw new OrderEvidenceError("Verified Stripe session does not match the accepted organization/offer.");
  }

  const completed=parseVerifiedCheckoutOutcome({
    id:object.id,
    amount_total:object.amount_total,
    currency:object.currency,
    payment_status:object.payment_status,
    livemode:object.livemode,
    total_details:object.total_details,
    customer_details:object.customer_details,
    customer:object.customer,
  },{
    id:sessionId,
    offerAmountMinor:snapshot.displayed_monthly_amount_minor as number,
    live:snapshot.stripe_livemode===true,
  });
  if(existing.status==="checkout_completed") {
    if(existing.stripe_checkout_session_id!==sessionId ||
      existing.checkout_final_amount_minor!==completed.checkout_final_amount_minor ||
      existing.checkout_currency!==completed.checkout_currency) {
      throw new OrderEvidenceError("Completed order evidence is inconsistent.");
    }
    return;
  }

  const {data:updated,error:updateError}=await client.from("billing_order_evidence")
    .update({
      stripe_checkout_session_id:sessionId,
      status:"checkout_completed",
      checkout_completed_at:new Date().toISOString(),
      ...completed,
      stripe_event_id:eventId,
    })
    .eq("id",existing.id).eq("organization_id",existing.organization_id)
    .eq("status",existing.status)
    .is("checkout_completed_at",null)
    .select("id").maybeSingle();
  if(updateError)throw updateError;
  if(!updated) {
    const {data:current,error:reloadError}=await client.from("billing_order_evidence")
      .select("status,stripe_checkout_session_id").eq("id",existing.id).maybeSingle();
    if(reloadError || current?.status!=="checkout_completed" ||
        current.stripe_checkout_session_id!==sessionId) {
      throw new OrderEvidenceError("Concurrent Stripe checkout evidence update requires retry.");
    }
  }
}
