import { createClient } from "@supabase/supabase-js";

import { billingServerConfig } from "@/lib/billing/server-config";

export type OrganizationRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type BillingActor = {
  userId: string;
  email: string | null;
  organizationId: string;
  role: OrganizationRole;
};

function supabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error("Supabase public configuration is missing.");
  }
  return { url, publishableKey };
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function createBillingServiceClient() {
  const { url } = supabasePublicConfig();
  const serviceRoleKey = billingServerConfig.supabaseServiceRoleKey;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authenticateBillingActor(
  request: Request,
  organizationId?: string,
  requireAdmin = false
): Promise<BillingActor> {
  const token = bearerToken(request);
  if (!token) throw new Error("AUTH_REQUIRED");

  const { url, publishableKey } = supabasePublicConfig();
  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) throw new Error("AUTH_REQUIRED");

  let membershipQuery = client
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (organizationId) membershipQuery = membershipQuery.eq("organization_id", organizationId);

  const { data: memberships, error: membershipError } = await membershipQuery.limit(1);
  if (membershipError) throw membershipError;

  const membership = memberships?.[0] as
    | { organization_id: string; role: OrganizationRole }
    | undefined;

  if (!membership) throw new Error("ORG_ACCESS_REQUIRED");
  if (requireAdmin && membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("BILLING_ADMIN_REQUIRED");
  }

  return {
    userId: userData.user.id,
    email: userData.user.email ?? null,
    organizationId: membership.organization_id,
    role: membership.role,
  };
}
