import { NextResponse } from "next/server";
import { authenticateBillingActor,createBillingServiceClient } from "@/lib/billing/supabase-server";
import { buildTenantArchive,requireExportableCase,TenantExportError } from "@/lib/compliance/exit-export";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function json(payload:object,status=200) {
  return NextResponse.json(payload,{
    status,
    headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"},
  });
}
function code(error:unknown) {
  const message=error instanceof Error?error.message:"";
  if(message==="AUTH_REQUIRED")return json({error:"auth_required"},401);
  if(message==="ORG_ACCESS_REQUIRED"||message==="BILLING_ADMIN_REQUIRED"||
    message==="OWNER_REQUIRED")return json({error:"organization_access_denied"},403);
  if(error instanceof TenantExportError)return json({error:"archive_unavailable",reason:error.message},409);
  if(error&&typeof error==="object"&&"code" in error &&
      String((error as {code:unknown}).code)==="23505")return json({error:"open_exit_case_exists"},409);
  console.error("ORBYVEN exit operation failed",message);
  return json({error:"exit_operation_unavailable"},500);
}
function uuid(value:string|null) {
  return typeof value==="string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ?value:null;
}
export async function GET(request:Request) {
  try{
    const url=new URL(request.url),organizationId=uuid(url.searchParams.get("organizationId"));
    if(!organizationId)return json({error:"organization_required"},400);
    const actor=await authenticateBillingActor(request,organizationId,true);
    if(actor.role!=="owner")return json({error:"owner_required"},403);
    const admin=createBillingServiceClient();
    const caseId=url.searchParams.get("caseId");
    if(!caseId) {
      const {data,error}=await admin.from("organization_exit_cases")
        .select("id,status,requested_at,action_note,package_sha256,package_generated_at,closure_reference")
        .eq("organization_id",actor.organizationId)
        .order("requested_at",{ascending:false}).limit(15);
      if(error)throw error;
      return json({cases:data??[]});
    }
    if(!uuid(caseId))return json({error:"invalid_case"},400);
    const {data:item,error:lookupError}=await admin.from("organization_exit_cases")
      .select("id,organization_id,status,package_sha256,package_generated_at")
      .eq("id",caseId).eq("organization_id",actor.organizationId).maybeSingle();
    if(lookupError)throw lookupError;
    if(!item)return json({error:"unknown_case"},404);
    requireExportableCase(item,actor.organizationId);

    const generatedAt=item.status==="package_generated"&&item.package_generated_at
      ?item.package_generated_at:new Date().toISOString();
    const archive=await buildTenantArchive(admin,actor.organizationId,item.id,generatedAt);
    if(item.status==="package_generated") {
      if(!item.package_sha256||archive.sha256!==item.package_sha256) {
        return json({error:"export_changed_since_generation"},409);
      }
    }
    if(item.status==="authorized") {
    const {data:saved,error:saveError}=await admin.from("organization_exit_cases")
      .update({
        status:"package_generated",
        package_sha256:archive.sha256,
        package_generated_at:generatedAt,
        package_generated_by:actor.userId,
        action_by:actor.userId,
        action_note:"Arhivă JSON generată pentru descărcare; primirea de către client nu este confirmată.",
      }).eq("id",item.id).eq("organization_id",actor.organizationId)
      .eq("status","authorized")
      .is("package_sha256",null)
      .select("id").maybeSingle();
    if(saveError)throw saveError;
    if(!saved)return json({error:"export_already_claimed"},409);
    }
    // No claim of successful delivery: the HTTP response may still disconnect.
    return new Response(archive.payload,{
      status:200,
      headers:{
        "Content-Type":"application/json; charset=utf-8",
        "Content-Disposition":'attachment; filename="orbyven-'+actor.organizationId+'-'+caseId+'.json"',
        "Cache-Control":"private, no-store, max-age=0",
        "Pragma":"no-cache",
        "X-Content-Type-Options":"nosniff",
        "X-Robots-Tag":"noindex",
      },
    });
  }catch(error){return code(error);}
}
export async function POST(request:Request) {
  try {
    if(!request.headers.get("content-type")?.includes("application/json")) {
      return json({error:"expected_json"},415);
    }
    const body=await request.json() as {organizationId?:unknown;action?:unknown};
    const org=uuid(typeof body.organizationId==="string"?body.organizationId:null);
    if(!org||body.action!=="request_export")return json({error:"invalid_exit_request"},400);
    const actor=await authenticateBillingActor(request,org,true);
    if(actor.role!=="owner")return json({error:"owner_required"},403);
    const admin=createBillingServiceClient();
    const {data,error}=await admin.from("organization_exit_cases").insert({
      organization_id:actor.organizationId,
      requested_by:actor.userId,
      action_by:actor.userId,
      action_note:"Titularul organizației solicită exportul datelor disponibile în ORBYVEN.",
    }).select("id,status").single();
    if(error)throw error;
    return json({case:data},201);
  }catch(error){return code(error);}
}
