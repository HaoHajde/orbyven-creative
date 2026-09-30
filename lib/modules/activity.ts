"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import {
  buildBusinessAutomationSignals,
  type AutomationEstimate,
  type AutomationEvent,
  type AutomationOperation,
} from "@/lib/automation/business-signals";

export type WorkspaceActivityLevel = "urgent" | "attention" | "upcoming";

export type WorkspaceActivityItem = {
  key: string;
  module: OrbyvenModuleId;
  recordId?: string;
  clientId?: string;
  taskId?: string;
  estimateId?: string;
  create?: boolean;
  actionLabel?: string;
  rule?: string;
  title: string;
  meta: string;
  level: WorkspaceActivityLevel;
  sortAt: string;
};

const DAY_MS = 86400000;

function dateLabel(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
    timeZone,
  }).format(new Date(value.includes("T") ? value : value + "T12:00:00"));
}

function money(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export async function loadWorkspaceActivity(
  organizationId: string,
  enabledModules: OrbyvenModuleId[],
  canAccessFinances: boolean,
  locale: string,
  timeZone: string
): Promise<WorkspaceActivityItem[]> {
  if (!organizationId.trim()) throw new Error("organization_id is required.");

  const now = new Date();
  const nowIso = now.toISOString();
  const tomorrow = new Date(now.getTime() + DAY_MS).toISOString();
  const tomorrowDate = new Date(now.getTime() + DAY_MS).toISOString().slice(0, 10);
  const items: WorkspaceActivityItem[] = [];

  const [leadsResult, tasksResult, eventsResult, estimatesResult, invoicesResult, inventoryGapsResult, purchaseOrdersResult] =
    await Promise.all([
      enabledModules.includes("leads")
        ? orbyvenSupabase
            .from("crm_leads")
            .select("id,name,stage,next_follow_up_at")
            .eq("organization_id", organizationId)
            .eq("kind", "lead")
            .not("stage", "in", '("won","lost")')
            .not("next_follow_up_at", "is", null)
            .lte("next_follow_up_at", tomorrow)
            .order("next_follow_up_at")
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("tasks")
        ? orbyvenSupabase
            .from("ops_tasks")
            .select("id,title,kind,status,priority,assignee,due_at,scheduled_at,created_at,client_id")
            .eq("organization_id", organizationId)
            .not("status", "in", '("done","cancelled")')
            .order("updated_at", { ascending: false })
            .limit(120)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("calendar")
        ? orbyvenSupabase
            .from("calendar_events")
            .select("id,title,status,start_at,end_at,assignee,client_id,task_id")
            .eq("organization_id", organizationId)
            .neq("status", "cancelled")
            .gte("start_at", nowIso)
            .order("start_at")
            .limit(80)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("estimates")
        ? orbyvenSupabase
            .from("sales_estimates")
            .select("id,reference,title,status,valid_until,client_id,task_id,updated_at")
            .eq("organization_id", organizationId)
            .in("status", ["sent", "accepted"])
            .order("updated_at", { ascending: false })
            .limit(80)
        : Promise.resolve({ data: [], error: null }),
      canAccessFinances && enabledModules.includes("expenses")
        ? orbyvenSupabase
            .from("sales_commercial_documents")
            .select("id,reference,title,status,total_cents,currency,due_on,client_id,task_id,estimate_id")
            .eq("organization_id", organizationId)
            .eq("document_type", "invoice_draft")
            .eq("status", "issued")
            .not("due_on", "is", null)
            .lte("due_on", tomorrowDate)
            .order("due_on")
            .limit(12)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("inventory")
        ? orbyvenSupabase
            .from("ops_inventory_procurement_gaps")
            .select("material_id,name,unit,suggested_order,outstanding_demand,on_hand,on_order")
            .eq("organization_id", organizationId)
            .gt("suggested_order", 0)
            .order("suggested_order", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("inventory")
        ? orbyvenSupabase
            .from("ops_purchase_orders")
            .select("id,reference,status,expected_on,task_id")
            .eq("organization_id", organizationId)
            .in("status", ["ordered", "partially_received"])
            .not("expected_on", "is", null)
            .lte("expected_on", tomorrowDate)
            .order("expected_on")
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const firstError =
    leadsResult.error ??
    tasksResult.error ??
    eventsResult.error ??
    estimatesResult.error ??
    invoicesResult.error ??
    inventoryGapsResult.error ??
    purchaseOrdersResult.error;
  if (firstError) throw firstError;

  for (const lead of leadsResult.data ?? []) {
    if (!lead.next_follow_up_at) continue;
    const overdue = lead.next_follow_up_at < nowIso;
    items.push({
      key: "lead:" + lead.id,
      module: "leads",
      recordId: lead.id,
      title: overdue ? "Follow-up întârziat · " + lead.name : "Follow-up · " + lead.name,
      meta:
        (overdue ? "Trebuia contactat " : "De contactat ") +
        dateLabel(lead.next_follow_up_at, locale, timeZone),
      level: overdue ? "urgent" : "upcoming",
      sortAt: lead.next_follow_up_at,
      actionLabel: "Deschide",
      rule: "lead_follow_up",
    });
  }

  const operations: AutomationOperation[] = (tasksResult.data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    kind: task.kind as AutomationOperation["kind"],
    status: task.status as AutomationOperation["status"],
    priority: task.priority as AutomationOperation["priority"],
    assignee: task.assignee ?? null,
    clientId: task.client_id ?? null,
    dueAt: task.due_at ?? null,
    scheduledAt: task.scheduled_at ?? null,
    createdAt: task.created_at,
  }));
  const events: AutomationEvent[] = (eventsResult.data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    startAt: event.start_at,
    endAt: event.end_at ?? null,
    assignee: event.assignee ?? null,
    clientId: event.client_id ?? null,
    taskId: event.task_id ?? null,
  }));
  const estimates: AutomationEstimate[] = (estimatesResult.data ?? []).map((estimate) => ({
    id: estimate.id,
    reference: estimate.reference,
    title: estimate.title,
    status: estimate.status,
    validUntil: estimate.valid_until ?? null,
    clientId: estimate.client_id ?? null,
    taskId: estimate.task_id ?? null,
    updatedAt: estimate.updated_at,
  }));

  const automationSignals = buildBusinessAutomationSignals({
    operations,
    estimates,
    events,
    now,
    locale,
    timeZone,
  });

  for (const signal of automationSignals) {
    if (!enabledModules.includes(signal.module)) continue;
    items.push({
      key: signal.key,
      module: signal.module,
      recordId: signal.open.recordId,
      clientId: signal.open.clientId,
      taskId: signal.open.taskId,
      estimateId: signal.open.estimateId,
      create: signal.open.create,
      actionLabel: signal.actionLabel,
      rule: signal.rule,
      title: signal.title,
      meta: signal.meta,
      level: signal.level,
      sortAt: signal.sortAt,
    });
  }

  for (const gap of inventoryGapsResult.data ?? []) {
    items.push({
      key: "inventory-gap:" + gap.material_id,
      module: "inventory",
      recordId: gap.material_id,
      title: "Aprovizionare necesară · " + gap.name,
      meta: Number(gap.suggested_order).toLocaleString(locale) + " " + gap.unit + " recomandat de comandat",
      level: Number(gap.outstanding_demand) > Number(gap.on_hand) + Number(gap.on_order) ? "urgent" : "attention",
      sortAt: nowIso,
      actionLabel: "Achiziții",
      rule: "inventory_shortage",
    });
  }

  for (const order of purchaseOrdersResult.data ?? []) {
    if (!order.expected_on) continue;
    const overdue = order.expected_on < nowIso.slice(0, 10);
    items.push({
      key: "purchase-order:" + order.id,
      module: "inventory",
      taskId: order.task_id ?? undefined,
      title: overdue ? "PO întârziată · " + order.reference : "PO ajunge curând · " + order.reference,
      meta: (overdue ? "Livrare estimată depășită " : "Livrare estimată ") + dateLabel(order.expected_on, locale, timeZone),
      level: overdue ? "urgent" : "upcoming",
      sortAt: order.expected_on + "T12:00:00.000Z",
      actionLabel: "Deschide",
      rule: "purchase_order_due",
    });
  }

  const invoices = invoicesResult.data ?? [];
  if (invoices.length) {
    const ids = invoices.map((row) => row.id);
    const { data: incomeRows, error: incomeError } = await orbyvenSupabase
      .from("finance_income_entries")
      .select("commercial_document_id,amount_cents,currency")
      .eq("organization_id", organizationId)
      .in("commercial_document_id", ids);
    if (incomeError) throw incomeError;

    const paidByInvoice = new Map<string, number>();
    for (const row of incomeRows ?? []) {
      if (!row.commercial_document_id) continue;
      paidByInvoice.set(
        row.commercial_document_id,
        (paidByInvoice.get(row.commercial_document_id) ?? 0) +
          Number(row.amount_cents || 0)
      );
    }

    for (const invoice of invoices) {
      if (!invoice.due_on) continue;
      const paid = paidByInvoice.get(invoice.id) ?? 0;
      const outstanding = Math.max(0, Number(invoice.total_cents || 0) - paid);
      if (outstanding <= 0) continue;
      const overdue = invoice.due_on < nowIso.slice(0, 10);
      items.push({
        key: "invoice:" + invoice.id,
        module: "expenses",
        clientId: invoice.client_id ?? undefined,
        taskId: invoice.task_id ?? undefined,
        estimateId: invoice.estimate_id ?? undefined,
        title: overdue
          ? "Încasare restantă · " + invoice.reference
          : "Încasare apropiată · " + invoice.reference,
        meta:
          money(outstanding, invoice.currency, locale) +
          " · scadență " +
          dateLabel(invoice.due_on, locale, timeZone),
        level: overdue ? "urgent" : "attention",
        sortAt: invoice.due_on + "T12:00:00.000Z",
        actionLabel: "Încasează",
        rule: "invoice_receivable",
      });
    }
  }

  const rank: Record<WorkspaceActivityLevel, number> = {
    urgent: 0,
    attention: 1,
    upcoming: 2,
  };
  return items
    .sort((left, right) => {
      const byLevel = rank[left.level] - rank[right.level];
      return byLevel || left.sortAt.localeCompare(right.sortAt);
    })
    .slice(0, 24);
}
