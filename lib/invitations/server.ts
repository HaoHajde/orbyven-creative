import { randomBytes } from "node:crypto";

import {
  createBillingServiceClient,
  type BillingActor,
} from "@/lib/billing/supabase-server";
import {
  invitationSourceKey,
  type InvitationProjectType,
} from "@/lib/invitations/contracts";
import { readSiteDraft, type EditableSite } from "@/lib/ai/site-editor";

export type PublishedInvitationProject = {
  id: string;
  organizationId: string;
  projectType: InvitationProjectType;
  slug: string;
  title: string;
  draft: EditableSite;
  publishedAt: string;
};

export type InvitationTable = {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
};

export type InvitationRsvp = {
  id: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  tableId: string | null;
  createdAt: string;
  updatedAt: string;
};

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "invitatie";
}

function newInvitationSlug(title: string) {
  return `${slugPart(title)}-${randomBytes(5).toString("hex")}`;
}

function projectFromRow(row: Record<string, unknown> | null): PublishedInvitationProject | null {
  if (!row) return null;
  const draft = readSiteDraft(row.draft);
  const projectType = row.project_type;
  if (
    !draft ||
    typeof row.id !== "string" ||
    typeof row.organization_id !== "string" ||
    (projectType !== "wedding" && projectType !== "baptism" && projectType !== "event") ||
    typeof row.slug !== "string" ||
    typeof row.title !== "string" ||
    typeof row.published_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    projectType,
    slug: row.slug,
    title: row.title,
    draft,
    publishedAt: row.published_at,
  };
}

