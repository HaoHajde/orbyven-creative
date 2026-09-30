import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  consumeInventoryForTask,
  createInventorySupplier,
  createPurchaseOrder,
  loadInventorySnapshot,
  receivePurchaseOrderItem,
  recordInventoryAdjustment,
  setPurchaseOrderStatus,
  type InventoryPurchaseItem,
  type InventorySnapshot,
} from "@/lib/modules/inventory";
import { inventorySummary, remainingPurchaseQuantity, type InventoryGap } from "@/lib/inventory/projections";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  initialRecordId?: string | null;
};

type PurchaseLine = {
  key: number;
  materialId: string;
  quantity: string;
  costLei: string;
};

type MovementMode = "consumption" | "adjustment_in" | "adjustment_out";

function money(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function quantity(value: number) {
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 3 }).format(value);
}

export default function DesktopInventoryPanel({ organizationId, locale, role, initialRecordId }: Props) {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplier, setSupplier] = useState({ name: "", contactName: "", email: "", phone: "" });

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseTaskId, setPurchaseTaskId] = useState("");
  const [purchaseExpectedOn, setPurchaseExpectedOn] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [lineKey, setLineKey] = useState(2);
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([
    { key: 1, materialId: "", quantity: "1", costLei: "" },
  ]);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementMode>("consumption");
  const [movementMaterialId, setMovementMaterialId] = useState("");
  const [movementTaskId, setMovementTaskId] = useState("");
  const [movementQuantity, setMovementQuantity] = useState("1");
  const [movementNote, setMovementNote] = useState("");

  const canWrite = role !== "viewer";
  const canProcure = ["owner", "admin", "manager"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await loadInventorySnapshot(organizationId));
    } catch (cause) {
      console.error("Desktop inventory:", cause);
      setError("Stocul și achizițiile nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const materials = snapshot?.materials ?? [];
  const trackedMaterials = materials.filter((item) => item.stock_tracked);
  const suppliers = (snapshot?.suppliers ?? []).filter((item) => item.active);
  const tasks = snapshot?.tasks ?? [];
  const gaps = useMemo(() => {
    const next = [...(snapshot?.stock ?? [])];
    if (initialRecordId) next.sort((left, right) => Number(right.materialId === initialRecordId) - Number(left.materialId === initialRecordId));
    return next;
  }, [snapshot, initialRecordId]);
  const purchaseOrders = snapshot?.purchaseOrders ?? [];
  const purchaseItems = snapshot?.purchaseItems ?? [];
  const summary = useMemo(
    () => inventorySummary(gaps, purchaseOrders.length),
    [gaps, purchaseOrders.length],
  );
  const materialById = useMemo(
    () => new Map(materials.map((item) => [item.id, item])),
    [materials],
  );
  const supplierById = useMemo(
    () => new Map((snapshot?.suppliers ?? []).map((item) => [item.id, item])),
    [snapshot],
  );

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
    } catch (cause) {
      console.error("Desktop inventory action:", cause);
      setError(cause instanceof Error ? cause.message : "Acțiunea nu a reușit.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const createSupplier = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await run(
      () => createInventorySupplier(organizationId, supplier),
      "Furnizor salvat.",
    );
    if (ok) {
      setSupplier({ name: "", contactName: "", email: "", phone: "" });
      setSupplierOpen(false);
    }
  };

  const updatePurchaseLine = (key: number, patch: Partial<PurchaseLine>) => {
    setPurchaseLines((current) => current.map((line) => {
      if (line.key !== key) return line;
      const next = { ...line, ...patch };
      if (patch.materialId !== undefined) {
        const material = materialById.get(patch.materialId);
        next.costLei = material ? String(material.unit_cost_cents / 100) : "";
      }
      return next;
    }));
  };

  const prepareGapPurchase = (gap: InventoryGap) => {
    setPurchaseSupplierId(gap.preferredSupplierId ?? "");
    setPurchaseTaskId("");
    setPurchaseExpectedOn("");
    setPurchaseNote("Necesar generat din stoc și cererea confirmată.");
    setPurchaseLines([{
      key: lineKey,
      materialId: gap.materialId,
      quantity: String(gap.suggestedOrder),
      costLei: String(gap.unitCostCents / 100),
    }]);
    setLineKey((value) => value + 1);
    setPurchaseOpen(true);
  };

  const submitPurchase = async (event: FormEvent) => {
    event.preventDefault();
    const lines = purchaseLines
      .filter((line) => line.materialId)
      .map((line) => ({
        materialId: line.materialId,
        quantity: Number(line.quantity),
        unitCostCents: Math.round(Number(line.costLei) * 100),
      }));
    const ok = await run(
      () => createPurchaseOrder(organizationId, {
        supplierId: purchaseSupplierId,
        taskId: purchaseTaskId || null,
        expectedOn: purchaseExpectedOn || null,
        note: purchaseNote,
        items: lines,
      }),
      "Comanda furnizor a fost creată ca ciornă.",
    );
    if (ok) {
      setPurchaseOpen(false);
      setPurchaseSupplierId("");
      setPurchaseTaskId("");
      setPurchaseExpectedOn("");
      setPurchaseNote("");
      setPurchaseLines([{ key: lineKey, materialId: "", quantity: "1", costLei: "" }]);
      setLineKey((value) => value + 1);
    }
  };

  const submitMovement = async (event: FormEvent) => {
    event.preventDefault();
    if (movementMode !== "consumption" && !canProcure) {
      setError("Ajustările manuale sunt disponibile doar rolurilor manageriale.");
      return;
    }
    const amount = Number(movementQuantity);
    const ok = await run(
      () => movementMode === "consumption"
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
        : "Ajustarea de stoc a fost înregistrată.",
    );
    if (ok) {
      setMovementQuantity("1");
      setMovementNote("");
      setMovementOpen(false);
    }
  };

  const receiveRemaining = async (item: InventoryPurchaseItem) => {
    const remaining = remainingPurchaseQuantity(item.ordered_quantity, item.received_quantity);
    if (remaining <= 0) return;
    await run(
      () => receivePurchaseOrderItem(organizationId, item, remaining),
      "Recepția a fost înregistrată în stoc.",
    );
  };

  if (loading && !snapshot) return <div className="inventory-loading">Se încarcă stocul...</div>;

  return (
    <div className="inventory-panel">
      <section className="inventory-hero">
        <div>
          <p className="eyebrow">OPERATIONS · INVENTORY CORE</p>
          <h2>Stoc & achiziții</h2>
          <p>Necesarul confirmat, stocul real, furnizorii, recepțiile și consumul pe lucrare folosesc aceeași bibliotecă de materiale.</p>
        </div>
        <div className="inventory-actions">
          {canWrite && trackedMaterials.length > 0 && (
            <button className="secondary" onClick={() => setMovementOpen((value) => !value)}>
              {movementOpen ? "Închide mișcarea" : "+ Mișcare stoc"}
            </button>
          )}
          {canProcure && <button className="secondary" onClick={() => setSupplierOpen((value) => !value)}>+ Furnizor</button>}
          {canProcure && trackedMaterials.length > 0 && suppliers.length > 0 && (
            <button className="primary" onClick={() => setPurchaseOpen((value) => !value)}>+ Comandă furnizor</button>
          )}
        </div>
      </section>

      <section className="inventory-metrics">
        {[
          ["Materiale urmărite", String(summary.trackedMaterials), "stoc activ"],
          ["Atenție", String(summary.lowOrShort), "sub prag / lipsă"],
          ["Lipsuri reale", String(summary.shortageMaterials), "cerere confirmată"],
          ["PO deschise", String(summary.openPurchaseOrders), "furnizori"],
          ["Valoare stoc", money(summary.stockValueCents, locale), "estimare operațională"],
        ].map(([label, value, note]) => (
          <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
        ))}
      </section>

      {error && <p className="inventory-message error" role="alert">{error}</p>}
      {notice && <p className="inventory-message success" role="status">{notice}</p>}

      {supplierOpen && canProcure && (
        <form className="inventory-form" onSubmit={(event) => void createSupplier(event)}>
          <div className="inventory-form-head"><div><p className="eyebrow">FURNIZOR NOU</p><h3>Datele de bază, fără birocrație.</h3></div>
            <button type="button" onClick={() => setSupplierOpen(false)}>Închide</button></div>
          <div className="inventory-grid four">
            <input required placeholder="Nume furnizor" value={supplier.name} onChange={(e) => setSupplier((v) => ({ ...v, name: e.target.value }))} />
            <input placeholder="Persoană contact" value={supplier.contactName} onChange={(e) => setSupplier((v) => ({ ...v, contactName: e.target.value }))} />
            <input type="email" placeholder="Email" value={supplier.email} onChange={(e) => setSupplier((v) => ({ ...v, email: e.target.value }))} />
            <input placeholder="Telefon" value={supplier.phone} onChange={(e) => setSupplier((v) => ({ ...v, phone: e.target.value }))} />
          </div>
          <div className="inventory-form-submit"><button className="primary" disabled={busy}>Salvează furnizor</button></div>
        </form>
      )}

      {purchaseOpen && canProcure && (
        <form className="inventory-form emphasized" onSubmit={(event) => void submitPurchase(event)}>
          <div className="inventory-form-head"><div><p className="eyebrow">PURCHASE ORDER</p><h3>Comandă internă către furnizor.</h3><small>Document operațional intern; nu este document fiscal.</small></div>
            <button type="button" onClick={() => setPurchaseOpen(false)}>Închide</button></div>
          <div className="inventory-grid three">
            <select required value={purchaseSupplierId} onChange={(e) => setPurchaseSupplierId(e.target.value)}>
              <option value="">Alege furnizorul</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={purchaseTaskId} onChange={(e) => setPurchaseTaskId(e.target.value)}>
              <option value="">Fără lucrare/comandă specifică</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.kind === "order" ? "Comandă" : "Lucrare"} · {task.title}</option>)}
            </select>
            <input type="date" value={purchaseExpectedOn} onChange={(e) => setPurchaseExpectedOn(e.target.value)} />
          </div>
          <div className="purchase-lines">
            {purchaseLines.map((line) => (
              <div className="purchase-line" key={line.key}>
                <select required value={line.materialId} onChange={(e) => updatePurchaseLine(line.key, { materialId: e.target.value })}>
                  <option value="">Material</option>{trackedMaterials.map((material) => <option key={material.id} value={material.id}>{material.name} · {material.unit}</option>)}
                </select>
                <input required min="0.001" step="any" type="number" value={line.quantity} onChange={(e) => updatePurchaseLine(line.key, { quantity: e.target.value })} />
                <input required min="0" step="0.01" type="number" value={line.costLei} onChange={(e) => updatePurchaseLine(line.key, { costLei: e.target.value })} />
                <button type="button" disabled={purchaseLines.length === 1} onClick={() => setPurchaseLines((current) => current.filter((item) => item.key !== line.key))}>×</button>
              </div>
            ))}
          </div>
          <div className="inventory-form-footer">
            <button type="button" className="secondary" onClick={() => {
              setPurchaseLines((current) => [...current, { key: lineKey, materialId: "", quantity: "1", costLei: "" }]);
              setLineKey((value) => value + 1);
            }}>+ Poziție</button>
            <input value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)} placeholder="Notă internă (opțional)" />
            <button className="primary" disabled={busy || !purchaseSupplierId}>Creează ciorna PO</button>
          </div>
        </form>
      )}

      {movementOpen && canWrite && (
        <form className="inventory-form" onSubmit={(event) => void submitMovement(event)}>
          <div className="inventory-grid five">
            <select value={movementMode} onChange={(e) => setMovementMode(e.target.value as MovementMode)}>
              <option value="consumption">Consum pe lucrare/comandă</option>
              {canProcure && <option value="adjustment_in">Ajustare + stoc</option>}
              {canProcure && <option value="adjustment_out">Ajustare - stoc</option>}
            </select>
            <select required value={movementMaterialId} onChange={(e) => setMovementMaterialId(e.target.value)}>
              <option value="">Material</option>{trackedMaterials.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select required={movementMode === "consumption"} disabled={movementMode !== "consumption"} value={movementTaskId} onChange={(e) => setMovementTaskId(e.target.value)}>
              <option value="">Lucrare / comandă</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.kind === "order" ? "Comandă" : "Lucrare"} · {task.title}</option>)}
            </select>
            <input required type="number" min="0.001" step="any" value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} placeholder="Cantitate" />
            <button className="primary" disabled={busy || !movementMaterialId || (movementMode === "consumption" && !movementTaskId)}>Înregistrează</button>
          </div>
          <input className="full-input" value={movementNote} onChange={(e) => setMovementNote(e.target.value)} placeholder="Notă / motiv ajustare (opțional)" />
        </form>
      )}

      <section className="inventory-section">
        <div className="inventory-section-head"><div><p className="eyebrow">PROCUREMENT SIGNALS</p><h3>Ce trebuie cumpărat</h3></div><span>{gaps.filter((gap) => gap.suggestedOrder > 0).length} poziții</span></div>
        <div className="inventory-table">
          {gaps.map((gap) => (
            <div className={"inventory-row " + gap.state + (gap.materialId === initialRecordId ? " highlighted" : "")} key={gap.materialId}>
              <div><strong>{gap.name}</strong><small>{gap.state === "shortage" ? "Lipsă reală" : gap.state === "low" ? "Sub prag" : "Stoc OK"}</small></div>
              <div><span>În stoc</span><strong>{quantity(gap.onHand)} {gap.unit}</strong></div>
              <div><span>Cerere</span><strong>{quantity(gap.outstandingDemand)} {gap.unit}</strong></div>
              <div><span>Pe drum</span><strong>{quantity(gap.onOrder)} {gap.unit}</strong></div>
              <div><span>Recomandat</span><strong>{quantity(gap.suggestedOrder)} {gap.unit}</strong></div>
              {canProcure && gap.suggestedOrder > 0 ? <button className="secondary" onClick={() => prepareGapPurchase(gap)}>Pregătește PO</button> : <span />}
            </div>
          ))}
          {!gaps.length && <p className="inventory-empty">Nu există materiale urmărite încă.</p>}
        </div>
      </section>

      <section className="inventory-section">
        <div className="inventory-section-head"><div><p className="eyebrow">PURCHASE ORDERS</p><h3>Comenzi furnizori deschise</h3></div><span>{purchaseOrders.length}</span></div>
        <div className="inventory-po-list">
          {purchaseOrders.map((order) => {
            const items = purchaseItems.filter((item) => item.purchase_order_id === order.id);
            return <article key={order.id} className="inventory-po">
              <div className="inventory-po-head">
                <div><strong>{order.reference}</strong><small>{supplierById.get(order.supplier_id)?.name || "Furnizor"}</small></div>
                <span>{order.status}</span>
              </div>
              {items.map((item) => {
                const remaining = remainingPurchaseQuantity(item.ordered_quantity, item.received_quantity);
                return <div className="inventory-po-line" key={item.id}>
                  <span>{item.description}</span><small>{quantity(item.received_quantity)} / {quantity(item.ordered_quantity)} {item.unit}</small>
                  {canProcure && remaining > 0 && order.status !== "draft" ? <button onClick={() => void receiveRemaining(item)}>Recepționează restul</button> : null}
                </div>;
              })}
              {canProcure && order.status === "draft" && <button className="primary po-action" onClick={() => void run(
                () => setPurchaseOrderStatus(organizationId, order.id, "ordered"),
                "Comanda a fost marcată ca trimisă.",
              )}>Marchează comandată</button>}
            </article>;
          })}
          {!purchaseOrders.length && <p className="inventory-empty">Nu există comenzi furnizor deschise.</p>}
        </div>
      </section>
    </div>
  );
}
