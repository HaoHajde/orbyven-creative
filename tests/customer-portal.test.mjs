import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("portal links store hashes only and remain server-only", () => {
  const migration = read("supabase/migrations/20261001200000_alpha092_customer_portal.sql");
  assert.match(migration, /token_hash text not null unique/i);
  assert.doesNotMatch(migration, /raw_token|token_plain|portal_token text/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on public\.client_portal_links from public,anon,authenticated/i);
  assert.match(migration, /grant select,insert,update on public\.client_portal_links to service_role/i);
});

test("estimate decisions are immutable, atomic and hashed", () => {
  const migration = read("supabase/migrations/20261001200000_alpha092_customer_portal.sql");
  assert.match(migration, /client_portal_estimate_decisions/i);
  assert.match(migration, /before update or delete/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /offer_snapshot/i);
  assert.match(migration, /digest\(snapshot::text,'sha256'\)/i);
  assert.match(migration, /update public\.sales_estimates/i);
});

test("portal snapshot exposes only explicitly published documents", () => {
  const server = read("lib/portal/server.ts");
  const documents = read("lib/modules/documents.ts");
  assert.match(server, /\.eq\("portal_visible", true\)/);
  assert.match(documents, /portal_visible: boolean/);
  assert.match(documents, /setDocumentPortalVisible/);
  assert.doesNotMatch(server, /planned_labor_cents|other_cost_cents/);
});

test("portal acceptance requires explicit confirmation and manager link issuance", () => {
  const decision = read("app/api/customer-portal/[token]/decision/route.ts");
  const links = read("app/api/customer-portal/links/route.ts");
  const auth = read("lib/portal/server.ts");
  assert.match(decision, /decision === "accepted" && body\.confirmed !== true/);
  assert.match(links, /authenticatePortalManager/);
  assert.match(auth, /owner", "admin", "manager/);
});

test("public portal is noindex and document downloads re-check portal visibility", () => {
  const page = read("app/portal/[token]/page.tsx");
  const server = read("lib/portal/server.ts");
  assert.match(page, /index: false/);
  assert.match(page, /follow: false/);
  assert.match(server, /loadPortalDocument/);
  assert.match(server, /\.eq\("portal_visible", true\)/);
});
