// Side-effect-free verification. Kept free of Next.js aliases so Node CI can run it.
export type CheckoutPrice = {
  id:string; active:boolean; currency:string; unit_amount:number|null;
  billing_scheme:string; livemode:boolean; tax_behavior:string; type:string;
  recurring:{interval:string;interval_count:number;usage_type:string}|null;
};
export type CompletedCheckout = {
  id:unknown;amount_total:unknown;currency:unknown;payment_status:unknown;
  livemode:unknown;total_details?:unknown;customer_details?:unknown;customer?:unknown;
};
export class OrderEvidenceError extends Error {}

export function validateCheckoutPrice(price:CheckoutPrice,expected:{
  priceId:string;amountMinor:number;live:boolean;taxLabel:string;
}) {
  if(price.id!==expected.priceId || !price.active || price.currency!=="ron" ||
    price.unit_amount!==expected.amountMinor || price.billing_scheme!=="per_unit" ||
    price.type!=="recurring" || price.recurring?.interval!=="month" ||
    price.recurring?.interval_count!==1 || price.recurring?.usage_type!=="licensed" ||
    price.livemode!==expected.live) {
    throw new OrderEvidenceError("Stripe price does not match the displayed monthly plan.");
  }
  if(price.tax_behavior==="exclusive" ||
    !["inclusive","unspecified"].includes(price.tax_behavior) ||
    !expected.taxLabel || expected.taxLabel==="tratament TVA de configurat") {
    throw new OrderEvidenceError("Checkout tax configuration requires review.");
  }
  return price;
}

function nonnegativeInteger(value:unknown):value is number {
  return typeof value==="number" && Number.isSafeInteger(value) && value>=0;
}
export function parseVerifiedCheckoutOutcome(
  object:CompletedCheckout,
  expected:{id:string;offerAmountMinor:number;live:boolean},
) {
  if(typeof object.id!=="string" || object.id!==expected.id) {
    throw new OrderEvidenceError("Stripe checkout session ID mismatch.");
  }
  if(object.currency!=="ron" || !nonnegativeInteger(object.amount_total) ||
    object.amount_total>expected.offerAmountMinor) {
    throw new OrderEvidenceError("Stripe checkout amount/currency exceeds the accepted offer.");
  }
  if(object.livemode!==expected.live) {
    throw new OrderEvidenceError("Stripe live/test mode mismatch.");
  }
  if(typeof object.payment_status!=="string" ||
    !["paid","unpaid","no_payment_required"].includes(object.payment_status)) {
    throw new OrderEvidenceError("Stripe payment status is missing.");
  }
  const details=object.total_details;
  const data=details && typeof details==="object" && !Array.isArray(details)
    ? details as Record<string,unknown> : {};
  const tax=data.amount_tax??0, discount=data.amount_discount??0;
  if(!nonnegativeInteger(tax)||!nonnegativeInteger(discount)) {
    throw new OrderEvidenceError("Stripe tax/discount totals are invalid.");
  }
  const buyer=object.customer_details;
  const buyerDetails=buyer&&typeof buyer==="object"&&!Array.isArray(buyer)
    ? buyer as Record<string,unknown> : {};
  const optionalText=(value:unknown)=>
    typeof value==="string"&&value.trim().length>0
      ? value.trim().slice(0,450) : null;
  const rawTaxIds=buyerDetails.tax_ids;
  const taxIds=Array.isArray(rawTaxIds)?rawTaxIds:[];
  const taxId=taxIds.map((row:unknown)=>{
    const item=row&&typeof row==="object"&&!Array.isArray(row)
      ? row as Record<string,unknown> : {};
    return optionalText(item.value);
  }).find(Boolean)??null;
  const rawAddress=buyerDetails.address;
  const address=rawAddress&&typeof rawAddress==="object"&&!Array.isArray(rawAddress)
    ? rawAddress as Record<string,unknown> : {};
  const sanitizedAddress=Object.fromEntries(
    ["line1","line2","city","state","postal_code","country"]
      .map(key=>[key,optionalText(address[key])]).filter(([,value])=>value!==null)
  );
  return {
    checkout_stripe_customer_id:optionalText(object.customer),
    checkout_buyer_name:optionalText(buyerDetails.name),
    checkout_buyer_email:optionalText(buyerDetails.email),
    checkout_buyer_tax_id:taxId,
    checkout_billing_address:sanitizedAddress,
    checkout_final_amount_minor:object.amount_total,
    checkout_tax_amount_minor:tax,
    checkout_discount_amount_minor:discount,
    checkout_currency:"ron",
    checkout_payment_status:object.payment_status,
  };
}
