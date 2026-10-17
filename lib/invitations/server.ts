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

export type InvitationRsvp = {
  id: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  createdAt: string;
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
): Promise<{ project: PublishedInvitationProject | null; rsvps: InvitationRsvp[] }> {
  const client = createBillingServiceClient(actor);
  const { data: row, error } = await client
    .from("invitation_projects")
    .select("id,organization_id,project_type,slug,title,draft,published_at")
    .eq("organization_id", actor.organizationId)
    .eq("source_key", invitationSourceKey(projectType))
    .maybeSingle();
  if (error) throw error;

  const project = projectFromRow(row as Record<string, unknown> | null);
  if (!project) return { project: null, rsvps: [] };

  const { data: responses, error: responseError } = await client
    .from("invitation_rsvps")
    .select("id,guest_name,attending,guest_count,message,created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (responseError) throw responseError;

  const rsvps: InvitationRsvp[] = (responses ?? []).flatMap((item) => {
    if (
      typeof item.id !== "string" ||
      typeof item.guest_name !== "string" ||
      typeof item.attending !== "boolean" ||
      typeof item.guest_count !== "number" ||
      typeof item.created_at !== "string"
    ) return [];
    return [{
      id: item.id,
      guestName: item.guest_name,
      attending: item.attending,
      guestCount: item.guest_count,
      message: typeof item.message === "string" ? item.message : null,
      createdAt: item.created_at,
    }];
  });

  return { project, rsvps };
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
