"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import {
  buildBusinessAutomationSignals,
  type AutomationEstimate,
  type AutomationEvent,
  type AutomationOperation,
} from "@/lib/automation/business-signals";
import { evaluateClientLifecycle } from "@/lib/automation/client-lifecycle";
import {
  buildPostServiceGrowthState,
  evaluatePostServiceGrowth,
  parsePostServiceEvent,
  POST_SERVICE_PREFIX,
  type PostServiceEvent,
} from "@/lib/automation/post-service-growth";
import { rankNextBestActions } from "@/lib/automation/next-best-action";

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
  const growthSince = new Date(now.getTime() - 120 * DAY_MS).toISOString();
  const items: WorkspaceActivityItem[] = [];

  const [
    leadsResult,
    reactivationClientsResult,
    tasksResult,
    completedGrowthTasksResult,
    growthActivitiesResult,
    eventsResult,
    estimatesResult,
    invoicesResult,
    inventoryGapsResult,
    purchaseOrdersResult,
    teamResult,
  ] = await Promise.all([
      enabledModules.includes("leads")
        ? orbyvenSupabase
            .from("crm_leads")
            .select("id,name,kind,stage,next_follow_up_at")
            .eq("organization_id", organizationId)
            .not("next_follow_up_at", "is", null)
            .lte("next_follow_up_at", tomorrow)
            .order("next_follow_up_at")
            .limit(14)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("leads")
        ? orbyvenSupabase
            .from("crm_leads")
            .select("id,name,kind,last_contact_at,next_follow_up_at,converted_at,created_at")
            .eq("organization_id", organizationId)
            .eq("kind", "client")
            .is("next_follow_up_at", null)
            .order("converted_at", { ascending: true, nullsFirst: true })
            .limit(80)
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
      enabledModules.includes("tasks") && enabledModules.includes("leads")
        ? orbyvenSupabase
            .from("ops_tasks")
            .select("id,title,kind,status,completed_at,client_id")
            .eq("organization_id", organizationId)
            .eq("status", "done")
            .not("client_id", "is", null)
            .not("completed_at", "is", null)
            .gte("completed_at", growthSince)
            .order("completed_at", { ascending: false })
            .limit(80)
        : Promise.resolve({ data: [], error: null }),
      enabledModules.includes("leads")
        ? orbyvenSupabase
            .from("crm_lead_activities")
            .select("lead_id,body,occurred_at")
            .eq("organization_id", organizationId)
            .like("body", POST_SERVICE_PREFIX + "%")
            .gte("occurred_at", growthSince)
            .order("occurred_at", { ascending: true })
            .limit(240)
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
      enabledModules.includes("team")
        ? orbyvenSupabase
            .from("people_team_members")
            .select("display_name,status")
            .eq("organization_id", organizationId)
            .eq("status", "inactive")
            .limit(120)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const firstError =
    leadsResult.error ??
    reactivationClientsResult.error ??
    tasksResult.error ??
    completedGrowthTasksResult.error ??
    growthActivitiesResult.error ??
    eventsResult.error ??
    estimatesResult.error ??
    invoicesResult.error ??
    inventoryGapsResult.error ??
    purchaseOrdersResult.error ??
    teamResult.error;
  if (firstError) throw firstError;

  const calendarEventIds = (eventsResult.data ?? []).map((event) => event.id);
  const resourceAssignmentsResult =
    enabledModules.includes("calendar") && calendarEventIds.length
      ? await orbyvenSupabase
          .from("calendar_event_resources")
          .select("event_id")
          .eq("organization_id", organizationId)
          .in("event_id", calendarEventIds)
      : { data: [], error: null };
  if (resourceAssignmentsResult.error) throw resourceAssignmentsResult.error;

  const resourceCountByEvent = new Map<string, number>();
  for (const assignment of resourceAssignmentsResult.data ?? []) {
    resourceCountByEvent.set(
      assignment.event_id,
      (resourceCountByEvent.get(assignment.event_id) ?? 0) + 1
    );
  }

  for (const lead of leadsResult.data ?? []) {
    if (!lead.next_follow_up_at) continue;
    if (lead.kind === "lead" && ["won", "lost"].includes(lead.stage)) continue;
    const overdue = lead.next_follow_up_at < nowIso;
    const retention = lead.kind === "client";
    items.push({
      key: (retention ? "client-retention:" : "lead:") + lead.id,
      module: "leads",
      recordId: lead.id,
      clientId: retention ? lead.id : undefined,
      title: retention
        ? overdue
          ? "Revenire client restantă · " + lead.name
          : "Revenire client · " + lead.name
        : overdue
          ? "Follow-up întârziat · " + lead.name
          : "Follow-up · " + lead.name,
      meta:
        (overdue ? "Trebuia contactat " : "De contactat ") +
        dateLabel(lead.next_follow_up_at, locale, timeZone),
      level: overdue ? "urgent" : "upcoming",
      sortAt: lead.next_follow_up_at,
      actionLabel: retention ? "Reia relația" : "Deschide",
      rule: retention ? "client_retention_follow_up" : "lead_follow_up",
    });
  }

  const reactivationCandidates = (reactivationClientsResult.data ?? [])
    .map((client) => ({
      client,
      lifecycle: evaluateClientLifecycle({
        id: client.id,
        name: client.name,
        kind: "client",
        lastContactAt: client.last_contact_at,
        nextFollowUpAt: client.next_follow_up_at,
        convertedAt: client.converted_at,
        createdAt: client.created_at,
      }, now),
    }))
    .filter((entry) => entry.lifecycle?.needsReactivation)
    .sort((left, right) =>
      (right.lifecycle?.inactiveDays ?? 0) - (left.lifecycle?.inactiveDays ?? 0)
    )
    .slice(0, 8);

  for (const entry of reactivationCandidates) {
    const lifecycle = entry.lifecycle!;
    items.push({
      key: "client-reactivation:" + entry.client.id,
      module: "leads",
      recordId: entry.client.id,
      clientId: entry.client.id,
      title: lifecycle.state === "dormant"
        ? "Client de reactivat · " + entry.client.name
        : "Relație în răcire · " + entry.client.name,
      meta: lifecycle.detail,
      level: "attention",
      sortAt: lifecycle.lastTouchAt,
      actionLabel: "Planifică revenire",
      rule: "client_reactivation",
    });
  }

  const openClientIds = new Set(
    (tasksResult.data ?? [])
      .map((task) => task.client_id)
      .filter((clientId): clientId is string => Boolean(clientId))
  );
  const activeEstimateClientIds = new Set(
    (estimatesResult.data ?? [])
      .map((estimate) => estimate.client_id)
      .filter((clientId): clientId is string => Boolean(clientId))
  );
  const growthEventsByTask = new Map<string, PostServiceEvent[]>();
  for (const activity of growthActivitiesResult.data ?? []) {
    const event = parsePostServiceEvent(activity.body, activity.occurred_at);
    if (!event) continue;
    const current = growthEventsByTask.get(event.taskId) ?? [];
    current.push(event);
    growthEventsByTask.set(event.taskId, current);
  }

  for (const task of completedGrowthTasksResult.data ?? []) {
    if (!task.client_id || !task.completed_at || task.kind === "task") continue;
    const state = buildPostServiceGrowthState(
      growthEventsByTask.get(task.id) ?? []
    );
    const action = evaluatePostServiceGrowth({
      taskTitle: task.title,
      completedAt: task.completed_at,
      state,
      now,
      hasOpenWorkForClient:
        openClientIds.has(task.client_id) || activeEstimateClientIds.has(task.client_id),
    });
    if (!action) continue;

    const opensEstimate =
      action.rule === "post_service_upsell" && enabledModules.includes("estimates");
    items.push({
      key: action.rule + ":" + task.id,
      module: opensEstimate ? "estimates" : "tasks",
      recordId: opensEstimate ? undefined : task.id,
      clientId: task.client_id,
      taskId: task.id,
      create: opensEstimate ? true : undefined,
      title: action.title,
      meta: action.detail,
      level: action.level,
      sortAt: task.completed_at,
      actionLabel:
        action.rule === "post_service_recovery"
          ? "Rezolvă"
          : action.rule.startsWith("post_service_review")
            ? "Review"
            : action.rule.startsWith("post_service_referral")
              ? "Recomandare"
              : action.rule === "post_service_upsell"
                ? "Ofertă nouă"
                : "Feedback",
      rule: action.rule,
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
    resourceCount: resourceCountByEvent.get(event.id) ?? 0,
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
    inactiveAssigneeNames: (teamResult.data ?? []).map((member) => member.display_name),
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

  return rankNextBestActions(items, {
    dedupeContext: true,
    limit: 24,
  });
}
