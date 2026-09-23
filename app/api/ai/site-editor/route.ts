import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { readSiteDraft } from "@/lib/ai/site-editor";

export async function POST(request: Request) {
  if (process.env.ORBYVEN_AI_EDITOR_ENABLED !== "true") return NextResponse.json({error:"Editor dezactivat"},{status:503});
  const body=await request.json();
  const draft=readSiteDraft(body.draft);
  if (!draft || typeof body.organizationId !== "string") return NextResponse.json({error:"Invalid"},{status:400});
  try { await authenticateBillingActor(request,body.organizationId,true); }
  catch {return NextResponse.json({error:"Forbidden"},{status:403});}
  return NextResponse.json({error:"Implementing"},{status:503});
}
