import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { readSiteDraft } from "@/lib/ai/site-editor";
import { suggestSiteEdit } from "@/lib/ai/openai-server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{"Cache-Control":"no-store"}});

export async function POST(request:Request){
  if(process.env.ORBYVEN_AI_EDITOR_ENABLED!=="true")return fail("Editorul AI este dezactivat.",503);
  const credential=process.env.OPENAI_API_KEY?.trim();
  if(!credential)return fail("Serviciul AI nu este configurat.",503);
  if(Number(request.headers.get("content-length")||0)>12000)return fail("Cerere prea mare.",413);
  let body:Record<string,unknown>;
  try{
    const raw=await request.text();
    if(raw.length>12000)return fail("Cerere prea mare.",413);
    body=JSON.parse(raw);
    if(!body||typeof body!=="object"||Array.isArray(body))throw Error("Invalid");
  }catch{return fail("Cerere invalidă.",400);}
  const org=body.organizationId;
  const draft=readSiteDraft(body.draft);
  const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
  if(!draft||typeof org!=="string"||!/^[0-9a-f-]{36}$/i.test(org)||prompt.length<4||prompt.length>600)return fail("Date invalide.",400);
  try{await authenticateBillingActor(request,org,true);}
  catch(e){return fail(e instanceof Error&&e.message==="AUTH_REQUIRED"?"Autentifică-te din nou.":"Nu ai drept de editare pentru această organizație.",e instanceof Error&&e.message==="AUTH_REQUIRED"?401:403);}
  try{return NextResponse.json(await suggestSiteEdit(draft,prompt,credential),{headers:{"Cache-Control":"no-store"}});}
  catch(e){return fail(e instanceof Error&&e.message==="AI_RATE_LIMIT"?"Serviciul AI a atins limita de utilizare.":"Solicitarea AI a eșuat.",e instanceof Error&&e.message==="AI_RATE_LIMIT"?429:502);}
}
