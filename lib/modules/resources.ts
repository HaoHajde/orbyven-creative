"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import {
  normalizeResourceIds,
  schedulerErrorMessage,
  type OperationalResourceType,
} from "@/lib/modules/resource-core";

export type OperationalResource = {
  id: string;
  organization_id: string;
  resource_type: OperationalResourceType;
  name: string;
  code: string | null;
  team_member_id: string | null;
  capacity: number;
  active: boolean;
  location: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarResourceAssignment = {
  id: string;
  event_id: string;
  resource_id: string;
  created_at: string;
};

export type ResourceUnavailability = {
  id: string;
  resource_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
};

const RESOURCE_FIELDS =
  "id,organization_id,resource_type,name,code,team_member_id,capacity,active,location,notes,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

export async function listOperationalResources(
  organizationId: string,
  options?: { activeOnly?: boolean }
): Promise<OperationalResource[]> {
  requireOrganizationId(organizationId);
  let query = orbyvenSupabase
    .from("ops_resources")
    .select(RESOURCE_FIELDS)
    .eq("organization_id", organizationId)
    .order("active", { ascending: false })
    .order("resource_type")
    .order("name");

  if (options?.activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    capacity: Number(row.capacity || 1),
  })) as OperationalResource[];
}

export async function listCalendarResourceAssignments(
  organizationId: string,
  eventIds: string[]
): Promise<CalendarResourceAssignment[]> {
  requireOrganizationId(organizationId);
  const ids = [...new Set(eventIds.filter(Boolean))];
  if (!ids.length) return [];

  const { data, error } = await orbyvenSupabase
    .from("calendar_event_resources")
    .select("id,event_id,resource_id,created_at")
    .eq("organization_id", organizationId)
    .in("event_id", ids)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as CalendarResourceAssignment[];
}

export async function setCalendarEventResources(
  organizationId: string,
  eventId: string,
  resourceIds: string[]
) {
  requireOrganizationId(organizationId);
  if (!eventId.trim()) throw new Error("calendar_event_id is required.");
  const normalized = normalizeResourceIds(resourceIds);
  const { error } = await orbyvenSupabase.rpc("calendar_set_event_resources", {
    p_organization_id: organizationId,
    p_event_id: eventId,
    p_resource_ids: normalized,
  });
  if (error) throw new Error(schedulerErrorMessage(error));
}

export async function createOperationalResource(
  organizationId: string,
  input: {
    name: string;
    resourceType: Exclude<OperationalResourceType, "person">;
    code?: string;
    capacity?: number;
    location?: string;
    notes?: string;
  }
): Promise<OperationalResource> {
  requireOrganizationId(organizationId);
  const name = input.name.trim();
  if (!name) throw new Error("Numele resursei este obligatoriu.");
  const capacity = Math.max(1, Math.min(100, Math.round(input.capacity || 1)));
  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("ops_resources")
    .insert({
      organization_id: organizationId,
      resource_type: input.resourceType,
      name,
      code: input.code?.trim() || null,
      capacity,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: authData.user?.id ?? null,
    })
    .select(RESOURCE_FIELDS)
    .single();
  if (error) throw error;
  return { ...data, capacity: Number(data.capacity || 1) } as OperationalResource;
}

export async function updateOperationalResource(
  organizationId: string,
  resourceId: string,
  patch: Partial<{
    name: string;
    code: string;
    capacity: number;
    active: boolean;
    location: string;
    notes: string;
  }>
): Promise<OperationalResource> {
  requireOrganizationId(organizationId);
  if (!resourceId.trim()) throw new Error("resource_id is required.");

  const next: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("Numele resursei nu poate fi gol.");
    next.name = name;
  }
  if (patch.code !== undefined) next.code = patch.code.trim() || null;
  if (patch.capacity !== undefined) next.capacity = Math.max(1, Math.min(100, Math.round(patch.capacity || 1)));
  if (patch.active !== undefined) next.active = patch.active;
  if (patch.location !== undefined) next.location = patch.location.trim() || null;
  if (patch.notes !== undefined) next.notes = patch.notes.trim() || null;

  const { data, error } = await orbyvenSupabase
    .from("ops_resources")
    .update(next)
    .eq("organization_id", organizationId)
    .eq("id", resourceId)
    .is("team_member_id", null)
    .select(RESOURCE_FIELDS)
    .single();

  if (error) throw error;
  return { ...data, capacity: Number(data.capacity || 1) } as OperationalResource;
}

export async function createResourceUnavailability(
  organizationId: string,
  input: { resourceId: string; startAt: string; endAt: string; reason?: string }
): Promise<ResourceUnavailability> {
  requireOrganizationId(organizationId);
  if (!input.resourceId.trim()) throw new Error("Alege resursa.");
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
    throw new Error("Intervalul de indisponibilitate nu este valid.");
  }
  if (endAt <= startAt) throw new Error("Finalul indisponibilității trebuie să fie după început.");

  const { data: resource, error: resourceError } = await orbyvenSupabase
    .from("ops_resources")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", input.resourceId)
    .single();
  if (resourceError || !resource) throw new Error("Resursa nu există în această firmă.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("ops_resource_unavailability")
    .insert({
      organization_id: organizationId,
      resource_id: input.resourceId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      reason: input.reason?.trim() || null,
      created_by: authData.user?.id ?? null,
    })
    .select("id,resource_id,start_at,end_at,reason")
    .single();

  if (error) throw new Error(schedulerErrorMessage(error));
  return data as ResourceUnavailability;
}

export async function deleteResourceUnavailability(
  organizationId: string,
  unavailabilityId: string
) {
  requireOrganizationId(organizationId);
  if (!unavailabilityId.trim()) throw new Error("unavailability_id is required.");
  const { error } = await orbyvenSupabase
    .from("ops_resource_unavailability")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", unavailabilityId);
  if (error) throw error;
}

export async function listResourceUnavailability(
  organizationId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<ResourceUnavailability[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("ops_resource_unavailability")
    .select("id,resource_id,start_at,end_at,reason")
    .eq("organization_id", organizationId)
    .lt("start_at", rangeEnd)
    .gt("end_at", rangeStart)
    .order("start_at");
  if (error) throw error;
  return (data ?? []) as ResourceUnavailability[];
}
