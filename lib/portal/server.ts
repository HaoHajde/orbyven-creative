import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { CustomerPortalSnapshot } from "@/lib/portal/types";

type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type PortalWorkspaceActor = {
  userId: string;
  organizationId: string;
  role: WorkspaceRole;
};

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) throw new Error("Supabase public configuration is missing.");
  return { url, publishableKey };
}

export function createPortalServiceClient() {
  const { url } = publicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function authenticatePortalManager(
  request: Request,
  organizationId: string
): Promise<PortalWorkspaceActor> {
  const token = bearerToken(request);
  if (!token) throw new Error("AUTH_REQUIRED");

  const { url, publishableKey } = publicConfig();
  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) throw new Error("AUTH_REQUIRED");

  const { data: membership, error: membershipError } = await client
    .from("organization_members")
    .select("organization_id,role,access_status")
    .eq("organization_id", organizationId)
    .eq("user_id", userData.user.id)
    .eq("access_status", "active")
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) throw new Error("ORG_ACCESS_REQUIRED");
  if (!["owner", "admin", "manager"].includes(membership.role)) {
    throw new Error("PORTAL_MANAGER_REQUIRED");
  }

  return {
    userId: userData.user.id,
    organizationId,
    role: membership.role as WorkspaceRole,
  };
}

export function hashPortalToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generatePortalToken() {
  return randomBytes(32).toString("base64url");
}

export function digestPortalIp(value: string | null) {
  const salt = process.env.CLIENT_PORTAL_AUDIT_SALT?.trim();
  const ip = value?.trim();
  if (!salt || !ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

type PortalLinkRow = {
  id: string;
  organization_id: string;
  client_id: string;
  expires_at: string;
};

export async function resolvePortalLink(
  client: SupabaseClient,
  rawToken: string
): Promise<PortalLinkRow | null> {
  if (!rawToken || rawToken.length < 32 || rawToken.length > 200) return null;
  const tokenHash = hashPortalToken(rawToken);
  const { data, error } = await client
    .from("client_portal_links")
    .select("id,organization_id,client_id,expires_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return data as PortalLinkRow | null;
}

export async function loadCustomerPortalSnapshot(
  rawToken: string
): Promise<CustomerPortalSnapshot | null> {
  const client = createPortalServiceClient();
  const link = await resolvePortalLink(client, rawToken);
  if (!link) return null;

  const [orgResult, clientResult, operationsResult, estimatesResult, documentsResult, paymentsResult] =
    await Promise.all([
      client.from("organizations")
        .select("name,legal_name")
        .eq("id", link.organization_id)
        .maybeSingle(),
      client.from("crm_leads")
        .select("name,company,kind")
        .eq("organization_id", link.organization_id)
        .eq("id", link.client_id)
        .eq("kind", "client")
        .maybeSingle(),
      client.from("ops_tasks")
        .select("id,kind,title,status,progress,scheduled_at,due_at,location")
        .eq("organization_id", link.organization_id)
        .eq("client_id", link.client_id)
        .in("kind", ["work", "order"])
        .neq("status", "cancelled")
        .order("updated_at", { ascending: false })
        .limit(100),
      client.from("sales_estimates")
        .select("id,reference,title,status,currency,subtotal_cents,discount_cents,tax_rate,total_cents,valid_until,sent_at,accepted_at")
        .eq("organization_id", link.organization_id)
        .eq("client_id", link.client_id)
        .in("status", ["sent", "accepted", "rejected", "expired"])
        .order("updated_at", { ascending: false })
        .limit(50),
      client.from("ops_documents")
        .select("id,name,category,mime_type,size_bytes,created_at")
        .eq("organization_id", link.organization_id)
        .eq("client_id", link.client_id)
        .eq("portal_visible", true)
        .order("created_at", { ascending: false })
        .limit(100),
      client.from("finance_income_entries")
        .select("id,occurred_on,amount_cents,currency,reference")
        .eq("organization_id", link.organization_id)
        .eq("client_id", link.client_id)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  for (const result of [orgResult, clientResult, operationsResult, estimatesResult, documentsResult, paymentsResult]) {
    if (result.error) throw result.error;
  }
  if (!orgResult.data || !clientResult.data) return null;

  const estimates = estimatesResult.data ?? [];
  const estimateIds = estimates.map((estimate) => estimate.id);
  const itemsResult = estimateIds.length
    ? await client.from("sales_estimate_items")
        .select("id,estimate_id,description,quantity,unit_price_cents,position")
        .eq("organization_id", link.organization_id)
        .in("estimate_id", estimateIds)
        .order("position")
        .order("created_at")
    : { data: [], error: null };

  if (itemsResult.error) throw itemsResult.error;
  const itemsByEstimate = new Map<string, Array<{
    id: string; description: string; quantity: number; unitPriceCents: number; position: number;
  }>>();
  for (const item of itemsResult.data ?? []) {
    const list = itemsByEstimate.get(item.estimate_id) ?? [];
    list.push({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPriceCents: Number(item.unit_price_cents),
      position: Number(item.position),
    });
    itemsByEstimate.set(item.estimate_id, list);
  }

  return {
    organization: {
      name: orgResult.data.name,
      legalName: orgResult.data.legal_name ?? null,
    },
    client: {
      name: clientResult.data.name,
      company: clientResult.data.company ?? null,
    },
    link: { expiresAt: link.expires_at },
    operations: (operationsResult.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind as "work" | "order",
      title: row.title,
      status: row.status,
      progress: Number(row.progress ?? 0),
      scheduledAt: row.scheduled_at ?? null,
      dueAt: row.due_at ?? null,
      location: row.location ?? null,
    })),
    estimates: estimates.map((row) => ({
      id: row.id,
      reference: row.reference,
      title: row.title,
      status: row.status,
      currency: row.currency,
      subtotalCents: Number(row.subtotal_cents),
      discountCents: Number(row.discount_cents),
      taxRate: row.tax_rate === null ? null : Number(row.tax_rate),
      totalCents: Number(row.total_cents),
      validUntil: row.valid_until ?? null,
      sentAt: row.sent_at ?? null,
      acceptedAt: row.accepted_at ?? null,
      items: itemsByEstimate.get(row.id) ?? [],
    })),
    documents: (documentsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      mimeType: row.mime_type ?? null,
      sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
      createdAt: row.created_at,
    })),
    payments: (paymentsResult.data ?? []).map((row) => ({
      id: row.id,
      occurredOn: row.occurred_on,
      amountCents: Number(row.amount_cents),
      currency: row.currency,
      reference: row.reference ?? null,
    })),
  };
}

export async function loadPortalDocument(
  rawToken: string,
  documentId: string
): Promise<{ storagePath: string; name: string } | null> {
  const client = createPortalServiceClient();
  const link = await resolvePortalLink(client, rawToken);
  if (!link) return null;

  const { data, error } = await client
    .from("ops_documents")
    .select("storage_path,name")
    .eq("organization_id", link.organization_id)
    .eq("client_id", link.client_id)
    .eq("id", documentId)
    .eq("portal_visible", true)
    .maybeSingle();
  if (error) throw error;
  return data ? { storagePath: data.storage_path, name: data.name } : null;
}
