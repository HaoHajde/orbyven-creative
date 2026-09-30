import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { readAllPages } from "@/lib/modules/paged-read";
import {
  projectInventoryGap,
  type InventoryGap,
} from "@/lib/inventory/projections";

export type InventoryMaterial = {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  unit: string;
  unit_cost_cents: number;
  vendor: string | null;
  sku: string | null;
  stock_tracked: boolean;
  reorder_point: number;
  preferred_supplier_id: string | null;
};

export type InventorySupplier = {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  payment_terms_days: number;
  active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryTask = {
  id: string;
  title: string;
  kind: "work" | "order";
  status: "planned" | "in_progress" | "blocked";
  client_id: string | null;
};

export type InventoryPurchaseOrder = {
  id: string;
  organization_id: string;
  supplier_id: string;
  task_id: string | null;
  status: "draft" | "ordered" | "partially_received" | "received" | "cancelled";
  reference: string;
  ordered_on: string | null;
  expected_on: string | null;
  currency: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryPurchaseItem = {
  id: string;
  organization_id: string;
  purchase_order_id: string;
  material_id: string;
  description: string;
  ordered_quantity: number;
  received_quantity: number;
  unit: string;
  unit_cost_cents: number;
  position: number;
};

export type InventoryMovement = {
  id: string;
  organization_id: string;
  material_id: string;
  task_id: string | null;
  purchase_order_id: string | null;
  purchase_order_item_id: string | null;
  movement_type:
    | "receipt"
    | "consumption"
    | "adjustment_in"
    | "adjustment_out"
    | "return_in"
    | "return_out";
  quantity_delta: number;
  unit_cost_cents: number;
  note: string | null;
  occurred_at: string;
  created_at: string;
};

export type InventorySnapshot = {
  materials: InventoryMaterial[];
  suppliers: InventorySupplier[];
  tasks: InventoryTask[];
  purchaseOrders: InventoryPurchaseOrder[];
  purchaseItems: InventoryPurchaseItem[];
  recentMovements: InventoryMovement[];
  stock: InventoryGap[];
};

export type PurchaseOrderLineInput = {
  materialId: string;
  quantity: number;
  unitCostCents?: number;
};

const MATERIAL_FIELDS =
  "id,organization_id,name,category,unit,unit_cost_cents,vendor,sku,stock_tracked,reorder_point,preferred_supplier_id";
const SUPPLIER_FIELDS =
  "id,organization_id,name,contact_name,email,phone,website,payment_terms_days,active,note,created_at,updated_at";
const PURCHASE_ORDER_FIELDS =
  "id,organization_id,supplier_id,task_id,status,reference,ordered_on,expected_on,currency,note,created_at,updated_at";
const PURCHASE_ITEM_FIELDS =
  "id,organization_id,purchase_order_id,material_id,description,ordered_quantity,received_quantity,unit,unit_cost_cents,position";
const MOVEMENT_FIELDS =
  "id,organization_id,material_id,task_id,purchase_order_id,purchase_order_item_id,movement_type,quantity_delta,unit_cost_cents,note,occurred_at,created_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

function cleanOptional(value?: string | null) {
  const next = value?.trim();
  return next ? next : null;
}

function positiveQuantity(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 100_000_000;
}

function cents(value: number) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export async function loadInventorySnapshot(
  organizationId: string
): Promise<InventorySnapshot> {
  requireOrganizationId(organizationId);

  const [
    materialRows,
    supplierRows,
    taskRows,
    purchaseOrderRows,
    gapRows,
    movementResult,
  ] = await Promise.all([
    readAllPages<InventoryMaterial>((from, to) =>
      orbyvenSupabase
        .from("ops_material_catalog")
        .select(MATERIAL_FIELDS)
        .eq("organization_id", organizationId)
        .order("name", { ascending: true })
        .range(from, to)
    ),
    readAllPages<InventorySupplier>((from, to) =>
      orbyvenSupabase
        .from("ops_suppliers")
        .select(SUPPLIER_FIELDS)
        .eq("organization_id", organizationId)
        .order("active", { ascending: false })
        .order("name", { ascending: true })
        .range(from, to)
    ),
    readAllPages<InventoryTask>((from, to) =>
      orbyvenSupabase
        .from("ops_tasks")
        .select("id,title,kind,status,client_id")
        .eq("organization_id", organizationId)
        .in("kind", ["work", "order"])
        .in("status", ["planned", "in_progress", "blocked"])
        .order("updated_at", { ascending: false })
        .range(from, to)
    ),
    readAllPages<InventoryPurchaseOrder>((from, to) =>
      orbyvenSupabase
        .from("ops_purchase_orders")
        .select(PURCHASE_ORDER_FIELDS)
        .eq("organization_id", organizationId)
        .in("status", ["draft", "ordered", "partially_received"])
        .order("updated_at", { ascending: false })
        .range(from, to)
    ),
    readAllPages<{
      material_id: string;
      name: string;
      unit: string;
      unit_cost_cents: number;
      preferred_supplier_id: string | null;
      on_hand: number;
      outstanding_demand: number;
      on_order: number;
      reorder_point: number;
    }>((from, to) =>
      orbyvenSupabase
        .from("ops_inventory_procurement_gaps")
        .select("material_id,name,unit,unit_cost_cents,preferred_supplier_id,on_hand,outstanding_demand,on_order,reorder_point")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true })
        .range(from, to)
    ),
    orbyvenSupabase
      .from("ops_inventory_movements")
      .select(MOVEMENT_FIELDS)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false })
      .limit(80),
  ]);

  if (movementResult.error) throw movementResult.error;

  const purchaseIds = purchaseOrderRows.map((row) => row.id);
  const purchaseItems = purchaseIds.length
    ? await readAllPages<InventoryPurchaseItem>((from, to) =>
        orbyvenSupabase
          .from("ops_purchase_order_item_progress")
          .select(PURCHASE_ITEM_FIELDS)
          .eq("organization_id", organizationId)
          .in("purchase_order_id", purchaseIds)
          .order("position", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to)
      )
    : [];

  return {
    materials: materialRows.map((row) => ({
      ...row,
      reorder_point: Number(row.reorder_point || 0),
    })),
    suppliers: supplierRows,
    tasks: taskRows,
    purchaseOrders: purchaseOrderRows,
    purchaseItems: purchaseItems.map((row) => ({
      ...row,
      ordered_quantity: Number(row.ordered_quantity || 0),
      received_quantity: Number(row.received_quantity || 0),
    })),
    recentMovements: ((movementResult.data ?? []) as InventoryMovement[]).map((row) => ({
      ...row,
      quantity_delta: Number(row.quantity_delta || 0),
    })),
    stock: gapRows.map((row) =>
      projectInventoryGap({
        materialId: row.material_id,
        name: row.name,
        unit: row.unit,
        unitCostCents: Number(row.unit_cost_cents || 0),
        preferredSupplierId: row.preferred_supplier_id ?? null,
        onHand: Number(row.on_hand || 0),
        outstandingDemand: Number(row.outstanding_demand || 0),
        onOrder: Number(row.on_order || 0),
        reorderPoint: Number(row.reorder_point || 0),
      })
    ),
  };
}

