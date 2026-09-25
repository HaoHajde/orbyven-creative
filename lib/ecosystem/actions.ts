import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { commercialSnapshotMatches } from "@/lib/ecosystem/revision";

// Operational helpers for the EXISTING Estimates module. Authorization remains
// Supabase RLS; every query and mutation is scoped to organization_id.
type Source = { id:string; client_id:string|null; task_id:string|null; reference:string; title:string; status:string; currency:string; subtotal_cents:number; discount_cents:number; total_cents:number; tax_rate:number|null; updated_at:string };
type Line = { id:string; description:string; quantity:number; unit_price_cents:number };

async function getSource(org:string, estimateId:string) {
  if (!org || !estimateId) throw new Error("Firma și devizul sunt obligatorii.");
  const {data,error}=await orbyvenSupabase.from("sales_estimates").select("id,client_id,task_id,reference,title,status,currency,subtotal_cents,discount_cents,total_cents,tax_rate,updated_at").eq("organization_id",org).eq("id",estimateId).single();
  if(error || !data) throw new Error("Devizul nu este disponibil în această firmă.");
  return data as Source;
}
async function getLines(org:string,estimateId:string){
  const {data,error}=await orbyvenSupabase.from("sales_estimate_items").select("id,description,quantity,unit_price_cents").eq("organization_id",org).eq("estimate_id",estimateId).order("position");
  if(error) throw error;
  return (data??[]) as Line[];
}
const isMoney=(n:number)=>Number.isSafeInteger(n)&&n>=0;
function validateOffer(source:Source,lines:Line[]){
  if(!source.client_id || !source.task_id) throw new Error("Asociază întâi clientul și lucrarea.");
  if(!lines.length) throw new Error("Devizul nu are poziții.");
  if(["rejected","expired"].includes(source.status)) throw new Error("Devizul respins sau expirat nu poate genera oferta.");
}
export async function addMaterialRequirement(org:string,estimateId:string,input:{description:string;quantity:number;unit:string;unitCostCents:number;vendor?:string;estimateItemId?:string}){
  const source=await getSource(org,estimateId);
  if(!["draft","sent"].includes(source.status)) throw new Error("O ofertă acceptată necesită o revizie pentru alte materiale.");
  if(!input.description.trim() || !input.unit.trim() || !Number.isFinite(input.quantity)||input.quantity<=0||!isMoney(input.unitCostCents)) throw new Error("Completează materialul, cantitatea și costul.");
  if(input.estimateItemId && !(await getLines(org,estimateId)).some(x=>x.id===input.estimateItemId)) throw new Error("Poziția nu aparține devizului.");
  const {error}=await orbyvenSupabase.from("sales_material_requirements").insert({
    organization_id:org,estimate_id:estimateId,source_estimate_item_id:input.estimateItemId||null,
    description:input.description.trim(),quantity:input.quantity,unit:input.unit.trim(),unit_cost_cents:input.unitCostCents,
    vendor:input.vendor?.trim()||null,status:"planned",
  });
  if(error) throw error;
}
export async function addRequirementsFromRecipe(org:string,estimateId:string,estimateItemId:string,recipeId:string){
  const source=await getSource(org,estimateId);
  if(!["draft","sent"].includes(source.status)) throw new Error("O ofertă acceptată necesită revizie pentru alte materiale.");
  const line=(await getLines(org,estimateId)).find(x=>x.id===estimateItemId);
  if(!line) throw new Error("Selectează o poziție validă a devizului.");
  const [recipe,ingredients,previous]=await Promise.all([
    orbyvenSupabase.from("ops_material_recipes").select("id").eq("organization_id",org).eq("id",recipeId).single(),
    orbyvenSupabase.from("ops_material_recipe_items").select("material_id,description,quantity_per_unit,unit,unit_cost_cents,vendor,position").eq("organization_id",org).eq("recipe_id",recipeId).order("position"),
    orbyvenSupabase.from("sales_material_requirements").select("id").eq("organization_id",org).eq("estimate_id",estimateId).eq("source_recipe_id",recipeId).eq("source_estimate_item_id",estimateItemId).limit(1),
  ]);
  if(recipe.error||!recipe.data||ingredients.error||previous.error) throw new Error("Rețeta nu este disponibilă în firma curentă.");
  if(previous.data?.length) throw new Error("Rețeta a fost aplicată deja acestei poziții.");
  if(!ingredients.data?.length) throw new Error("Rețeta nu conține materiale.");
  const materialIds=ingredients.data.map(item=>item.material_id).filter((id):id is string=>Boolean(id));
  const activeCatalog=materialIds.length?await orbyvenSupabase.from("ops_material_catalog")
    .select("id,name,unit,unit_cost_cents,vendor").eq("organization_id",org).in("id",materialIds):null;
  if(activeCatalog?.error)throw activeCatalog.error;
  const catalog=new Map((activeCatalog?.data??[]).map(item=>[item.id,item]));
  if(materialIds.some(id=>!catalog.has(id)))throw new Error("Un material din rețetă nu mai există în biblioteca firmei.");
  const rows=ingredients.data.map((item,i)=>({
    organization_id:org,estimate_id:estimateId,source_recipe_id:recipeId,source_estimate_item_id:line.id,
    description:item.material_id?catalog.get(item.material_id)?.name??item.description:item.description,
    quantity:Number(item.quantity_per_unit)*Number(line.quantity),unit:item.material_id?catalog.get(item.material_id)?.unit??item.unit:item.unit,
    unit_cost_cents:Number(item.material_id?catalog.get(item.material_id)?.unit_cost_cents??item.unit_cost_cents:item.unit_cost_cents),
    vendor:item.material_id?catalog.get(item.material_id)?.vendor??item.vendor:item.vendor,status:"planned",position:i,
  }));
  if(rows.some(x=>!Number.isFinite(x.quantity)||x.quantity<=0||!isMoney(x.unit_cost_cents))) throw new Error("Rețeta are cantități sau costuri invalide.");
  const {error}=await orbyvenSupabase.from("sales_material_requirements").insert(rows); // PostgreSQL multi-row statement is atomic
  if(error) throw error;
}
export async function advanceMaterialStatus(org:string,estimateId:string,id:string,current:"planned"|"ordered"|"bought"){
  if(current==="bought") throw new Error("Materialul a fost cumpărat.");
  const next=current==="planned"?"ordered":"bought";
  const {data,error}=await orbyvenSupabase.from("sales_material_requirements").update({status:next})
    .eq("organization_id",org).eq("estimate_id",estimateId).eq("id",id).eq("status",current).select("id").single();
  if(error||!data) throw new Error("Statusul nu a fost actualizat; reîncarcă lista.");
}
export async function makeClientOfferDraft(org:string,estimateId:string){
  const source=await getSource(org,estimateId), lines=await getLines(org,estimateId);
  validateOffer(source,lines);
  const previous=await orbyvenSupabase.from("sales_commercial_documents").select("id").eq("organization_id",org).eq("estimate_id",estimateId).eq("document_type","offer").limit(1);
  if(previous.error) throw previous.error;
  if(previous.data?.length) throw new Error("Oferta există deja; nu suprascriem documentele trimise.");
  const {error}=await orbyvenSupabase.from("sales_commercial_documents").insert({
    organization_id:org,estimate_id:source.id,client_id:source.client_id,task_id:source.task_id,
    document_type:"offer",reference:"OFR-"+crypto.randomUUID().slice(0,8).toUpperCase(),status:"draft",
    title:source.title,currency:source.currency,subtotal_cents:source.subtotal_cents,discount_cents:source.discount_cents,
    total_cents:source.total_cents,tax_rate:source.tax_rate,generated_from_updated_at:source.updated_at,
    snapshot:{source_reference:source.reference,source_updated_at:source.updated_at,client_id:source.client_id,task_id:source.task_id,
      lines:lines.map(x=>({...x})),fiscal_invoice:false},
  });
  if(error?.code==="23505") throw new Error("Oferta există deja; reîncarcă documentele.");
  if(error) throw error;
}
export async function markOfferManually(org:string,estimateId:string,status:"sent"|"accepted"){
  const source=await getSource(org,estimateId),lines=await getLines(org,estimateId);
  const {data,error}=await orbyvenSupabase.from("sales_commercial_documents")
    .select("id,status,title,client_id,task_id,currency,subtotal_cents,discount_cents,total_cents,tax_rate,snapshot").eq("organization_id",org).eq("estimate_id",estimateId).eq("document_type","offer").single();
  if(error||!data) throw new Error("Creează mai întâi oferta.");
  if(!commercialSnapshotMatches(source,lines,data)) throw new Error("Oferta nu mai corespunde conținutului devizului; este necesară revizie.");
  if(status==="sent"&&data.status!=="draft") throw new Error("Doar ciorna poate fi marcată trimisă.");
  if(status==="accepted"&&(data.status!=="sent"||source.status!=="accepted")) throw new Error("Confirmă trimiterea și acceptarea devizului înaintea ofertei.");
  const changed=await orbyvenSupabase.from("sales_commercial_documents").update({status})
    .eq("organization_id",org).eq("estimate_id",estimateId).eq("id",data.id).eq("status",data.status).select("id").single();
  if(changed.error||!changed.data) throw new Error("Statusul nu a fost actualizat; reîncarcă.");
}
export async function makeInvoiceDraft(org:string,estimateId:string){
  const source=await getSource(org,estimateId),lines=await getLines(org,estimateId);
  validateOffer(source,lines);
  if(source.status!=="accepted"||source.tax_rate===null) throw new Error("Confirmă acceptarea devizului și tratamentul TVA.");
  const docs=await orbyvenSupabase.from("sales_commercial_documents")
    .select("id,document_type,status,title,client_id,task_id,currency,subtotal_cents,discount_cents,total_cents,tax_rate,snapshot").eq("organization_id",org).eq("estimate_id",estimateId);
  if(docs.error) throw docs.error;
  if(docs.data?.some(d=>d.document_type==="invoice_draft")) throw new Error("Ciorna există deja.");
  const offer=docs.data?.find(d=>d.document_type==="offer");
  if(!offer||offer.status!=="accepted"||!commercialSnapshotMatches(source,lines,offer)) throw new Error("Oferta trebuie să fie actuală și acceptată explicit.");
  const {error}=await orbyvenSupabase.from("sales_commercial_documents").insert({
    organization_id:org,estimate_id:source.id,client_id:source.client_id,task_id:source.task_id,
    document_type:"invoice_draft",reference:"PRE-"+crypto.randomUUID().slice(0,8).toUpperCase(),
    status:"draft",title:source.title,currency:source.currency,subtotal_cents:source.subtotal_cents,
    discount_cents:source.discount_cents,total_cents:source.total_cents,tax_rate:source.tax_rate,
    generated_from_updated_at:source.updated_at,
    snapshot:{source_reference:source.reference,source_updated_at:source.updated_at,linked_offer_id:offer.id,
      client_id:source.client_id,task_id:source.task_id,lines:lines.map(x=>({...x})),
      fiscal_invoice:false,anaf_submission:false},
  });
  if(error?.code==="23505") throw new Error("Ciorna există deja; reîncarcă.");
  if(error) throw error;
}
