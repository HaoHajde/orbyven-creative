import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";

// Only consume the ingress IP header from a trusted Vercel deployment.
// For non-Vercel hosts, configure equivalent proxy-header sanitization first.
function clientIp(request: Request): string | null {
  const header = request.headers.get("x-forwarded-for") ?? "";
  const firstHop = header.split(",")[0]?.trim() ?? "";
  return isIP(firstHop) ? firstHop : null;
}

export async function claimProjectRequestIpQuota(request: Request): Promise<boolean> {
  const ip = clientIp(request);
  const secret = process.env.ORBYVEN_REQUEST_RATE_LIMIT_SECRET?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // A missing config must not silently disable abuse protection.
  if (!ip || !secret || secret.length < 32 || !url || !key) {
    throw new Error("PROJECT_REQUEST_RATE_LIMIT_NOT_CONFIGURED");
  }

  const fingerprint = createHmac("sha256", secret).update(ip).digest("hex");
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc("claim_project_request_ip_quota", {
    p_fingerprint: fingerprint,
  });
  if (error) throw new Error("PROJECT_REQUEST_RATE_LIMIT_UNAVAILABLE");
  return data === true;
}
