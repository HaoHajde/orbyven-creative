import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type CrmLeadKind = "lead" | "client";
export type CrmLeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";
export type CrmActivityKind = "note" | "call" | "email" | "meeting" | "status";

export type CrmLead = {
  id: string;
  organization_id: string;
  kind: CrmLeadKind;
  stage: CrmLeadStage;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  note: string | null;
  estimated_value: number | null;
  currency: string;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  converted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmLeadActivity = {
  id: string;
  organization_id: string;
  lead_id: string;
  kind: CrmActivityKind;
  body: string;
  occurred_at: string;
  created_by: string | null;
  created_at: string;
};

export type CreateCrmLeadInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  note?: string;
  estimatedValue?: number | null;
  currency?: string;
  nextFollowUpAt?: string | null;
};

export type UpdateCrmLeadInput = Partial<{
  kind: CrmLeadKind;
  stage: CrmLeadStage;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  note: string | null;
  estimated_value: number | null;
  currency: string;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  converted_at: string | null;
}>;

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) {
    throw new Error("organization_id is required for every Leads module operation.");
  }
}

function cleanOptional(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function listCrmLeads(organizationId: string): Promise<CrmLead[]> {
  requireOrganizationId(organizationId);

  const { data, error } = await orbyvenSupabase
    .from("crm_leads")
    .select(
      "id,organization_id,kind,stage,name,company,email,phone,source,note,estimated_value,currency,last_contact_at,next_follow_up_at,converted_at,created_by,created_at,updated_at"
    )
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrmLead[];
}

export async function createCrmLead(
  organizationId: string,
  input: CreateCrmLeadInput
): Promise<CrmLead> {
  requireOrganizationId(organizationId);

  const name = input.name.trim();
  if (!name) throw new Error("Lead name is required.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const estimatedValue =
    typeof input.estimatedValue === "number" && Number.isFinite(input.estimatedValue)
      ? Math.max(0, input.estimatedValue)
      : null;

  const { data, error } = await orbyvenSupabase
    .from("crm_leads")
    .insert({
      organization_id: organizationId,
      kind: "lead",
      stage: "new",
      name,
      company: cleanOptional(input.company),
      email: cleanOptional(input.email),
      phone: cleanOptional(input.phone),
      source: cleanOptional(input.source),
      note: cleanOptional(input.note),
      estimated_value: estimatedValue,
      currency: (input.currency?.trim() || "RON").toUpperCase(),
      next_follow_up_at: input.nextFollowUpAt || null,
      created_by: authData.user?.id ?? null,
    })
    .select(
      "id,organization_id,kind,stage,name,company,email,phone,source,note,estimated_value,currency,last_contact_at,next_follow_up_at,converted_at,created_by,created_at,updated_at"
    )
    .single();

  if (error) throw error;
  return data as CrmLead;
}

export async function updateCrmLead(
  organizationId: string,
  leadId: string,
  patch: UpdateCrmLeadInput
): Promise<CrmLead> {
  requireOrganizationId(organizationId);
  if (!leadId.trim()) throw new Error("lead_id is required.");

  const nextPatch = { ...patch };
  if (typeof nextPatch.name === "string") {
    nextPatch.name = nextPatch.name.trim();
    if (!nextPatch.name) throw new Error("Lead name cannot be empty.");
  }
  if (typeof nextPatch.currency === "string") {
    nextPatch.currency = nextPatch.currency.trim().toUpperCase();
  }

  const { data, error } = await orbyvenSupabase
    .from("crm_leads")
    .update(nextPatch)
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .select(
      "id,organization_id,kind,stage,name,company,email,phone,source,note,estimated_value,currency,last_contact_at,next_follow_up_at,converted_at,created_by,created_at,updated_at"
    )
    .single();

  if (error) throw error;
  return data as CrmLead;
}

export async function convertCrmLeadToClient(
  organizationId: string,
  leadId: string
): Promise<CrmLead> {
  return updateCrmLead(organizationId, leadId, {
    kind: "client",
    stage: "won",
    converted_at: new Date().toISOString(),
  });
}

export async function listCrmLeadActivities(
  organizationId: string,
  leadId: string
): Promise<CrmLeadActivity[]> {
  requireOrganizationId(organizationId);
  if (!leadId.trim()) throw new Error("lead_id is required.");

  const { data, error } = await orbyvenSupabase
    .from("crm_lead_activities")
    .select("id,organization_id,lead_id,kind,body,occurred_at,created_by,created_at")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrmLeadActivity[];
}

export async function createCrmLeadActivity(
  organizationId: string,
  leadId: string,
  kind: CrmActivityKind,
  body: string
): Promise<CrmLeadActivity> {
  requireOrganizationId(organizationId);
  if (!leadId.trim()) throw new Error("lead_id is required.");

  const cleanBody = body.trim();
  if (!cleanBody) throw new Error("Activity body is required.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const now = new Date().toISOString();

  const { data, error } = await orbyvenSupabase
    .from("crm_lead_activities")
    .insert({
      organization_id: organizationId,
      lead_id: leadId,
      kind,
      body: cleanBody,
      occurred_at: now,
      created_by: authData.user?.id ?? null,
    })
    .select("id,organization_id,lead_id,kind,body,occurred_at,created_by,created_at")
    .single();

  if (error) throw error;

  if (kind !== "note" && kind !== "status") {
    await orbyvenSupabase
      .from("crm_leads")
      .update({ last_contact_at: now })
      .eq("organization_id", organizationId)
      .eq("id", leadId);
  }

  return data as CrmLeadActivity;
}
