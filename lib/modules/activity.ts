"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type WorkspaceActivityLevel = "urgent" | "attention" | "upcoming";

export type WorkspaceActivityItem = {
  key: string;
  module: OrbyvenModuleId;
  recordId?: string;
  clientId?: string;
  taskId?: string;
  estimateId?: string;
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
  }).format(new Date(value.includes("T") ? value : `${value}T12:00:00`));
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
  const twoDaysDate = new Date(now.getTime() + 2 * DAY_MS).toISOString().slice(0, 10);
  const tomorrowDate = new Date(now.getTime() + DAY_MS).toISOString().slice(0, 10);
  const items: WorkspaceActivityItem[] = [];

  const [leadsResult, tasksResult, eventsResult, estimatesResult, invoicesResult] = await Promise.all([
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
          .select("id,title,status,priority,due_at,client_id")
          .eq("organization_id", organizationId)
          .not("status", "in", '("done","cancelled")')
          .not("due_at", "is", null)
          .lte("due_at", tomorrow)
          .order("due_at")
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
    enabledModules.includes("calendar")
      ? orbyvenSupabase
          .from("calendar_events")
          .select("id,title,status,start_at,client_id,task_id")
          .eq("organization_id", organizationId)
          .neq("status", "cancelled")
          .gte("start_at", nowIso)
          .lte("start_at", tomorrow)
          .order("start_at")
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    enabledModules.includes("estimates")
      ? orbyvenSupabase
          .from("sales_estimates")
          .select("id,reference,title,status,valid_until,client_id,task_id")
          .eq("organization_id", organizationId)
          .eq("status", "sent")
          .not("valid_until", "is", null)
          .lte("valid_until", twoDaysDate)
          .order("valid_until")
          .limit(10)
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
  ]);

  const firstError =
    leadsResult.error ?? tasksResult.error ?? eventsResult.error ?? estimatesResult.error ?? invoicesResult.error;
  if (firstError) throw firstError;

  for (const lead of leadsResult.data ?? []) {
    if (!lead.next_follow_up_at) continue;
    const overdue = lead.next_follow_up_at < nowIso;
    items.push({
      key: `lead:${lead.id}`,
      module: "leads",
      recordId: lead.id,
      title: overdue ? `Follow-up întârziat · ${lead.name}` : `Follow-up · ${lead.name}`,
      meta: `${overdue ? "Trebuia contactat" : "De contactat"} ${dateLabel(lead.next_follow_up_at, locale, timeZone)}`,
      level: overdue ? "urgent" : "upcoming",
      sortAt: lead.next_follow_up_at,
    });
  }

  for (const task of tasksResult.data ?? []) {
    if (!task.due_at) continue;
    const overdue = task.due_at < nowIso;
    items.push({
      key: `task:${task.id}`,
      module: "tasks",
      recordId: task.id,
      clientId: task.client_id ?? undefined,
      title: overdue ? `Lucrare întârziată · ${task.title}` : `Termen apropiat · ${task.title}`,
      meta: `${overdue ? "Termen depășit" : "Scadent"} ${dateLabel(task.due_at, locale, timeZone)}`,
      level: overdue || task.priority === "urgent" ? "urgent" : "attention",
      sortAt: task.due_at,
    });
  }

  for (const event of eventsResult.data ?? []) {
    items.push({
      key: `event:${event.id}`,
      module: "calendar",
      clientId: event.client_id ?? undefined,
      taskId: event.task_id ?? undefined,
      title: `Programare · ${event.title}`,
      meta: dateLabel(event.start_at, locale, timeZone),
      level: "upcoming",
      sortAt: event.start_at,
    });
  }

  for (const estimate of estimatesResult.data ?? []) {
    if (!estimate.valid_until) continue;
    const expired = estimate.valid_until < nowIso.slice(0, 10);
    items.push({
      key: `estimate:${estimate.id}`,
      module: "estimates",
      recordId: estimate.id,
      clientId: estimate.client_id ?? undefined,
      taskId: estimate.task_id ?? undefined,
      title: expired ? `Ofertă expirată · ${estimate.reference}` : `Oferta expiră curând · ${estimate.reference}`,
      meta: estimate.title,
      level: expired ? "urgent" : "attention",
      sortAt: `${estimate.valid_until}T12:00:00.000Z`,
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
        (paidByInvoice.get(row.commercial_document_id) ?? 0) + Number(row.amount_cents || 0)
      );
    }

    for (const invoice of invoices) {
      if (!invoice.due_on) continue;
      const paid = paidByInvoice.get(invoice.id) ?? 0;
      const outstanding = Math.max(0, Number(invoice.total_cents || 0) - paid);
      if (outstanding <= 0) continue;
      const overdue = invoice.due_on < nowIso.slice(0, 10);
      items.push({
        key: `invoice:${invoice.id}`,
        module: "expenses",
        clientId: invoice.client_id ?? undefined,
        taskId: invoice.task_id ?? undefined,
        estimateId: invoice.estimate_id ?? undefined,
        title: overdue ? `Încasare restantă · ${invoice.reference}` : `Încasare apropiată · ${invoice.reference}`,
        meta: `${money(outstanding, invoice.currency, locale)} · scadență ${dateLabel(invoice.due_on, locale, timeZone)}`,
        level: overdue ? "urgent" : "attention",
        sortAt: `${invoice.due_on}T12:00:00.000Z`,
      });
    }
  }

  const rank: Record<WorkspaceActivityLevel, number> = { urgent: 0, attention: 1, upcoming: 2 };
  return items
    .sort((left, right) => {
      const byLevel = rank[left.level] - rank[right.level];
      return byLevel || left.sortAt.localeCompare(right.sortAt);
    })
    .slice(0, 24);
}
