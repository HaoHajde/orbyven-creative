import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  invitationSourceKey,
  isInvitationProjectType,
  isInvitationSlug,
} from "../lib/invitations/contracts.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("invitation contracts keep AI publish modes bounded", () => {
  assert.equal(isInvitationProjectType("wedding"), true);
  assert.equal(isInvitationProjectType("baptism"), true);
  assert.equal(isInvitationProjectType("event"), true);
  assert.equal(isInvitationProjectType("website"), false);
  assert.equal(invitationSourceKey("wedding"), "ai-web-design-wedding");
  assert.equal(isInvitationSlug("ana-vlad-a1b2c3d4e5"), true);
  assert.equal(isInvitationSlug("../secret"), false);
});

test("invitation storage is RLS enabled and server-role only", () => {
  const migration = read("supabase/migrations/20261017180500_ai_invitation_projects_rsvp.sql");
  for (const table of ["invitation_projects", "invitation_rsvps", "invitation_rsvp_ip_quota"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on public\\.${table} from public, anon, authenticated`, "i"));
  }
  assert.match(migration, /grant execute on function public\.claim_invitation_rsvp_ip_quota\(text\)\s*to service_role/i);
  assert.match(migration, /where public\.invitation_rsvp_ip_quota\.hits < 10/i);
  assert.doesNotMatch(migration, /grant .* to anon/i);
});

test("authenticated invitation publishing stays tenant scoped", () => {
  const route = read("app/api/invitations/projects/route.ts");
  const server = read("lib/invitations/server.ts");
  assert.match(route, /authenticateBillingActor\(request, organizationId, false\)/);
  assert.match(route, /actor\.role === "viewer"/);
  assert.match(route, /readSiteDraft\(body\.draft\)/);
  assert.match(server, /\.eq\("organization_id", input\.actor\.organizationId\)/);
  assert.match(server, /invitationSourceKey\(input\.projectType\)/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
});

test("public RSVP gateway validates, rate limits and minimizes collected data", () => {
  const route = read("app/api/invitations/rsvp/route.ts");
  const rateLimit = read("lib/security/request-rate-limit.ts");
  const publicUi = read("components/invitations/PublishedInvitation.tsx");

  assert.match(route, /claimInvitationRsvpIpQuota\(request\)/);
  assert.match(route, /status: 429/);
  assert.match(route, /raw\.website/);
  assert.match(route, /Date\.now\(\) - startedAt < 1000/);
  assert.match(route, /guestName\.length < 2/);
  assert.match(route, /guestCount > 12/);
  assert.match(rateLimit, /orbyven:invitation-rsvp:ip:v1:/);
  assert.match(rateLimit, /createHmac\("sha256", secret\)/);
  assert.match(publicUi, /\/api\/invitations\/rsvp/);
  assert.doesNotMatch(publicUi, /type="email"/);
  assert.doesNotMatch(publicUi, /type="tel"/);
});

test("published invitations are private-by-link and Design Studio can publish them", () => {
  const page = read("app/invitatie/[slug]/page.tsx");
  const studio = read("components/ai/WebDesignStudio.tsx");
  const control = read("components/invitations/InvitationPublishControl.tsx");

  assert.match(page, /robots: \{ index: false, follow: false/);
  assert.match(page, /loadPublishedInvitation/);
  assert.match(studio, /InvitationPublishControl/);
  assert.match(studio, /projectMode !== "website"/);
  assert.match(control, /\/api\/invitations\/projects/);
  assert.match(control, /Authorization: `Bearer \$\{token\}`/);
  assert.match(control, /Publică invitația/);
  assert.match(control, /Copiază link/);
});
