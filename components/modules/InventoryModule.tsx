"use client";

import {
  consumeInventoryForTask,
  createInventorySupplier,
  createPurchaseOrder,
  loadInventorySnapshot,
  loadInventoryTaskMaterialPlan,
  receivePurchaseOrderItem,
  recordInventoryAdjustment,
  releaseInventoryReservation,
  reserveAvailableInventoryForTask,
  setPurchaseOrderStatus,
  updateInventoryMaterialSettings,
  type InventoryPurchaseItem,
  type InventorySnapshot,
  type InventoryTaskMaterialPlan,
} from "@/lib/modules/inventory";
import {
  inventorySummary,
  remainingPurchaseQuantity,
  type InventoryGap,
} from "@/lib/inventory/projections";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { useWorkspaceLiveContext } from "@/components/modules/useWorkspaceLiveContext";
import { ModuleNextAction, ModuleProgressiveMetrics } from "@/components/modules/ModuleKit";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  initialRecordId?: string;
  initialTaskId?: string;
};

type PurchaseLine = {
  key: number;
  materialId: string;
  quantity: string;
  costLei: string;
};

type MovementMode = "consumption" | "adjustment_in" | "adjustment_out";

const field =
  "h-10 min-w-0 w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-3 text-[12px] text-[var(--text)] outline-none focus:border-[var(--accent)]";
const button =
  "h-10 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 text-[11px] font-semibold transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40";
const primary =
  "h-10 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

function money(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function quantity(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 3,
  }).format(value);
}

function purchaseStatus(status: string) {
  if (status === "draft") return "Ciornă";
  if (status === "ordered") return "Comandată";
  if (status === "partially_received") return "Recepție parțială";
  if (status === "received") return "Recepționată";
  return "Anulată";
}

