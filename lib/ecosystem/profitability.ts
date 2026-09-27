/** Pure projection. Amounts are integer bani; NOT accounting profit or taxable income. */
export type CostLine={quantity:number;unit_cost_cents:number};
export type CostProjectionInput={
  subtotalCents:number;discountCents:number;materialLines:CostLine[];
  plannedLaborCents:number;otherCostCents:number;
  recordedExpensesCents:number[];
};
export function computeEstimateProfitability(input:CostProjectionInput){
  const safe=(value:number)=>Number.isFinite(value)?Math.max(0,Math.round(value)):0;
  const netPrice=safe(input.subtotalCents-input.discountCents); // excludes VAT
  const estimatedMaterialCost=safe(input.materialLines.reduce((sum,line)=>{
    if(!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isFinite(line.unit_cost_cents)||line.unit_cost_cents<0)
      return sum;
    return sum+Math.round(line.quantity*line.unit_cost_cents);
  },0));
  const labor=safe(input.plannedLaborCents),other=safe(input.otherCostCents);
  const plannedTotal=estimatedMaterialCost+labor+other;
  const plannedMargin=netPrice-plannedTotal;
  const actualExpenses=safe(input.recordedExpensesCents.reduce((sum,value)=>sum+safe(value),0));
  return {
    netPrice,estimatedMaterialCost,labor,other,plannedTotal,plannedMargin,
    plannedMarginPercent:netPrice>0?plannedMargin/netPrice*100:null,
    actualExpenses,
    // Partial actual costs are not added to planned costs: could double-count
    // purchases already represented in a material forecast.
  };
}