export async function createInventorySupplier(
  organizationId: string,
  input: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    paymentTermsDays?: number;
    note?: string;
  }
) {
  requireOrganizationId(organizationId);
  const name = input.name.trim();
  if (!name) throw new Error("Numele furnizorului este obligatoriu.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const paymentTermsDays = Number.isFinite(input.paymentTermsDays)
    ? Math.min(365, Math.max(0, Math.round(input.paymentTermsDays ?? 0)))
    : 0;

  const { data, error } = await orbyvenSupabase
    .from("ops_suppliers")
    .insert({
      organization_id: organizationId,
      name,
      contact_name: cleanOptional(input.contactName),
      email: cleanOptional(input.email),
      phone: cleanOptional(input.phone),
      website: cleanOptional(input.website),
      payment_terms_days: paymentTermsDays,
      note: cleanOptional(input.note),
      created_by: authData.user?.id ?? null,
    })
    .select(SUPPLIER_FIELDS)
    .single();

  if (error?.code === "23505") throw new Error("Furnizorul există deja.");
  if (error || !data) throw error ?? new Error("Furnizorul nu a putut fi salvat.");
  return data as InventorySupplier;
}

export async function updateInventoryMaterialSettings(
  organizationId: string,
  materialId: string,
  input: {
    stockTracked: boolean;
    reorderPoint: number;
    preferredSupplierId?: string | null;
    sku?: string | null;
  }
) {
  requireOrganizationId(organizationId);
  if (!materialId.trim()) throw new Error("Materialul este obligatoriu.");
  if (!Number.isFinite(input.reorderPoint) || input.reorderPoint < 0) {
    throw new Error("Pragul minim nu este valid.");
  }

  const { data, error } = await orbyvenSupabase
    .from("ops_material_catalog")
    .update({
      stock_tracked: input.stockTracked,
      reorder_point: input.stockTracked ? input.reorderPoint : 0,
      preferred_supplier_id: input.stockTracked
        ? input.preferredSupplierId || null
        : null,
      sku: cleanOptional(input.sku),
    })
    .eq("organization_id", organizationId)
    .eq("id", materialId)
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Materialul nu a putut fi actualizat.");
}

export async function createPurchaseOrder(
  organizationId: string,
  input: {
    supplierId: string;
    taskId?: string | null;
    expectedOn?: string | null;
    note?: string;
    items: PurchaseOrderLineInput[];
  }
): Promise<string> {
  requireOrganizationId(organizationId);
  if (!input.supplierId.trim()) throw new Error("Alege furnizorul.");
  if (!input.items.length || input.items.length > 100) {
    throw new Error("Comanda trebuie să conțină între 1 și 100 de poziții.");
  }

  const items = input.items.map((item) => {
    if (!item.materialId.trim() || !positiveQuantity(item.quantity)) {
      throw new Error("Verifică materialele și cantitățile comenzii.");
    }
    const unitCostCents =
      item.unitCostCents === undefined ? null : cents(item.unitCostCents);
    if (item.unitCostCents !== undefined && unitCostCents === null) {
      throw new Error("Costul unei poziții nu este valid.");
    }
    return {
      material_id: item.materialId,
      quantity: item.quantity,
      unit_cost_cents: unitCostCents,
    };
  });

  const { data, error } = await orbyvenSupabase.rpc(
    "inventory_create_purchase_order",
    {
      p_organization_id: organizationId,
      p_supplier_id: input.supplierId,
      p_task_id: input.taskId || null,
      p_expected_on: input.expectedOn || null,
      p_note: cleanOptional(input.note),
      p_items: items,
    }
  );

  if (error) throw error;
  if (typeof data !== "string") throw new Error("Comanda furnizor nu a putut fi creată.");
  return data;
}

export async function setPurchaseOrderStatus(
  organizationId: string,
  purchaseOrderId: string,
  next: "ordered" | "cancelled"
) {
  requireOrganizationId(organizationId);
  if (!purchaseOrderId.trim()) throw new Error("Comanda furnizor este obligatorie.");

  const allowedCurrent =
    next === "ordered" ? ["draft"] : ["draft", "ordered"];
  const patch =
    next === "ordered"
      ? { status: next, ordered_on: new Date().toISOString().slice(0, 10) }
      : { status: next };

  const { data, error } = await orbyvenSupabase
    .from("ops_purchase_orders")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", purchaseOrderId)
    .in("status", allowedCurrent)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Statusul comenzii s-a schimbat; reîncarcă datele.");
  }
}