function tableFromRow(row: Record<string, unknown> | null): InvitationTable | null {
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.capacity !== "number" ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rsvpFromRow(row: Record<string, unknown> | null): InvitationRsvp | null {
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.guest_name !== "string" ||
    typeof row.attending !== "boolean" ||
    typeof row.guest_count !== "number" ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    guestName: row.guest_name,
    attending: row.attending,
    guestCount: row.guest_count,
    message: typeof row.message === "string" ? row.message : null,
    tableId: typeof row.table_id === "string" ? row.table_id : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveOwnedInvitationProjectId(
  actor: BillingActor,
  projectType: InvitationProjectType
) {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("invitation_projects")
    .select("id")
    .eq("organization_id", actor.organizationId)
    .eq("source_key", invitationSourceKey(projectType))
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("INVITATION_PROJECT_NOT_FOUND");
  return String(data.id);
}

async function assertInvitationTableBelongsToProject(
  actor: BillingActor,
  projectId: string,
  tableId: string
) {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("invitation_tables")
    .select("id")
    .eq("id", tableId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("INVITATION_TABLE_NOT_FOUND");
}

export async function publishInvitationProject(input: {
  actor: BillingActor;
  projectType: InvitationProjectType;
  draft: EditableSite;
}) {
  const client = createBillingServiceClient(input.actor);
  const sourceKey = invitationSourceKey(input.projectType);
  const title = input.draft.brand.trim().slice(0, 180) || "Invitație ORBYVEN";

  const { data: existing, error: existingError } = await client
    .from("invitation_projects")
    .select("id,slug")
    .eq("organization_id", input.actor.organizationId)
    .eq("source_key", sourceKey)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id && existing?.slug) {
    const { data, error } = await client
      .from("invitation_projects")
      .update({
        project_type: input.projectType,
        status: "published",
        title,
        draft: input.draft,
        published_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("organization_id", input.actor.organizationId)
      .select("id,organization_id,project_type,slug,title,draft,published_at")
      .single();
    if (error) throw error;
    const project = projectFromRow(data as Record<string, unknown> | null);
    if (!project) throw new Error("INVITATION_PROJECT_INVALID_RESPONSE");
    return project;
  }

  const { data, error } = await client
    .from("invitation_projects")
    .insert({
      organization_id: input.actor.organizationId,
      created_by: input.actor.userId,
      source_key: sourceKey,
      project_type: input.projectType,
      slug: newInvitationSlug(title),
      status: "published",
      title,
      draft: input.draft,
      published_at: new Date().toISOString(),
    })
    .select("id,organization_id,project_type,slug,title,draft,published_at")
    .single();
  if (error) throw error;
  const project = projectFromRow(data as Record<string, unknown> | null);
  if (!project) throw new Error("INVITATION_PROJECT_INVALID_RESPONSE");
  return project;
}

export async function loadInvitationAdminState(
  actor: BillingActor,
  projectType: InvitationProjectType
): Promise<{
  project: PublishedInvitationProject | null;
  rsvps: InvitationRsvp[];
  tables: InvitationTable[];
}> {
  const client = createBillingServiceClient(actor);
  const { data: row, error } = await client
    .from("invitation_projects")
    .select("id,organization_id,project_type,slug,title,draft,published_at")
    .eq("organization_id", actor.organizationId)
    .eq("source_key", invitationSourceKey(projectType))
    .maybeSingle();
  if (error) throw error;

  const project = projectFromRow(row as Record<string, unknown> | null);
  if (!project) return { project: null, rsvps: [], tables: [] };

  const [responsesResult, tablesResult] = await Promise.all([
    client
      .from("invitation_rsvps")
      .select("id,guest_name,attending,guest_count,message,table_id,created_at,updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(1000),
    client
      .from("invitation_tables")
      .select("id,name,capacity,created_at,updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);
  if (responsesResult.error) throw responsesResult.error;
  if (tablesResult.error) throw tablesResult.error;

  const rsvps: InvitationRsvp[] = (responsesResult.data ?? []).flatMap((item) => {
    const parsed = rsvpFromRow(item as Record<string, unknown> | null);
    return parsed ? [parsed] : [];
  });
  const tables: InvitationTable[] = (tablesResult.data ?? []).flatMap((item) => {
    const parsed = tableFromRow(item as Record<string, unknown> | null);
    return parsed ? [parsed] : [];
  });

  return { project, rsvps, tables };
}

export async function createInvitationTable(input: {
  actor: BillingActor;
  projectType: InvitationProjectType;
  name: string;
  capacity: number;
}) {
  const client = createBillingServiceClient(input.actor);
  const projectId = await resolveOwnedInvitationProjectId(input.actor, input.projectType);
  const { data, error } = await client
    .from("invitation_tables")
    .insert({
      project_id: projectId,
      name: input.name,
      capacity: input.capacity,
      created_by: input.actor.userId,
      updated_by: input.actor.userId,
    })
    .select("id,name,capacity,created_at,updated_at")
    .single();
  if (error) throw error;
  const table = tableFromRow(data as Record<string, unknown> | null);
  if (!table) throw new Error("INVITATION_TABLE_INVALID_RESPONSE");
  return table;
}

export async function updateInvitationTable(input: {
  actor: BillingActor;
  projectType: InvitationProjectType;
  tableId: string;
  name: string;
  capacity: number;
}) {
  const client = createBillingServiceClient(input.actor);
  const projectId = await resolveOwnedInvitationProjectId(input.actor, input.projectType);
  const { data, error } = await client
    .from("invitation_tables")
    .update({
      name: input.name,
      capacity: input.capacity,
      updated_by: input.actor.userId,
    })
    .eq("id", input.tableId)
    .eq("project_id", projectId)
    .select("id,name,capacity,created_at,updated_at")
    .maybeSingle();
  if (error) throw error;
  const table = tableFromRow(data as Record<string, unknown> | null);
  if (!table) throw new Error("INVITATION_TABLE_NOT_FOUND");
  return table;
}

export async function deleteInvitationTable(input: {
  actor: BillingActor;
  projectType: InvitationProjectType;
  tableId: string;
}) {
  const client = createBillingServiceClient(input.actor);
  const projectId = await resolveOwnedInvitationProjectId(input.actor, input.projectType);
  const { data, error } = await client
    .from("invitation_tables")
    .delete()
    .eq("id", input.tableId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("INVITATION_TABLE_NOT_FOUND");
  return String(data.id);
}

export async function updateInvitationRsvp(input: {
  actor: BillingActor;
  projectType: InvitationProjectType;
  rsvpId: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  tableId?: string | null;
}) {
  const client = createBillingServiceClient(input.actor);
  const projectId = await resolveOwnedInvitationProjectId(input.actor, input.projectType);
  const tableId = input.attending ? input.tableId : null;
  if (tableId) {
    await assertInvitationTableBelongsToProject(input.actor, projectId, tableId);
  }
  const update: Record<string, unknown> = {
    guest_name: input.guestName,
    attending: input.attending,
    guest_count: input.attending ? input.guestCount : 0,
    message: input.message,
    updated_by: input.actor.userId,
  };
  if (input.tableId !== undefined || !input.attending) update.table_id = tableId ?? null;

  const { data, error } = await client
    .from("invitation_rsvps")
    .update(update)
    .eq("id", input.rsvpId)
    .eq("project_id", projectId)
    .select("id,guest_name,attending,guest_count,message,table_id,created_at,updated_at")
    .maybeSingle();
  if (error) throw error;
  const rsvp = rsvpFromRow(data as Record<string, unknown> | null);
  if (!rsvp) throw new Error("INVITATION_RSVP_NOT_FOUND");
  return rsvp;
}

export async function deleteInvitationRsvp(input: {
  actor: BillingActor;
  projectType: InvitationProjectType;
  rsvpId: string;
}) {
  const client = createBillingServiceClient(input.actor);
  const projectId = await resolveOwnedInvitationProjectId(input.actor, input.projectType);
  const { data, error } = await client
    .from("invitation_rsvps")
    .delete()
    .eq("id", input.rsvpId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("INVITATION_RSVP_NOT_FOUND");
  return String(data.id);
}

export async function loadPublishedInvitation(slug: string): Promise<PublishedInvitationProject | null> {
  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("invitation_projects")
    .select("id,organization_id,project_type,slug,title,draft,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return projectFromRow(data as Record<string, unknown> | null);
}

export async function storeInvitationRsvp(input: {
  projectId: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
}) {
  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("invitation_rsvps")
    .insert({
      project_id: input.projectId,
      guest_name: input.guestName,
      attending: input.attending,
      guest_count: input.attending ? input.guestCount : 0,
      message: input.message,
    })
    .select("id")
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error("INVITATION_RSVP_EMPTY_RESPONSE");
  return String(data.id);
}
