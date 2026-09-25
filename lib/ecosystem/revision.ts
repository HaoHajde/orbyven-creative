/**
 * Only actual commercial content can invalidate a sent offer. A status change
 * on sales_estimates updates updated_at but must NOT silently invalidate the
 * same accepted prices, work, customer and lines.
 */
export type CommercialSourceShape = {
  reference:string;title:string;client_id:string|null;task_id:string|null;
  currency:string;subtotal_cents:number;discount_cents:number;
  total_cents:number;tax_rate:number|null;
};
export type CommercialLineShape = {
  id:string;description:string;quantity:number;unit_price_cents:number;
};
export type CommercialDocumentShape = {
  title:string;client_id:string|null;task_id:string|null;currency:string;
  subtotal_cents:number;discount_cents:number;total_cents:number;
  tax_rate:number|null;snapshot:unknown;
};
type SnapLine = {id?:unknown;description?:unknown;quantity?:unknown;unit_price_cents?:unknown};

export function commercialSnapshotMatches(
  source:CommercialSourceShape,
  lines:readonly CommercialLineShape[],
  document:CommercialDocumentShape,
):boolean {
  if (!source.client_id || !source.task_id || !lines.length) return false;
  if (source.title!==document.title||source.client_id!==document.client_id||
    source.task_id!==document.task_id||source.currency!==document.currency||
    Number(source.subtotal_cents)!==Number(document.subtotal_cents)||
    Number(source.discount_cents)!==Number(document.discount_cents)||
    Number(source.total_cents)!==Number(document.total_cents)||
    source.tax_rate!==document.tax_rate) return false;

  const snap=document.snapshot;
  if(!snap||typeof snap!=="object"||Array.isArray(snap))return false;
  const obj=snap as {source_reference?:unknown;lines?:unknown};
  if(obj.source_reference!==source.reference||!Array.isArray(obj.lines)||obj.lines.length!==lines.length)return false;
  const sourceLines=new Map(lines.map(line=>[line.id,line]));
  if(sourceLines.size!==lines.length)return false;
  for(const raw of obj.lines){
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
    const row=raw as SnapLine;
    if(typeof row.id!=="string")return false;
    const item=sourceLines.get(row.id);
    if(!item||row.description!==item.description||Number(row.quantity)!==Number(item.quantity)||
      Number(row.unit_price_cents)!==Number(item.unit_price_cents))return false;
  }
  return true;
}
