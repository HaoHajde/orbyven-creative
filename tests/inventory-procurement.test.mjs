import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  inventorySummary,
  projectInventoryGap,
  remainingPurchaseQuantity,
} from "../lib/inventory/projections.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("inventory gap subtracts stock and open procurement from confirmed demand", () => {
  const gap = projectInventoryGap({
    materialId: "m-1",
    name: "Țeavă PPR",
    unit: "m",
    unitCostCents: 450,
    preferredSupplierId: "s-1",
    onHand: 30,
    outstandingDemand: 100,
    onOrder: 20,
    reorderPoint: 10,
  });
  assert.equal(gap.shortage, 50);
  assert.equal(gap.projectedAfterDemand, -50);
  assert.equal(gap.suggestedOrder, 60);
  assert.equal(gap.state, "shortage");
  assert.equal(gap.stockValueCents, 13500);
});

test("reorder point can recommend replenishment without a hard shortage", () => {
  const gap = projectInventoryGap({
    materialId: "m-2",
    name: "Filtru",
    unit: "buc",
    unitCostCents: 1000,
    preferredSupplierId: null,
    onHand: 12,
    outstandingDemand: 8,
    onOrder: 0,
    reorderPoint: 10,
  });
  assert.equal(gap.shortage, 0);
  assert.equal(gap.suggestedOrder, 6);
  assert.equal(gap.state, "low");
});

test("purchase receipt remaining quantity never goes negative", () => {
  assert.equal(remainingPurchaseQuantity(10, 4), 6);
  assert.equal(remainingPurchaseQuantity(10, 12), 0);
});

test("inventory summary keeps stock valuation separate from procurement counts", () => {
  const gaps = [
    projectInventoryGap({
      materialId: "a", name: "A", unit: "buc", unitCostCents: 100,
      preferredSupplierId: null, onHand: 5, outstandingDemand: 0, onOrder: 0, reorderPoint: 2,
    }),
    projectInventoryGap({
      materialId: "b", name: "B", unit: "buc", unitCostCents: 200,
      preferredSupplierId: null, onHand: 0, outstandingDemand: 3, onOrder: 0, reorderPoint: 0,
    }),
  ];
  const summary = inventorySummary(gaps, 2);
  assert.equal(summary.trackedMaterials, 2);
  assert.equal(summary.shortageMaterials, 1);
  assert.equal(summary.openPurchaseOrders, 2);
  assert.equal(summary.stockValueCents, 500);
});

test("inventory is a PRO module and is not silently added to BUSINESS", () => {
  const billing = read("lib/billing/public-config.ts");
  assert.match(billing, /ALL_BILLING_MODULE_IDS[\s\S]*"inventory"/);
  const business = billing.match(/business:\s*\{[\s\S]*?entitlements:\s*\[([^\]]+)\]/)?.[1] ?? "";
  assert.doesNotMatch(business, /"inventory"/);
  assert.match(billing, /pro:[\s\S]*entitlements:\s*\[\.\.\.ALL_BILLING_MODULE_IDS\]/);
});

