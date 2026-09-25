import { NextResponse } from "next/server";
import {
  authorizeControlCenter, ControlCenterHttpError, requireStaffRole,
} from "@/lib/orbyven-control-center-server";
import { legalConfig } from "@/lib/legal-config";
import {
  ComplianceValidationError, oneMonthDeadline, parseContractRecord,
  parsePrivacyCase, parsePrivacyTransition, requireUuid, type PrivacyStatus,
} from "@/lib/compliance/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(body: object,status=200) {
  return NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
}
function handleError(error: unknown) {
  if (error instanceof ControlCenterHttpError) return reply({error:error.code},error.status);
  if (error instanceof ComplianceValidationError) return reply({error:error.code,message:error.message},400);
  const code = error && typeof error === "object" && "code" in error
    ? String((error as {code?:unknown}).code) : "";
  if (code === "23505") return reply({error:"duplicate_contract_record"},409);
  if (code === "23503") return reply({error:"unknown_organization"},404);
  if (code === "42P01" || code === "PGRST205" || code === "42703") {
    return reply({error:"compliance_migration_required"},503);
  }
  console.error("ORBYVEN internal compliance operation failed",code || error);
  return reply({error:"compliance_operation_failed"},500);
}
function readBody(body: unknown): Record<string,unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ComplianceValidationError("invalid_body","Expected a JSON object.");
  }
  return body as Record<string,unknown>;
}

export async function GET(request: Request) {
  try {
    const {admin,staffRole} = await authorizeControlCenter(request);
    requireStaffRole(staffRole,["platform_owner","platform_admin"]);
    const rawId = new URL(request.url).searchParams.get("organizationId");
    const organizationId = rawId ? requireUuid(rawId) : null;

    const {data:organizations,error:organizationsError} = await admin
      .from("organizations").select("id,name,legal_name").order("name").limit(500);
    if (organizationsError) throw organizationsError;
    if (organizationId && !(organizations ?? []).some(o=>o.id===organizationId)) {
      return reply({error:"unknown_organization"},404);
    }

    const privacyQuery = admin.from("privacy_request_cases")
      .select("id,organization_id,subject_reference,request_type,processing_role,channel,status,received_at,due_at,last_action,updated_at")
      .order("received_at",{ascending:false}).limit(100);
    const [casesResult,contractsResult,acceptancesResult,subscriptionsResult] = await Promise.all([
      organizationId ? privacyQuery.eq("organization_id",organizationId) : privacyQuery,
      organizationId
        ? admin.from("legal_contract_records")
            .select("id,organization_id,document_type,title,document_version,sha256,evidence_reference,evidence_status,merchant_key,merchant_legal_name,recorded_at")
            .eq("organization_id",organizationId).order("recorded_at",{ascending:false}).limit(100)
        : Promise.resolve({data:[],error:null}),
      organizationId
        ? admin.from("billing_terms_acceptances")
            .select("id,document_type,document_version,accepted_from,accepted_at,merchant_key,merchant_legal_name")
            .eq("organization_id",organizationId).order("accepted_at",{ascending:false}).limit(100)
        : Promise.resolve({data:[],error:null}),
      organizationId
        ? admin.from("subscriptions")
            .select("id,plan_id,status,merchant_key,merchant_legal_name,created_at")
            .eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(20)
        : Promise.resolve({data:[],error:null}),
    ]);
    for (const result of [casesResult,contractsResult,acceptancesResult,subscriptionsResult]) {
      if (result.error) throw result.error;
    }
    return reply({
      organizations:organizations ?? [],
      privacyCases:casesResult.data ?? [],
      contracts:contractsResult.data ?? [],
      checkouts:acceptancesResult.data ?? [],
      subscriptions:subscriptionsResult.data ?? [],
      limitPerList:100,
      canonicalAcceptanceSource:"billing_terms_acceptances",
      // A manual registry entry never claims to be a signed agreement.
      manualEvidenceIsVerified:false,
    });
  } catch(error) {return handleError(error);}
}

export async function POST(request: Request) {
  try {
    const {admin,user,staffRole} = await authorizeControlCenter(request);
    requireStaffRole(staffRole,["platform_owner","platform_admin"]);
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return reply({error:"expected_json"},415);
    }
    const body=readBody(await request.json());
    const action=body.action;

    if (action==="register_contract") {
      const parsed=parseContractRecord(body);
      const {data:organization,error:orgError}=await admin.from("organizations")
        .select("id").eq("id",parsed.organization_id).maybeSingle();
      if (orgError) throw orgError;
      if (!organization) return reply({error:"unknown_organization"},404);
      const {data,error}=await admin.from("legal_contract_records").insert({
        ...parsed,
        merchant_key:legalConfig.entityKey || null,
        merchant_legal_name:legalConfig.legalName || null,
        merchant_tax_id:legalConfig.taxId || null,
        recorded_by:user.id,
      }).select("id,evidence_status").single();
      if (error) throw error;
      return reply({ok:true,record:data},201);
    }

    if (action==="create_privacy_case") {
      const parsed=parsePrivacyCase(body);
      if (parsed.organization_id) {
        const {data:organization,error:orgError}=await admin.from("organizations")
          .select("id").eq("id",parsed.organization_id).maybeSingle();
        if (orgError) throw orgError;
        if (!organization) return reply({error:"unknown_organization"},404);
      }
      const now=new Date();
      const {data,error}=await admin.from("privacy_request_cases").insert({
        ...parsed,
        status:"received",
        received_at:now.toISOString(),
        due_at:oneMonthDeadline(now),
        updated_by:user.id,
        last_action:"Cerere înregistrată în registrul intern; verificarea identității și a rolului urmează.",
      }).select("id,status,due_at").single();
      if (error) throw error;
      return reply({ok:true,case:data},201);
    }

    if (action==="advance_privacy_case") {
      const id=requireUuid(body.id,"id");
      const {data:current,error:currentError}=await admin.from("privacy_request_cases")
        .select("id,status").eq("id",id).maybeSingle();
      if (currentError) throw currentError;
      if (!current) return reply({error:"unknown_privacy_case"},404);
      const parsed=parsePrivacyTransition(body,current.status as PrivacyStatus);
      const {data,error}=await admin.from("privacy_request_cases")
        .update({status:parsed.status,last_action:parsed.last_action,updated_by:user.id})
        .eq("id",parsed.id).eq("status",current.status)
        .select("id,status,updated_at").maybeSingle();
      if (error) throw error;
      if (!data) return reply({error:"privacy_case_changed_reload"},409);
      return reply({ok:true,case:data});
    }

    return reply({error:"unknown_action"},400);
  } catch(error) {return handleError(error);}
}
