import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type OverviewLead = {
  id: string;
  name: string;
  kind: "lead" | "client";
  stage: string;
  next_follow_up_at: string | null;
};

export type OverviewTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
  scheduled_at: string | null;
};

export type OverviewEvent = {
  id: string;
  title: string;
  status: string;
  start_at: string;
};

export type OverviewEstimate = {
  id: string;
  reference: string;
  title: string;
  status: string;
  total_cents: number;
  currency: string;
  updated_at: string;
};

export type OverviewExpense = {
  id: string;
  occurred_on: string;
  amount_cents: number;
  currency: string;
};

export type OverviewSnapshot = {
  leads: OverviewLead[];
  tasks: OverviewTask[];
  events: OverviewEvent[];
  estimates: OverviewEstimate[];
  expenses: OverviewExpense[];
  documentCount: number;
  activeTeamCount: number;
};

export async function loadOverviewSnapshot(organizationId: string): Promise<OverviewSnapshot> {
  if (!organizationId.trim()) throw new Error("organization_id is required.");

  const [leads, tasks, events, estimates, expenses, documents, team] = await Promise.all([
    orbyvenSupabase
      .from("crm_leads")
      .select("id,name,kind,stage,next_follow_up_at")
      .eq("organization_id", organizationId),
    orbyvenSupabase
      .from("ops_tasks")
      .select("id,title,status,priority,due_at,scheduled_at")
      .eq("organization_id", organizationId),
    orbyvenSupabase
      .from("calendar_events")
      .select("id,title,status,start_at")
      .eq("organization_id", organizationId)
      .order("start_at", { ascending: true })
      .limit(50),
    orbyvenSupabase
      .from("sales_estimates")
      .select("id,reference,title,status,total_cents,currency,updated_at")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    orbyvenSupabase
      .from("finance_expenses")
      .select("id,occurred_on,amount_cents,currency")
      .eq("organization_id", organizationId)
      .order("occurred_on", { ascending: false }),
    orbyvenSupabase
      .from("ops_documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    orbyvenSupabase
      .from("people_team_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  for (const result of [leads, tasks, events, estimates, expenses, documents, team]) {
    if (result.error) throw result.error;
  }

  return {
    leads: (leads.data ?? []) as OverviewLead[],
    tasks: (tasks.data ?? []) as OverviewTask[],
    events: (events.data ?? []) as OverviewEvent[],
    estimates: (estimates.data ?? []) as OverviewEstimate[],
    expenses: (expenses.data ?? []) as OverviewExpense[],
    documentCount: documents.count ?? 0,
    activeTeamCount: team.count ?? 0,
  };
}