export async function receivePurchaseOrderItem(
  organizationId: string,
  item: InventoryPurchaseItem,
  quantity: number,
  note?: string
) {
  requireOrganizationId(organizationId);
  if (!positiveQuantity(quantity)) throw new Error("Cantitatea recepționată nu este validă.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { error } = await orbyvenSupabase
    .from("ops_inventory_movements")
    .insert({
      organization_id: organizationId,
      material_id: item.material_id,
      purchase_order_id: item.purchase_order_id,
      purchase_order_item_id: item.id,
      movement_type: "receipt",
      quantity_delta: quantity,
      unit_cost_cents: item.unit_cost_cents,
      note: cleanOptional(note),
      created_by: authData.user?.id ?? null,
    });

  if (error) throw error;
}

export async function recordInventoryAdjustment(
  organizationId: string,
  input: {
    materialId: string;
    mode: "adjustment_in" | "adjustment_out";
    quantity: number;
    note?: string;
  }
) {
  requireOrganizationId(organizationId);
  if (!input.materialId.trim() || !positiveQuantity(input.quantity)) {
    throw new Error("Materialul și cantitatea sunt obligatorii.");
  }

  const materialResult = await orbyvenSupabase
    .from("ops_material_catalog")
    .select("unit_cost_cents")
    .eq("organization_id", organizationId)
    .eq("id", input.materialId)
    .single();
  if (materialResult.error || !materialResult.data) {
    throw new Error("Materialul nu este disponibil.");
  }

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { error } = await orbyvenSupabase
    .from("ops_inventory_movements")
    .insert({
      organization_id: organizationId,
      material_id: input.materialId,
      movement_type: input.mode,
      quantity_delta:
        input.mode === "adjustment_in" ? input.quantity : -input.quantity,
      unit_cost_cents: Number(materialResult.data.unit_cost_cents || 0),
      note: cleanOptional(input.note),
      created_by: authData.user?.id ?? null,
    });
  if (error) throw error;
}

export async function consumeInventoryForTask(
  organizationId: string,
  input: {
    materialId: string;
    taskId: string;
    quantity: number;
    note?: string;
  }
) {
  requireOrganizationId(organizationId);
  if (!input.materialId.trim() || !input.taskId.trim() || !positiveQuantity(input.quantity)) {
    throw new Error("Materialul, lucrarea/comanda și cantitatea sunt obligatorii.");
  }

  const materialResult = await orbyvenSupabase
    .from("ops_material_catalog")
    .select("unit_cost_cents")
    .eq("organization_id", organizationId)
    .eq("id", input.materialId)
    .single();
  if (materialResult.error || !materialResult.data) {
    throw new Error("Materialul nu este disponibil.");
  }

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { error } = await orbyvenSupabase
    .from("ops_inventory_movements")
    .insert({
      organization_id: organizationId,
      material_id: input.materialId,
      task_id: input.taskId,
      movement_type: "consumption",
      quantity_delta: -input.quantity,
      unit_cost_cents: Number(materialResult.data.unit_cost_cents || 0),
      note: cleanOptional(input.note),
      created_by: authData.user?.id ?? null,
    });
  if (error) throw error;
}

export async function loadTaskInventoryConsumption(
  organizationId: string,
  taskId: string
) {
  requireOrganizationId(organizationId);
  if (!taskId.trim()) throw new Error("task_id is required.");

  const rows = await readAllPages<{
    quantity_delta: number;
    unit_cost_cents: number;
  }>((from, to) =>
    orbyvenSupabase
      .from("ops_inventory_movements")
      .select("quantity_delta,unit_cost_cents")
      .eq("organization_id", organizationId)
      .eq("task_id", taskId)
      .eq("movement_type", "consumption")
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );

  return {
    count: rows.length,
    costCents: rows.reduce(
      (sum, row) =>
        sum +
        Math.round(Math.max(0, -Number(row.quantity_delta || 0)) * Number(row.unit_cost_cents || 0)),
      0
    ),
  };
}
