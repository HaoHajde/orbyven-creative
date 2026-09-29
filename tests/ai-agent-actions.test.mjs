import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMutationPrompt } from "../lib/ai/action-parser.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");
const fixedNow = new Date("2026-09-29T14:00:00.000Z");

test("Agent Actions parses lead creation without executing it", () => {
  const result = parseMutationPrompt(
    "Creează lead Ana Popescu; telefon: 0712345678; companie: Atelier Ana",
    { timeZone: "Europe/Bucharest", now: fixedNow }
  );
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_lead");
  assert.equal(result.proposal.payload.name, "Ana Popescu");
  assert.equal(result.proposal.payload.phone, "0712345678");
  assert.equal(result.proposal.payload.company, "Atelier Ana");
});

test("Agent Actions distinguishes client and lead lifecycle", () => {
  const result = parseMutationPrompt("Adaugă client Mihai Ionescu", { now: fixedNow });
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_client");
  assert.equal(result.proposal.targetModule, "leads");
});

test("Agent Actions parses work priority and exact client label", () => {
  const result = parseMutationPrompt(
    "Creează lucrare Revizie centrală; client: Neagu Costică SRL; prioritate: urgent",
    { now: fixedNow }
  );
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_task");
  assert.equal(result.proposal.payload.kind, "work");
  assert.equal(result.proposal.payload.priority, "urgent");
  assert.equal(result.proposal.payload.clientName, "Neagu Costică SRL");
});

test("Agent Actions interprets Bucharest relative calendar time and previews it", () => {
  const result = parseMutationPrompt(
    "Programează o programare Revizie tehnică mâine la 10:30; durata: 90; reminder: 15",
    { timeZone: "Europe/Bucharest", now: fixedNow }
  );
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_calendar_event");
  assert.equal(result.proposal.payload.startAt, "2026-09-30T07:30:00.000Z");
  assert.equal(result.proposal.payload.endAt, "2026-09-30T09:00:00.000Z");
  assert.equal(result.proposal.payload.reminderMinutes, 15);
});

test("Calendar mutation asks for missing date/time rather than guessing", () => {
  const result = parseMutationPrompt("Programează o programare Revizie tehnică", {
    timeZone: "Europe/Bucharest",
    now: fixedNow,
  });
  assert.equal(result.kind, "needs_details");
});

test("Read-only questions never become mutation proposals", () => {
  assert.equal(parseMutationPrompt("Ce am de făcut azi?", { now: fixedNow }).kind, "none");
  assert.equal(parseMutationPrompt("Ce am de încasat?", { now: fixedNow }).kind, "none");
});

test("Action proposals are server-only with RLS and explicit grants", () => {
  const migration = read("supabase/migrations/20260929145800_ai_action_proposals.sql");
  assert.match(migration, /alter table public\.ai_action_proposals enable row level security/);
  assert.match(migration, /revoke all on table public\.ai_action_proposals from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update on table public\.ai_action_proposals to service_role/);
  assert.match(migration, /interval '15 minutes'/);
});

test("Action executor mirrors existing create permissions and claims proposals atomically", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /MUTATION_ROLES = new Set\(\["owner", "admin", "manager", "member"\]\)/);
  assert.match(source, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(source, /\.eq\("actor_id", actor\.userId\)/);
  assert.match(source, /\.eq\("status", "pending"\)/);
  assert.match(source, /status: "executing"/);
  assert.match(source, /status: "executed"/);
  assert.match(source, /platform_audit_log/);
  assert.match(source, /confirmation: "explicit_user_confirmation"/);
});

test("Agent execution keeps Finance writes forbidden and estimate creation behind the atomic RPC", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /create_lead/);
  assert.match(source, /create_client/);
  assert.match(source, /create_task/);
  assert.match(source, /create_calendar_event/);
  assert.match(source, /create_estimate/);
  assert.match(source, /rpc\("ai_create_estimate_draft"/);
  assert.doesNotMatch(source, /finance_expenses"\)\s*\.insert/);
  assert.doesNotMatch(source, /sales_estimates"\)\s*\.insert/);
});

test("Confirmation endpoint is bounded and UI exposes confirm/reject", () => {
  const route = read("app/api/ai/actions/confirm/route.ts");
  const ui = read("components/WorkspaceIntelligence.tsx");
  assert.match(route, /decision === "reject"/);
  assert.match(route, /decideMutationProposal/);
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(ui, /CONFIRMARE NECESARĂ/);
  assert.match(ui, /decideProposal\(action, "confirm"\)/);
  assert.match(ui, /decideProposal\(action, "reject"\)/);
});