test("inventory service uses the shared material catalog and explicit movement ledger", () => {
  const service = read("lib/modules/inventory.ts");
  assert.match(service, /from\("ops_material_catalog"\)/);
  assert.match(service, /from\("ops_inventory_movements"\)/);
  assert.match(service, /from\("ops_purchase_orders"\)/);
  assert.match(service, /rpc\(\s*"inventory_create_purchase_order"/);
  assert.match(service, /movement_type: "consumption"/);
  assert.match(service, /movement_type: "receipt"/);
});

test("material requirements preserve shared catalog identity for procurement", () => {
  const actions = read("lib/ecosystem/actions.ts");
  assert.match(actions, /material_id:materialId/);
  assert.match(actions, /material_id:item\.material_id\?\?null/);
});

test("operational dossier and activity center consume inventory context", () => {
  const tasks = read("lib/modules/tasks.ts");
  const activity = read("lib/modules/activity.ts");
  assert.match(tasks, /loadTaskInventoryConsumption/);
  assert.match(tasks, /inventoryConsumedCents/);
  assert.match(activity, /ops_inventory_procurement_gaps/);
  assert.match(activity, /inventory_shortage/);
  assert.match(activity, /purchase_order_due/);
});


test("task material reservations are derived from accepted estimates without mutating physical stock", () => {
  const service = read("lib/modules/inventory.ts");
  const ui = read("components/modules/InventoryModule.tsx");
  const migration = read("supabase/migrations/20261001232500_wave4_inventory_reservations.sql");

  assert.match(service, /loadInventoryTaskMaterialPlan/);
  assert.match(service, /reserveAvailableInventoryForTask/);
  assert.match(service, /releaseInventoryReservation/);
  assert.match(service, /ops_inventory_task_material_plan/);
  assert.match(ui, /Materiale rezervate pe lucrare/);
  assert.match(ui, /Rezervă tot disponibilul/);
  assert.match(ui, /Eliberează rezervarea/);
  assert.match(migration, /create table if not exists public\.ops_inventory_reservations/i);
  assert.match(migration, /accepted_task_estimates/i);
  assert.match(migration, /estimate_id uuid not null/i);
  assert.match(migration, /r\.estimate_id = b\.estimate_id/i);
  assert.match(migration, /available_to_reserve/i);
  assert.match(migration, /shortage_after_reservation/i);
  assert.match(migration, /security_invoker = true/i);
  assert.match(migration, /inventory_reserve_task_stock/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
});

test("reserved stock is protected from unrelated task consumption", () => {
  const guard = read("supabase/migrations/20261001232600_wave4_inventory_reservation_guard.sql");
  assert.match(guard, /inventory_reservation_outflow_guard/i);
  assert.match(guard, /ops_inventory_task_material_plan/i);
  assert.match(guard, /p\.task_id <> new\.task_id/i);
  assert.match(guard, /current_stock \+ new\.quantity_delta < protected_for_other_tasks/i);
  assert.match(guard, /inventory_reserved_for_other_work/i);
  assert.match(read("lib/modules/inventory.ts"), /o parte din stoc este rezervată pentru alte lucrări/);
  assert.match(guard, /pg_advisory_xact_lock/i);
});

test("work readiness treats unreserved or missing materials as operational attention", () => {
  const readiness = read("lib/automation/work-readiness.ts");
  const tasksUi = read("components/modules/TasksModule.tsx");
  assert.match(readiness, /key: "materials"/);
  assert.match(readiness, /inventoryShortageLines/);
  assert.match(readiness, /inventoryUnreadyLines/);
  assert.match(readiness, /lipsă după rezervarea stocului disponibil/);
  assert.match(tasksUi, /poziții cu lipsă/);
  assert.match(tasksUi, /poziții de rezervat/);
});

test("procurement consolidates shopping by supplier and real work cost includes stock consumption", () => {
  const inventoryUi = read("components/modules/InventoryModule.tsx");
  const tasksData = read("lib/modules/tasks.ts");
  const tasksUi = read("components/modules/TasksModule.tsx");

  assert.match(inventoryUi, /Listă de cumpărături/);
  assert.match(inventoryUi, /prepareSupplierPurchase/);
  assert.match(inventoryUi, /estimatedCents/);
  assert.match(tasksData, /realOperationalCostCents/);
  assert.match(tasksData, /\(expensesCents \?\? 0\) \+ \(inventoryConsumedCents \?\? 0\)/);
  assert.match(tasksUi, /cheltuieli operative \+ .* consumuri stoc/);
});

test("Purchase Orders bridge directly to evidence and finance when those modules are enabled", () => {
  const inventoryUi = read("components/modules/InventoryModule.tsx");
  const workspace = read("components/WorkspaceContent.tsx");
  const navigation = read("lib/workspace-navigation.ts");
  assert.match(inventoryUi, /\+ Dovadă/);
  assert.match(inventoryUi, /Finanțe ↗/);
  assert.match(inventoryUi, /purchaseOrderId: order\.id/);
  assert.match(navigation, /purchaseOrderId\?: string/);
  assert.match(workspace, /initialPurchaseOrderId=\{intent\?\.purchaseOrderId\}/);
  assert.match(workspace, /InventoryModule[^\n]+enabledModules=\{enabledModules\}/);
});

test("production inventory migrations are exact and keep stock writes guarded", () => {
  const corePath = "supabase/migrations/20260930071344_alpha09_inventory_procurement_core.sql";
  const signalPath = "supabase/migrations/20260930071500_alpha09_inventory_automation_signal.sql";
  const hardeningPath = "supabase/migrations/20260930071644_alpha09_inventory_rls_rpc_hardening.sql";
  const core = read(corePath);
  const signal = read(signalPath);
  const hardening = read(hardeningPath);

  assert.match(core, /alter table public\.ops_inventory_movements enable row level security/i);
  assert.match(core, /pg_advisory_xact_lock/i);
  assert.match(core, /insufficient inventory/i);
  assert.match(core, /security_invoker = true/i);
  assert.match(core, /inventory adjustment requires manager/i);
  assert.match(signal, /suggested_order/i);
  assert.match(hardening, /alter function public\.inventory_create_purchase_order[\s\S]*security invoker/i);
  assert.match(hardening, /ops_purchase_orders_insert_manager/i);
  assert.match(hardening, /ops_purchase_order_items_insert_manager/i);

  assert.throws(() => read("supabase/migrations/20260930073000_alpha09_inventory_procurement_core.sql"));
  assert.throws(() => read("supabase/migrations/20260930074500_alpha09_inventory_automation_signal.sql"));
});

test("Wave 5 migration does not schema-qualify SQL special expressions", () => {
  const migration = read("supabase/migrations/20261001234500_wave5_procurement_finance_bridge.sql");
  assert.doesNotMatch(migration, /pg_catalog\.(?:coalesce|greatest|least)\s*\(/i);
  assert.match(migration, /create or replace view public\.ops_purchase_order_finance_status/i);
  assert.match(migration, /add column if not exists purchase_order_id uuid/i);
});
