"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type CustomerPortalLinkSummary = {
  id: string;
  expiresAt: string;
  revokedAt: string | null;
  active: boolean;
  createdAt: string;
  label: string | null;
};

async function accessToken() {
  const { data, error } = await orbyvenSupabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Sesiunea a expirat.");
  return token;
}

export async function listCustomerPortalLinks(
  organizationId: string,
  clientId: string
): Promise<CustomerPortalLinkSummary[]> {
  const token = await accessToken();
  const response = await fetch(
    `/api/customer-portal/links?organizationId=${encodeURIComponent(organizationId)}&clientId=${encodeURIComponent(clientId)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Linkurile portalului nu au putut fi încărcate.");
  return payload.links;
}

export async function createCustomerPortalLink(
  organizationId: string,
  clientId: string,
  expiresInDays = 30
): Promise<{ id: string; url: string; expiresAt: string }> {
  const token = await accessToken();
  const response = await fetch("/api/customer-portal/links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ organizationId, clientId, expiresInDays }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Linkul portalului nu a putut fi creat.");
  return payload;
}

export async function revokeCustomerPortalLink(
  organizationId: string,
  linkId: string
) {
  const token = await accessToken();
  const response = await fetch("/api/customer-portal/links", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ organizationId, linkId }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Linkul portalului nu a putut fi revocat.");
}