export default function InventoryModule({
  organizationId,
  locale,
  role,
  enabledModules,
  onOpenModule,
  initialRecordId,
  initialTaskId,
}: Props) {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [planTaskId, setPlanTaskId] = useState(initialTaskId ?? "");
  const [taskPlan, setTaskPlan] = useState<InventoryTaskMaterialPlan[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseTaskId, setPurchaseTaskId] = useState(initialTaskId ?? "");
  const [purchaseExpectedOn, setPurchaseExpectedOn] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    { key: 1, materialId: "", quantity: "1", costLei: "" },
  ]);
  const [lineKey, setLineKey] = useState(2);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementMode>("consumption");
  const [movementMaterialId, setMovementMaterialId] = useState(initialRecordId ?? "");
  const [movementTaskId, setMovementTaskId] = useState(initialTaskId ?? "");
  const [movementQuantity, setMovementQuantity] = useState("1");
  const [movementNote, setMovementNote] = useState("");
  useWorkspaceLiveContext({
    taskId: planTaskId || purchaseTaskId || movementTaskId || undefined,
  });

  const canWrite = role !== "viewer";
  const canProcure = ["owner", "admin", "manager"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await loadInventorySnapshot(organizationId));
    } catch (reason) {
      console.error(reason);
      setError("Stocul și achizițiile nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const loadTaskPlan = useCallback(async () => {
    if (!planTaskId) {
      setTaskPlan([]);
      return;
    }
    setPlanLoading(true);
    try {
      setTaskPlan(await loadInventoryTaskMaterialPlan(organizationId, planTaskId));
    } catch (reason) {
      console.error(reason);
      setError("Necesarul de materiale al lucrării nu a putut fi încărcat.");
      setTaskPlan([]);
    } finally {
      setPlanLoading(false);
    }
  }, [organizationId, planTaskId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTaskPlan(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTaskPlan]);

  const materials = useMemo(() => snapshot?.materials ?? [], [snapshot]);
  const trackedMaterials = materials.filter((item) => item.stock_tracked);
  const activeSuppliers = (snapshot?.suppliers ?? []).filter((item) => item.active);
  const stock = useMemo(() => snapshot?.stock ?? [], [snapshot]);
  const purchaseOrders = snapshot?.purchaseOrders ?? [];
  const purchaseItems = snapshot?.purchaseItems ?? [];
  const recentMovements = snapshot?.recentMovements ?? [];
  const tasks = useMemo(() => snapshot?.tasks ?? [], [snapshot]);

  const supplierById = useMemo(
    () => new Map((snapshot?.suppliers ?? []).map((item) => [item.id, item])),
    [snapshot]
  );
  const materialById = useMemo(
    () => new Map(materials.map((item) => [item.id, item])),
    [materials]
  );
  const taskById = useMemo(
    () => new Map(tasks.map((item) => [item.id, item])),
    [tasks]
  );
  const summary = useMemo(
    () => inventorySummary(stock, purchaseOrders.length),
    [stock, purchaseOrders.length]
  );

  const taskPlanSummary = useMemo(() => {
    const active = taskPlan.filter((item) => item.outstanding_quantity > 0);
    return {
      lines: taskPlan.length,
      ready: taskPlan.filter(
        (item) =>
          item.outstanding_quantity <= 0 ||
          item.reserved_quantity >= item.outstanding_quantity
      ).length,
      untracked: active.filter((item) => !item.stock_tracked).length,
      needsReservation: active.filter(
        (item) => item.stock_tracked && item.available_to_reserve > 0
      ).length,
      shortages: active.filter(
        (item) => item.stock_tracked && item.shortage_after_reservation > 0
      ).length,
    };
  }, [taskPlan]);

  const firstTaskShortage = useMemo(() => {
    const item = taskPlan.find((row) => row.outstanding_quantity > 0 && row.shortage_after_reservation > 0);
    if (!item) return null;
    const gap = stock.find((row) => row.materialId === item.material_id);
    return gap?.suggestedOrder ? { item, gap } : null;
  }, [taskPlan, stock]);

  const shoppingGroups = useMemo(() => {
    const grouped = new Map<string, InventoryGap[]>();
    for (const gap of stock) {
      const supplierId = gap.preferredSupplierId;
      if (
        gap.suggestedOrder <= 0 ||
        !supplierId ||
        !supplierById.get(supplierId)?.active
      ) continue;
      const rows = grouped.get(supplierId) ?? [];
      rows.push(gap);
      grouped.set(supplierId, rows);
    }
    return [...grouped.entries()].map(([supplierId, gaps]) => ({
      supplierId,
      gaps,
      estimatedCents: gaps.reduce(
        (sum, gap) => sum + Math.round(gap.suggestedOrder * gap.unitCostCents),
        0
      ),
    }));
  }, [stock, supplierById]);
  const unassignedShoppingCount = stock.filter((gap) => {
    if (gap.suggestedOrder <= 0) return false;
    return !gap.preferredSupplierId || !supplierById.get(gap.preferredSupplierId)?.active;
  }).length;

  const run = async (operation: () => Promise<unknown>, success: string) => {
    if (busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(success);
      await load();
      return true;
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Acțiunea nu a reușit.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const activateStock = async (materialId: string) => {
    const material = materialById.get(materialId);
    if (!material) return;
    const ok = await run(
      () =>
        updateInventoryMaterialSettings(organizationId, materialId, {
          stockTracked: true,
          reorderPoint: Number(material.reorder_point || 0),
          preferredSupplierId: material.preferred_supplier_id,
          sku: material.sku,
        }),
      "Materialul este urmărit acum în stoc."
    );
    if (ok && planTaskId) await loadTaskPlan();
  };

  const changeMaterialSettings = async (
    materialId: string,
    reorderPoint: number,
    supplierId: string,
    sku: string
  ) => {
    const material = materialById.get(materialId);
    if (!material || !material.stock_tracked) return;
    await run(
      () =>
        updateInventoryMaterialSettings(organizationId, materialId, {
          stockTracked: true,
          reorderPoint,
          preferredSupplierId: supplierId || null,
          sku,
        }),
      "Setările de stoc au fost actualizate."
    );
  };

  const createSupplier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await run(
      () =>
        createInventorySupplier(organizationId, {
          name: supplierName,
          contactName: supplierContact,
          email: supplierEmail,
          phone: supplierPhone,
        }),
      "Furnizor salvat."
    );
    if (ok) {
      setSupplierName("");
      setSupplierContact("");
      setSupplierEmail("");
      setSupplierPhone("");
      setSupplierOpen(false);
    }
  };

  const updatePurchaseLine = (
    key: number,
    patch: Partial<Pick<PurchaseLine, "materialId" | "quantity" | "costLei">>
  ) => {
    setPurchaseLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (patch.materialId !== undefined) {
          const material = materialById.get(patch.materialId);
          next.costLei = material ? String(material.unit_cost_cents / 100) : "";
        }
        return next;
      })
    );
  };

  const addPurchaseLine = () => {
    setPurchaseLines((current) => [
      ...current,
      { key: lineKey, materialId: "", quantity: "1", costLei: "" },
    ]);
    setLineKey((value) => value + 1);
  };

  const prepareSupplierPurchase = (supplierId: string, gaps: InventoryGap[]) => {
    setPurchaseSupplierId(supplierId);
    setPurchaseTaskId("");
    setPurchaseExpectedOn("");
    setPurchaseNote("Listă de cumpărături generată din necesarul consolidat ORBYVEN.");
    setPurchaseLines(
      gaps.map((gap, index) => ({
        key: lineKey + index,
        materialId: gap.materialId,
        quantity: String(gap.suggestedOrder),
        costLei: String(gap.unitCostCents / 100),
      }))
    );
    setLineKey((value) => value + gaps.length);
    setPurchaseOpen(true);
    window.setTimeout(() => {
      document
        .querySelector('[data-inventory-purchase-form="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const reserveTaskStock = async (materialId?: string) => {
    if (!planTaskId) return;
    const ok = await run(
      () => reserveAvailableInventoryForTask(organizationId, planTaskId, materialId || null),
      materialId ? "Stocul disponibil a fost rezervat pentru material." : "Stocul disponibil a fost rezervat pentru lucrare."
    );
    if (ok) await loadTaskPlan();
  };

  const releaseTaskStock = async (materialId: string) => {
    if (!planTaskId) return;
    const ok = await run(
      () => releaseInventoryReservation(organizationId, planTaskId, materialId),
      "Rezervarea a fost eliberată."
    );
    if (ok) await loadTaskPlan();
  };

  const prepareTaskShortagePurchase = (
    item: InventoryTaskMaterialPlan,
    gap: InventoryGap
  ) => {
    const taskQuantity = Math.min(
      item.shortage_after_reservation,
      gap.suggestedOrder
    );
    if (taskQuantity <= 0) return;
    const supplierId =
      gap.preferredSupplierId && supplierById.get(gap.preferredSupplierId)?.active
        ? gap.preferredSupplierId
        : "";
    setPurchaseSupplierId(supplierId);
    setPurchaseTaskId(planTaskId);
    setPurchaseExpectedOn("");
    setPurchaseNote("Necesar de cumpărat pentru " + (taskById.get(planTaskId)?.title || "lucrare") + ".");
    setPurchaseLines([{
      key: lineKey,
      materialId: item.material_id,
      quantity: String(taskQuantity),
      costLei: String(item.unit_cost_cents / 100),
    }]);
    setLineKey((value) => value + 1);
    setPurchaseOpen(true);
    window.setTimeout(() => {
      document
        .querySelector('[data-inventory-purchase-form="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const prepareGapPurchase = (gap: InventoryGap, taskId = "") => {
    const supplierId =
      gap.preferredSupplierId && supplierById.get(gap.preferredSupplierId)?.active
        ? gap.preferredSupplierId
        : "";
    setPurchaseSupplierId(supplierId);
    setPurchaseTaskId(taskId);
    setPurchaseExpectedOn("");
    setPurchaseNote("Necesar generat din stoc și cererea confirmată.");
    setPurchaseLines([
      {
        key: lineKey,
        materialId: gap.materialId,
        quantity: String(gap.suggestedOrder),
        costLei: String(gap.unitCostCents / 100),
      },
    ]);
    setLineKey((value) => value + 1);
    setPurchaseOpen(true);
    window.setTimeout(() => {
      document
        .querySelector('[data-inventory-purchase-form="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const submitPurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lines = purchaseLines
      .filter((line) => line.materialId)
      .map((line) => ({
        materialId: line.materialId,
        quantity: Number(line.quantity),
        unitCostCents: Math.round(Number(line.costLei) * 100),
      }));

    const ok = await run(
      () =>
        createPurchaseOrder(organizationId, {
          supplierId: purchaseSupplierId,
          taskId: purchaseTaskId || null,
          expectedOn: purchaseExpectedOn || null,
          note: purchaseNote,
          items: lines,
        }),
      "Comanda furnizor a fost creată ca ciornă."
    );
    if (ok) {
      setPurchaseOpen(false);
      setPurchaseSupplierId("");
      setPurchaseTaskId(initialTaskId ?? "");
      setPurchaseExpectedOn("");
      setPurchaseNote("");
      setPurchaseLines([{ key: lineKey, materialId: "", quantity: "1", costLei: "" }]);
      setLineKey((value) => value + 1);
    }
  };

  const receiveRemaining = async (item: InventoryPurchaseItem) => {
    const remaining = remainingPurchaseQuantity(
      item.ordered_quantity,
      item.received_quantity
    );
    if (remaining <= 0) return;
    await run(
      () => receivePurchaseOrderItem(organizationId, item, remaining),
      "Recepția a fost înregistrată în stoc."
    );
  };

  const submitMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (movementMode !== "consumption" && !canProcure) {
      setError("Ajustările manuale de stoc sunt disponibile doar rolurilor manageriale.");
      return;
    }
    const amount = Number(movementQuantity);
    const ok = await run(
      () =>
        movementMode === "consumption"
          ? consumeInventoryForTask(organizationId, {
              materialId: movementMaterialId,
              taskId: movementTaskId,
              quantity: amount,
              note: movementNote,
            })
          : recordInventoryAdjustment(organizationId, {
              materialId: movementMaterialId,
              mode: movementMode,
              quantity: amount,
              note: movementNote,
            }),
      movementMode === "consumption"
        ? "Consumul a fost legat de lucrare/comandă."
        : "Ajustarea de stoc a fost înregistrată."
    );
    if (ok) {
      if (movementMode === "consumption" && planTaskId === movementTaskId) {
        await loadTaskPlan();
      }
      setMovementQuantity("1");
      setMovementNote("");
      setMovementOpen(false);
    }
  };

  if (loading && !snapshot) {
    return <div className="pb-24 text-sm text-[var(--muted)]">Se încarcă stocul…</div>;
  }

  return (
    <div className="pb-24 md:pb-8">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Operations · Inventory Core
          </p>
          <h1 className="mt-2.5 text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[42px]">
            Stoc & achiziții
          </h1>
          <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-[var(--muted)]">
            Necesarul confirmat, stocul real, comenzile către furnizori, recepțiile
            și consumul pe lucrare folosesc aceeași bibliotecă de materiale.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canProcure && trackedMaterials.length > 0 && activeSuppliers.length > 0 ? (
            <button type="button" onClick={() => setPurchaseOpen((value) => !value)} className={primary}>
              {purchaseOpen ? "Închide comanda" : "+ Comandă furnizor"}
            </button>
          ) : canWrite && trackedMaterials.length > 0 ? (
            <button type="button" onClick={() => setMovementOpen((value) => !value)} className={primary}>
              {movementOpen ? "Închide mișcarea" : "+ Mișcare stoc"}
            </button>
          ) : canProcure ? (
            <button type="button" onClick={() => setSupplierOpen((value) => !value)} className={primary}>
              {supplierOpen ? "Închide furnizorul" : "+ Furnizor"}
            </button>
          ) : null}
          {(canWrite || canProcure) ? (
            <details className="relative">
              <summary className={button + " flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden"}>Alte acțiuni</summary>
              <div className="absolute right-0 top-11 z-30 min-w-[190px] space-y-1 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                {canWrite && trackedMaterials.length > 0 ? <button type="button" onClick={() => setMovementOpen((value) => !value)} className="w-full rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold hover:bg-[var(--surface-2)]">Mișcare stoc</button> : null}
                {canProcure ? <button type="button" onClick={() => setSupplierOpen((value) => !value)} className="w-full rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold hover:bg-[var(--surface-2)]">Furnizor nou</button> : null}
                {canProcure && trackedMaterials.length > 0 && activeSuppliers.length > 0 ? <button type="button" onClick={() => setPurchaseOpen((value) => !value)} className="w-full rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold hover:bg-[var(--surface-2)]">Comandă furnizor</button> : null}
              </div>
            </details>
          ) : null}
        </div>
      </section>

      <ModuleProgressiveMetrics
        className="mt-8"
        primary={<>
          <Metric label="Atenție" value={String(summary.lowOrShort)} note="sub prag / lipsă" />
          <Metric label="Lipsuri reale" value={String(summary.shortageMaterials)} note="cerere confirmată" />
          <Metric label="PO deschise" value={String(summary.openPurchaseOrders)} note="furnizori" />
        </>}
        secondary={<>
          <Metric label="Materiale urmărite" value={String(summary.trackedMaterials)} note="stoc activ" />
          <Metric label="Valoare stoc" value={money(summary.stockValueCents, locale)} note="estimare operațională" />
        </>}
      />

      {error ? (
        <p role="alert" className="mt-4 rounded-[15px] border border-rose-400/25 bg-rose-400/[0.06] px-4 py-3 text-xs text-rose-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 rounded-[15px] border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-xs text-emerald-300">
          {notice}
        </p>
      ) : null}

      {supplierOpen && canProcure ? (
        <form onSubmit={(event) => void createSupplier(event)} className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Furnizor nou</p>
              <h2 className="mt-1 text-lg font-semibold">Datele de bază, fără birocrație.</h2>
            </div>
            <button type="button" onClick={() => setSupplierOpen(false)} className="text-xs text-[var(--muted)]">Închide</button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <input required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nume furnizor" className={field} />
            <input value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} placeholder="Persoană contact" className={field} />
            <input type="email" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="Email" className={field} />
            <input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="Telefon" className={field} />
          </div>
          <div className="mt-3 flex justify-end"><button disabled={busy} className={primary}>Salvează furnizor</button></div>
        </form>
      ) : null}

      {purchaseOpen && canProcure ? (
        <form data-inventory-purchase-form="true" onSubmit={(event) => void submitPurchase(event)} className="mt-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Purchase Order</p>
              <h2 className="mt-1 text-lg font-semibold">Comandă internă către furnizor.</h2>
              <p className="mt-1 text-[10px] text-[var(--muted)]">Document operațional intern; nu este document fiscal.</p>
            </div>
            <button type="button" onClick={() => setPurchaseOpen(false)} className="text-xs text-[var(--muted)]">Închide</button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <select required value={purchaseSupplierId} onChange={(e) => setPurchaseSupplierId(e.target.value)} className={field}>
              <option value="">Alege furnizorul</option>
              {activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <select value={purchaseTaskId} onChange={(e) => setPurchaseTaskId(e.target.value)} className={field}>
              <option value="">Fără lucrare/comandă specifică</option>
              {tasks.map((task) => <option key={task.id} value={task.id}>{task.kind === "order" ? "Comandă" : "Lucrare"} · {task.title}</option>)}
            </select>
            <input type="date" value={purchaseExpectedOn} onChange={(e) => setPurchaseExpectedOn(e.target.value)} className={field} aria-label="Data estimată de livrare" />
          </div>
          <div className="mt-3 space-y-2">
            {purchaseLines.map((line, index) => (
              <div key={line.key} className="grid gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-3 md:grid-cols-[1.5fr_0.6fr_0.7fr_auto]">
                <select required value={line.materialId} onChange={(e) => updatePurchaseLine(line.key, { materialId: e.target.value })} className={field}>
                  <option value="">Material</option>
                  {trackedMaterials.map((material) => <option key={material.id} value={material.id}>{material.name} · {material.unit}</option>)}
                </select>
                <input required min="0.001" step="any" type="number" value={line.quantity} onChange={(e) => updatePurchaseLine(line.key, { quantity: e.target.value })} className={field} aria-label={"Cantitate poziția " + (index + 1)} />
                <input required min="0" step="0.01" type="number" value={line.costLei} onChange={(e) => updatePurchaseLine(line.key, { costLei: e.target.value })} className={field} aria-label={"Cost unitar poziția " + (index + 1)} />
                <button type="button" disabled={purchaseLines.length === 1} onClick={() => setPurchaseLines((current) => current.filter((item) => item.key !== line.key))} className={button}>×</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={addPurchaseLine} className={button}>+ Poziție</button>
            <input value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)} placeholder="Notă internă (opțional)" className={field + " flex-1"} />
            <button disabled={busy || !purchaseSupplierId} className={primary}>Creează ciorna PO</button>
          </div>
        </form>
      ) : null}

      {movementOpen && canWrite ? (
        <form onSubmit={(event) => void submitMovement(event)} className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <select value={movementMode} onChange={(e) => setMovementMode(e.target.value as MovementMode)} className={field}>
              <option value="consumption">Consum pe lucrare/comandă</option>
              {canProcure ? <option value="adjustment_in">Ajustare + stoc</option> : null}
              {canProcure ? <option value="adjustment_out">Ajustare - stoc</option> : null}
            </select>
            <select required value={movementMaterialId} onChange={(e) => setMovementMaterialId(e.target.value)} className={field}>
              <option value="">Material</option>
              {trackedMaterials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
            </select>
            <select required={movementMode === "consumption"} disabled={movementMode !== "consumption"} value={movementTaskId} onChange={(e) => setMovementTaskId(e.target.value)} className={field}>
              <option value="">Lucrare / comandă</option>
              {tasks.map((task) => <option key={task.id} value={task.id}>{task.kind === "order" ? "Comandă" : "Lucrare"} · {task.title}</option>)}
            </select>
            <input required type="number" min="0.001" step="any" value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} placeholder="Cantitate" className={field} />
            <button disabled={busy || !movementMaterialId || (movementMode === "consumption" && !movementTaskId)} className={primary}>
              Înregistrează
            </button>
          </div>
          <input value={movementNote} onChange={(e) => setMovementNote(e.target.value)} placeholder="Notă / motiv ajustare (opțional)" className={field + " mt-2"} />
          <p className="mt-2 text-[10px] text-[var(--muted-2)]">Ieșirile sunt refuzate la nivel de bază de date dacă ar duce stocul sub zero.</p>
        </form>
      ) : null}

      <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Work Material Readiness</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Materiale rezervate pe lucrare</h2>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[var(--muted)]">Necesarul vine din ultima ofertă acceptată. Rezervarea blochează disponibilul operațional pentru lucrare fără să modifice stocul fizic.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={planTaskId} onChange={(event) => setPlanTaskId(event.target.value)} className={field + " min-w-[220px]"} aria-label="Lucrare pentru rezervarea materialelor">
              <option value="">Alege lucrarea / comanda</option>
              {tasks.map((task) => <option key={task.id} value={task.id}>{task.kind === "order" ? "Comandă" : "Lucrare"} · {task.title}</option>)}
            </select>
            {canWrite && planTaskId && taskPlanSummary.needsReservation > 0 ? (
              <button type="button" disabled={busy || planLoading} onClick={() => void reserveTaskStock()} className={primary}>Rezervă tot disponibilul</button>
            ) : null}
          </div>
        </div>

        {planTaskId ? (
          planLoading ? (
            <p className="mt-4 text-xs text-[var(--muted)]">Se calculează necesarul și disponibilul…</p>
          ) : taskPlan.length ? (
            <>
              <div className="mt-4">
                {taskPlanSummary.shortages > 0 && firstTaskShortage && canProcure ? (
                  <ModuleNextAction
                    title="Cumpără materialele lipsă"
                    description={`${taskPlanSummary.shortages} poziții rămân neacoperite după stocul disponibil.`}
                    action={<button type="button" disabled={busy} onClick={() => prepareTaskShortagePurchase(firstTaskShortage.item, firstTaskShortage.gap)} className={primary}>Pregătește cumpărarea →</button>}
                  />
                ) : taskPlanSummary.needsReservation > 0 && canWrite ? (
                  <ModuleNextAction
                    title="Rezervă stocul disponibil"
                    description={`${taskPlanSummary.needsReservation} poziții pot fi acoperite acum fără cumpărare.`}
                    action={<button type="button" disabled={busy || planLoading} onClick={() => void reserveTaskStock()} className={primary}>Rezervă tot →</button>}
                  />
                ) : (
                  <ModuleNextAction
                    title={taskPlanSummary.untracked > 0 ? "Stocul urmărit nu are blocaje" : "Materialele sunt pregătite"}
                    description={taskPlanSummary.untracked > 0
                      ? `${taskPlanSummary.untracked} poziții nu folosesc stoc tracking și rămân de verificat manual. ORBYVEN nu le blochează automat; poți continua cu programarea.`
                      : "Necesarul urmărit este rezervat sau deja consumat. Lucrarea poate trece la programare."}
                    action={canWrite && enabledModules.includes("calendar") ? (
                      <button
                        type="button"
                        onClick={() => onOpenModule("calendar", {
                          create: true,
                          taskId: planTaskId,
                          clientId: taskById.get(planTaskId)?.client_id ?? undefined,
                        })}
                        className={primary}
                      >
                        Programează execuția →
                      </button>
                    ) : undefined}
                  />
                )}
              </div>
              <details className="group mt-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/40">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[10px] font-semibold text-[var(--muted)] [&::-webkit-details-marker]:hidden">
                  <span>Vezi calculele materialelor</span><span className="transition group-open:rotate-45">+</span>
                </summary>
                <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] p-3 lg:grid-cols-4">
                  <MiniMetric label="Poziții necesar" value={String(taskPlanSummary.lines)} />
                  <MiniMetric label="Acoperite" value={String(taskPlanSummary.ready)} />
                  <MiniMetric label="De rezervat" value={String(taskPlanSummary.needsReservation)} />
                  <MiniMetric label="Cu lipsă" value={String(taskPlanSummary.shortages)} />
                </div>
              </details>
              {taskPlanSummary.untracked > 0 ? (
                <p className="mt-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/45 px-3 py-2 text-[10px] leading-4 text-[var(--muted)]">
                  {taskPlanSummary.untracked} poziții au stoc tracking oprit. Ele rămân vizibile în necesar, dar ORBYVEN nu presupune automat că sunt disponibile sau lipsă.
                </p>
              ) : null}
              <div className="mt-4 grid gap-2 lg:grid-cols-2">
                {taskPlan.map((item) => {
                  const gap = stock.find((row) => row.materialId === item.material_id);
                  const fullyConsumed = item.outstanding_quantity <= 0;
                  const fullyReserved = item.outstanding_quantity > 0 && item.reserved_quantity >= item.outstanding_quantity;
                  return (
                    <article key={item.material_id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="mt-1 text-[10px] text-[var(--muted)]">
                            Necesar {quantity(item.required_quantity)} {item.unit} · consumat {quantity(item.consumed_quantity)} · rezervat {quantity(item.reserved_quantity)}
                          </p>
                        </div>
                        <span className={"rounded-full border px-2.5 py-1 text-[9px] font-semibold " + (
                          fullyConsumed ? "border-emerald-400/25 text-emerald-300" :
                          fullyReserved ? "border-emerald-400/25 text-emerald-300" :
                          !item.stock_tracked ? "border-[var(--border)] text-[var(--muted)]" :
                          item.shortage_after_reservation > 0 ? "border-rose-400/25 text-rose-300" :
                          "border-amber-400/25 text-amber-300"
                        )}>
                          {fullyConsumed ? "Consum complet" :
                           fullyReserved ? "Rezervat" :
                           !item.stock_tracked ? "Stoc inactiv" :
                           item.shortage_after_reservation > 0 ? "Lipsă " + quantity(item.shortage_after_reservation) + " " + item.unit :
                           "Disponibil"}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-[var(--muted)] sm:grid-cols-4">
                        <span>Stoc <strong className="block text-[var(--text)]">{quantity(item.on_hand)}</strong></span>
                        <span>Liber <strong className="block text-[var(--text)]">{quantity(item.available_unreserved)}</strong></span>
                        <span>Rezervat altora <strong className="block text-[var(--text)]">{quantity(item.reserved_elsewhere)}</strong></span>
                        <span>Pe drum <strong className="block text-[var(--text)]">{quantity(item.on_order)}</strong></span>
                      </div>
                      {canWrite ? (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                          {!item.stock_tracked && canProcure ? <button type="button" disabled={busy} onClick={() => void activateStock(item.material_id)} className={button}>Activează stoc</button> : null}
                          {item.stock_tracked && item.available_to_reserve > 0 ? <button type="button" disabled={busy} onClick={() => void reserveTaskStock(item.material_id)} className={primary}>Rezervă {quantity(item.available_to_reserve)}</button> : null}
                          {item.reserved_quantity > 0 ? <button type="button" disabled={busy} onClick={() => void releaseTaskStock(item.material_id)} className={button}>Eliberează rezervarea</button> : null}
                          {canProcure && item.shortage_after_reservation > 0 && gap?.suggestedOrder ? <button type="button" disabled={busy} onClick={() => prepareTaskShortagePurchase(item, gap)} className={button}>Pregătește cumpărarea →</button> : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-4">
              <ModuleNextAction
                title="Nu există necesar material confirmat"
                description="Nu există un blocaj material în acest moment. Dacă lucrarea este pregătită operațional, poți continua cu programarea."
                action={canWrite && enabledModules.includes("calendar") ? (
                  <button
                    type="button"
                    onClick={() => onOpenModule("calendar", {
                      create: true,
                      taskId: planTaskId,
                      clientId: taskById.get(planTaskId)?.client_id ?? undefined,
                    })}
                    className={primary}
                  >
                    Programează →
                  </button>
                ) : undefined}
              />
            </div>
          )
        ) : (
          <div className="mt-4 rounded-[16px] border border-dashed border-[var(--border)] px-4 py-7 text-center">
            <p className="text-sm font-semibold">Alege o lucrare pentru a vedea material readiness.</p>
            <p className="mt-1 text-[10px] text-[var(--muted)]">ORBYVEN compară necesarul acceptat cu consumul, rezervările și stocul liber.</p>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Procurement Signals</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Ce trebuie cumpărat</h2>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Doar necesarul din devize acceptate, minus consumul, stocul și cantitatea deja comandată.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || busy} className={button}>↻ Actualizează</button>
        </div>

        {shoppingGroups.length || unassignedShoppingCount ? (
          <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]/45 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Listă de cumpărături</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">Lipsurile sunt grupate automat pe furnizorul preferat.</p>
              </div>
              {unassignedShoppingCount ? <span className="rounded-full border border-amber-400/25 px-2.5 py-1 text-[9px] font-semibold text-amber-300">{unassignedShoppingCount} fără furnizor</span> : null}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {shoppingGroups.map((group) => {
                const supplier = supplierById.get(group.supplierId);
                return (
                  <div key={group.supplierId} className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold">{supplier?.name ?? "Furnizor"}</p>
                        <p className="mt-1 text-[9px] text-[var(--muted)]">{group.gaps.length} poziții · aprox. {money(group.estimatedCents, locale)}</p>
                      </div>
                      {canProcure ? <button type="button" disabled={busy} onClick={() => prepareSupplierPurchase(group.supplierId, group.gaps)} className="text-[9px] font-semibold text-[var(--accent)]">Pregătește PO →</button> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {stock.filter((item) => item.suggestedOrder > 0).map((gap) => (
            <article key={gap.materialId} className="rounded-[16px] border border-amber-400/20 bg-amber-400/[0.045] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{gap.name}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    Cerere {quantity(gap.outstandingDemand)} {gap.unit} · stoc {quantity(gap.onHand)} · pe drum {quantity(gap.onOrder)}
                  </p>
                </div>
                <span className="rounded-full border border-amber-400/25 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                  +{quantity(gap.suggestedOrder)} {gap.unit}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                <span className="text-[10px] text-[var(--muted)]">
                  {gap.preferredSupplierId ? supplierById.get(gap.preferredSupplierId)?.name ?? "Furnizor preferat" : "Fără furnizor preferat"}
                </span>
                {canProcure ? <button type="button" onClick={() => prepareGapPurchase(gap)} className={button}>Pregătește PO →</button> : null}
              </div>
            </article>
          ))}
          {!stock.some((item) => item.suggestedOrder > 0) ? (
            <div className="lg:col-span-2 rounded-[16px] border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm font-semibold">Nu există lipsuri de aprovizionare.</p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">Stocul + comenzile existente acoperă cererea confirmată și pragurile configurate.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Stock Ledger</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Materiale</h2>
            </div>
            <button type="button" onClick={() => onOpenModule("estimates")} className="text-[10px] font-semibold text-[var(--accent)]">Biblioteca materiale ↗</button>
          </div>
          <div className="mt-4 space-y-2">
            {stock.map((item) => {
              const material = materialById.get(item.materialId);
              if (!material) return null;
              const focused = initialRecordId === material.id;
              return (
                <div key={material.id} data-workspace-record-focus={focused ? "true" : undefined} className={"scroll-mt-28 rounded-[15px] border p-3 " + (focused ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-2)]/45")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold">{material.name}</p>
                      <p className="mt-1 text-[10px] text-[var(--muted)]">{material.sku ? material.sku + " · " : ""}{money(material.unit_cost_cents, locale)} / {material.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold tabular-nums">{quantity(item.onHand)} {item.unit}</p>
                      <p className={"mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] " + (item.state === "shortage" ? "text-rose-400" : item.state === "low" ? "text-amber-300" : "text-emerald-300")}>
                        {item.state === "shortage" ? "Lipsă" : item.state === "low" ? "Sub prag" : "OK"}
                      </p>
                    </div>
                  </div>
                  {canProcure ? (
                    <div className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 sm:grid-cols-3">
                      <label className="text-[9px] text-[var(--muted)]">Prag minim
                        <input key={material.id + "-reorder-" + material.reorder_point} type="number" min="0" step="any" defaultValue={material.reorder_point} className={field} onBlur={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next) && next !== material.reorder_point) void changeMaterialSettings(material.id, next, material.preferred_supplier_id ?? "", material.sku ?? "");
                        }} />
                      </label>
                      <label className="text-[9px] text-[var(--muted)]">Furnizor preferat
                        <select value={material.preferred_supplier_id ?? ""} onChange={(event) => void changeMaterialSettings(material.id, material.reorder_point, event.target.value, material.sku ?? "")} className={field}>
                          <option value="">Nesetat</option>
                          {activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                        </select>
                      </label>
                      <label className="text-[9px] text-[var(--muted)]">SKU intern
                        <input key={material.id + "-sku-" + (material.sku ?? "")} defaultValue={material.sku ?? ""} onBlur={(event) => {
                          const next = event.target.value.trim();
                          if (next !== (material.sku ?? "")) void changeMaterialSettings(material.id, material.reorder_point, material.preferred_supplier_id ?? "", next);
                        }} className={field} />
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {materials.filter((item) => !item.stock_tracked).map((material) => (
              <div key={material.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-dashed border-[var(--border)] px-3 py-3">
                <div className="min-w-0"><p className="truncate text-[11px] font-semibold">{material.name}</p><p className="mt-1 text-[9px] text-[var(--muted)]">În bibliotecă, dar stocul nu este urmărit.</p></div>
                {canProcure ? <button type="button" disabled={busy} onClick={() => void activateStock(material.id)} className={button}>Activează stoc</button> : null}
              </div>
            ))}
            {!materials.length ? <p className="py-8 text-center text-xs text-[var(--muted)]">Biblioteca de materiale este goală. Adaugă materiale din Oferte.</p> : null}
          </div>
        </article>

        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Ledger recent</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Mișcări</h2>
          <div className="mt-4 space-y-2">
            {recentMovements.slice(0, 14).map((movement) => {
              const material = materialById.get(movement.material_id);
              const task = movement.task_id ? taskById.get(movement.task_id) : null;
              return <div key={movement.id} className="rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/45 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-[11px] font-semibold">{material?.name ?? "Material"}</span><span className={"text-[11px] font-semibold tabular-nums " + (movement.quantity_delta > 0 ? "text-emerald-300" : "text-amber-300")}>{movement.quantity_delta > 0 ? "+" : ""}{quantity(movement.quantity_delta)}</span></div>
                <p className="mt-1 truncate text-[9px] text-[var(--muted)]">{movement.movement_type}{task ? " · " + task.title : ""}</p>
              </div>;
            })}
            {!recentMovements.length ? <p className="py-8 text-center text-xs text-[var(--muted)]">Nu există încă mișcări de stoc.</p> : null}
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Procurement</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Comenzi furnizor</h2>
          </div>
          <span className="text-[10px] text-[var(--muted)]">{purchaseOrders.length} deschise</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {purchaseOrders.map((order) => {
            const items = purchaseItems.filter((item) => item.purchase_order_id === order.id);
            const supplier = supplierById.get(order.supplier_id);
            return <article key={order.id} className="rounded-[17px] border border-[var(--border)] bg-[var(--surface-2)]/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[12px] font-semibold">{order.reference}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">{supplier?.name ?? "Furnizor"}{order.expected_on ? " · estimat " + order.expected_on : ""}</p></div>
                <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[9px] font-semibold">{purchaseStatus(order.status)}</span>
              </div>
              <div className="mt-3 space-y-2">
                {items.map((item) => {
                  const remaining = remainingPurchaseQuantity(item.ordered_quantity, item.received_quantity);
                  return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
                    <div className="min-w-0"><p className="truncate text-[10px] font-semibold">{item.description}</p><p className="mt-0.5 text-[9px] text-[var(--muted)]">{quantity(item.received_quantity)} / {quantity(item.ordered_quantity)} {item.unit} recepționat</p></div>
                    {canWrite && ["ordered", "partially_received"].includes(order.status) && remaining > 0 ? <button type="button" disabled={busy} onClick={() => void receiveRemaining(item)} className="text-[9px] font-semibold text-[var(--accent)]">Recepționează {quantity(remaining)} →</button> : null}
                  </div>;
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
                {canProcure && order.status === "draft" ? (
                  <button type="button" disabled={busy} onClick={() => void run(() => setPurchaseOrderStatus(organizationId, order.id, "ordered"), "Comanda a fost marcată transmisă furnizorului.")} className={primary}>Marchează comandată →</button>
                ) : order.status === "received" && enabledModules.includes("documents") ? (
                  <button type="button" onClick={() => onOpenModule("documents", { create: true, taskId: order.task_id ?? undefined, purchaseOrderId: order.id })} className={primary}>+ Dovadă</button>
                ) : order.status === "received" && canProcure && enabledModules.includes("expenses") ? (
                  <button type="button" onClick={() => onOpenModule("expenses", { create: true, taskId: order.task_id ?? undefined, purchaseOrderId: order.id })} className={primary}>Finanțe →</button>
                ) : null}
                {(enabledModules.includes("documents") || (canProcure && enabledModules.includes("expenses")) || (canProcure && ["draft", "ordered"].includes(order.status))) ? (
                  <details className="relative">
                    <summary className={button + " flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden"}>Alte acțiuni</summary>
                    <div className="absolute bottom-11 right-0 z-30 min-w-[180px] space-y-1 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                      {enabledModules.includes("documents") && order.status !== "received" ? <button type="button" onClick={() => onOpenModule("documents", { create: true, taskId: order.task_id ?? undefined, purchaseOrderId: order.id })} className="w-full rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold hover:bg-[var(--surface-2)]">+ Dovadă</button> : null}
                      {canProcure && enabledModules.includes("expenses") && ["ordered","partially_received","received"].includes(order.status) && !(order.status === "received" && !enabledModules.includes("documents")) ? <button type="button" onClick={() => onOpenModule("expenses", { create: true, taskId: order.task_id ?? undefined, purchaseOrderId: order.id })} className="w-full rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold hover:bg-[var(--surface-2)]">Finanțe ↗</button> : null}
                      {canProcure && ["draft", "ordered"].includes(order.status) ? <button type="button" disabled={busy} onClick={() => {
                        if (window.confirm("Anulezi această comandă furnizor?")) void run(() => setPurchaseOrderStatus(organizationId, order.id, "cancelled"), "Comanda a fost anulată.");
                      }} className="w-full rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold text-rose-400 hover:bg-[var(--surface-2)] disabled:opacity-40">Anulează</button> : null}
                    </div>
                  </details>
                ) : null}
              </div>
            </article>;
          })}
          {!purchaseOrders.length ? <div className="lg:col-span-2 rounded-[16px] border border-dashed border-[var(--border)] px-4 py-8 text-center"><p className="text-sm font-semibold">Nu există comenzi furnizor deschise.</p><p className="mt-1 text-[10px] text-[var(--muted)]">Creează una manual sau pornește dintr-un semnal de lipsă.</p></div> : null}
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
        <p className="text-[10px] leading-5 text-[var(--muted)]">
          Stocul ORBYVEN este un registru operațional. Recepțiile actualizează costul curent al materialului pentru calculele viitoare, dar nu modifică retroactiv devizele existente și nu înlocuiesc contabilitatea.
        </p>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 truncate text-[22px] font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[9px] text-[var(--muted)]">{note}</p>
    </article>
  );
}
