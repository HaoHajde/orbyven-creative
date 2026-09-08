import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type TeamMemberStatus = "active" | "inactive";

export type TeamMember = {
  id: string;
  organization_id: string;
  linked_user_id: string | null;
  display_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  status: TeamMemberStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceAccessMember = {
  user_id: string;
  role: "owner" | "admin" | "manager" | "member" | "viewer";
  access_status: "active" | "suspended";
};

export type TeamMemberInput = {
  displayName: string;
  jobTitle?: string;
  contactEmail?: string;
  phone?: string;
  status?: TeamMemberStatus;
  notes?: string;
  linkedUserId?: string | null;
};

const FIELDS =
  "id,organization_id,linked_user_id,display_name,job_title,email,phone,status,notes,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

export async function listTeamMembers(organizationId: string): Promise<TeamMember[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("people_team_members")
    .select(FIELDS)
    .eq("organization_id", organizationId)
    .order("status", { ascending: true })
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TeamMember[];
}

export async function listWorkspaceAccessMembers(
  organizationId: string
): Promise<WorkspaceAccessMember[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("organization_members")
    .select("user_id,role,access_status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkspaceAccessMember[];
}

export async function createTeamMember(
  organizationId: string,
  input: TeamMemberInput
): Promise<TeamMember> {
  requireOrganizationId(organizationId);
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("Numele membrului este obligatoriu.");
  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("people_team_members")
    .insert({
      organization_id: organizationId,
      linked_user_id: input.linkedUserId || null,
      display_name: displayName,
      job_title: input.jobTitle?.trim() || null,
      email: input.contactEmail?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      status: input.status || "active",
      notes: input.notes?.trim() || null,
      created_by: authData.user?.id ?? null,
    })
    .select(FIELDS)
    .single();
  if (error) throw error;
  return data as TeamMember;
}

export async function updateTeamMember(
  organizationId: string,
  memberId: string,
  input: Partial<TeamMemberInput>
): Promise<TeamMember> {
  requireOrganizationId(organizationId);
  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (!displayName) throw new Error("Numele membrului nu poate fi gol.");
    patch.display_name = displayName;
  }
  if (input.jobTitle !== undefined) patch.job_title = input.jobTitle.trim() || null;
  if (input.contactEmail !== undefined) patch.email = input.contactEmail.trim().toLowerCase() || null;
  if (input.phone !== undefined) patch.phone = input.phone.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes.trim() || null;
  if (input.linkedUserId !== undefined) patch.linked_user_id = input.linkedUserId || null;

  const { data, error } = await orbyvenSupabase
    .from("people_team_members")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", memberId)
    .select(FIELDS)
    .single();
  if (error) throw error;
  return data as TeamMember;
}

export async function deleteTeamMember(organizationId: string, memberId: string) {
  requireOrganizationId(organizationId);
  const { error } = await orbyvenSupabase
    .from("people_team_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", memberId);
  if (error) throw error;
}
