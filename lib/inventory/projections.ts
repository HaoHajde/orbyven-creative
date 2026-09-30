export type InventoryGapSource = {
  materialId: string;
  name: string;
  unit: string;
  unitCostCents: number;
  preferredSupplierId: string | null;
  onHand: number;
  outstandingDemand: number;
  onOrder: number;
  reorderPoint: number;
};

export type InventoryGap = InventoryGapSource & {
  shortage: number;
  projectedAfterDemand: number;
  suggestedOrder: number;
  stockValueCents: number;
  state: "ok" | "low" | "shortage";
};

function nonnegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function projectInventoryGap(source: InventoryGapSource): InventoryGap {
  const onHand = nonnegative(source.onHand);
  const outstandingDemand = nonnegative(source.outstandingDemand);
  const onOrder = nonnegative(source.onOrder);
  const reorderPoint = nonnegative(source.reorderPoint);
  const unitCostCents = Number.isSafeInteger(source.unitCostCents)
    ? Math.max(0, source.unitCostCents)
    : 0;

  const shortage = Math.max(0, outstandingDemand - onHand - onOrder);
  const projectedAfterDemand = onHand + onOrder - outstandingDemand;
  const suggestedOrder = Math.max(
    0,
    outstandingDemand + reorderPoint - onHand - onOrder
  );
  const stockValueCents = Math.max(0, Math.round(onHand * unitCostCents));
  const state: InventoryGap["state"] =
    shortage > 0 ? "shortage" : projectedAfterDemand < reorderPoint ? "low" : "ok";

  return {
    ...source,
    unitCostCents,
    onHand,
    outstandingDemand,
    onOrder,
    reorderPoint,
    shortage,
    projectedAfterDemand,
    suggestedOrder,
    stockValueCents,
    state,
  };
}

export function remainingPurchaseQuantity(ordered: number, received: number) {
  return Math.max(0, nonnegative(ordered) - nonnegative(received));
}

export function inventorySummary(
  gaps: readonly InventoryGap[],
  openPurchaseOrders: number
) {
  return {
    trackedMaterials: gaps.length,
    lowOrShort: gaps.filter((item) => item.state !== "ok").length,
    shortageMaterials: gaps.filter((item) => item.shortage > 0).length,
    suggestedLines: gaps.filter((item) => item.suggestedOrder > 0).length,
    openPurchaseOrders: Math.max(0, Math.round(openPurchaseOrders)),
    stockValueCents: gaps.reduce((sum, item) => sum + item.stockValueCents, 0),
  };
}
